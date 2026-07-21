import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL environment variable is not set');
  const port = Number(process.env.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port');
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(value => value.trim()).filter(Boolean);
  if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) throw new Error('ALLOWED_ORIGINS is required in production');

  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.setGlobalPrefix('api');
  app.enableCors({ origin: allowedOrigins.length ? allowedOrigins : false, methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', credentials: true });
  app.enableShutdownHooks();
  await app.listen(port, '0.0.0.0');
  logger.log(`API listening on port ${port}`);
}
bootstrap().catch((error: unknown) => {
  console.error('Application startup failed:', error);
  process.exit(1);
});
