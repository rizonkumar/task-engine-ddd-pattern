import { Module } from '@nestjs/common';
import { ProjectController } from './project/controller/project.controller';
import { TaskController } from './task/controller/task.controller';
import { ApplicationModule } from '../application/application.module';

@Module({
  // WHY import ApplicationModule?
  // Controllers inject services (ProjectService, TaskService).
  // Those services live in ApplicationModule.
  // Importing it here makes them available for injection.
  imports: [ApplicationModule],
  controllers: [ProjectController, TaskController],
})
export class PresentationModule {}
