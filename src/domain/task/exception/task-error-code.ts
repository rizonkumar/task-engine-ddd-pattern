// WHY ERROR CODES?
// If you throw new Error("Task not found") you get a plain string.
// The global exception filter in presentation/ needs to map domain errors
// to HTTP status codes. It does this by reading a structured error code,
// not by parsing strings.
//
// Error codes also make your API responses consistent:
// { "errorCode": "TASK_NOT_FOUND", "message": "Task not found" }
// instead of whatever random string you happened to type.

export enum TaskErrorCode {
  TASK_NOT_FOUND = 'TASK_NOT_FOUND',
  DUPLICATE_TASK_TITLE = 'DUPLICATE_TASK_TITLE',
  INVALID_SCORE_POINTS = 'INVALID_SCORE_POINTS',
  TASK_ALREADY_COMPLETED = 'TASK_ALREADY_COMPLETED',
  INVALID_RECURRENCE_INTERVAL = 'INVALID_RECURRENCE_INTERVAL',
}
