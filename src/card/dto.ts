import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsOptional, Length, Matches } from 'class-validator';

@InputType()
export class ContactInput {
  @Field()
  @Length(2, 80, { message: 'Имя — от 2 до 80 символов.' })
  name!: string;

  @Field()
  @IsEmail({}, { message: 'Нужен корректный адрес почты.' })
  @Length(5, 160)
  email!: string;

  @Field()
  @Length(10, 2000, { message: 'Сообщение — от 10 до 2000 символов.' })
  message!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Length(2, 40)
  @Matches(/^[\w-]+$/, { message: 'Источник — латиница, цифры, дефис и подчёркивание.' })
  source?: string;
}
