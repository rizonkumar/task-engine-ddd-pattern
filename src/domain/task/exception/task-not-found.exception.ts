// WHY A SPECIFIC CLASS PER ERROR?
// You could just throw new DomainException('TASK_NOT_FOUND', 'Task not found')
// everywhere. But specific classes let you catch selectively:
//
//   catch (e) {
//     if (e instanceof TaskNotFoundException) { ... }
//   }
//
// And they make stack traces instantly readable.

import { DomainException } from './domain-exception.base';
import { TaskErrorCode } from './task-error-code';

export class TaskNotFoundException extends DomainException {
  constructor(taskId: string) {
    // We pass the errorCode + a message that includes context (the ID)
    super(
      TaskErrorCode.TASK_NOT_FOUND,
      `Task with id "${taskId}" was not found`,
    );
  }
}
