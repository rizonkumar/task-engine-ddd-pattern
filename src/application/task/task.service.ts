import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { v4 as uuidv4 } from 'uuid';

import {
  ITaskRepository,
  TASK_REPOSITORY,
} from '../../domain/task/repository/task.repository.interface';
import {
  IProjectRepository,
  PROJECT_REPOSITORY,
} from '../../domain/project/repository/project.repository.interface';
import {
  CreateTaskProps,
  UpdateTaskProps,
} from '../../domain/task/type/task.types';
import { Task } from '../../domain/task/model/task';
import { TaskNotFoundException } from '../../domain/task/exception/task-not-found.exception';
import { DuplicateTaskTitleException } from '../../domain/task/exception/duplicate-task-title.exception';
import { ProjectNotFoundException } from '../../domain/project/exception/project-not-found.exception';

@Injectable()
export class TaskService {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepo: ITaskRepository,

    // WHY inject ProjectRepository into TaskService?
    // When creating a task, we must verify the project actually exists.
    // This is a cross-entity validation — the task service needs to
    // reach into the project repository to check.
    // This is normal in DDD — services can use multiple repositories.
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
  ) {}

  @Transactional()
  async createTask(props: CreateTaskProps): Promise<Task> {
    // STEP 1: verify the project exists
    // WHY? A task without a valid project is orphaned data.
    // We catch this at the application layer before it ever
    // reaches the database (which would give a FK constraint error —
    // a much harder error to read and handle).
    const project = await this.projectRepo.findById(props.projectId);
    if (!project) {
      throw new ProjectNotFoundException(props.projectId);
    }

    // STEP 2: check for duplicate title within this project
    const titleExists = await this.taskRepo.existsByTitleInProject(
      props.title,
      props.projectId,
    );
    if (titleExists) {
      throw new DuplicateTaskTitleException(props.title);
    }

    // STEP 3: create domain object (validation runs inside Task.create())
    const id = uuidv4();
    const task = Task.create(id, props);

    // STEP 4: persist
    await this.taskRepo.save(task);

    return task;
  }

  async getTaskById(id: string): Promise<Task> {
    const task = await this.taskRepo.findById(id);
    if (!task) {
      throw new TaskNotFoundException(id);
    }
    return task;
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    // Verify project exists before fetching its tasks
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new ProjectNotFoundException(projectId);
    }
    return this.taskRepo.findAllByProjectId(projectId);
  }

  @Transactional()
  async updateTask(id: string, props: UpdateTaskProps): Promise<Task> {
    // fetch → mutate → save (same pattern as project)
    const task = await this.getTaskById(id);

    // If title is changing, check for duplicates
    if (props.title && props.title !== task.title) {
      const titleExists = await this.taskRepo.existsByTitleInProject(
        props.title,
        task.projectId,
      );
      if (titleExists) {
        throw new DuplicateTaskTitleException(props.title);
      }
    }

    // Domain method applies changes + validates score range
    task.update(props);

    await this.taskRepo.update(task);
    return task;
  }

  @Transactional()
  async completeTask(id: string): Promise<Task> {
    const task = await this.getTaskById(id);

    // WHY call task.complete() instead of task.status = 'done'?
    // task.complete() is a domain METHOD — it enforces the rule
    // "cannot complete an already completed task" AND sets completedAt.
    // Directly setting task.status bypasses both of those things.
    // Always use domain methods when they exist.
    task.complete();

    await this.taskRepo.update(task);
    return task;
  }

  async getRecurringTasks(): Promise<Task[]> {
    return this.taskRepo.findAllRecurring();
  }
}
