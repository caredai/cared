# Gemini Project Context: @cared/web

This document provides context for the `@cared/web` package to assist Gemini with understanding its structure, technologies, and development conventions.

## Package Overview

This package contains the web application for the `cared` monorepo. It is built using the T3 stack, specifically with TanStack Start, which provides a modern, full-stack framework for React applications. It is configured for Server-Side Rendering (SSR) and deployment on Cloudflare Pages.

### Key Technologies

- **Framework**: TanStack Start
- **Routing**: TanStack Router (file-based)
- **Data Fetching**: TanStack Query (via orpc)
- **UI Framework**: React
- **Styling**: Tailwind CSS
- **UI Components**: `@cared/ui` (based on shadcn/ui)
- **Build Tool**: Vite
- **Deployment**: Cloudflare Pages via Wrangler
- **API Communication**: orpc
- **Authentication**: better-auth (via `@daveyplate/better-auth-tanstack`)
- **Schema Validation**: Zod
- **Tooling**: TypeScript, ESLint, Prettier

### Key Directories

The `src` directory is organized as follows:

- `src/components/`: Contains shared React components used throughout the application.
- `src/config/`: Holds application-specific configuration files (e.g., menu, site info).
- `src/hooks/`: For custom React hooks that encapsulate business logic or data fetching.
- `src/lib/`: A collection of utility functions and libraries.
- `src/routes/`: Defines the application's pages and layouts using file-based routing for TanStack Router.
- `src/server.ts`: The server entry point for SSR, adapted for Cloudflare.
- `src/start.ts`: TanStack Start configuration file.
- `src/router.tsx`: The main setup for TanStack Router.

### Development Conventions

- **Routing**: New pages should be created as files within the `src/routes/` directory, following the conventions of TanStack Router. The route tree is automatically generated in `src/routeTree.gen.ts`.
- **Styling**: Use Tailwind CSS for styling. For common UI patterns, prefer using or extending components from the `@cared/ui` library.
- **State Management**: For server state, use TanStack Query. For local/client state, consider using React hooks (`useState`, `useReducer`) or Jotai if shared state is needed.
- **API Calls**: All API interactions are handled through `orpc`.
- **Environment Variables**: Managed via `src/env.ts` using `@t3-oss/env-core`.
