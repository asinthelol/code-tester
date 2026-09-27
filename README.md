# Code Tester

## Quick Start

### Local Development

1. Clone the repo

```bash
git clone https://github.com/asinthelol/code-tester.git
cd code-tester
```

2. Install frontend dependencies

```bash
cd frontend
npm install
```

3. Build the supervisor (needed for running tests, local and Docker)

```bash
cd ../supervisor
npm install
npm run build:local
```

4. Run the app

```bash
cd ../frontend
npm start
```

Opens as a desktop app (Electron).

## How To Use

1. Import a source file and pick a function to test, or point at a hand-written suite file
2. Import a repo and let the wizard scaffold a docker-compose environment for it (Postgres/Redis/MySQL auto-wired when detected)
3. Run tests locally with no Docker, or against a running environment
4. Watch live pass/fail/errored status per test, with captured stdout/stderr
5. Manage files, tests, environments, and repos from the sidebar, each with an optional delete-from-disk

## Features

- Target-mode tests: pick a function, give it args + expected output, run it
- Suite-mode tests: hand-written test files
- JS/TS, Python, and C++ execution (C++ is target-mode only)
- Docker-based integration environments via docker-compose, auto-scaffolded from a repo
- Local (no-Docker) execution path for quick iteration
- Persisted workspace state across restarts

## Prerequisites

Feature-gated, not everything is needed for every use:

- **Node.js** — required to run the app in development at all
- **Docker Desktop** (with Compose) — importing/starting environments, Docker-mode test runs
- **`pack` CLI** (Cloud Native Buildpacks) — the "Add Repo" wizard's image builds
- **A C++ compiler** (`g++`, e.g. MinGW-w64/MSYS2 on Windows) — local C++ target-mode tests only; Docker-mode C++ uses the compiler baked into the supervisor image instead
- **Python** — local Python tests only, same Docker exception as above

None of these are bundled into the app yet.

## Built With

- **Desktop shell**: Electron, Electron Forge, Vite
- **Frontend**: React, TypeScript, Tailwind, Monaco Editor
- **Test execution**: Node.js, Python, Docker
- **Repo scaffolding**: Cloud Native Buildpacks (`pack`)

## License

I don't care what you do with it, just don't say you made this.

---

### by asinthelol
