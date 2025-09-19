import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
dotenv.config(); // Carga variables de entorno desde .env lo antes posible

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ---- CORS ----
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? 'https://front-proyecto1.vercel.app',
    credentials: true, 
  });


  // ---- Validación global ----
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,               // elimina propiedades no declaradas en DTOs
      forbidNonWhitelisted: true,    // lanza error si vienen props no permitidas
      transform: true,               // convierte tipos automáticamente según DTOs
      transformOptions: {
        enableImplicitConversion: true, // ej: "42" -> number en @Param/@Query
      },
    }),
  );

  // ---- Swagger / OpenAPI ----
  const swaggerConfig = new DocumentBuilder()
    .setTitle('IMC Calculator API')             // Título visible en Swagger UI
    .setDescription('API para calcular y guardar IMC') // Descripción
    .setVersion('1.0')                           // Versión
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {});

  // Monta Swagger UI en /docs 
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // conserva el token al refrescar la página
    },
  });
 
  // ---- Arranque del servidor ----
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`API levantada en http://localhost:${port}`);
  console.log(`Swagger UI en http://localhost:${port}/docs`);
  console.log(`OpenAPI JSON en http://localhost:${port}/docs-json`);
}

bootstrap();
