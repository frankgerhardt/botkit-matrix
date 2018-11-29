/**
 * This function creates the matrix client instance.
 * Implicitly returns a Promise because it's an async function.
 *
 * @function createMatrixClient
 *
 * @param config - The config object which contains the properties needed to create a matrix client
 * @param client - This object stores the client and it's functions
 * @param sdk - The matrix-js-sdk
 * @param matrix_controller - The matrix controller instance
 * @param localStorage - The storage used by the matrix bot
 * @returns {Promise<void>}
 */

exports.createMatrixClient = async function(config, client, sdk, matrix_controller, localStorage) {

    // If the bot is not logged in we log in automatically
    if (!localStorage.getItem('accessToken') || !localStorage.getItem('deviceId')) {
        const loginClient = sdk.createClient({
            baseUrl: config.baseUrl
        });

        const loginResult = await loginClient.login('m.login.password', {
            user: config.botUserId,
            password: config.password
        });

        localStorage.setItem('accessToken', loginResult['access_token']);
        localStorage.setItem('userId', loginResult['user_id']);
        localStorage.setItem('deviceId', loginResult['device_id']);

        loginClient.stopClient();
    }

    // Creating the client
    client.matrixClient = sdk.createClient({
        baseUrl: config.baseUrl,
        accessToken: localStorage.getItem('accessToken'),
        userId: localStorage.getItem('userId'),
        sessionStore: new sdk.WebStorageSessionStore(localStorage),
        deviceId: localStorage.getItem('deviceId'),
    });

    // If syncing is ready, add the listeners to the bot.
    client.matrixClient.once('sync', function (state, prevState, data) {
        switch (state) {
            case 'PREPARED':
                matrix_controller.startTicking();
                let bot = matrix_controller.spawn();
                let startTime = Date.now();

                // Listener for the room timeline
                client.matrixClient.on("Room.timeline", function (event) {

                    let elapsedTime = Date.now() - startTime;
                    //   saving the event's own timestamp
                    let eventTimeStamp = (event.event.unsigned ? event.event.unsigned.age : 0);
                    // threshold, that is given in milliseconds
                    let threshold = 2000;

                    // Skipping old messages, using the two timestamp and giving a
                    if (elapsedTime + threshold < eventTimeStamp) return;

                    // Skipping not message type events
                    if (event.getType() !== "m.room.message") return;

                    // Skipping own events
                    if (event.getSender().trim() === localStorage.getItem('userId').trim()) return;

                    // We use the user's ID who sent the message as session ID
                    let sessionId = event.getSender();

                    matrix_controller.ingest(bot, event, sessionId);
                });

                // Join rooms automatically when invited
                client.matrixClient.on('RoomMember.membership', async function (event, member) {
                    if (member.membership === 'invite' && member.userId === localStorage.getItem('userId')) {
                        console.log('Joining for ' + member.roomId);

                        // Joining the client
                        await client.matrixClient.joinRoom(member.roomId)
                            .then(function () {
                                console.log('Joined for ' + member.roomId);
                            })
                            .catch(function (err) {
                                console.log('Couldn\'t join room because of an error: ' + err);
                            })
                    }
                });

                // Log if someone started/stopped typing
                client.matrixClient.on('RoomMember.typing', function(event, member) {
                    if(member.userId !== config.botUserId) {
                        if(member.typing === true) {
                            console.log(member.name + " is typing...");
                        } else {
                            console.log(member.name + " stopped typing.");
                        }
                    }
                });

                console.log("MATRIXBOT IS READY!");
                break;
            case 'ERROR':
                console.log(data.err);
                break;
        }
    });

    // Starting the matrix client
    client.matrixClient.startClient({initialSyncLimit: 1});
};