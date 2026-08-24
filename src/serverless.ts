import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { type Request, type Response } from 'express';
import { AppModule } from './app.module';

const server = express();
let bootstrapped: Promise<void> | undefined;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), { logger: ['error', 'warn'] });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableCors({ origin: true });

  // init, а не listen: слушает платформа, приложение только обрабатывает запрос.
  await app.init();
}

export async function handler(request: Request, response: Response): Promise<void> {
  // Один экземпляр на «тёплый» инстанс: пересобирать приложение на каждый
  // запрос значило бы платить полторы секунды и новый пул к базе каждый раз.
  bootstrapped ??= bootstrap();
  await bootstrapped;
  server(request, response);
}
