import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Health-check реально дёргает базу. Ответ «ok» от процесса, который не может
   * достучаться до PostgreSQL, — бесполезная зелёная лампочка.
   */
  @Get()
  async check() {
    const startedAt = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up', latencyMs: Date.now() - startedAt };
    } catch {
      return { status: 'degraded', database: 'down', latencyMs: Date.now() - startedAt };
    }
  }
}
