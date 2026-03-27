import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// WHY dotenv.config() here?
// When the TypeORM CLI runs migration commands, NestJS is NOT running.
// There is no ConfigModule, no dependency injection.
// We load .env manually so the CLI can read our database credentials.
dotenv.config();

// WHY a separate DataSource and not reuse app.module.ts config?
// app.module.ts uses NestJS's TypeOrmModule.forRootAsync() which
// requires the full NestJS container to be running.
// The migration CLI is a plain Node script — it needs a raw DataSource.
// This file gives the CLI exactly what it needs, nothing more.

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,

  // WHY point to .ts files and not .js?
  // We use ts-node to run migrations directly from TypeScript source.
  // No compile step needed.
  entities: [__dirname + '/../../**/*.entity.ts'],
  migrations: [__dirname + '/../../migrations/*.ts'],

  // synchronize MUST be false — migrations handle schema changes
  synchronize: false,
});
