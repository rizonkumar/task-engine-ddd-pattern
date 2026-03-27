import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

// WHY class-validator DECORATORS and not TypeScript types?
// TypeScript types only exist at compile time — they disappear
// when your code runs. class-validator decorators run at RUNTIME,
// so when a real HTTP request arrives with bad data, they catch it.
//
// Example: TypeScript won't stop someone sending { name: 123 } over HTTP.
// class-validator will reject it with a clear 400 error.

export class CreateProjectDto {
  @IsString()
  @MinLength(2, { message: 'Project name must be at least 2 characters' })
  @MaxLength(255, { message: 'Project name must be at most 255 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  // WHY no ownerId in the DTO?
  // In a real app, ownerId comes from the JWT token (the logged-in user).
  // For now we will hardcode it in the controller.
  // Later when we add auth, it comes from a guard — never from the request body.
  // Users should never be able to say "I am owner X" — the server decides that.
}
