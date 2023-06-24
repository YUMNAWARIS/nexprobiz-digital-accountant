import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, EntitySchema, ObjectType, Repository } from 'typeorm';
import { AccountBookTypes } from '../models/AccountBookTypes';
import { Asset } from 'src/assets/models/assets.entity';
import { CurrentAssets } from 'src/current_assets/models/current_assets.entity';
import { Liability } from 'src/liabilities/models/liabilties.entity';
import { Payables } from 'src/payables/models/payables.entity';
import { Receivables } from 'src/receivables/models/receivables.entity';
import { Expense } from 'src/expenses/models/expenses.entity';
import { Revenues } from 'src/revenues/models/revenues.entity';
import { OwnersEquity } from 'src/owners_equity/models/owners_equity.entity';
import { OwnersWithdrawls } from 'src/owners_withdrawls/models/owners_withdrawls.entity';

export interface AccountEntity {
  id: string
}


@Injectable()
export class AccountService {

  public getEntityClass(account_type: AccountBookTypes): any {
    switch (account_type) {
      case AccountBookTypes.asset:
        return Asset;
      case AccountBookTypes.current_assets:
        return CurrentAssets;
      case AccountBookTypes.liability:
        return Liability;
      case AccountBookTypes.payables:
        return Payables;
      case AccountBookTypes.receivables:
        return Receivables;
      case AccountBookTypes.expense:
        return Expense;
      case AccountBookTypes.revenues:
        return Revenues;
      case AccountBookTypes.owners_equity:
        return OwnersEquity;
      case AccountBookTypes.owners_withdrawl:
        return OwnersWithdrawls;
      default:
        throw new Error(`Invalid account type: ${account_type}`);
    }
  }
}
