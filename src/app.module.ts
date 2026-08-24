import { join } from 'node:path';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { GqlThrottlerGuard } from './common/gql-throttler.guard';
import { CardModule } from './card/card.module';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Схема генерируется из TypeScript (code-first): типы в коде и в SDL
    // не могут разъехаться, потому что источник один.
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // На serverless файловая система только для чтения, и попытка записать
      // schema.gql роняет приложение на старте с EROFS. Там схема держится
      // в памяти; локально пишется в файл — так её удобно посмотреть глазами.
      autoSchemaFile: process.env.VERCEL || process.env.READONLY_FS === '1'
        ? true
        : join(process.cwd(), 'schema.gql'),
      sortSchema: true,
      playground: false,
      // Песочница нужна: без неё «ссылка на проект» показывает голый POST-эндпоинт.
      introspection: true,
      path: '/graphql',
      // req нужен ограничителю частоты: без него он не знает, кого считать.
      context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),

      // Без этого ошибки валидации приезжают клиенту одной строкой
      // «Bad Request Exception», а какое поле не так — знает только сервер.
      formatError: (error) => {
        const original = error.extensions?.originalError as { message?: string | string[] } | undefined;
        const fields = Array.isArray(original?.message) ? original.message : undefined;
        return {
          message: fields?.length ? fields.join(' ') : error.message,
          path: error.path,
          extensions: {
            code: error.extensions?.code,
            ...(fields?.length ? { fields } : {}),
          },
        };
      },
    }),

    // Визитка публичная, а mutation contact пишет в базу — без ограничения
    // её зальют мусором за вечер.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'public'),
      exclude: ['/graphql', '/health'],
    }),

    PrismaModule,
    CardModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: GqlThrottlerGuard }],
})
export class AppModule {}
