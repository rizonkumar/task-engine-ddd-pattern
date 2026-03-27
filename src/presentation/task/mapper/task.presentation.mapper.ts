import { Task } from '../../../domain/task/model/task';
import { TaskResponseDto } from '../dto/task-response.dto';
import { CreateTaskDto } from '../dto/create-task.dto';
import {
  CreateTaskProps,
  TaskStatus,
} from '../../../domain/task/type/task.types';

export class TaskPresentationMapper {
  static toResponse(task: Task): TaskResponseDto {
    const dto = new TaskResponseDto();
    dto.id = task.id;
    dto.projectId = task.projectId;
    dto.title = task.title;
    dto.description = task.description;
    dto.status = task.status;
    dto.scorePoints = task.scorePoints;
    dto.dueDate = task.dueDate;
    dto.isRecurring = task.isRecurring;
    dto.recurrenceFrequency = task.recurrenceFrequency;
    dto.recurrenceInterval = task.recurrenceInterval;
    dto.recurrenceEndsAt = task.recurrenceEndsAt;
    dto.completedAt = task.completedAt;
    dto.createdAt = task.createdAt;
    dto.updatedAt = task.updatedAt;
    return dto;
  }

  static toCreateProps(dto: CreateTaskDto, projectId: string): CreateTaskProps {
    return {
      projectId,
      title: dto.title,
      description: dto.description,
      // WHY ?? TaskStatus.TODO?
      // If status was not sent in the request body, default to TODO.
      // This matches what Task.create() does internally too —
      // but being explicit here makes the intent clear to the reader.
      status: dto.status ?? TaskStatus.TODO,
      scorePoints: dto.scorePoints,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      recurrence: dto.recurrence
        ? {
            frequency: dto.recurrence.frequency,
            interval: dto.recurrence.interval,
            endsAt: dto.recurrence.endsAt
              ? new Date(dto.recurrence.endsAt)
              : undefined,
          }
        : undefined,
    };
  }
}
