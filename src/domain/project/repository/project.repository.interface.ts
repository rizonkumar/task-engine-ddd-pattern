import { Project } from '../model/project';

export const PROJECT_REPOSITORY = Symbol('PROJECT_REPOSITORY');

export interface IProjectRepository {
  save(project: Project): Promise<void>;

  findById(id: string): Promise<Project | null>;

  findAll(): Promise<Project[]>;

  // Check duplicate name before creating
  existsByName(name: string): Promise<boolean>;

  update(project: Project): Promise<void>;
}
