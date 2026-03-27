import { Task } from '../model/task';

// WHY A SYMBOL TOKEN?
// NestJS dependency injection needs a unique key to know which class
// to inject when something asks for "the task repository".
// We use a Symbol (not a string) because Symbols are globally unique —
// two Symbols with the same description are still different values.
// This prevents accidental name collisions across modules.
//
// Usage in the service:
//   @Inject(TASK_REPOSITORY) private readonly taskRepo: ITaskRepository

export const TASK_REPOSITORY = Symbol('TaskRepository');

// WHY AN INTERFACE AND NOT THE CLASS DIRECTLY?
// The application service depends on THIS interface, not on
// BankAccountRepository (the TypeORM class in infrastructure/).
//
// This means:
// 1. You can swap Postgres for MongoDB — only infrastructure/ changes
// 2. You can mock this in tests with a simple fake object
// 3. The domain layer stays completely independent of TypeORM
//
// This is the "Dependency Inversion Principle" — high-level modules
// (application service) depend on abstractions (this interface),
// not on concretions (TypeORM repository class).

export interface ITaskRepository {
  // Save a new task to the database
  save(task: Task): Promise<void>;

  // Find one task by its id — returns null if not found
  findById(id: string): Promise<Task | null>;

  // Find all tasks belonging to a project
  findAllByProjectId(projectId: string): Promise<Task[]>;

  // Check if a title already exists in a project (for duplicate check)
  existsByTitleInProject(title: string, projectId: string): Promise<boolean>;

  // Update an existing task
  update(task: Task): Promise<void>;

  // Find all recurring tasks (used by the scheduler later)
  findAllRecurring(): Promise<Task[]>;
}
