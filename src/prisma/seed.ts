/**
 * Наполнение визитки. Идемпотентно: гоняется сколько угодно раз и всегда приводит
 * базу к одному состоянию, поэтому годится и для локального запуска, и для CI.
 *
 * Содержимое — только то, что действительно сделано руками. Уровень CONFIDENT
 * стоит там, где пишу каждый день; LEARNING — там, где пробовал, и приписывать
 * себе больше было бы враньём, которое вскроется на первом же вопросе.
 */
import { LinkKind, PrismaClient, SkillCategory, SkillLevel } from '@prisma/client';

const prisma = new PrismaClient();

const SLUG = 'vitaly-zelenov';

async function main(): Promise<void> {
  const profile = await prisma.profile.upsert({
    where: { slug: SLUG },
    update: {},
    create: {
      slug: SLUG,
      fullName: 'Виталий Зеленов',
      headline: 'Fullstack-разработчик · TypeScript, React, Node.js',
      summary:
        'Делаю продукты целиком: от схемы базы до прода. MedKompas — маркетплейс медицинского ' +
        'туризма, где я сооснователь и единственный разработчик. LLM у меня основной рабочий ' +
        'инструмент, а не автодополнение: план до кода, узкие диффы, ревью каждого изменения.',
      location: 'Нижний Новгород',
      timezone: 'UTC+3',
      email: 'vitaly.zelenov13@gmail.com',
      phone: '+7 922 712-41-72',
    },
  });

  await prisma.link.deleteMany({ where: { profileId: profile.id } });
  await prisma.link.createMany({
    data: [
      { profileId: profile.id, kind: LinkKind.PORTFOLIO, label: 'Портфолио', url: 'https://vitalyzelenov-portfolio.vercel.app', order: 1 },
      { profileId: profile.id, kind: LinkKind.GITHUB, label: 'GitHub', url: 'https://github.com/Regat1ve', order: 2 },
      { profileId: profile.id, kind: LinkKind.EMAIL, label: 'Почта', url: 'mailto:vitaly.zelenov13@gmail.com', order: 3 },
      { profileId: profile.id, kind: LinkKind.PHONE, label: 'Телефон', url: 'tel:+79227124172', order: 4 },
    ],
  });

  const skills: {
    name: string;
    category: SkillCategory;
    level: SkillLevel;
    years: number | null;
  }[] = [
    { name: 'TypeScript', category: SkillCategory.LANGUAGE, level: SkillLevel.CONFIDENT, years: 1 },
    { name: 'JavaScript', category: SkillCategory.LANGUAGE, level: SkillLevel.CONFIDENT, years: 1 },
    { name: 'Python', category: SkillCategory.LANGUAGE, level: SkillLevel.WORKING, years: 0.5 },
    { name: 'C#', category: SkillCategory.LANGUAGE, level: SkillLevel.LEARNING, years: null },

    { name: 'React', category: SkillCategory.FRONTEND, level: SkillLevel.CONFIDENT, years: 1 },
    { name: 'Next.js', category: SkillCategory.FRONTEND, level: SkillLevel.CONFIDENT, years: 1 },
    { name: 'Vite', category: SkillCategory.FRONTEND, level: SkillLevel.WORKING, years: 1 },
    { name: 'TanStack Query', category: SkillCategory.FRONTEND, level: SkillLevel.WORKING, years: null },

    { name: 'Node.js', category: SkillCategory.BACKEND, level: SkillLevel.WORKING, years: 1 },
    { name: 'Express', category: SkillCategory.BACKEND, level: SkillLevel.WORKING, years: 1 },
    { name: 'NestJS', category: SkillCategory.BACKEND, level: SkillLevel.LEARNING, years: null },
    { name: 'GraphQL', category: SkillCategory.BACKEND, level: SkillLevel.LEARNING, years: null },
    { name: 'REST', category: SkillCategory.BACKEND, level: SkillLevel.CONFIDENT, years: 1 },

    { name: 'PostgreSQL', category: SkillCategory.DATABASE, level: SkillLevel.WORKING, years: 1 },
    { name: 'Prisma', category: SkillCategory.DATABASE, level: SkillLevel.WORKING, years: 1 },
    { name: 'MongoDB', category: SkillCategory.DATABASE, level: SkillLevel.LEARNING, years: null },

    { name: 'Docker', category: SkillCategory.INFRA, level: SkillLevel.WORKING, years: null },
    { name: 'Git', category: SkillCategory.INFRA, level: SkillLevel.CONFIDENT, years: 1 },
    { name: 'GitHub Actions', category: SkillCategory.INFRA, level: SkillLevel.WORKING, years: null },
    { name: 'Vercel', category: SkillCategory.INFRA, level: SkillLevel.WORKING, years: 1 },

    { name: 'Claude Code', category: SkillCategory.AI, level: SkillLevel.CONFIDENT, years: 0.5 },
    { name: 'Контекст-инжиниринг', category: SkillCategory.AI, level: SkillLevel.CONFIDENT, years: 0.5 },
  ];

  await prisma.skill.deleteMany({ where: { profileId: profile.id } });
  await prisma.skill.createMany({
    data: skills.map((skill, index) => ({ ...skill, profileId: profile.id, order: index })),
  });

  const projects = [
    {
      slug: 'medkompas',
      name: 'MedKompas',
      summary:
        'Маркетплейс медицинского туризма: подбор клиники, карта, заявка. Я сооснователь и ' +
        'единственный разработчик — от пустого репозитория до прода примерно за четыре месяца.',
      role: 'Сооснователь, единственный разработчик',
      stack: ['React', 'TypeScript', 'Vite', 'Express', 'Prisma', 'PostgreSQL', 'MapLibre'],
      highlights: [
        'Схема базы, JWT-авторизация с refresh, bcrypt и rate-limit написаны руками, без готовых чёрных ящиков',
        'Карта клиник: выгрузка из OpenStreetMap, геокодинг, дедупликация справочника',
        'Воронка заявки размечена по шагам, недельные метрики конверсии считаются автоматически',
      ],
      url: 'https://medkompas13.ru',
      repoUrl: null,
      year: 2026,
      featured: true,
    },
    {
      slug: 'remote-work-radar',
      name: 'remote-work-radar',
      summary: 'Агрегатор удалённых вакансий: ETL из нескольких источников, нормализация, дедупликация, поиск.',
      role: 'Автор',
      stack: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL', 'Python', 'GitHub Actions'],
      highlights: [
        'Python-ETL: httpx, feedparser, BeautifulSoup, pydantic, psycopg 3, типизация под mypy',
        '30 тестов на pytest, запуск по расписанию через GitHub Actions',
      ],
      url: null,
      repoUrl: 'https://github.com/Regat1ve/remote-work-radar',
      year: 2026,
      featured: true,
    },
    {
      slug: 'kuznets',
      name: 'КУЗНЕЦ',
      summary: 'Браузерная merge-игра про кузницу: восемь металлов, механика перековки, две локали.',
      role: 'Автор',
      stack: ['JavaScript', 'Canvas', 'matter.js', 'Python', 'Pillow'],
      highlights: [
        'Тела в физике — сами слитки, а не круги с картинкой: это убрало дыры между ними и подложку под спрайтами',
        'Спрайты рисует Python-скрипт, поэтому форму можно менять пачкой; вес ассетов упал со 148 до 48 КБ',
        'Упакована под Яндекс.Игры: SDK, лидерборд, облачные сохранения, русская и английская локали',
      ],
      url: 'https://vitalyzelenov-portfolio.vercel.app/games/kuznets',
      repoUrl: 'https://github.com/Regat1ve/vitalyzelenov-portfolio/tree/master/public/games/kuznets',
      year: 2026,
      featured: true,
    },
    {
      slug: 'claude-code-playbook',
      name: 'claude-code-playbook',
      summary: 'Публичный свод практик работы с Claude Code: 13 правил, шесть разобранных примеров, два шаблона.',
      role: 'Автор',
      stack: ['Markdown', 'Claude Code'],
      highlights: [
        'Про то, как не превращать ассистента в генератор «лишь бы собралось»: план до кода, узкие диффы, обязательные проверки',
      ],
      url: null,
      repoUrl: 'https://github.com/Regat1ve/claude-code-playbook',
      year: 2026,
      featured: false,
    },
    {
      slug: 'vitaly-card',
      name: 'Эта визитка',
      summary: 'Сама визитка: NestJS, GraphQL по code-first, Prisma, PostgreSQL, Docker и проверка в GitHub Actions.',
      role: 'Автор',
      stack: ['NestJS', 'GraphQL', 'Prisma', 'PostgreSQL', 'TypeScript', 'Docker', 'GitHub Actions'],
      highlights: [
        'Схема GraphQL генерируется из типов TypeScript — SDL и код не могут разъехаться',
        'Docker-образ собирается и проверяется в CI: контейнер поднимается вместе с PostgreSQL, и туда уходит настоящий запрос',
      ],
      url: null,
      repoUrl: 'https://github.com/Regat1ve/vitaly-card',
      year: 2026,
      featured: false,
    },
  ];

  for (const [index, project] of projects.entries()) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      update: { ...project, profileId: profile.id, order: index },
      create: { ...project, profileId: profile.id, order: index },
    });
  }

  const counts = {
    links: await prisma.link.count({ where: { profileId: profile.id } }),
    skills: await prisma.skill.count({ where: { profileId: profile.id } }),
    projects: await prisma.project.count({ where: { profileId: profile.id } }),
  };
  console.log(`Визитка наполнена: ссылок ${counts.links}, навыков ${counts.skills}, проектов ${counts.projects}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
