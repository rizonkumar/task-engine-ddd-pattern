import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ITaskRepository } from '../../../domain/task/repository/task.repository.interface';
import { Task } from '../../../domain/task/model/task';
import { TaskEntity } from '../entity/task.entity';
import { TaskMapper } from '../mapper/task.mapper';

@Injectable()
export class TaskRepository implements ITaskRepository {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly repo: Repository<TaskEntity>,
  ) {}

  async save(task: Task): Promise<void> {
    const entity = TaskMapper.toEntity(task);
    await this.repo.save(entity);
  }

  async findById(id: string): Promise<Task | null> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) return null;
    return TaskMapper.toDomain(entity);
  }

  async findAllByProjectId(projectId: string): Promise<Task[]> {
    const entities = await this.repo.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => TaskMapper.toDomain(e));
  }

  async existsByTitleInProject(
    title: string,
    projectId: string,
  ): Promise<boolean> {
    // WHY QueryBuilder instead of repo.findOne()?
    // repo.findOne() does exact string matching.
    // We need LOWER() for case-insensitive comparison AND we need
    // to filter by projectId at the same time.
    // QueryBuilder lets us write precise SQL conditions.
    const count = await this.repo
      .createQueryBuilder('task')
      .where('LOWER(task.title) = LOWER(:title)', { title })
      .andWhere('task.project_id = :projectId', { projectId })
      .getCount();

    return count > 0;
  }

  async update(task: Task): Promise<void> {
    const entity = TaskMapper.toEntity(task);
    await this.repo.save(entity);
  }

  async findAllRecurring(): Promise<Task[]> {
    const entities = await this.repo.find({
      where: { isRecurring: true },
      order: { createdAt: 'ASC' },
    });
    return entities.map((e) => TaskMapper.toDomain(e));
  }
}
