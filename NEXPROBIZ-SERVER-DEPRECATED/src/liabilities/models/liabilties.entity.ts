import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum LiabilityAccountType {
  UNEARNED_REVENUE = 'UNEARNED_REVENUE',
  ACCRUED_EXPENSE = 'ACCRUED_EXPENSE',
  OTHERS = 'OTHERS'
}

@Entity()
export class Liability{

  @PrimaryGeneratedColumn('uuid')
  id:string

  @Column('text')
  account: string

  @Column('text' , {default: ""})
  description: string;

  @Column({
    type: "enum",
    enum: LiabilityAccountType,
    default: LiabilityAccountType.OTHERS
  })
  type: LiabilityAccountType

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

  @Column('numeric', {nullable:false, default:0})
  total_amount: number;

  @Column('simple-array', {default: []})
  adjustment_details : {
    adjusted_at: Date,
    adjusted_amount: number,
    adjusted_for_period: string,
    adjustment_notes: string
  }[]

  @CreateDateColumn()
  date_added: Date

  @Column('boolean' , {nullable: false, default: false})
  is_completed: boolean

  @Column('json', {
    default : 
    {
      debit: [],
      credit: []
    }
  })
  
  @Column('decimal', {default: 0})
  account_amount:number

  data: object
  @Column('text', {default: ""})
  notes: string
}