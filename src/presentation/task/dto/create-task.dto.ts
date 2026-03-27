import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TaskStatus,
  RecurrenceFrequency,
} from '../../../domain/task/type/task.types';

// WHY @ValidateNested + @Type?
// When a DTO contains a nested object (like recurrence),
// class-validator needs two things:
// 1. @ValidateNested() — tells it to validate the nested object too
// 2. @Type(() => CreateRecurrenceDto) — tells class-transformer
//    to actually instantiate the nested class so decorators work.
// Without @Type, the nested object stays a plain JS object
// and none of its validators run.

class CreateRecurrenceDto {
  @IsEnum(RecurrenceFrequency, {
    message: 'frequency must be daily, weekly, or monthly',
  })
  frequency: RecurrenceFrequency;

  @IsInt()
  @Min(1, { message: 'interval must be at least 1' })
  @Max(365, { message: 'interval must be at most 365' })
  interval: number;

  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

export class CreateTaskDto {
  @IsString()
  @IsOptional()
  projectId?: string;
  // WHY optional here?
  // projectId comes from the URL param (:projectId),
  // not the request body. The controller merges them.
  // We keep it optional in the DTO so it can also be
  // used if someone sends it in the body directly.

  @IsString()
  @Min(2)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsInt()
  @Min(1, { message: 'scorePoints must be at least 1' })
  @Max(1000, { message: 'scorePoints must be at most 1000' })
  scorePoints: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateRecurrenceDto)
  recurrence?: CreateRecurrenceDto;
}
