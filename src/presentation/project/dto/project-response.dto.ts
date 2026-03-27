// WHY A RESPONSE DTO?
// Your domain model might have fields you never want to expose
// (internal flags, sensitive data, computed state).
// The response DTO is the EXACT shape you want to send over the wire.
// It is your API contract with the outside world.
//
// If you returned the domain object directly, any field you add
// to the domain model would accidentally appear in the API response.
// The response DTO gives you explicit control.

export class ProjectResponseDto {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
