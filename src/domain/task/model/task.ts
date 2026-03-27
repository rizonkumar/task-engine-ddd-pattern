import {
  CreateTaskProps,
  UpdateTaskProps,
  TaskStatus,
  RecurrenceFrequency,
} from '../type/task.types';
import { InvalidScorePointsException } from '../exception/invalid-score.exception';

// WHY A CLASS AND NOT JUST AN INTERFACE?
// An interface is just a shape — it holds data but has no behaviour.
// A class can enforce rules. The Task class GUARANTEES that any Task
// object you have in memory is valid — because the only way to create
// one is through Task.create() which validates first.
//
// If you used a plain object, anyone could write:
//   const task = { scorePoints: -999, title: '' }
// and nothing would stop them. With this class, that's impossible.

export class Task {
  // WHY READONLY?
  // Once a Task is created, its id and projectId should never change.
  // readonly enforces this at compile time — TypeScript will error if
  // anyone tries to do task.id = 'something-else'.

  readonly id: string;
  readonly projectId: string;

  title: string;
  description: string | null;
  status: TaskStatus;
  scorePoints: number;
  dueDate: Date | null;
  isRecurring: boolean;
  recurrenceFrequency: RecurrenceFrequency | null;
  recurrenceInterval: number | null;
  recurrenceEndsAt: Date | null;
  completedAt: Date | null;

  readonly createdAt: Date;
  updatedAt: Date;

  // WHY PRIVATE CONSTRUCTOR?
  // This forces everyone to use Task.create() or Task.reconstitute()
  // to get a Task instance. You can NEVER do: new Task()
  // This means all validation always runs — no shortcuts.

  private constructor(props: {
    id: string;
    projectId: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    scorePoints: number;
    dueDate: Date | null;
    isRecurring: boolean;
    recurrenceFrequency: RecurrenceFrequency | null;
    recurrenceInterval: number | null;
    recurrenceEndsAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.projectId = props.projectId;
    this.title = props.title;
    this.description = props.description ?? null;
    this.status = props.status;
    this.scorePoints = props.scorePoints;
    this.dueDate = props.dueDate ?? null;
    this.isRecurring = props.isRecurring;
    this.recurrenceFrequency = props.recurrenceFrequency ?? null;
    this.recurrenceInterval = props.recurrenceInterval ?? null;
    this.recurrenceEndsAt = props.recurrenceEndsAt ?? null;
    this.completedAt = props.completedAt ?? null;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  // ─────────────────────────────────────────────
  // STATIC FACTORY: Task.create()
  // ─────────────────────────────────────────────
  // WHY STATIC FACTORY INSTEAD OF new Task()?
  // 1. It has a meaningful name — Task.create() tells you intent
  // 2. It can run validation BEFORE the object exists
  // 3. It generates system-managed fields (id, createdAt) automatically
  // 4. It sets sensible defaults (status = TODO if not provided)
  //
  // This is called the "Factory Method" pattern.

  static create(id: string, props: CreateTaskProps): Task {
    // BUSINESS RULE: score must be between 1 and 1000
    // WHY HERE and not in the DTO?
    // The DTO only runs when the request comes from HTTP.
    // But a task could be created by a background job, a seed script,
    // or a test — none of which go through the HTTP layer.
    // The domain model is the LAST LINE OF DEFENCE for business rules.
    if (props.scorePoints < 1 || props.scorePoints > 1000) {
      throw new InvalidScorePointsException(props.scorePoints);
    }

    const now = new Date();
    const hasRecurrence = !!props.recurrence;

    return new Task({
      id,
      projectId: props.projectId,
      title: props.title,
      description: props.description ?? null,

      // DEFAULT: if no status provided, always start as TODO
      status: props.status ?? TaskStatus.TODO,

      scorePoints: props.scorePoints,
      dueDate: props.dueDate ?? null,

      // Recurrence fields — only set if recurrence config was passed
      isRecurring: hasRecurrence,
      recurrenceFrequency: props.recurrence?.frequency ?? null,
      recurrenceInterval: props.recurrence?.interval ?? null,
      recurrenceEndsAt: props.recurrence?.endsAt ?? null,

      completedAt: null, // a brand new task is never completed
      createdAt: now,
      updatedAt: now,
    });
  }

  // ─────────────────────────────────────────────
  // STATIC FACTORY: Task.reconstitute()
  // ─────────────────────────────────────────────
  // WHY A SECOND FACTORY?
  // Task.create() is for NEW tasks — it generates id, createdAt, etc.
  // Task.reconstitute() is for tasks LOADED FROM THE DATABASE.
  // When loading from DB, you already have the id and createdAt —
  // you don't want to generate new ones or run "creation" validation.
  //
  // The repository implementation will call this when mapping
  // a database row back into a domain object.

  static reconstitute(props: {
    id: string;
    projectId: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    scorePoints: number;
    dueDate: Date | null;
    isRecurring: boolean;
    recurrenceFrequency: RecurrenceFrequency | null;
    recurrenceInterval: number | null;
    recurrenceEndsAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): Task {
    return new Task(props);
  }

  // ─────────────────────────────────────────────
  // BEHAVIOUR METHODS
  // ─────────────────────────────────────────────
  // WHY METHODS ON THE MODEL?
  // These are actions that change task state and have business rules.
  // Putting them here means the rule and the state change are always
  // together — you can't change the status without the rule running.

  complete(): void {
    // BUSINESS RULE: you cannot complete an already completed task
    if (this.status === TaskStatus.DONE) {
      throw new Error('Task is already completed');
    }
    this.status = TaskStatus.DONE;
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  update(props: UpdateTaskProps): void {
    // Only update fields that were actually passed
    // WHY: if props.title is undefined, we keep the current title
    if (props.title !== undefined) {
      this.title = props.title;
    }
    if (props.description !== undefined) {
      this.description = props.description;
    }
    if (props.status !== undefined) {
      this.status = props.status;
    }
    if (props.dueDate !== undefined) {
      this.dueDate = props.dueDate;
    }
    // BUSINESS RULE: score can only be updated if still valid range
    if (props.scorePoints !== undefined) {
      if (props.scorePoints < 1 || props.scorePoints > 1000) {
        throw new InvalidScorePointsException(props.scorePoints);
      }
      this.scorePoints = props.scorePoints;
    }
    this.updatedAt = new Date();
  }
}
