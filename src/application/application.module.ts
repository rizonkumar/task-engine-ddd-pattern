import { Module } from '@nestjs/common';
import { ProjectService } from './project/project.service';
import { TaskService } from './task/task.service';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

@Module({
  // WHY import InfrastructureModule?
  // The services need the repository symbols injected.
  // Those symbols are exported from InfrastructureModule.
  // By importing it here, NestJS knows where to find the
  // implementations when it sees @Inject(TASK_REPOSITORY).
  imports: [InfrastructureModule],

  providers: [ProjectService, TaskService],

  // WHY export the services?
  // The presentation layer (controllers) need to inject them.
  // Without exports they are private to this module.
  exports: [ProjectService, TaskService],
})
export class ApplicationModule {}
