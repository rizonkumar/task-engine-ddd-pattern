import { ProjectEntity } from '../entity/project.entity';
import { Project } from '../../../domain/project/model/project';

// WHY A SEPARATE MAPPER CLASS?
// You could put this logic inside the repository, but then the
// repository does two jobs: querying AND translating.
// A mapper class has exactly one job: translation.
// This makes both the repository AND the mapper easier to test
// and reason about independently.

export class ProjectMapper {
  // toDomain: Database row → Domain model
  // Called when you LOAD from database and need a business object
  static toDomain(entity: ProjectEntity): Project {
    // WHY reconstitute() and NOT create()?
    // This data already exists in the DB — it was validated when first saved.
    // reconstitute() skips validation and just rebuilds the object.
    // create() would generate a new ID and timestamps — wrong here.
    return Project.reconstitute({
      id: entity.id,
      ownerId: entity.ownerId,
      name: entity.name,
      description: entity.description,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  // toEntity: Domain model → Database row
  // Called when you SAVE or UPDATE — translates business object to DB shape
  static toEntity(domain: Project): ProjectEntity {
    const entity = new ProjectEntity();

    // WHY new ProjectEntity() with no args here?
    // TypeORM entities have public constructors (unlike domain models).
    // We manually assign each field because TypeORM needs a plain
    // object with the right property names to map to columns.
    entity.id = domain.id;
    entity.ownerId = domain.ownerId;
    entity.name = domain.name;
    entity.description = domain.description;
    entity.isActive = domain.isActive;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;

    return entity;
  }
}
