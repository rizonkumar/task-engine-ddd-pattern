import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectEntity } from './project/entity/project.entity';
import { TaskEntity } from './task/entity/task.entity';

import { ProjectRepository } from './project/repository/project.repository';
import { TaskRepository } from './task/repository/task.repository';

import { PROJECT_REPOSITORY } from '../domain/project/repository/project.repository.interface';
import { TASK_REPOSITORY } from '../domain/task/repository/task.repository.interface';

// WHY A SEPARATE InfrastructureModule?
// app.module.ts is the root — it should just wire big modules together.
// All the TypeORM entity registration and repository binding lives here,
// keeping infrastructure concerns in one place.

@Module({
  imports: [
    // WHY forFeature()?
    // TypeOrmModule.forRoot() in app.module.ts sets up the DB connection.
    // forFeature() registers specific entities for THIS module —
    // it makes Repository<ProjectEntity> and Repository<TaskEntity>
    // available for injection via @InjectRepository().
    TypeOrmModule.forFeature([ProjectEntity, TaskEntity]),
  ],

  providers: [
    // WHY this pattern instead of just: ProjectRepository?
    // NestJS normally injects by CLASS TYPE.
    // But our services depend on the SYMBOL (PROJECT_REPOSITORY),
    // not on ProjectRepository directly.
    //
    // This binding says:
    // "When something asks for PROJECT_REPOSITORY, give it ProjectRepository"
    //
    // This is the Dependency Inversion Principle in action:
    // the service never imports ProjectRepository — it only knows the symbol.
    // Swapping the implementation = changing one line here, nothing else.
    {
      provide: PROJECT_REPOSITORY,
      useClass: ProjectRepository,
    },
    {
      provide: TASK_REPOSITORY,
      useClass: TaskRepository,
    },
  ],

  // WHY exports?
  // The application module needs to inject these repositories into services.
  // Without exporting, they are private to InfrastructureModule.
  exports: [PROJECT_REPOSITORY, TASK_REPOSITORY],
})
export class InfrastructureModule {}
