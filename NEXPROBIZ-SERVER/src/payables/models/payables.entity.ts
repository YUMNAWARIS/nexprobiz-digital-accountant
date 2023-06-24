
import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

export enum payable_type {
  ON_ACCOUNT= 'on_account',
  NOTE = 'note'
}

@Entity()
export class Payables {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', {nullable: false})
  account: string

  @Column('text', {default: ""})
  description: string;

  @CreateDateColumn()
  date_added: Date;

  @Column('timestamp', {nullable: true})
  date_paid: Date;

  @Column('timestamp', {default: () => 'CURRENT_TIMESTAMP'})
  date_due: Date;

  @Column({
    type: "enum",
    enum: payable_type,
    default: payable_type.ON_ACCOUNT
  })
  type: payable_type

  @Column('json', {default: {
    name: "",
    email: "",
    address: "",
    description: ""
  }})
  vendor_details: {
    name: string,
    email: string,
    address: string,
    description: string
  }

  @Column('numeric', {nullable:false, default:0})
  amount_due: number;

  @Column('numeric', {nullable:false, default:0})
  total_amount: number;

  @Column('bool', {default: false})
  is_paid: boolean;

  @Column('json', {default: {
    payment_method: "",
    payment_status: "",
    payment_date: (new Date()).toISOString(),
  }})
  payment_detail: {
    payment_method: string,
    payment_status: string,
    payment_date: string,
  }

  @Column('json', {
    default : 
    {
      debit: [],
      credit: []
    }
  })
  data: object


  @Column('decimal', {default: 0})
  account_amount:number


  @Column('text', {default: ""})
  notes: string
}