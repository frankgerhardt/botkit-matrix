# botkit-matrix
A Botkit connector for Matrix

### Install

```$ npm install botkit-matrix```

### Usage

```JavaScript
require('botkit-matrix').MatrixController(config)
.then((controller) => {

    controller.hears(['hi', 'hello'], 'message_received', function (bot, message) {
        bot.reply(message, "Hello, world!");
    });
});
```

You can get a sample bot at [botkit-matrix-sample](https://github.com/frankgerhardt/botkit-matrix-sample) 

For more features see [Botkit Core](https://botkit.ai/docs/core.html)

### Authors

- **Frank Gerhardt** - *management* - [frankgerhardt](https://github.com/frankgerhardt)
- **Nándor Póka** - *management* - [nandor-poka](https://github.com/nandor-poka)
- **Dániel Sabic** - *development* - [SabicDaniel](https://github.com/SabicDaniel)
- **Sándor Lukács** - *development* - [lukacssandor](https://github.com/lukacssandor)

### License

This project is licensed under Apache License 2.0 - see the [LICENSE.md](./LICENSE) for details