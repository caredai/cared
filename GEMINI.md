# Gemini Project Context: cared

This document provides context for the `cared` monorepo to assist Gemini with understanding the project structure, technologies, and common tasks.

## Project Overview

This is a monorepo for T3 applications, built using Turborepo. It includes a web application built with Tanstack Start, an Expo mobile application, and a set of shared packages. The project is structured to support code sharing and efficient development across multiple applications.

### Key Technologies

*   **Monorepo:** pnpm workspaces and Turborepo
*   **Web App:** Tanstack Start, Tanstack Router, React, Tailwind CSS
*   **Mobile App:** Expo, React Native
*   **API:** orpc
*   **Database:** Drizzle ORM with Supabase (Postgres)
*   **Authentication:** better-auth
*   **UI:** shadcn-ui
*   **Tooling:** TypeScript, Prettier, ESLint

### Project Structure

The monorepo is organized into the following directories:

*   `apps/`: Contains the individual applications (web, Expo, etc.).
*   `packages/`: Contains shared code, such as API definitions, authentication logic, database schemas, and UI components.
*   `tooling/`: Contains shared configurations for tools like ESLint and Prettier.

## Building and Running

The following commands are available in the root `package.json` and should be run from the root of the monorepo.

### Development

*   **Run all apps in development mode:**
    ```bash
    pnpm dev
    ```
*   **Run only the web app in development mode:**
    ```bash
    pnpm dev:web
    ```

### Build

*   **Build all apps and packages:**
    ```bash
    pnpm build
    ```
*   **Build only the packages:**
    ```bash
    pnpm build:packages
    ```

### Database

*   **Push database schema changes:**
    ```bash
    pnpm db:push
    ```
*   **Open database studio:**
    ```bash
    pnpm db:studio
    ```

### Code Quality

*   **Lint all code:**
    ```bash
    pnpm lint
    ```
*   **Format all code:**
    ```bash
    pnpm format
    ```
*   **Type-check all code:**
    ```bash
    pnpm typecheck
    ```

## Development Conventions

*   **Package Management:** This project uses `pnpm` for package management. Use `pnpm` for all dependency installations and script execution.
*   **Code Style:** Code is formatted with Prettier and linted with ESLint. Run `pnpm format` and `pnpm lint` before committing code.
*   **Commits:** (Inferred) The presence of `.changeset` and a `publish-packages` script suggests that this project follows a conventional commit message format for automated versioning and changelog generation.
*   **UI Components:** New UI components can be added using the `shadcn/ui` CLI by running `pnpm ui-add`.
