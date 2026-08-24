import { Module } from '@nestjs/common';
import { CardResolver } from './card.resolver';
import { CardService } from './card.service';

@Module({
  providers: [CardService, CardResolver],
  exports: [CardService],
})
export class CardModule {}
