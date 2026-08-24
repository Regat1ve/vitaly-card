import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CardService, DEFAULT_PROFILE_SLUG } from './card.service';
import { SkillCategory } from './models';

/**
 * Сервис проверяется с подменённым Prisma: тесты не требуют базы и проверяют
 * ровно то, за что сервис отвечает, — какой запрос он собирает и как ведёт себя,
 * когда данных нет.
 */
describe('CardService', () => {
  const profile = { id: 'profile-1', slug: DEFAULT_PROFILE_SLUG, fullName: 'Виталий Зеленов' };

  const prisma = {
    profile: { findUnique: jest.fn() },
    link: { findMany: jest.fn() },
    skill: { findMany: jest.fn() },
    project: { findMany: jest.fn(), findUnique: jest.fn() },
    contactRequest: { create: jest.fn() },
  };

  let service: CardService;

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma.profile.findUnique.mockResolvedValue(profile);

    const moduleRef = await Test.createTestingModule({
      providers: [CardService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(CardService);
  });

  it('берёт профиль по слагу по умолчанию', async () => {
    await expect(service.profile()).resolves.toBe(profile);
    expect(prisma.profile.findUnique).toHaveBeenCalledWith({ where: { slug: DEFAULT_PROFILE_SLUG } });
  });

  it('бросает 404, а не возвращает null, если профиля нет', async () => {
    prisma.profile.findUnique.mockResolvedValue(null);
    await expect(service.profile('нет-такого')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('фильтрует проекты по технологии на стороне PostgreSQL', async () => {
    prisma.project.findMany.mockResolvedValue([]);
    await service.projects(profile.id, { stack: 'PostgreSQL' });

    // has превращается в оператор массива в SQL; фильтровать в Node значило бы
    // тянуть все проекты и выбрасывать лишние уже в памяти.
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { profileId: profile.id, stack: { has: 'PostgreSQL' } },
      }),
    );
  });

  it('не добавляет фильтр по стеку, если технология не задана', async () => {
    prisma.project.findMany.mockResolvedValue([]);
    await service.projects(profile.id);

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { profileId: profile.id } }),
    );
  });

  it('фильтрует навыки по категории', async () => {
    prisma.skill.findMany.mockResolvedValue([]);
    await service.skills(profile.id, SkillCategory.BACKEND);

    expect(prisma.skill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { profileId: profile.id, category: SkillCategory.BACKEND } }),
    );
  });

  it('нормализует обращение перед записью: почта в нижний регистр, пробелы срезаны', async () => {
    prisma.contactRequest.create.mockResolvedValue({ id: 'contact-1' });

    await service.contact({
      name: '  Мария Леви  ',
      email: '  HR@Example.COM ',
      message: '  Здравствуйте, посмотрели визитку.  ',
    });

    expect(prisma.contactRequest.create).toHaveBeenCalledWith({
      data: {
        profileId: profile.id,
        name: 'Мария Леви',
        email: 'hr@example.com',
        message: 'Здравствуйте, посмотрели визитку.',
        source: null,
      },
    });
  });

  it('бросает 404 на неизвестный проект', async () => {
    prisma.project.findUnique.mockResolvedValue(null);
    await expect(service.project('нет-такого')).rejects.toBeInstanceOf(NotFoundException);
  });
});
