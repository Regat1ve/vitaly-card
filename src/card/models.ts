import { Field, Float, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum LinkKind {
  GITHUB = 'GITHUB',
  PORTFOLIO = 'PORTFOLIO',
  TELEGRAM = 'TELEGRAM',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  OTHER = 'OTHER',
}

export enum SkillCategory {
  LANGUAGE = 'LANGUAGE',
  FRONTEND = 'FRONTEND',
  BACKEND = 'BACKEND',
  DATABASE = 'DATABASE',
  INFRA = 'INFRA',
  AI = 'AI',
}

/**
 * Уровень владения. Три ступени, а не пять и не проценты: «85 % владения React»
 * ничего не значит, а «пишу каждый день» и «пробовал в пет-проекте» — значат.
 */
export enum SkillLevel {
  LEARNING = 'LEARNING',
  WORKING = 'WORKING',
  CONFIDENT = 'CONFIDENT',
}

registerEnumType(LinkKind, { name: 'LinkKind' });
registerEnumType(SkillCategory, { name: 'SkillCategory' });
registerEnumType(SkillLevel, {
  name: 'SkillLevel',
  description: 'LEARNING — пробовал, WORKING — писал в проде, CONFIDENT — пишу каждый день',
});

@ObjectType()
export class Link {
  @Field(() => ID) id!: string;
  @Field(() => LinkKind) kind!: LinkKind;
  @Field() label!: string;
  @Field() url!: string;
}

@ObjectType()
export class Skill {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field(() => SkillCategory) category!: SkillCategory;
  @Field(() => SkillLevel) level!: SkillLevel;

  @Field(() => Float, { nullable: true, description: 'Лет практики; null — если считать нечестно' })
  years!: number | null;
}

@ObjectType()
export class Project {
  @Field(() => ID) id!: string;
  @Field() slug!: string;
  @Field() name!: string;
  @Field() summary!: string;
  @Field() role!: string;
  @Field(() => [String]) stack!: string[];
  @Field(() => [String]) highlights!: string[];
  @Field(() => String, { nullable: true }) url!: string | null;
  @Field(() => String, { nullable: true }) repoUrl!: string | null;
  @Field(() => Int) year!: number;
  @Field() featured!: boolean;
}

@ObjectType()
export class Profile {
  @Field(() => ID) id!: string;
  @Field() slug!: string;
  @Field() fullName!: string;
  @Field() headline!: string;
  @Field() summary!: string;
  @Field() location!: string;
  @Field() timezone!: string;
  @Field() email!: string;
  @Field(() => String, { nullable: true }) phone!: string | null;

  // Поля-связи резолвятся отдельно, а не грузятся всегда: клиенту, которому нужно
  // только имя и почта, незачем платить тремя лишними запросами в базу.
  @Field(() => [Link]) links!: Link[];
  @Field(() => [Skill]) skills!: Skill[];
  @Field(() => [Project]) projects!: Project[];
}

@ObjectType()
export class ContactRequest {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field() email!: string;
  @Field() message!: string;
  @Field() createdAt!: Date;
}
