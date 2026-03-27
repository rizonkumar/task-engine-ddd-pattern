import { CreateProjectProps, UpdateProjectProps } from '../type/project.types';

// Project is simpler than Task — it is the "tenant root".
// Think of it like "association" in Synemi.
// Every task belongs to a project.
// The project itself just has a name, description, and owner.

export class Project {
  readonly id: string;
  readonly ownerId: string;

  name: string;
  description: string | null;
  isActive: boolean;

  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: {
    id: string;
    ownerId: string;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.ownerId = props.ownerId;
    this.name = props.name;
    this.description = props.description ?? null;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(id: string, props: CreateProjectProps): Project {
    const now = new Date();
    return new Project({
      id,
      ownerId: props.ownerId,
      name: props.name,
      description: props.description ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: {
    id: string;
    ownerId: string;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Project {
    return new Project(props);
  }

  update(props: UpdateProjectProps): void {
    if (props.name !== undefined) {
      this.name = props.name;
    }
    if (props.description !== undefined) {
      this.description = props.description;
    }
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }
}
