import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IProjectRepository } from '../../../domain/project/repository/project.repository.interface';
import { Project } from '../../../domain/project/model/project';
import { ProjectEntity } from '../entity/project.entity';
import { ProjectMapper } from '../mapper/project.mapper';

// WHY @Injectable()?
// This tells NestJS: "this class can be injected into other classes
// via the dependency injection container."
// Without it, NestJS doesn't know this class exists for DI purposes.

@Injectable()
export class ProjectRepository implements IProjectRepository {
  constructor(
    // WHY @InjectRepository(ProjectEntity)?
    // TypeORM gives us a generic Repository<ProjectEntity> that knows
    // how to do find/save/update/delete on the project table.
    // @InjectRepository is how NestJS injects that TypeORM repository.
    // We never create this manually — NestJS + TypeORM handle it.
    @InjectRepository(ProjectEntity)
    private readonly repo: Repository<ProjectEntity>,
  ) {}

  async save(project: Project): Promise<void> {
    // WHY mapper.toEntity() before saving?
    // TypeORM's .save() expects a ProjectEntity, not a Project domain model.
    // The mapper translates the domain object into the DB shape.
    const entity = ProjectMapper.toEntity(project);
    await this.repo.save(entity);
  }

  async findById(id: string): Promise<Project | null> {
    const entity = await this.repo.findOne({ where: { id } });

    // WHY return null instead of throwing here?
    // The repository's job is just fetching — it doesn't know
    // what the caller wants to do if nothing is found.
    // The APPLICATION SERVICE decides: "if null, throw ProjectNotFoundException"
    // This keeps the repository simple and reusable.
    if (!entity) return null;

    return ProjectMapper.toDomain(entity);
  }

  async findAll(): Promise<Project[]> {
    const entities = await this.repo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
    // WHY map() here?
    // repo.find() returns ProjectEntity[].
    // We need Project[] (domain objects).
    // We map every entity through the mapper.
    return entities.map((e) => ProjectMapper.toDomain(e));
  }

  async existsByName(name: string): Promise<boolean> {
    // WHY case-insensitive check?
    // "My Project" and "my project" should be treated as duplicates.
    // LOWER() on both sides makes the comparison case-insensitive.
    // This is a Postgres function — another reason this lives in
    // infrastructure and not in the domain.
    const count = await this.repo
      .createQueryBuilder('project')
      .where('LOWER(project.name) = LOWER(:name)', { name })
      .getCount();

    return count > 0;
  }

  async update(project: Project): Promise<void> {
    const entity = ProjectMapper.toEntity(project);
    await this.repo.save(entity);
    // WHY .save() for update too?
    // TypeORM's .save() does an INSERT if no id match exists,
    // or an UPDATE if the id already exists in the table.
    // Since we always have an id on updates, this is always an UPDATE.
  }
}
