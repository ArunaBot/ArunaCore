# v1.0.0-ALPHA.4

- [BREAKING] Drop support for all versions below Node.js v16.0.0
  - Our build system was improved and can't build in version 14 or lower anymore, but may work if you use a pre-built version
  - Some dependencies dropped support for version 16 or lower, so we had to drop support too

- [BREAKING] ArunaCore is now a ES module
  - This doesn't affect the api, so your code probably will work without issues

- [CHANGE] We changed the project structure
  - Say goodbye to multiples `node_modules` folders (we now use a single in the root and another in api only)
  - Now we use a single `package.json` file in the root of the project (and another in api only)
  - Now we use a single `tsconfig.json` file in the root of the project (and another in api only)

- [CHANGE] Build system was improved
  - Since we have abandoned the multiple modules structure, we can now use a single build system
  - This includes the api (you don't need to build it separately anymore)

- [NEW] Add configuration system
  - Now you can configure the system (including server port) editing the  `bundle/config/config.json` file
  - You can also use enviroment `ARUNA_<PROPERTY>` variables to override the configuration file

- [NEW] Add `masterkey` to allow access to restricted endpoints and commands
  - You can set the masterkey in the configuration file or in the enviroment variable `ARUNA_MASTERKEY`
  - If a masterkey is not provided, all restricted endpoints and commands will be disabled and will return a `503` error

- [FIX] Critical issue in the websocket message parser
  - If the client type was defined, the parser mistakenly considered the type as the client's ID and vice versa.

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

- [NEW] Some improvements to the log system

- [NEW] Create AutoLogEnd to prevent unexpected ends

- [CHORE] Reduce build time

- [CHORE] Update dependencies

# v1.0.0-ALPHA.0

- [NEW] Initial release
