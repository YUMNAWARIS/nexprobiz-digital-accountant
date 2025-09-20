import { Matches } from "class-validator";
import { Column, Entity, PrimaryColumn, PrimaryColumnCannotBeNullableError, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Expense {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  account: string

  @Column('text' , {nullable:true})
  description: string;

  @Column('timestamp', {
    default: () => 'CURRENT_TIMESTAMP',
  })
  date_incurred: Date;

  @Column('numeric', {nullable:false, default:0})
  amount: number;

  @Column('boolean' , {nullable: false, default: false})
  is_paid: boolean;

  @Column('json', {default: {
    payment_method: "",
    payment_status: "",
    payment_date: new Date()
  }})
  payment_detail: {
    payment_method: string,
    payment_status: string,
    payment_date: string,

  }

  @Column('decimal', {default: 0})
  account_amount:number

  @Column('boolean' , {nullable: false, default: false})
  is_closed: boolean

  @Column('json', {
    default : 
    {
      debit: [],
      credit: []
    }
  })
  data: object

  @Column('text', {default: ""})
  notes: string
}