import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── Prefijo global de la API ───
  app.setGlobalPrefix('api/v1');

  // ─── CORS para el frontend React ───
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ─── Validación global de DTOs ───
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // Elimina propiedades no declaradas en el DTO
      forbidNonWhitelisted: true, // Lanza error si se envían propiedades extra
      transform: true,          // Convierte tipos automáticamente (ej: string → number)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── Swagger / Documentación de la API ───
  const config = new DocumentBuilder()
    .setTitle('HotChicken API')
    .setDescription(
      'API REST para el Sistema de Gestión de Comandas y Control de Ventas - Restaurante HotChicken',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Autenticación y registro')
    .addTag('users', 'Gestión de usuarios/empleados')
    .addTag('mesas', 'Control del estado de mesas')
    .addTag('comandas', 'Gestión de pedidos y comandas')
    .addTag('productos', 'Catálogo de platos y bebidas')
    .addTag('reportes', 'Reportes y estadísticas de ventas')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`\n🍗  HotChicken Backend corriendo en: http://localhost:${port}`);
  console.log(`📚  Documentación Swagger:         http://localhost:${port}/api/docs\n`);
}

bootstrap();
