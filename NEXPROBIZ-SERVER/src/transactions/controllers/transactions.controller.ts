import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { TransactionsService } from '../services/transactions.service';
import { AccountBookTypes } from '../models/AccountBookTypes';
import { CreateTransactionDto } from '../dtos/createTransaction.dto';
import { plainToClass } from 'class-transformer';
import { BusinessTransactions } from '../models/transactions.entity';

@Controller('/transactions')
export class TransactionsController {

  constructor (private transactionSerive: TransactionsService){}

  @Get()
  async getAccountsByTypes(@Query() query: any){
    const account_type = AccountBookTypes[query.account_type]
    if( !account_type ) return new NotFoundException("Account Book type not found.")
    const results = await this.transactionSerive.getAccountsByTypes(account_type)
    return results
  }

  @Post()
  async createTransaction(@Body() body: CreateTransactionDto){

    const payload = plainToClass(BusinessTransactions,body)
    const result = await this.transactionSerive.createTransaction(payload)
    return result;
  }

  @Get('/all')
  async getAll(){
    const result = await this.transactionSerive.getAll()
    return result;
  }

  @Get('/balance-sheet')
  async getBalanceSheet(){
    return await this.transactionSerive.getBalanceSheet()
  }

}
