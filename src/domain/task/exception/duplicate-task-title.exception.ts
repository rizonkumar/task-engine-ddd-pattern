import { DomainException } from './domain-exception.base';
import { TaskErrorCode } from './task-error-code';

export class DuplicateTaskTitleException extends DomainException {
  constructor(title: string) {
    super(
      TaskErrorCode.DUPLICATE_TASK_TITLE,
      `A task with the title "${title}" already exists in this project`,
    );
  }
}
