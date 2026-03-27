# Task Engine — Complete Architecture Reference
> NestJS · TypeORM · PostgreSQL · Clean Architecture · DDD-inspired
> Built step by step as a learning project. Use this to revise and for interviews.

---

## The one-line summary
> Every layer has **one job**. Layers only talk to the layer directly below them. The domain knows nothing about anyone.

---

## The mental models (burn these in first)

### The restaurant kitchen
| Layer | Analogy | Real file |
|---|---|---|
| Domain | Recipe card — what the dish IS and its rules | `task.ts`, `project.ts` |
| Application | Head chef — orchestrates, enforces order | `task.service.ts` |
| Infrastructure | Kitchen staff — fetches ingredients, stores food | `task.repository.ts` |
| Presentation | Waiter — takes order, delivers plate | `task.controller.ts` |

### The three infrastructure words
- **Entity = SHAPE** → what the DB row looks like (`task.entity.ts`)
- **Mapper = TRANSLATE** → converts between DB world and business world (`task.mapper.ts`)
- **Repository = FETCH** → saves and retrieves using TypeORM (`task.repository.ts`)

### The dependency rule (never break this)
```
Presentation → Application → Domain interfaces
Infrastructure → Domain interfaces

Domain knows NOTHING about anyone else.
```

---

## Step 1 — Project Setup

### What we did
- Created NestJS project with `nest new task-engine`
- Installed TypeORM, pg, class-validator, typeorm-transactional, uuid
- Created the full folder structure manually
- Set up `app.module.ts` with ConfigModule + TypeOrmModule
- Set up `main.ts` with ValidationPipe + initializeTransactionalContext

### Folder structure
```
src/
  domain/
    task/
      model/          ← what a Task IS
      type/           ← input contracts (CreateTaskProps)
      repository/     ← interface promise (ITaskRepository)
      exception/      ← what can go wrong
    project/          ← same four folders
  application/
    task/             ← task.service.ts
    project/          ← project.service.ts
  infrastructure/
    task/
      entity/         ← TypeORM DB mapping
      mapper/         ← domain ↔ entity translation
      repository/     ← implements the interface
    project/          ← same three folders
    database/         ← data-source.ts for CLI
  presentation/
    task/
      controller/     ← HTTP routes
      dto/            ← request/response shapes
      mapper/         ← DTO ↔ domain props
    project/          ← same three folders
  migrations/         ← versioned DB schema changes
  shared/
    filter/           ← global exception filter
```

### Key decisions
- `synchronize: false` always — migrations own the schema
- `initializeTransactionalContext()` must run BEFORE `NestFactory.create()`
- UUIDs generated in the application layer, not Postgres
- Path aliases (`@domain/*`, `@application/*`) for clean imports

---

## Step 2 — Domain Layer

### What lives here
- Zero NestJS imports
- Zero TypeORM imports
- Pure TypeScript only

### The four files per feature

#### `type/task.types.ts` — input contracts
```typescript
// WHY: caller provides these, system generates the rest (id, createdAt)
export type CreateTaskProps = {
  projectId: string;
  title: string;
  scorePoints: number;        // must be 1-1000
  status?: TaskStatus;        // defaults to TODO
  recurrence?: CreateRecurrenceProps;
};
```

#### `exception/` — structured errors
```
task-error-code.ts          ← enum of all error codes
domain-exception.base.ts    ← base class all exceptions extend
task-not-found.exception.ts ← specific class per error
```
Why error codes not strings? The global filter reads the code to decide HTTP status (404 vs 400 vs 409).

#### `model/task.ts` — the star of the layer
```typescript
export class Task {
  // private constructor = nobody can do new Task()
  // forces all creation through factories

  static create(id: string, props: CreateTaskProps): Task {
    // validates business rules (score 1-1000)
    // generates defaults (status = TODO, completedAt = null)
    // called for NEW tasks
  }

  static reconstitute(props: {...}): Task {
    // NO validation — data came from our own DB, already valid
    // called when LOADING from database
  }

  complete(): void {
    // business method — enforces "cannot re-complete" rule
    // sets completedAt, updates updatedAt
  }
}
```

#### `repository/task.repository.interface.ts` — the promise
```typescript
export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY');

export interface ITaskRepository {
  save(task: Task): Promise<void>;
  findById(id: string): Promise<Task | null>;
  findAllByProjectId(projectId: string): Promise<Task[]>;
  existsByTitleInProject(title: string, projectId: string): Promise<boolean>;
  update(task: Task): Promise<void>;
  findAllRecurring(): Promise<Task[]>;
}
```
Why a Symbol? Symbols are globally unique — prevents DI name collisions.
Why an interface? The service depends on the abstraction, not the TypeORM class.

### Interview answer: "Why private constructor?"
> "It makes it impossible to create an invalid domain object. The only paths to a Task are `Task.create()` which validates business rules, or `Task.reconstitute()` which rebuilds from trusted DB data. There is no way to bypass the rules."

### Interview answer: "create() vs reconstitute()?"
> "`create()` is for new objects — it generates IDs, sets defaults, runs validation. `reconstitute()` is for loading from the database — the data was already validated when saved, so we trust it and skip re-validation."

---

## Step 3 — Infrastructure Layer

### Entity (`task.entity.ts`)
```typescript
@Entity('task')           // maps to 'task' table in Postgres
export class TaskEntity {
  @PrimaryColumn({ type: 'uuid' })    // we generate IDs, not Postgres
  id: string;

  @ManyToOne(() => ProjectEntity)
  @JoinColumn({ name: 'project_id' }) // FK column lives on task table
  project: ProjectEntity;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;                  // stored separately for cheap reads

  @Column({ type: 'enum', enum: TaskStatus })
  status: TaskStatus;                 // Postgres native ENUM enforces values

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;                    // TypeORM sets this automatically on INSERT

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;                    // TypeORM updates this automatically
}
```

### Mapper (`task.mapper.ts`)
```typescript
export class TaskMapper {
  // Loading from DB → call reconstitute (no validation)
  static toDomain(entity: TaskEntity): Task {
    return Task.reconstitute({ ...entity });
  }

  // Saving to DB → plain entity object for TypeORM
  static toEntity(domain: Task): TaskEntity {
    const entity = new TaskEntity();
    entity.id = domain.id;
    // ... assign all fields
    return entity;
  }
}
```

### Repository (`task.repository.ts`)
```typescript
@Injectable()
export class TaskRepository implements ITaskRepository {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly repo: Repository<TaskEntity>,
  ) {}

  async findById(id: string): Promise<Task | null> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) return null;          // returns null, never throws
    return TaskMapper.toDomain(entity); // always map before returning
  }

  async existsByTitleInProject(title: string, projectId: string) {
    const count = await this.repo
      .createQueryBuilder('task')
      .where('LOWER(task.title) = LOWER(:title)', { title })
      .andWhere('task.project_id = :projectId', { projectId })
      .getCount();
    return count > 0;
  }
}
```

### Module binding (`infrastructure.module.ts`)
```typescript
providers: [
  { provide: PROJECT_REPOSITORY, useClass: ProjectRepository },
  { provide: TASK_REPOSITORY,    useClass: TaskRepository    },
]
// This is the Dependency Inversion Principle:
// "When someone asks for TASK_REPOSITORY, give them TaskRepository"
// Swapping databases = changing useClass here, nothing else.
```

### Interview answer: "Why separate entity from domain model?"
> "The entity has TypeORM decorators and knows about Postgres. The domain model has business methods and knows about rules. Mixing them means a database change could break business logic and vice versa. The mapper translates between them so neither world leaks into the other."

### Interview answer: "Why does the repository return null instead of throwing?"
> "The repository only knows how to fetch. It does not know what 'not found' means for a given use case. The service decides — in some cases null means throw an exception, in others it means 'check if it exists'. Returning null keeps the repository flexible and reusable."

---

## Step 4 — Application Layer

### The service's three jobs
1. **Check rules** that require querying the DB (duplicates, existence)
2. **Create/mutate** domain objects via their factories and methods
3. **Persist** via repository interface and return the result

### The fetch → mutate → save pattern
```typescript
async updateTask(id: string, props: UpdateTaskProps): Promise<Task> {
  const task = await this.getTaskById(id);  // 1. fetch (throws if not found)
  task.update(props);                        // 2. mutate (domain rules run)
  await this.taskRepo.update(task);          // 3. save
  return task;
}
```
Why this pattern? You can never update a field without the business rule running. Directly setting `task.status = 'done'` bypasses `completedAt` and the re-complete check.

### @Transactional
```typescript
@Transactional()
async createTask(props: CreateTaskProps): Promise<Task> {
  // if ANYTHING throws inside here,
  // ALL database operations are rolled back automatically
}
```
Must call `initializeTransactionalContext()` in `main.ts` before this works.

### Duplicate check pattern
```typescript
// Duplicate checks ALWAYS in the service, not the domain model
// WHY: checking duplicates requires a DB query — domain model has no repo
const exists = await this.taskRepo.existsByTitleInProject(title, projectId);
if (exists) throw new DuplicateTaskTitleException(title);
```

### UUID generation
```typescript
// IDs generated in the application layer, not in Postgres
// WHY: domain object needs the ID before being saved
const id = uuidv4();
const task = Task.create(id, props);
```

### Interview answer: "Where do business rules live — domain or service?"
> "Rules about a single object live in the domain model (score must be 1-1000, can't re-complete a task). Rules that require querying the database live in the service (no duplicate titles in a project). The domain model can't query the DB — it has no repository."

---

## Step 5 — Presentation Layer

### DTO vs domain type
```typescript
// DTO — runtime validation, HTTP shape, lives in presentation/
export class CreateTaskDto {
  @IsString()
  @IsInt() @Min(1) @Max(1000)
  scorePoints: number;    // class-validator runs this at HTTP request time
}

// Domain type — compile-time contract, lives in domain/
export type CreateTaskProps = {
  scorePoints: number;    // TypeScript only, no runtime validation
};
```

### The presentation mapper — two directions
```typescript
// HTTP request → domain input
static toCreateProps(dto: CreateTaskDto, projectId: string): CreateTaskProps

// Domain object → HTTP response
static toResponse(task: Task): TaskResponseDto
```

### Global exception filter
```typescript
@Catch(DomainException)     // catches ALL subclasses automatically
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const status = this.getHttpStatus(exception.errorCode);
    response.status(status).json({
      statusCode: status,
      errorCode: exception.errorCode,   // e.g. "TASK_NOT_FOUND"
      message: exception.message,
    });
  }
}
// Result: zero try/catch in controllers. Ever.
```

### Controller rules
- Extract URL params with `@Param()`
- Extract body with `@Body()` (DTO validation runs automatically)
- Call presentation mapper to convert DTO → props
- Call service
- Call presentation mapper to convert domain → response DTO
- Never write if/else business logic here

### Nested routes
```typescript
@Controller('projects/:projectId/tasks')
// URL expresses the relationship: tasks belong to projects
// projectId comes from URL, not request body
```

### Interview answer: "Why validate in DTO AND domain model?"
> "The DTO only runs for HTTP requests. The domain model is also called from background jobs, tests, and seed scripts that never touch HTTP. The DTO is the first line of defence for bad HTTP input. The domain model is the last line of defence for bad data from anywhere."

---

## Step 6 — Migrations

### The golden rule
```
synchronize: false — ALWAYS.
Migrations are the only thing allowed to change your schema.
```

### Every migration has two methods
```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // what to DO — CREATE TABLE, ADD COLUMN, CREATE INDEX
}

public async down(queryRunner: QueryRunner): Promise<void> {
  // how to UNDO — in REVERSE ORDER of up()
  // drop index before table (table depends on index does not exist yet)
  // drop table before type (type is used by table column)
}
```

### Index types used
| Type | Example | Why |
|---|---|---|
| Unique | `LOWER(name)` | prevents duplicates, case-insensitive |
| Regular | `project_id` | fast lookups by FK |
| Partial | `is_recurring WHERE is_recurring=true` | small index, most rows are false |

### Three layers of duplicate protection
```
1. Service:   existsByName() → DuplicateProjectNameException (friendly)
2. DB index:  UNIQUE INDEX on LOWER(name)                   (safety net)
3. FK:        FOREIGN KEY project_id REFERENCES project(id) (orphan protection)
```

### Commands
```bash
npm run migration:run      # applies all pending migrations
npm run migration:revert   # undoes the last migration
npm run migration:generate # auto-generates from entity diff (review before using)
```

### Interview answer: "Why not use synchronize:true?"
> "In production, synchronize:true means TypeORM automatically runs ALTER TABLE and DROP COLUMN when your entities change. One wrong entity change can destroy production data with no warning and no way to roll back. Migrations give you explicit, reviewed, versioned, reversible schema changes."

---

## The complete request flow

```
HTTP POST /projects/:projectId/tasks
         │
         ▼
    ValidationPipe          → rejects bad DTO shape (400)
         │
         ▼
    TaskController          → extracts params, calls mapper
         │
         ▼
    PresentationMapper      → DTO + projectId → CreateTaskProps
         │
         ▼
    TaskService             → checks project exists
    @Transactional()          checks no duplicate title
                              Task.create(uuid, props)  ← domain validates
                              taskRepo.save(task)
         │
         ▼
    TaskRepository          → TaskMapper.toEntity(task)
                              repo.save(entity)
         │
         ▼
    PostgreSQL              → INSERT INTO task ...
         │
         ▼ (return path)
    TaskMapper.toDomain()   → entity → Task domain object
    PresentationMapper      → Task → TaskResponseDto
         │
         ▼
    HTTP 201 { id, title, status, scorePoints, ... }

    If ANYTHING throws a DomainException anywhere:
         │
         ▼
    DomainExceptionFilter   → { statusCode, errorCode, message }
```

---

## Interview cheat sheet

| Question | One-line answer |
|---|---|
| What is Clean Architecture? | Dependencies point inward. Domain knows nothing about anyone. |
| What is DDD? | Model software around business concepts, not database tables. |
| Why interfaces for repositories? | Dependency inversion — swap implementations without touching business logic. |
| What is a Symbol token? | A globally unique DI key that prevents name collisions. |
| What is @Transactional? | Wraps a method in a DB transaction — any failure rolls everything back. |
| Why private constructor? | Forces all creation through factories that validate business rules. |
| create() vs reconstitute()? | create() for new objects with validation. reconstitute() for DB data, trusted. |
| Why mapper exists? | Keeps DB shape and business shape independent. Each can change without breaking the other. |
| Why return null from repo? | Repo fetches, service decides what null means. Keeps repo reusable. |
| Where do duplicate checks go? | Service — they need a DB query the domain model cannot make. |
| Why migrations not synchronize? | Explicit, reviewed, versioned, reversible. synchronize can silently destroy data. |
| What is a partial index? | An index with a WHERE clause — only indexes matching rows, smaller and faster. |
| Why soft delete (isActive)? | Preserves history, allows recovery, maintains referential integrity. |
| What does the exception filter do? | Catches all DomainException subclasses and converts to HTTP JSON automatically. |
| Why nested routes for tasks? | URL expresses the relationship. projectId comes from URL, not request body. |

---

## File count summary

```
domain/         14 files  (models, types, interfaces, exceptions)
application/     3 files  (2 services + 1 module)
infrastructure/ 10 files  (2 entities, 2 mappers, 2 repos, 1 module, 1 data-source)
presentation/   11 files  (2 controllers, 4 DTOs, 2 mappers, 1 module, 1 filter)
migrations/      2 files  (project table, task table)
config/          2 files  (app.module, main.ts)
─────────────────────────
Total:          42 files  — every single one with a clear single responsibility
```
<!--Notion: https://www.notion.so/DDD-Pattern-Notes-With-Simple-App-32fcd46418a080f095f2c17ff543b546?source=copy_link -->
