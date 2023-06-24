import { Module } from '@nestjs/common';
import { ReceivablesController } from './controllers/receivables.controller';
import { ReceiablesService } from './services/receiables.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receivables } from './models/receivables.entity';

@Module({
  controllers: [ReceivablesController],
  providers: [ReceiablesService],
  imports: [
    TypeOrmModule.forFeature([Receivables])
  ]
})
export class ReceivablesModule {}
