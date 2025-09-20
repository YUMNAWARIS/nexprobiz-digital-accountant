
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { AccountBookTypes } from "./AccountBookTypes";

@Entity()
export class BusinessTransactions {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  internal_id: string

  @Column('text')
  description: string;

  @Column('timestamp' , {nullable:false, default: () => 'CURRENT_TIMESTAMP'})
  transaction_date: Date;

  @Column('json')
  debit: {
    id: string,
    type: AccountBookTypes,
  }

  @Column('decimal')
  amount: number

  @Column('json')
  credit: {
    id: string,
    type: AccountBookTypes,
  }

  @Column('json' , {default: {}})
  data: object

  @Column('text' , {default: ""})
  notes: string
}