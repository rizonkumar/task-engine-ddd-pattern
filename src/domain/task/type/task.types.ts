// WHY THIS FILE EXISTS:
// When the application service wants to create a Task, it needs to pass
// some data to the domain model. Instead of passing loose arguments
// (createTask("Buy milk", "todo", 10)) which break if you add a new field,
// we define a typed "props" object.
//
// This is NOT a DTO (that lives in presentation/).
// This is NOT a database row (that lives in infrastructure/).
// This is the pure business contract: "to create a Task you need these fields."

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum RecurrenceFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

// WHY A SEPARATE TYPE FOR CREATE vs the full model?
// The full Task model has fields like `id`, `createdAt`, `completedAt`
// that the CALLER should NOT be providing — the system generates them.
// CreateTaskProps only contains what the caller is responsible for sending.

export type CreateTaskProps = {
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  scorePoints: number;
  dueDate?: Date;
  recurrence?: CreateRecurrenceProps;
};

// WHY NESTED TYPE?
// Recurrence config is its own concept. Nesting it here keeps CreateTaskProps
// readable — you see "recurrence is optional and has its own shape."

export type CreateRecurrenceProps = {
  frequency: RecurrenceFrequency;
  interval: number; // every N days/weeks/months (e.g. interval=2 + WEEKLY = every 2 weeks)
  endsAt?: Date; // optional — null means recurs forever
};

export type UpdateTaskProps = {
  title?: string;
  description?: string;
  status?: TaskStatus;
  scorePoints?: number;
  dueDate?: Date;
};
