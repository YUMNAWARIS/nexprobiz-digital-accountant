import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, EntitySchema, ObjectType, Repository } from 'typeorm';
import { AccountBookTypes } from '../models/AccountBookTypes';
import { Asset } from 'src/assets/models/assets.entity';
import { CurrentAsset } from 'src/current_assets/models/current_assets.entity';
import { Liability } from 'src/liabilities/models/liabilties.entity';
import { Payable } from 'src/payables/models/payables.entity';
import { Receivable } from 'src/receivables/models/receivables.entity';
import { Expense } from 'src/expenses/models/expenses.entity';
import { Revenue } from 'src/revenues/models/revenues.entity';
import { OwnersEquity } from 'src/owners_equity/models/owners_equity.entity';
import { OwnersWithdrawl } from 'src/owners_withdrawls/models/owners_withdrawls.entity';

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
        return CurrentAsset;
      case AccountBookTypes.liability:
        return Liability;
      case AccountBookTypes.payables:
        return Payable;
      case AccountBookTypes.receivables:
        return Receivable;
      case AccountBookTypes.expense:
        return Expense;
      case AccountBookTypes.revenues:
        return Revenue;
      case AccountBookTypes.owners_equity:
        return OwnersEquity;
      case AccountBookTypes.owners_withdrawl:
        return OwnersWithdrawl;
      default:
        throw new Error(`Invalid account type: ${account_type}`);
    }
  }
}
