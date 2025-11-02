# ArunaCore Changelog

## v1.0.0-BETA.4

  - [BREAKING] Dropped support for all versions below Node.js v20.11.1  
    - While the api may still work on older versions, the app itself can't run on them anymore due to internal fs changes.

  - [BREAKING] Application register flow changed
    - New websocket connections now register on the upgrade request, not after the connection is established.
    - This simplifies the connection process and improves performance.

  - [BREAKING] Removed `isRegistered()` method from `ArunaClient`
    - This method became obsolete with the new registration flow.
  
  - [FEAT] Better docker support
    - Enforce port to 3000 inside the container, regardless of the configuration file.
    - This allows easier deployment and avoids port conflicts, allowing the user to map the port as needed in the docker itself.

## v1.0.0-BETA.3

- [FIX] Dead WebSocket connections not being properly handled  
  - Now, when a connection is considered dead, all `'pong'` event listeners are removed and the promise resolves the correct state.
  - This prevents memory leaks and improves stability.

- [FIX] Wrong `masterkey` casing in configuration  
  - Fixed an issue where the `masterkey` property was not being recognized due to incorrect casing.

- [FIX] Add dependency removed by accident

- [NEW] Added typing for client-emitted events  
  - This improves developer experience and type safety when handling events emitted by clients.

## v1.0.0-BETA.2

- [BREAKING] Removed deprecated methods from `WebSocketParser`  
  - These methods were deprecated in the previous version, so they were removed now.

- [FIX] Removed deprecated Node flag `--loader` from start and test scripts  
  - This flag was deprecated in Node.js v20.0.0 and replaced by the `--import` flag.

- [DOCS] Updated important JSDoc comments

## v1.0.0-BETA.1

- [BREAKING] Dropped support for all versions below Node.js v18.8.0  
  - These versions are too old and can't be supported anymore.

- [NEW] Improvements to system environment variables  
  - Now `ARUNACORE_<PROPERTY>` variables can be used to override all properties in the configuration file  
    - For real this time.

- [CHORE] Updated dependencies

## v1.0.0-BETA.0

### Yes, we are finally in beta! 🎉

This release includes a lot of changes and improvements, so check the changelog to see what's new.

- [BREAKING] Dropped support for all versions below Node.js v16.20.0  
  - Our build system was improved and can't build on version 14 or lower anymore.  
  - Also, our load system uses features from Node.js v16.20.0, so we can't support older versions anymore.

- [BREAKING] Message system was refactored  
  - Instead of a crazy IRC-inspired message system, we now use simple JSON objects.  
  - The send method was changed, and you'll need to update your code to use the new one.  
  - Legacy `command` and `args` properties are now optional, and you probably won't need to use them anymore.  
  - A new parameter `content` was added — this accepts anything and will be sent as the message content.  
  - The `type` property in messages no longer refers to the client type; now it refers to the message type (update your code accordingly).  
  - Various other changes were made, so check the `IMessage` interface to see them all.

- [BREAKING] ArunaCore is now an ES module  
  - This doesn't affect the API, so your code will probably work without issues.

- [DEPRECATED] Various methods from `WebSocketParser` were deprecated  
  - They will be removed in a future version, so update your code to use the new methods.

- [CHANGE] Project structure was changed  
  - Say goodbye to multiple `node_modules` folders (we now use one in the root and another only in `api`).  
  - Now we use a single `package.json` file in the root of the project (and another only in `api`).  
  - Now we use a single `tsconfig.json` file in the root of the project (and another only in `api`).  
  - This significantly reduces project size and build time (and also makes it easier to maintain).

- [CHANGE] Build system was improved  
  - Since we abandoned the multi-module structure, we can now use a single build system.  
  - This includes the API (you no longer need to build it separately).

- [CHANGE] Increased WebSocket payload size limit  
  - Now we support payloads up to 512 KB.

- [NEW] Added configuration system  
  - Now you can configure the system (including the server port) by editing the `bundle/config/config.json` file.  
  - You can also use environment variables `ARUNACORE_<PROPERTY>` to override the configuration file.

- [NEW] Added `masterkey` to allow access to restricted endpoints and commands  
  - You can set the masterkey in the configuration file or in the environment variable `ARUNACORE_MASTERKEY`.  
  - If a masterkey is not provided, all restricted endpoints and commands will be disabled and return a `503` error.

- [NEW] Created a connection structure  
  - Useful to store and manipulate connections.

- [FIX] Timeouts not being cleared  
  - This also reduces test time.

- [FIX] HTTP server not responding to unknown endpoints  
  - Now it returns a `404` error _(as expected)_, instead of just doing nothing and waiting for a timeout.

- [FIX] HTTP didn't support request body  
  - Since the default Node HTTP server doesn't support request bodies, we've implemented a custom parser to support it.

- [FIX] HTTP server routes were case sensitive  
  - Now all routes are case-insensitive.

- [CHORE] Updated dependencies

- [CHORE] Improved documentation

- [CHORE] Created a changelog file to keep track of changes  
  - Probably includes all changes from previous versions.

## v1.0.0-ALPHA.3

- [BREAKING] Switched to external log library  
  - Now we use [@promisepending/logger.js](https://www.npmjs.com/package/@promisepending/logger.js) and no longer provide a custom logger.

- [NEW] Added compression to WebSocket server and client

- [FIX] Some null pointer errors

- [CHORE] Updated dependencies

## v1.0.0-ALPHA.2

- [NEW] Implemented secure mode

- [NEW] Implemented HTTP system  
  - Added `/healthCheck` endpoint

- [NEW] Added Docker support  
  - Check the [Docker repository](https://github.com/ArunaBot/ArunaCore-Docker)

- [CHORE] Deleted unused files and modules

- [CHORE] Improved tests

- [CHORE] Updated dependencies

## v1.0.0-ALPHA.1

- [FIXED] Some type errors

- [NEW] Some improvements to the log system

- [NEW] Created AutoLogEnd to prevent unexpected ends

- [CHORE] Reduced build time

- [CHORE] Updated dependencies

## v1.0.0-ALPHA.0

- [NEW] Initial release
