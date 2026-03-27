import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProjectService } from '../../../application/project/project.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { ProjectResponseDto } from '../dto/project-response.dto';
import { ProjectPresentationMapper } from '../mapper/project.presentation.mapper';

// WHY @Controller('projects')?
// This sets the base URL path for all routes in this class.
// Every method inside becomes /projects/...

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}
  // WHY inject ProjectService directly (no symbol)?
  // Services are injected by CLASS TYPE — NestJS knows about them
  // because they are registered as providers in ApplicationModule.
  // Only repositories need symbols because they are bound to interfaces.

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProjectDto): Promise<ProjectResponseDto> {
    // WHY @Body()?
    // Extracts and deserializes the JSON request body.
    // NestJS + class-transformer instantiates CreateProjectDto from it,
    // then class-validator runs the decorators and rejects bad data.

    // Hardcoded ownerId for now — will come from JWT later
    const props = ProjectPresentationMapper.toCreateProps(dto, 'owner-001');
    const project = await this.projectService.createProject(props);

    // WHY map to response DTO before returning?
    // We never return domain objects directly from controllers.
    // The response DTO controls exactly what JSON the client sees.
    return ProjectPresentationMapper.toResponse(project);
  }

  @Get()
  async findAll(): Promise<ProjectResponseDto[]> {
    const projects = await this.projectService.getAllProjects();
    return projects.map((p) => ProjectPresentationMapper.toResponse(p));
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProjectResponseDto> {
    // WHY @Param('id')?
    // Extracts the :id segment from the URL.
    // GET /projects/abc-123 → id = 'abc-123'
    const project = await this.projectService.getProjectById(id);
    return ProjectPresentationMapper.toResponse(project);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectService.updateProject(id, dto);
    return ProjectPresentationMapper.toResponse(project);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id') id: string): Promise<void> {
    // WHY deactivate and not delete?
    // We never hard-delete data — we soft-delete by setting isActive=false.
    // This preserves history and allows recovery.
    // HTTP DELETE is the right verb because from the client's perspective
    // the resource is gone — even though we keep the row.
    await this.projectService.deactivateProject(id);
  }
}
