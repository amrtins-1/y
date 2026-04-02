import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import type { IncomingMessage, ServerResponse } from 'http';
import { AppModule } from '../src/app.module';
import { getAllowedOrigins } from '../src/config/env';
import { GlobalExceptionFilter } from '../src/filters/global-exception.filter';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

let cachedHandler: Handler | null = null;

async function bootstrapHandler(): Promise<Handler> {
  if (cachedHandler) {
    return cachedHandler;
  }

  const app = await NestFactory.create(AppModule, { cors: false });

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

  await app.init();

  cachedHandler = app.getHttpAdapter().getInstance();
  return cachedHandler as Handler;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const server = await bootstrapHandler();
  return server(req, res);
}
