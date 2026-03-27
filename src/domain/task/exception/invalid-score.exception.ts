import { DomainException } from './domain-exception.base';
import { TaskErrorCode } from './task-error-code';

export class InvalidScorePointsException extends DomainException {
  constructor(points: number) {
    super(
      TaskErrorCode.INVALID_SCORE_POINTS,
      `Score points must be between 1 and 1000, got ${points}`,
    );
  }
}
