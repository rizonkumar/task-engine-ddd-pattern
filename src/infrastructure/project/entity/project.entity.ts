import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

// WHY @Entity('project')?
// This decorator tells TypeORM: "this class maps to the 'project' table
// in Postgres". The string 'project' is the exact table name.
// Without this decorator, TypeORM ignores the class completely.

// WHY @PrimaryColumn() and not @PrimaryGeneratedColumn()?
// We use UUIDs generated in the APPLICATION layer (not the database).
// This means the ID exists before the row is inserted — which is important
// for domain events, distributed systems, and testing.
// @PrimaryGeneratedColumn('uuid') would make Postgres generate the UUID,
// which means you don't know the ID until after the INSERT — too late
// if your domain model already used it.

@Entity('project')
export class ProjectEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  // WHY name: 'owner_id'?
  // TypeScript uses camelCase (ownerId) but Postgres convention is
  // snake_case (owner_id). The name option maps one to the other.
  // Without it, TypeORM would create a column called "ownerid".

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // WHY nullable: true on description?
  // This tells TypeORM the column allows NULL in Postgres.
  // If you don't set this, TypeORM defaults to NOT NULL — and your
  // INSERT will fail when description is absent.

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // WHY @CreateDateColumn?
  // TypeORM automatically sets this to NOW() on INSERT.
  // You never have to set it manually.

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // WHY @UpdateDateColumn?
  // TypeORM automatically updates this to NOW() on every UPDATE.
  // Again, never set manually.

  // WHY @OneToMany here?
  // This tells TypeORM that one Project has many TaskEntities.
  // We need this so TypeORM can understand the relationship
  // even if we never use eager loading.
  // The () => TaskEntity is a lazy reference to avoid circular imports.
  @OneToMany(() => TaskEntity, (task) => task.project)
  tasks: TaskEntity[];
}

// We import TaskEntity below to avoid circular import issues
// (TaskEntity references ProjectEntity and vice versa)
import { TaskEntity } from '../../task/entity/task.entity';
