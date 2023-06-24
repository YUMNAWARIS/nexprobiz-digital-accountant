import React from 'react';
import { AccountLayout } from './sub_layouts/accountLayout';
import { HomeLayout } from './sub_layouts/homeLayout';
import { AppNav } from '../components/App/appNav/appNav';
import { OwnerLayout } from './sub_layouts/OwnerLayout';
import { TransactionLayout } from './sub_layouts/transactionLayout';
import { StatementLayout } from './sub_layouts/statementLayout';
import { ClosingsLayout } from './sub_layouts/closingsLayout';

export function AppLayout(props){

  const sub_layouts = {
    account_book: AccountLayout,
    transaction_layout: TransactionLayout,
    home_layout: HomeLayout,
    owner_layout: OwnerLayout,
    statement_layout: StatementLayout,
    closings_layout: ClosingsLayout
  }
  const SubLayout = props.sub_layout ? sub_layouts[props.sub_layout] : HomeLayout

  return (
    <div>
      <div>
        <AppNav />
      </div>
      <section>
        <SubLayout title={props.title}>
          {props.children}
        </SubLayout>
      </section>
      
    </div>
  );
};
