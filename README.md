# Task Engine

> A projects + tasks management REST API, built from scratch to practice **Clean Architecture** and **Domain-Driven Design** with **NestJS · TypeORM · PostgreSQL**.

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-0.3-FE0803)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)

Every layer has **one job**. Layers only talk to the layer below them, and the core business code (the Domain) knows nothing about the database, the web, or any framework. The result is code that is easy to test, easy to change, and hard to break by accident.

---

## What it is

A small backend where you create **projects** and add **tasks** to them. It looks simple on the surface, but under the hood it follows a strict layered design so the business rules stay independent of NestJS and PostgreSQL:

- **Projects** — create, list, fetch, update, soft-delete.
- **Tasks** — nested under a project; create, list, fetch, update, and complete. Tasks carry a score (1–1000), an optional due date, and optional recurrence settings.
- **Safety by design** — domain validation, transactional writes, three layers of duplicate protection, and a single global error handler.

---

## Architecture at a glance

```
Presentation  →  Application  →  Domain (interfaces + rules)
Infrastructure ----implements---->  Domain

The Domain knows NOTHING about anyone else. Arrows only point inward.
```

| Layer | Job | Lives in |
|---|---|---|
| **Domain** | The business rules — what a Task/Project *is* and what must always be true | `src/domain` |
| **Application** | Orchestrates the steps for each use case; owns transactions | `src/application` |
| **Infrastructure** | Talks to PostgreSQL via TypeORM; the only place the DB exists | `src/infrastructure` |
| **Presentation** | HTTP layer — validates input, shapes responses | `src/presentation` |

📖 **Want the full, plain-English walkthrough?** Read the deep-dive:
- **[Clean Architecture & DDD — the deep dive](./DDD-Clean-Architecture-Blog.md)** — every layer explained with diagrams and real code.
- **[`Flow.png`](./Flow.png)** — the whole architecture on one page.
- **[`Notes.md`](./Notes.md)** — condensed revision / interview notes.

---

## Tech stack

| Area | Choice |
|---|---|
| Framework | NestJS 11 |
| Language | TypeScript 5.7 |
| ORM | TypeORM 0.3 |
| Database | PostgreSQL |
| Validation | class-validator / class-transformer |
| Transactions | typeorm-transactional |
| IDs | UUID (generated in the application layer) |

---

## Features

- ✅ Clean Architecture with a strict, inward-pointing dependency rule
- ✅ Rich domain models (private constructors + `create()` / `reconstitute()` factories)
- ✅ Repository pattern behind interfaces (swap the database without touching business logic)
- ✅ `@Transactional()` writes — any failure rolls everything back
- ✅ Versioned, reversible **migrations** (`synchronize: false`, always)
- ✅ Three layers of duplicate protection (service check + unique index + foreign key)
- ✅ Global exception filter — meaningful error codes mapped to HTTP statuses, zero `try/catch` in controllers

---

## Getting started

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** running locally (or a connection you can reach)

### 1. Install

```bash
git clone https://github.com/rizonkumar/task-engine.git
cd task-engine
npm install
```

### 2. Configure environment

Copy the example file and fill in your database credentials:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_HOST` | PostgreSQL host (e.g. `localhost`) |
| `DATABASE_PORT` | PostgreSQL port (e.g. `5432`) |
| `DATABASE_USER` | Database user |
| `DATABASE_PASSWORD` | Database password |
| `DATABASE_NAME` | Database name (e.g. `task_engine`) |
| `NODE_ENV` | `development` / `production` |

> Make sure the database named in `DATABASE_NAME` exists before running migrations.

### 3. Run migrations

```bash
npm run migration:run
```

### 4. Start the app

```bash
npm run start:dev        # watch mode
```

The API is now available at `http://localhost:3000`.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run start:dev` | Start in watch mode |
| `npm run start:prod` | Run the compiled build (`dist/main`) |
| `npm run build` | Compile the project |
| `npm run lint` | Lint and auto-fix |
| `npm run format` | Format with Prettier |
| `npm run test` | Run unit tests |
| `npm run test:cov` | Tests with coverage |
| `npm run test:e2e` | End-to-end tests |
| `npm run migration:run` | Apply all pending migrations |
| `npm run migration:revert` | Undo the last migration |
| `npm run migration:generate` | Generate a migration from entity changes (review before using) |
| `npm run migration:create` | Create an empty migration file |

---

## REST API

### Projects

| Method | Route | Description |
|---|---|---|
| `POST` | `/projects` | Create a project |
| `GET` | `/projects` | List projects |
| `GET` | `/projects/:id` | Get one project |
| `PATCH` | `/projects/:id` | Update a project |
| `DELETE` | `/projects/:id` | Soft-delete a project |

### Tasks (nested under a project)

| Method | Route | Description |
|---|---|---|
| `POST` | `/projects/:projectId/tasks` | Create a task |
| `GET` | `/projects/:projectId/tasks` | List tasks in a project |
| `GET` | `/projects/:projectId/tasks/:id` | Get one task |
| `PATCH` | `/projects/:projectId/tasks/:id` | Update a task |
| `PATCH` | `/projects/:projectId/tasks/:id/complete` | Mark a task complete |

The nested route expresses the relationship: tasks belong to a project, so `projectId` comes from the URL, not the request body.

---

## Project structure

```
src/
  domain/             ← pure business rules (zero framework imports)
    task/
      model/          ← what a Task IS + its rules
      type/           ← input contracts (CreateTaskProps)
      repository/     ← the interface promise (ITaskRepository)
      exception/      ← named domain errors with codes
    project/          ← same four folders
  application/        ← use-case services (orchestration + transactions)
  infrastructure/     ← TypeORM entities, mappers, repositories
    database/         ← data-source.ts for the migration CLI
  presentation/       ← controllers, DTOs, response mappers
  migrations/         ← versioned DB schema changes
  shared/
    filter/           ← global exception filter
```

---

## Further reading

- 📘 **[Clean Architecture & DDD — the deep dive](./DDD-Clean-Architecture-Blog.md)** — the full guide, in plain English.
- 🗒️ **[Notes.md](./Notes.md)** — quick revision / interview notes.

---

## License

A personal learning project. Use it freely to learn from.
