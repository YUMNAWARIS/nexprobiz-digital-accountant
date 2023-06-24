import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Closings } from '../models/closings.entity';
import { Connection, Repository } from 'typeorm';
import { Expense } from 'src/expenses/models/expenses.entity';
import { Revenues } from 'src/revenues/models/revenues.entity';
import { OwnersWithdrawls } from 'src/owners_withdrawls/models/owners_withdrawls.entity';


interface data {

  debit?: any[];
  credit?: any[];

}

@Injectable()
export class ClosingsService {

  constructor(
    @InjectRepository(Closings) private closingsRepo: Repository<Closings>,
    @InjectRepository(Expense) private expensesRepo: Repository<Expense>,
    @InjectRepository(OwnersWithdrawls) private withdrawlepo: Repository<OwnersWithdrawls>,
    @InjectRepository(Revenues) private revenuesRepo: Repository<Revenues>,
    private connection: Connection
  ) { }

  async getAllClosings() {
    const result = await this.closingsRepo.find()
    return result
  }

  async close() {

    const queryRunner = this.connection.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const closingEntry = this.closingsRepo.create()
      closingEntry.financial_year = (await this.closingsRepo.count()) + 1;

      const expenses = await this.expensesRepo.find({ where: { is_closed: false } })
      const revenues = await this.revenuesRepo.find({ where: { is_closed: false } })

      let sum_of_expenses_debit = 0
      let sum_of_expenses_credit = 0
      let sum_of_revenues_debit = 0
      let sum_of_revenues_credit = 0

      expenses.map(expense => {
        const data = expense.data as data
        data.debit.map(d => sum_of_expenses_debit += d.amount ?? 0)
        data.credit.map(d => sum_of_expenses_credit += d.amount ?? 0)
      })

      revenues.map(revenue => {
        const data = revenue.data as data
        data.debit.map(d => sum_of_revenues_debit += d.amount ?? 0)
        data.credit.map(d => sum_of_revenues_credit += d.amount ?? 0)
      })

      closingEntry.total_expenses = sum_of_expenses_debit - sum_of_expenses_credit
      closingEntry.total_revenues = sum_of_revenues_credit - sum_of_revenues_debit
      closingEntry.total_earnings = closingEntry.total_revenues - closingEntry.total_expenses

      let sum_of_withdrawl_debit = 0;
      let sum_of_withdrawl_credit = 0;
      const withdrawls = await this.withdrawlepo.find({ where: { is_closed: false } })
      withdrawls.map(withdrawl => {
        const data = withdrawl.data as data
        data.debit.map(d => sum_of_withdrawl_debit += d.amount ?? 0)
        data.credit.map(d => sum_of_withdrawl_credit += d.amount ?? 0)
      })
      closingEntry.total_withdrawls = sum_of_withdrawl_debit - sum_of_withdrawl_debit

      await queryRunner.manager.update(Expense, { is_closed: false }, { is_closed: true });
      await queryRunner.manager.update(Revenues, { is_closed: false }, { is_closed: true });
      await queryRunner.manager.update(OwnersWithdrawls, { isClosed: false }, { is_closed: true });

      await queryRunner.manager.save(closingEntry)

      queryRunner.commitTransaction()
    } catch (e) {
      queryRunner.rollbackTransaction
      console.log(e);
    }
  }


}
