import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ExpensesService } from '../services/expenses.service';
import { CreateExpenseDto } from '../dtos/createExpense.dto';
import { ExpenseFilter } from '../dtos/expenseFilter.dto';

@Controller('/account-books/expenses')
export class ExpensesController {
  constructor(private expenseService: ExpensesService){}

  @Post()
  async createNewExpense(@Body() data: CreateExpenseDto){
    console.log(data);
    const result = await this.expenseService.createNewExpense(data)
    return result
  }

  @Get()
  async getAll(@Query() filters: ExpenseFilter){
    const result = await this.expenseService.getAll(filters)
    return result;
  }

  @Get(':id')
  async getOneById(@Param('id') id:string){
    const result = await this.expenseService.getOneById(id)
    return result
  }
}
