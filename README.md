# ArunaCore

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](./LICENSE)
![Docker Pulls](https://img.shields.io/docker/pulls/lobometalurgico/arunacore)
![Docker Image Version](https://img.shields.io/docker/v/lobometalurgico/arunacore?sort=semver)

## Overview

ArunaCore is the central runtime responsible for managing distributed communication between applications using WebSockets.  
It acts as a coordination layer, allowing multiple services, clients, or modules to exchange structured messages through a unified communication hub.

---

## Features

- WebSocket-based communication hub  
- Lightweight core runtime  
- Message routing between distributed modules  
- Easy integration with new or existing applications  
- Designed for multi-application and distributed environments  
- Pluggable client APIs (TypeScript/JavaScript available; others in development)

---

## Installation

ArunaCore can be installed either through Docker (recommended) or from source.  
Installation details are being expanded as part of the current structural revision.

### Running with Docker (recommended)

The official image is available on Docker Hub:
```bash
docker pull lobometalurgico/arunacore:latest
```

Run ArunaCore with:
```bash
docker run -p 3000:3000 lobometalurgico/arunacore
```

For Alpine-based builds:
```bash
docker pull lobometalurgico/arunacore:alpine
docker run -p 3000:3000 lobometalurgico/arunacore:alpine
```

---

### Running from Release (pre-compiled package)

Each GitHub Release provides a `arunacore.zip` package containing the pre-compiled distribution of the application.

To run ArunaCore using this package:

1. Download the latest `arunacore.zip` from:  
   https://github.com/ArunaBot/ArunaCore/releases

2. Extract the archive.

3. Install dependencies:

```bash
npm ci --omit=dev
```

4. Start the application:

```bash
npm start
```


This method does not require building from source and is suitable for quick local setups or environments without Docker.

---

### Running from Source

Instructions for manual installation from source will be added soon as the project undergoes structural refinement.

---

## Architecture

ArunaCore operates as an event-driven WebSocket server.  
Applications connect to the core through their respective client APIs and communicate using structured messages.  
This architecture enables:

- Real-time distributed communication  
- Decoupling between application logic and message routing  
- Horizontal scalability through networked modules  
- Multi-language client integration  

More details will be published in the Wiki.

---

## Client APIs

ArunaCore provides client libraries for multiple programming languages.  
These libraries allow external applications to communicate with the core runtime via WebSockets.

| Language | Repository | Status |
|---------|------------|--------|
| **TypeScript / JavaScript** | https://github.com/ArunaBot/arunacore-js-api | ✔️ Stable |
| **Kotlin/Java** | *(In development)* | 🚧 Work in progress |
| **Python** | *(Planned)* | ⏳ Pending |
| **Go** | *(Planned)* | ⏳ Pending |

Contributions for additional language bindings are welcome.

---

## Documentation

Documentation is being expanded and updated during the current development cycle.

Please refer to the Wiki:  
https://github.com/ArunaBot/ArunaCore/wiki

If you encounter issues, need clarification, or want to request new features, use:  
- GitHub Issues: https://github.com/ArunaBot/Arunacore/issues  
- Discord community: https://discord.gg/NqbBgEf

---

## Contributing

Contribution guidelines are being prepared.  
Until then, feel free to open issues or pull requests with suggestions or improvements.

---

## License

ArunaCore is licensed under the GPL-3.0 license.  
For more information, see the [LICENSE](./LICENSE) file.

---

## Authors

ArunaCore is developed with 💜 by <a href="https://github.com/LoboMetalurgico">Lobo Metalurgico</a> and <a href="https://github.com/SpaceFox1">SpaceFox</a>.

