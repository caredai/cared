# Repository Guidance

When working in this repository, inspect the existing package-level guidance before editing files in a package. In particular, `packages/api/AGENTS.md` contains API-specific conventions.

Additional architecture notes live under `docs/`. Review relevant documents there on demand.

For the Cared and Appwrite integration, start with `docs/appwrite-integration-architecture.md`.

When running `pnpm` commands, generally run them outside the sandbox so the global pnpm store can be used.
