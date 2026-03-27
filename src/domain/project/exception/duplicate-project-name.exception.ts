import { DomainException } from '../../task/exception/domain-exception.base';
import { ProjectErrorCode } from './project-error-code';

export class DuplicateProjectNameException extends DomainException {
  constructor(name: string) {
    super(
      ProjectErrorCode.DUPLICATE_PROJECT_NAME,
      `A project named "${name}" already exists`,
    );
  }
}
