import { Module } from '@nestjs/common';
import { TransactionsController } from './controllers/transactions.controller';
import { TransactionsService } from './services/transactions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessTransactions } from './models/transactions.entity';
import { AccountService } from './services/accountService';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService, AccountService],
  imports : [
    TypeOrmModule.forFeature([BusinessTransactions]),
  ]
})
export class TransactionsModule {}
