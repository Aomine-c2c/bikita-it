import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Validate required environment variables
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  
  // Configure CORS - only allow trusted origins
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [];
  
  if (allowedOrigins.length === 0) {
    console.warn('WARNING: No ALLOWED_ORIGINS configured. CORS will be disabled.');
  }
  
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`✓ API running on port ${port}`);
}

bootstrap().catch(error => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

