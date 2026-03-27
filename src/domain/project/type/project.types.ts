// Same pattern — pure input contracts for the Project domain object.
// Notice: zero imports. This file has no dependencies at all.

export type CreateProjectProps = {
  name: string;
  description?: string;
  ownerId: string; // who created/owns this project
};

export type UpdateProjectProps = {
  name?: string;
  description?: string;
};
