import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaskTable1000000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "task_status_enum" AS ENUM (
        'todo',
        'in_progress',
        'done'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "recurrence_frequency_enum" AS ENUM (
        'daily',
        'weekly',
        'monthly'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "task" (
        "id"                     UUID                        NOT NULL,
        "project_id"             UUID                        NOT NULL,
        "title"                  VARCHAR(255)                NOT NULL,
        "description"            TEXT,
        "status"                 "task_status_enum"          NOT NULL DEFAULT 'todo',
        "score_points"           INTEGER                     NOT NULL,
        "due_date"               TIMESTAMPTZ,
        "is_recurring"           BOOLEAN                     NOT NULL DEFAULT false,
        "recurrence_frequency"   "recurrence_frequency_enum",
        "recurrence_interval"    INTEGER,
        "recurrence_ends_at"     TIMESTAMPTZ,
        "completed_at"           TIMESTAMPTZ,
        "created_at"             TIMESTAMPTZ                 NOT NULL DEFAULT now(),
        "updated_at"             TIMESTAMPTZ                 NOT NULL DEFAULT now(),

        CONSTRAINT "pk_task" PRIMARY KEY ("id"),

        CONSTRAINT "fk_task_project"
          FOREIGN KEY ("project_id")
          REFERENCES "project" ("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_task_title_project"
      ON "task" (LOWER("title"), "project_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_task_project_id"
      ON "task" ("project_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_task_is_recurring"
      ON "task" ("is_recurring")
      WHERE "is_recurring" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_task_is_recurring"`);
    await queryRunner.query(`DROP INDEX "idx_task_project_id"`);
    await queryRunner.query(`DROP INDEX "uq_task_title_project"`);
    await queryRunner.query(`DROP TABLE "task"`);
    await queryRunner.query(`DROP TYPE "recurrence_frequency_enum"`);
    await queryRunner.query(`DROP TYPE "task_status_enum"`);
  }
}
