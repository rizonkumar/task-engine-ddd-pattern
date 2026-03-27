import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { v4 as uuidv4 } from 'uuid';

import {
  IProjectRepository,
  PROJECT_REPOSITORY,
} from '../../domain/project/repository/project.repository.interface';
import {
  CreateProjectProps,
  UpdateProjectProps,
} from '../../domain/project/type/project.types';
import { Project } from '../../domain/project/model/project';
import { ProjectNotFoundException } from '../../domain/project/exception/project-not-found.exception';
import { DuplicateProjectNameException } from '../../domain/project/exception/duplicate-project-name.exception';

// WHY @Injectable()?
// Same as the repository — this tells NestJS DI:
// "I exist, you can inject me into controllers."

@Injectable()
export class ProjectService {
  constructor(
    // WHY @Inject(PROJECT_REPOSITORY)?
    // Our service depends on the SYMBOL (the abstract promise),
    // NOT on ProjectRepository (the concrete TypeORM class).
    // NestJS reads this symbol and hands us whichever class is
    // bound to it in infrastructure.module.ts.
    //
    // This means ProjectService never imports ProjectRepository.
    // It has no idea TypeORM exists. That is the whole point.
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
  ) {}
  // WHY @Transactional()?
  // This decorator wraps the entire method in a single database transaction.
  // If anything throws inside this method, ALL database operations
  // inside it are automatically rolled back.
  //
  // Example: if save() succeeds but something after it fails,
  // @Transactional ensures the save is also undone.
  // Without it, you could have partial data written to the DB.
  @Transactional()
  async createProject(props: CreateProjectProps): Promise<Project> {
    // BUSINESS RULE: no two projects can have the same name
    // WHY HERE and not in the domain model?
    // The domain model only knows about ONE object at a time.
    // Checking for duplicates requires querying the database —
    // that needs a repository, which only the service has access to.
    // So duplicate checks always live in the service.
    const nameExists = await this.projectRepo.existsByName(props.name);
    if (nameExists) {
      throw new DuplicateProjectNameException(props.name);
    }

    // WHY uuidv4() here and not in the domain model?
    // The domain model should be pure and testable without any imports.
    // UUID generation is an infrastructure concern — the service
    // generates it and passes it in. This way, in tests you can
    // pass a predictable ID like 'test-id-123'.
    const id = uuidv4();

    // The domain model's static factory runs business validation
    // (e.g. score range) and sets defaults (isActive = true)
    const project = Project.create(id, props);

    // Repository translates to entity and saves to Postgres
    await this.projectRepo.save(project);

    // WHY return the domain object and not just void?
    // The controller needs to build the HTTP response.
    // It needs the full project object (with generated id, createdAt etc.)
    // to do that. So we return the domain object.
    return project;
  }

  async getProjectById(id: string): Promise<Project> {
    const project = await this.projectRepo.findById(id);

    // WHY throw here but return null in the repository?
    // The repository's job is just fetching — it does not know
    // what "not found" means for this use case.
    // The SERVICE decides: in this context, not found = exception.
    // In a different context (e.g. "does this exist?") you might
    // want null — so the repository stays flexible.
    if (!project) {
      throw new ProjectNotFoundException(id);
    }
    return project;
  }

  async getAllProjects(): Promise<Project[]> {
    return this.projectRepo.findAll();
  }

  async updateProject(id: string, props: UpdateProjectProps): Promise<Project> {
    // Pattern: fetch → mutate → save
    // WHY this pattern?
    // 1. fetch — get the current state from DB (as a domain object)
    // 2. mutate — call the domain method which applies business rules
    // 3. save — persist the new state
    // This guarantees business rules always run, even on updates.
    const project = await this.getProjectById(id);

    // Check name uniqueness only if name is being changed
    if (props.name && props.name !== project.name) {
      const nameExists = await this.projectRepo.existsByName(props.name);
      if (nameExists) {
        throw new DuplicateProjectNameException(props.name);
      }
    }

    // Domain method applies the changes + updates updatedAt
    project.update(props);

    await this.projectRepo.update(project);
    return project;
  }

  @Transactional()
  async deactivateProject(id: string): Promise<void> {
    const project = await this.getProjectById(id);
    project.deactivate();
    await this.projectRepo.update(project);
  }
}
