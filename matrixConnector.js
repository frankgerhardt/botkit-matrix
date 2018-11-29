const Botkit = require('botkit/lib/CoreBot');
const matrixBot = require('./matrixBot');

try {
    console.log('Loading olm...');
    global.Olm = require('olm');
    console.log('==> DONE');
} catch (err) {
    console.log('Error loading olm: ' + err);
    process.exit(1);
}

const sdk = require('matrix-js-sdk');
const client = require('./matrixClient');
client.sdk = sdk;

try {
    console.log('Loading q...');
    var q = require('q');
    client.q = q;
    console.log('==> DONE');
} catch (err) {
    console.log('Error loading q: ' + err);
    process.exit(1);
}

if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    var localStorage = new LocalStorage('./storage');
}

/**
 * This is the main function of the module. It creates a controller instance
 * which can be than used by Botkit bots.
 * Implicitly returns a Promise because it's an async function.
 *
 * @function MatrixController
 *
 * @param config - The config object
 * @returns {Promise<*>}
 */

exports.MatrixController = async function(config) {

    let matrix_controller = Botkit(config);

    await matrixBot.createMatrixClient(config, client, sdk, matrix_controller, localStorage);

    matrix_controller.defineBot(function (botkit, config) {

        let bot = {
            type: 'matrix',
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances,
        };

        // here is where you make the API call to SEND a message
        // the message object should be in the proper format already
        bot.send = function (message, cb) {

            if (message.channel) {
                client.sendBotNotice(message.channel, message.text);
            } else {
                throw "Can not send message to unknown channel";
            }

            cb && cb(null, message.text);
        };

        // this function takes an incoming message (from a user) and an outgoing message (reply from bot)
        // and ensures that the reply has the appropriate fields to appear as a reply
        bot.reply = function (src, resp, cb) {
            if (typeof(resp) === 'string') {
                resp = {
                    text: resp
                }
            }
            resp.channel = src.channel;
            bot.say(resp, cb);
        };

        // this function defines the mechanism by which botkit looks for ongoing conversations
        // probably leave as is!
        bot.findConversation = function (message, cb) {
            for (var t = 0; t < botkit.tasks.length; t++) {
                for (var c = 0; c < botkit.tasks[t].convos.length; c++) {
                    if (
                        botkit.tasks[t].convos[c].isActive() &&
                        botkit.tasks[t].convos[c].source_message.user === message.user &&
                        botkit.excludedEvents.indexOf(message.type) === -1 // this type of message should not be included
                    ) {
                        cb(botkit.tasks[t].convos[c]);
                        return;
                    }
                }
            }
            cb();
        };

        return bot;

    });

    // provide one or more normalize middleware functions that take a raw incoming message
    // and ensure that the key botkit fields are present -- user, channel, text, and type
    matrix_controller.middleware.normalize.use(function (bot, message, next) {
        console.log('NORMALIZE');

        message.type = 'message_received';
        message.user = message.event.sender;
        message.channel = message.event.room_id;
        if (message.event.content.body) {
            message.text = message.event.content.body;
        } else if (message._clearEvent.content.body) {
            message.text = message._clearEvent.content.body;
        }
        message.tokenizedMessage = message.text.split(" ");

        next();

    });

    // provide one or more ways to format outgoing messages from botkit messages into
    // the necessary format required by the platform API
    // at a minimum, copy all fields from `message` to `platform_message`
    matrix_controller.middleware.format.use(function (bot, message, platform_message, next) {
        for (var k in message) {
            platform_message[k] = message[k]
        }
        next();
    });

    return matrix_controller;

};