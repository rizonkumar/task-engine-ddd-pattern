import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

// WHY all fields optional on update?
// PATCH semantics: only send what you want to change.
// If you only want to change the name, you should not have to
// send the description again.
export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
