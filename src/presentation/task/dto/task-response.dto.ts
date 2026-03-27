import {
  TaskStatus,
  RecurrenceFrequency,
} from '../../../domain/task/type/task.types';

export class TaskResponseDto {
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
}
