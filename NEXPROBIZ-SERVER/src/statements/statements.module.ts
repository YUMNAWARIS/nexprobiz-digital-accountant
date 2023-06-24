import { Module } from '@nestjs/common';
import { StatementsController } from './controllers/statements.controller';
import { StatementsService } from './services/statements.service';

@Module({
  controllers: [StatementsController],
  providers: [StatementsService]
})
export class StatementsModule {}
