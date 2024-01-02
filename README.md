# ArunaCore

## Summary

0 - <a href="#TODO">TODO List</a>

1 - <a href="#Introduction">Introduction</a>

2 - <a href="#Installation">Installation</a>

3 - <a href="#Wiki">Wiki</a>

4 - <a href="#API">API</a>

5 - <a href="#Contributing">Contributing</a>

6 - <a href="#Authors">Authors</a>

7 - <a href="#License">License</a>

## TODO

- [ ] Implement plugins
- [ ] Create the wiki
- [ ] Improve Todo List

## Introduction

ArunaCore is a framework that helps developers to build their own applications.

with it is ease to create and manange a new application created from scratch or to use on top of existing application.

It uses websocket to communicate with your application and it is easy to use.

You can also develop your own plugins to extend the functionality of ArunaCore (**SOON:tm:**).

## Installation

```bash
TODO
```

## Wiki

If you have any question, please check our <a href="https://github.com/ArunaBot/ArunaCore/wiki">Wiki</a> (**WIP**), contact us on <a href="https://github.com/ArunaBot/ArunaCore/issues">Github Issues Tab</a> or in the <a href="https://discord.gg/NqbBgEf">Discord</a>.

## API

Using the API is easy!

### Installing:

To install, just use `npm install arunacore-api`or `yarn add arunacore-api`.

### Creating a client:

```js
import { ArunaClient } from 'arunacore-api';

const client = new ArunaClient('localhost', 3000, '<clientName>');

client.connect();
```

### Receiving a message:

The message is received as a JSON object with parsed informations.

```js
client.on('message', (message) => {
  console.log(message);
});
```

### The full documentation:

You can find the full documentation on <a href="https://github.com/ArunaBot/ArunaCore/wiki/api">Wiki</a>.

## Contributing

If you want to contribute to ArunaCore, please check our CONTRIBUTING.md file (**TODO**).

## Authors

ArunaCore is developed with 💜 by <a href="https://github.com/LoboMetalurgico">Lobo Metalurgico</a> and <a href="https://github.com/emanuelfranklyn">Space_Interprise</a>.

## License

ArunaCore is licensed under the <a href="./LICENSE">GPL-3.0 license</a>.
