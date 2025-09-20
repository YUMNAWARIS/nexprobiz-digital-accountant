import { Module } from '@nestjs/common';
import { ExpensesController } from './controllers/expenses.controller';
import { ExpensesService } from './services/expenses.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from './models/expenses.entity';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService],
  imports: [
    TypeOrmModule.forFeature([Expense])
  ]
})
export class ExpensesModule {}
