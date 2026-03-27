import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectEntity } from '../../project/entity/project.entity';
import {
  TaskStatus,
  RecurrenceFrequency,
} from '../../../domain/task/type/task.types';

// WHY DO WE IMPORT ENUMS FROM DOMAIN HERE?
// The enum values (like 'todo', 'in_progress') need to be consistent
// between what the domain uses and what gets stored in Postgres.
// Importing from domain/ is the ONE allowed exception where
// infrastructure can reference domain — but only for shared type definitions,
// never for business logic.

@Entity('task')
export class TaskEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  // WHY @ManyToOne + @JoinColumn?
  // @ManyToOne tells TypeORM: many tasks belong to one project.
  // @JoinColumn tells TypeORM: the foreign key column lives on THIS
  // table (task.project_id references project.id).
  // Without @JoinColumn, TypeORM won't know where the FK column is.
  @ManyToOne(() => ProjectEntity, (project: ProjectEntity) => project.tasks)
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  // WHY STORE project_id SEPARATELY?
  // @ManyToOne gives you the full ProjectEntity object (if loaded).
  // But sometimes you just need the ID without loading the whole project.
  // Having projectId as its own @Column lets you read it cheaply.
  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // WHY type: 'enum'?
  // Postgres has a native ENUM type. We use it here so the DB
  // enforces the allowed values — an invalid status can never be inserted.
  // The enum option maps to the TypeScript enum we imported from domain/.
  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({ name: 'score_points', type: 'int' })
  scorePoints: number;

  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate: Date | null;

  // WHY timestamptz and not timestamp?
  // timestamptz = timestamp WITH time zone.
  // Postgres stores it in UTC and converts on read.
  // Plain timestamp has no timezone info — dangerous in global apps.
  // Always use timestamptz for date/time columns.

  @Column({ name: 'is_recurring', type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({
    name: 'recurrence_frequency',
    type: 'enum',
    enum: RecurrenceFrequency,
    nullable: true,
  })
  recurrenceFrequency: RecurrenceFrequency | null;

  @Column({ name: 'recurrence_interval', type: 'int', nullable: true })
  recurrenceInterval: number | null;

  @Column({ name: 'recurrence_ends_at', type: 'timestamptz', nullable: true })
  recurrenceEndsAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
