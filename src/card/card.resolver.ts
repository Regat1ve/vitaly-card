import { Args, Parent, Query, ResolveField, Resolver, Mutation } from '@nestjs/graphql';
import { CardService } from './card.service';
import { ContactInput } from './dto';
import { ContactRequest, Link, Profile, Project, Skill, SkillCategory } from './models';

@Resolver(() => Profile)
export class CardResolver {
  constructor(private readonly card: CardService) {}

  @Query(() => Profile, { description: 'Профиль владельца визитки' })
  profile() {
    return this.card.profile();
  }

  @Query(() => [Project], { description: 'Проекты; можно отфильтровать по технологии' })
  async projects(
    @Args('stack', { nullable: true, description: 'Например: TypeScript, React, PostgreSQL' }) stack?: string,
    @Args('featuredOnly', { nullable: true, defaultValue: false }) featuredOnly?: boolean,
  ) {
    const profile = await this.card.profile();
    return this.card.projects(profile.id, { stack, featuredOnly });
  }

  @Query(() => Project)
  project(@Args('slug') slug: string) {
    return this.card.project(slug);
  }

  @Query(() => [Skill])
  async skills(@Args('category', { type: () => SkillCategory, nullable: true }) category?: SkillCategory) {
    const profile = await this.card.profile();
    return this.card.skills(profile.id, category);
  }

  @Mutation(() => ContactRequest, { description: 'Написать владельцу визитки' })
  contact(@Args('input') input: ContactInput) {
    return this.card.contact(input);
  }

  // Связи резолвятся по требованию: запрос { profile { fullName } } не тронет
  // ни одну из трёх дочерних таблиц. Профиль здесь ровно один, поэтому
  // проблемы N+1 нет — при списке профилей сюда понадобился бы DataLoader.

  @ResolveField('links', () => [Link])
  resolveLinks(@Parent() profile: Profile) {
    return this.card.links(profile.id);
  }

  // Имя поля задано явно: метод не может называться skills — так зовётся Query выше.
  @ResolveField('skills', () => [Skill])
  resolveSkills(@Parent() profile: Profile) {
    return this.card.skills(profile.id);
  }

  @ResolveField('projects', () => [Project])
  resolveProjects(@Parent() profile: Profile) {
    return this.card.projects(profile.id);
  }
}
