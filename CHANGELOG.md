# v1.0.0-BETA.1

- [BREAKING] Drop support for all versions below Node.js v18.8.0
  - These versions are too old and can't be supported anymore

- [NEW] Improvements on system environment variables
  - Now `ARUNACORE_<PROPERTY>` variables can be used to override all properties in the configuration file
    - For real this time

- [CHORE] Update dependencies

# v1.0.0-BETA.0

## Yes, we are finally in beta! 🎉

This release includes a lot of changes and improvements, so check the changelog to see what's new.

- [BREAKING] Drop support for all versions below Node.js v16.20.0
  - Our build system was improved and can't build in version 14 or lower anymore
  - Also, our load system uses features from Node.js v16.20.0, so we can't support older versions anymore

- [BREAKING] Message system was refactored
  - Instead of a crazy irc-inspired message system, we now use simple json objects
  - The send method was changed, and you will need to update your code to use the new one
  - Legacy "command" and "args" properties are now optional, and you probably won't need to use them anymore
  - New parameter "content" was added, this accepts anything and will be sent as the message content
  - The property "type" in message doesn't mean the client type anymore, now it means the message type (update your code to reflect this change)
  - Various other changes were made, so check IMessage interface to see all changes

- [BREAKING] ArunaCore is now an ES module
  - This doesn't affect the api, so your code probably will work without issues

- [DEPRECATED] Various methods from `WebSocketParser` were deprecated
  - They will be removed in some future version, so update your code to use the new methods

- [CHANGE] We changed the project structure
  - Say goodbye to multiples `node_modules` folders (we now use a single in the root and another in api only)
  - Now we use a single `package.json` file in the root of the project (and another in api only)
  - Now we use a single `tsconfig.json` file in the root of the project (and another in api only)
  - This reduces significantly the project size and build time (and also makes it easier to maintain)

- [CHANGE] Build system was improved
  - Since we have abandoned the multiple modules structure, we can now use a single build system
  - This includes the api (you don't need to build it separately anymore)

- [CHANGE] Increase WebSocket payload size limit
  - Now we support payloads up to 512kb

- [NEW] Add configuration system
  - Now you can configure the system (including server port) editing the  `bundle/config/config.json` file
  - You can also use enviroment `ARUNACORE_<PROPERTY>` variables to override the configuration file

- [NEW] Add `masterkey` to allow access to restricted endpoints and commands
  - You can set the masterkey in the configuration file or in the enviroment variable `ARUNACORE_MASTERKEY`
  - If a masterkey is not provided, all restricted endpoints and commands will be disabled and will return a `503` error

- [NEW] Create a connection structure
  - Usefull to store and manipulate connections

- [FIX] Timeouts not being cleared
  - This also reduces test time

- [FIX] HTTP server not responding unknown endpoints
  - Now it returns a `404` error _(as expected)_ instead just doing nothing and waiting for a timeout

- [FIX] HTTP doesn't support body
  - Since the default node http server doesn't support body, we've implemented a custom parser to support it

- [FIX] HTTP server routes begin case sensitive
  - Now all routes are case insensitive

- [CHORE] Update dependencies

- [CHORE] Improve documentation

- [CHORE] Create a changelog file to keep track of changes
  - Probably includes all changes from previous versions

# v1.0.0-ALPHA.3

- [BREAKING] Change to external log library
  - Now we use [@promisepending/logger.js](https://www.npmjs.com/package/@promisepending/logger.js) and doesn't provide a custom logger anymore

- [NEW] Add compression to websocket server and client

- [FIX] Some null pointer errors

- [CHORE] Update dependencies

# v1.0.0-ALPHA.2

- [NEW] Implement secure mode

- [NEW] Implement HTTP system
  - Add `/healthCheck` endpoint

- [NEW] Add docker support
  - Check [docker repository](https://github.com/ArunaBot/ArunaCore-Docker)

- [CHORE] Delete unused files and modules

- [CHORE] Improve tests

- [CHORE] Update dependencies

# v1.0.0-ALPHA.1

- [FIXED] Some type errors

- [NEW] Some improvements in the log system

- [NEW] Create AutoLogEnd to prevent unexpected ends

- [CHORE] Reduce build time

- [CHORE] Update dependencies

# v1.0.0-ALPHA.0

- [NEW] Initial release
