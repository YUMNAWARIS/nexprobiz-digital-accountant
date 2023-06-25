import { Module } from '@nestjs/common';
import { ReceivablesController } from './controllers/receivables.controller';
import { ReceiablesService } from './services/receiables.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receivable } from './models/receivables.entity';

@Module({
  controllers: [ReceivablesController],
  providers: [ReceiablesService],
  imports: [
    TypeOrmModule.forFeature([Receivable])
  ]
})
export class ReceivablesModule {}
