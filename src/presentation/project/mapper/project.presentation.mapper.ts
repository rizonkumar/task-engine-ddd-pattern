import { Project } from '../../../domain/project/model/project';
import { ProjectResponseDto } from '../dto/project-response.dto';
import { CreateProjectDto } from '../dto/create-project.dto';
import { CreateProjectProps } from '../../../domain/project/type/project.types';

export class ProjectPresentationMapper {
  // WHY toResponse()?
  // Converts domain object → HTTP response shape.
  // Only picks the fields we want to expose.
  static toResponse(project: Project): ProjectResponseDto {
    const dto = new ProjectResponseDto();
    dto.id = project.id;
    dto.name = project.name;
    dto.description = project.description;
    dto.ownerId = project.ownerId;
    dto.isActive = project.isActive;
    dto.createdAt = project.createdAt;
    dto.updatedAt = project.updatedAt;
    return dto;
  }

  // WHY toCreateProps()?
  // Converts HTTP request DTO → domain input props.
  // The controller calls this before passing data to the service.
  static toCreateProps(
    dto: CreateProjectDto,
    ownerId: string,
  ): CreateProjectProps {
    return {
      name: dto.name,
      description: dto.description,
      ownerId,
    };
  }
}
