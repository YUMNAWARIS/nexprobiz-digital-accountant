import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Expense } from '../models/expenses.entity';
import { Repository } from 'typeorm';
import { CreateExpenseDto } from '../dtos/createExpense.dto';
import { ExpenseFilter } from '../dtos/expenseFilter.dto';

@Injectable()
export class ExpensesService {
  constructor(@InjectRepository(Expense) private expenseRepo: Repository<Expense>){}

  async createNewExpense (payload: CreateExpenseDto){
    const expense = this.expenseRepo.create(payload);
    if(payload.is_paid) {
      expense.payment_detail = payload.payment_details || 
      {
        payment_method: "",
        payment_status: "INCOMPLETE",
        payment_date: (new Date()).toISOString()
      }
    }
    return await this.expenseRepo.save(expense)
  }

  async getAll (filters: ExpenseFilter){
    const query = this.expenseRepo.createQueryBuilder("expenses");
    // if (filters.id) {
    //   query.andWhere("current_asset.id = :id", { id: filters.id });
    // }
    // if (filters.name) {
    //   query.andWhere("current_asset.name = :name", { frequency: filters.name });
    // }
    const result =  await query.getMany();
    return result
  }

  async getOneById (id: string){
    const result = await this.expenseRepo.findOneBy({id})
    return result
  }
}
