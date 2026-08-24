import { Controller, Get, Header } from '@nestjs/common';
import { CARD_PAGE } from '../generated/page';

@Controller()
export class PageController {
  /**
   * Главная страница. Отдаётся из сборки, а не с диска: одна HTML-страница
   * не нуждается в статическом файловом сервере, зато нуждается в том, чтобы
   * одинаково работать и в контейнере, и в serverless.
   */
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=0, must-revalidate')
  page(): string {
    return CARD_PAGE;
  }
}
