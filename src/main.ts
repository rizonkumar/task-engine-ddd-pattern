import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './shared/filter/domain-exception.filter';

async function bootstrap() {
  // Must be called BEFORE NestFactory.create — sets up async storage for transactions
  initializeTransactionalContext();

  const app = await NestFactory.create(AppModule);

  // Global DTO validation — strips unknown fields, returns 400 on bad input
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip fields not in DTO
      forbidNonWhitelisted: true, // throw if unknown fields sent
      transform: true, // auto-convert types (string "1" -> number 1)
    }),
  );

  app.useGlobalFilters(new DomainExceptionFilter());

  await app.listen(3000);
  console.log('Task Engine running on http://localhost:3000');
}
bootstrap();
