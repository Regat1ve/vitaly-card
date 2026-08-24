import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContactInput } from './dto';
import { SkillCategory } from './models';

/** Один профиль на всю визитку — slug зафиксирован, чтобы не плодить лишний параметр в API. */
export const DEFAULT_PROFILE_SLUG = 'vitaly-zelenov';

@Injectable()
export class CardService {
  constructor(private readonly prisma: PrismaService) {}

  async profile(slug: string = DEFAULT_PROFILE_SLUG) {
    const profile = await this.prisma.profile.findUnique({ where: { slug } });
    if (!profile) throw new NotFoundException(`Профиль «${slug}» не найден.`);
    return profile;
  }

  links(profileId: string) {
    return this.prisma.link.findMany({
      where: { profileId },
      orderBy: { order: 'asc' },
    });
  }

  skills(profileId: string, category?: SkillCategory) {
    return this.prisma.skill.findMany({
      where: { profileId, ...(category ? { category } : {}) },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  }

  projects(profileId: string, options: { featuredOnly?: boolean; stack?: string } = {}) {
    return this.prisma.project.findMany({
      where: {
        profileId,
        ...(options.featuredOnly ? { featured: true } : {}),
        // has — поиск по элементу массива на стороне PostgreSQL, а не фильтр в Node.
        ...(options.stack ? { stack: { has: options.stack } } : {}),
      },
      orderBy: [{ order: 'asc' }, { year: 'desc' }],
    });
  }

  async project(slug: string) {
    const project = await this.prisma.project.findUnique({ where: { slug } });
    if (!project) throw new NotFoundException(`Проект «${slug}» не найден.`);
    return project;
  }

  /** Обращение с формы визитки. Пишется в базу — иначе мутация была бы декорацией. */
  async contact(input: ContactInput) {
    const profile = await this.profile();
    return this.prisma.contactRequest.create({
      data: {
        profileId: profile.id,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        message: input.message.trim(),
        source: input.source ?? null,
      },
    });
  }
}
