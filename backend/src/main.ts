import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { getAllowedOrigins } from './config/env';

// 1. Importações necessárias para a Vercel (Express Adapter)
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

// 2. Criação da instância do Express fora do escopo da função
const server = express();

async function bootstrap(expressInstance: express.Express) {
  // 3. Injetando o Express no NestJS
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance), { cors: false });

  app.use(cookieParser());

  const allowedOrigins = getAllowedOrigins();
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      const normalized = origin.endsWith('/') ? origin.slice(0, -1) : origin;
      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }
      return callback(new Error('Origem nao permitida'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['*'],
    exposedHeaders: ['Set-Cookie'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: false,
      forbidUnknownValues: false,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // 4. ATENÇÃO: Na Vercel não usamos app.listen(). Usamos app.init().
  // O ambiente Serverless liga e desliga sob demanda.
  await app.init();
}

// Inicializa o processo
bootstrap(server)
  .then(() => console.log('NestJS inicializado para Serverless (Vercel)'))
  .catch((err) => console.error('Erro ao inicializar o NestJS', err));

// 5. O FIX PRINCIPAL: Exportar o servidor para a Vercel encontrar
export default server;