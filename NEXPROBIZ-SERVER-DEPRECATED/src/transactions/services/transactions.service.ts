import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, QueryResult, Repository, Transaction } from 'typeorm';
import { BusinessTransactions } from '../models/transactions.entity';
import { AccountBookTypes } from '../models/AccountBookTypes';
import { AccountEntity, AccountService } from './accountService';
import {v4 as uuidv4} from 'uuid';

interface AccountEntityWithData extends AccountEntity {
  data: {
    debit?: any[];
    credit?: any[];
  };
}

const sum = (x:any[], y:any[]) => {
  let debit = 0;
  let credit = 0
  if(x && x.length != 0) x?.map((a:any) => (debit += a?.amount));
  if(y && y.length != 0) y?.map((a:any) => (credit += a?.amount));
  return Number(debit - credit);
};

const sumArray = ( x : any ) => {
  let total = 0 ;
  x.map((a: any ) => {
    total += a.amount
  })
  return total
}

@Injectable()
export class TransactionsService {

  constructor(@InjectRepository(BusinessTransactions) private transactionRepository: Repository<BusinessTransactions>,
    private connection: Connection,
    private accountService: AccountService
  ){}

  async getAccountsByTypes(account_type: AccountBookTypes){
    
    const queryRunner = this.connection.createQueryRunner()
    await queryRunner.connect() 
    if(account_type === AccountBookTypes.expense || account_type === AccountBookTypes.revenues || account_type === AccountBookTypes.owners_withdrawl ){
      const res = await queryRunner.manager.find(this.accountService.getEntityClass(account_type), {where : {is_closed : false}});
      return res
    }   
    const res = await queryRunner.manager.find(this.accountService.getEntityClass(account_type));
    return res
  }

  async createTransaction(payload: BusinessTransactions) {
    const queryRunner = this.connection.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()
    const internal_id = uuidv4()
    try{
      const debitAccount = await this.accountService.getEntityClass(AccountBookTypes[payload.debit.type])
      const creditAccount = await this.accountService.getEntityClass(AccountBookTypes[payload.credit.type])
      const debitAccountEntity =await queryRunner.manager.findOneBy(debitAccount, {id: payload.debit.id}) as AccountEntityWithData
      const creditAccountEntity =await queryRunner.manager.findOneBy(creditAccount, {id: payload.credit.id}) as AccountEntityWithData
      console.log("Debit Account: ");
      console.log(debitAccountEntity);
      console.log("Credit Account: ");
      console.log(creditAccountEntity);
      const debitData = {
        amount: payload.amount,
        date: (new Date()).toISOString(),
        transasctionId: internal_id
      }
      const creditData = {
        amount: payload.amount,
        date: (new Date()).toISOString(),
        transasctionId: internal_id
      }

      // data: {
      //   debit: [
      //     {externalId, amount , date},
      //   ]
      //   credit: {
      //     {externalId, amount, date}
      //   }
      // }
      if(debitAccountEntity.data) {
        debitAccountEntity.data.debit?.push(debitData)
      }
      if(creditAccountEntity.data) {
        creditAccountEntity.data.credit?.push(creditData)
      }
      await queryRunner.manager.save(debitAccountEntity)
      await queryRunner.manager.save(creditAccountEntity)
      console.log(debitAccountEntity.data);
      console.log(creditAccountEntity.data);
      const transaction = this.transactionRepository.create(payload);
      transaction.internal_id = internal_id;
      const result = await queryRunner.manager.save(transaction);
      console.log(result);
      queryRunner.commitTransaction()
      return result
    }catch(e){
      console.log(e);
      queryRunner.rollbackTransaction()
      return new InternalServerErrorException("Something went wrong while making this transaction.")
    }finally{
      
    }
  }

  async getAll(){
    const result = this.transactionRepository.find()
    return result
  }

  async getBalanceSheet() {
    const queryRunner = this.connection.createQueryRunner()
    await queryRunner.connect() 

    const transactions = await this.transactionRepository.find()

    const assets = await queryRunner.manager.find(this.accountService.getEntityClass(AccountBookTypes.asset)) 

    const currentAssets = await queryRunner.manager.find(this.accountService.getEntityClass(AccountBookTypes.asset))

    const liabilites = await queryRunner.manager.find(this.accountService.getEntityClass(AccountBookTypes.asset))

    const ownersEquity = await queryRunner.manager.find(this.accountService.getEntityClass(AccountBookTypes.owners_equity))

    const ownersWithDrawl = await queryRunner.manager.find(this.accountService.getEntityClass(AccountBookTypes.owners_withdrawl))

    const accoutPayables =  await queryRunner.manager.find(this.accountService.getEntityClass(AccountBookTypes.payables))


    const accountReceivables = await queryRunner.manager.find(this.accountService.getEntityClass(AccountBookTypes.receivables))

    const expenses =await queryRunner.manager.find(this.accountService.getEntityClass(AccountBookTypes.expense))

    const revenues =await queryRunner.manager.find(this.accountService.getEntityClass(AccountBookTypes.revenues))


    const accounts_data = {
      assets : assets.map(a => {
        return {
          name: a.name,
          amount: sum(a.data.debit, a.data.credit)
        }
      }), 
      liabilites: liabilites.map(a => {
        return {
          name: a.account,
          amount: sum(a.data.credit, a.data.debit)
        }
      }), 
      ownersEquity :ownersEquity.map(a => {
        return {
          name: a.account_name,
          amount: sum(a.data?.credit ?? 0, a.data?.debit ?? 0)
        }
      }), 
      ownersWithDrawl :ownersWithDrawl.map(a => {
        return {
          name: a.account_name,
          amount: sum(a.data.debit, a.data.credit)
        }
      }),
      accountReceivables :accountReceivables.map(a => {
        return {
          name: a.account,
          amount: sum(a.data.debit, a.data.credit)
        }
      }),
      accoutPayables:accoutPayables.map(a => {
        return {
          name: a.name,
          amount: sum(a.data.credit, a.data.debit)
        }
      })
      ,expenses:expenses.map(a => {
        return {
          name: a.account,
          amount: sum(a.data.debit, a.data.credit)
        }
      }),
      revenues:revenues.map(a => {
        return {
          name: a.account,
          amount: sum(a.data.credit, a.data.debit)
        }
      }),
      currentAssets:currentAssets.map(a => {
        return {
          name: a.accout_name,
          amount: sum(a.data.debit, a.data.credit)
        }
      }),
    }
    const payload = {
      ... accounts_data, 
      meta : {
        expenses: sumArray(accounts_data.expenses),
        revenues: sumArray(accounts_data.revenues),
        ownersWithDrawl: sumArray(accounts_data.ownersWithDrawl),
      }
    }


    return payload
  }
}


