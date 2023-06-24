import { Module } from '@nestjs/common';
import { ClosingsController } from './controllers/closings.controller';
import { ClosingsService } from './services/closings.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Closings } from './models/closings.entity';
import { Expense } from 'src/expenses/models/expenses.entity';
import { Revenues } from 'src/revenues/models/revenues.entity';
import { OwnersWithdrawls } from 'src/owners_withdrawls/models/owners_withdrawls.entity';

@Module({
  controllers: [ClosingsController],
  providers: [ClosingsService],
  imports: [
    TypeOrmModule.forFeature([
      Closings,
      Expense,
      Revenues,
      OwnersWithdrawls
    ])
  ]
})
export class ClosingsModule {}
