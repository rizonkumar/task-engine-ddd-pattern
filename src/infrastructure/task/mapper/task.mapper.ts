import { TaskEntity } from '../entity/task.entity';
import { Task } from '../../../domain/task/model/task';

export class TaskMapper {
  static toDomain(entity: TaskEntity): Task {
    return Task.reconstitute({
      id: entity.id,
      projectId: entity.projectId,
      title: entity.title,
      description: entity.description,
      status: entity.status,
      scorePoints: entity.scorePoints,
      dueDate: entity.dueDate,
      isRecurring: entity.isRecurring,
      recurrenceFrequency: entity.recurrenceFrequency,
      recurrenceInterval: entity.recurrenceInterval,
      recurrenceEndsAt: entity.recurrenceEndsAt,
      completedAt: entity.completedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toEntity(domain: Task): TaskEntity {
    const entity = new TaskEntity();

    entity.id = domain.id;
    entity.projectId = domain.projectId;
    entity.title = domain.title;
    entity.description = domain.description;
    entity.status = domain.status;
    entity.scorePoints = domain.scorePoints;
    entity.dueDate = domain.dueDate;
    entity.isRecurring = domain.isRecurring;
    entity.recurrenceFrequency = domain.recurrenceFrequency;
    entity.recurrenceInterval = domain.recurrenceInterval;
    entity.recurrenceEndsAt = domain.recurrenceEndsAt;
    entity.completedAt = domain.completedAt;

    // WHY NOT setting createdAt here?
    // On INSERT: TypeORM's @CreateDateColumn handles it automatically.
    // On UPDATE: we never re-insert createdAt — it never changes.
    // updatedAt is handled by @UpdateDateColumn automatically too.

    return entity;
  }
}
