import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TaskService } from '../../../application/task/task.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskResponseDto } from '../dto/task-response.dto';
import { TaskPresentationMapper } from '../mapper/task.presentation.mapper';

// WHY nested under projects/:projectId/tasks?
// Tasks always belong to a project — the URL expresses this relationship.
// It also means we automatically know the projectId from the URL
// without the client having to put it in the request body.
@Controller('projects/:projectId/tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    // WHY merge projectId from URL into props?
    // The DTO does not carry projectId (it comes from the URL).
    // The mapper merges them into one CreateTaskProps object.
    const props = TaskPresentationMapper.toCreateProps(dto, projectId);
    const task = await this.taskService.createTask(props);
    return TaskPresentationMapper.toResponse(task);
  }

  @Get()
  async findAll(
    @Param('projectId') projectId: string,
  ): Promise<TaskResponseDto[]> {
    const tasks = await this.taskService.getTasksByProject(projectId);
    return tasks.map((t) => TaskPresentationMapper.toResponse(t));
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TaskResponseDto> {
    const task = await this.taskService.getTaskById(id);
    return TaskPresentationMapper.toResponse(task);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    const task = await this.taskService.updateTask(id, dto);
    return TaskPresentationMapper.toResponse(task);
  }

  @Patch(':id/complete')
  async complete(@Param('id') id: string): Promise<TaskResponseDto> {
    // WHY a separate endpoint for complete?
    // Completing a task is a BUSINESS ACTION, not just a field update.
    // It sets completedAt, enforces "cannot re-complete" rule.
    // A dedicated endpoint makes the API intention crystal clear.
    const task = await this.taskService.completeTask(id);
    return TaskPresentationMapper.toResponse(task);
  }
}
