import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AssetsModule } from './assets/assets.module';
import { CurrentAssetsModule } from './current_assets/current_assets.module';
import { PayablesModule } from './payables/payables.module';
import { LiabilitiesModule } from './liabilities/liabilities.module';
import { ExpensesModule } from './expenses/expenses.module';
import { RevenuesModule } from './revenues/revenues.module';
import { ReceivablesModule } from './receivables/receivables.module';
import { OwnersModule } from './owners/owners.module';
import { OwnersEquityModule } from './owners_equity/owners_equity.module';
import { OwnersWithdrawlsModule } from './owners_withdrawls/owners_withdrawls.module';
import { StatementsModule } from './statements/statements.module';
import { AdjustmentsModule } from './adjustments/adjustments.module';
import { ClosingsModule } from './closings/closings.module';
import { TransactionsModule } from './transactions/transactions.module';
import { Asset } from './assets/models/assets.entity';
import { Depreciation } from './assets/models/depreciation.entity';
import { Adjustments } from './adjustments/models/adjustments.entity';
import { Closings } from './closings/models/closings.entity';
import { CurrentAsset } from './current_assets/models/current_assets.entity';
import { Expense } from './expenses/models/expenses.entity';
import { Liability } from './liabilities/models/liabilties.entity';
import { Owners } from './owners/models/owners.entity';
import { OwnersWithdrawl } from './owners_withdrawls/models/owners_withdrawls.entity';
import { OwnersEquity } from './owners_equity/models/owners_equity.entity';
import { Payable } from './payables/models/payables.entity';
import { Receivable } from './receivables/models/receivables.entity';
import { Revenue } from './revenues/models/revenues.entity';
import { statements } from './statements/models/statements';
import {  BusinessTransactions } from './transactions/models/transactions.entity';
import { AccountTypesModule } from './account_types/account_types.module';
import { AccountTypes } from './account_types/models/account_types.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'nex-pro-biz-db',
      password: 'nex-pro-biz-password',
      database: 'nex-pro-biz',
      entities: [Asset, Depreciation, Adjustments, Closings, CurrentAsset, Expense, Liability, Owners,OwnersWithdrawl, OwnersEquity, Payable, Receivable, Revenue, statements, BusinessTransactions, AccountTypes ],
      synchronize: true,
    }),
    AssetsModule,
    CurrentAssetsModule,
    PayablesModule,
    LiabilitiesModule,
    ExpensesModule,
    RevenuesModule,
    ReceivablesModule,
    OwnersModule,
    OwnersEquityModule,
    OwnersWithdrawlsModule,
    StatementsModule,
    AdjustmentsModule,
    ClosingsModule,
    TransactionsModule,
    AccountTypesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
