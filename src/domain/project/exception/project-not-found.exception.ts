// We reuse the same DomainException base — notice we import it
// using a relative path. Later we'll set up path aliases
// so this becomes @domain/task/exception/domain-exception.base

import { DomainException } from '../../task/exception/domain-exception.base';
import { ProjectErrorCode } from './project-error-code';

export class ProjectNotFoundException extends DomainException {
  constructor(projectId: string) {
    super(
      ProjectErrorCode.PROJECT_NOT_FOUND,
      `Project with id "${projectId}" was not found`,
    );
  }
}
