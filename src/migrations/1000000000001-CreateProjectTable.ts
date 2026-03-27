import { MigrationInterface, QueryRunner } from 'typeorm';

// WHY implement MigrationInterface?
// TypeORM requires every migration class to have:
// - up()   → what to do (apply the change)
// - down() → how to undo it (revert the change)
// This is the contract that makes migrations reversible.

export class CreateProjectTable1000000000001 implements MigrationInterface {
  // up() runs when you execute: npm run migration:run
  // It creates the project table from scratch
  public async up(queryRunner: QueryRunner): Promise<void> {
    // WHY CREATE EXTENSION IF NOT EXISTS "uuid-ossp"?
    // This Postgres extension provides the uuid_generate_v4() function.
    // We don't use it to generate IDs (the app does that),
    // but having it available is good practice for UUID columns.
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);

    await queryRunner.query(`
      CREATE TABLE "project" (
        "id"          UUID          NOT NULL,
        "owner_id"    UUID          NOT NULL,
        "name"        VARCHAR(255)  NOT NULL,
        "description" TEXT,
        "is_active"   BOOLEAN       NOT NULL DEFAULT true,
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT now(),

        CONSTRAINT "pk_project" PRIMARY KEY ("id")
      )
    `);

    // WHY a unique index on LOWER(name)?
    // We want "My Project" and "my project" to be treated as duplicates.
    // A unique index on LOWER(name) enforces this at the database level
    // AS WELL AS our application-level check in the service.
    // Two layers of protection: application catches it first with a
    // friendly error — the DB constraint is the safety net.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_project_name_lower"
      ON "project" (LOWER("name"))
    `);

    // WHY an index on owner_id?
    // We will often query "all projects belonging to this owner."
    // Without an index, Postgres does a full table scan.
    // With an index, it jumps straight to the matching rows.
    await queryRunner.query(`
      CREATE INDEX "idx_project_owner_id"
      ON "project" ("owner_id")
    `);
  }

  // down() runs when you execute: npm run migration:revert
  // It must UNDO everything up() did, in reverse order
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_project_owner_id"`);
    await queryRunner.query(`DROP INDEX "uq_project_name_lower"`);
    await queryRunner.query(`DROP TABLE "project"`);
  }
}
