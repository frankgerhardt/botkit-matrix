exports.q = {};

exports.sdk = {};

exports.matrixClient = {};

/**
 * Sends a message into the matrix room, checks if the device we
 * received the message from is verified or not, if not, we verify
 * th device.
 *
 * @function sendBotNotice
 *
 * @param roomId - the ID of the room the message came from
 * @param message - the message we send in the room
 */

exports.sendBotNotice = function(roomId, message) {
    exports.matrixClient.sendNotice(roomId, message).catch(function (err) {

        // If we catch UnknownDeviceError we verify the devices
        if (err.name === 'UnknownDeviceError') {
            console.log('UnknownDeviceError caught.');

            Object.keys(err.devices).forEach(function (userId) {
                Object.keys(err.devices[userId]).forEach(function (deviceId) {

                    // Set device as known
                    verifyDevice(userId, deviceId);
                });
            });

            let msg = "Devices verified. Please resend your message.";
            exports.matrixClient.sendNotice(roomId, msg);

        } else {
            return q.reject(err);
        }
    });
};

/**
 * This function calls the functions from matrix-js-sdk to verify
 * the devices.
 * Implicitly returns a Promise because it's an async function.
 *
 * @function verifyDevice
 *
 * @param userId - The user who's devices has to be verified
 * @param deviceId - The ID of the device which has to be verified
 * @returns {Promise<void>}
 */

async function verifyDevice (userId, deviceId) {
    await exports.matrixClient.setDeviceKnown(userId, deviceId, true);
    await exports.matrixClient.setDeviceVerified(userId, deviceId, true);
}