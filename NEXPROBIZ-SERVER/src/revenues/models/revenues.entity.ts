import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Revenue {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', {nullable: false})
  account: string

  @Column('text', {default: ""})
  description: string;

  @Column('timestamp',{default: () => "CURRENT_TIMESTAMP"})
  date_received: Date;

  @Column('numeric', {nullable:false, default: 0})
  amount: number;

  @Column('boolean', {default:false})
  is_received: boolean;

  @Column('json', {
    default: {
      payment_method: "",
      payment_status: "",
      payment_date: "",
    }
  })
  payment_detail: {
    payment_method: string,
    payment_status: string,
    payment_date: string,
  }

  @Column('boolean', {default:false})
  is_closed: boolean;

  @Column('decimal', {default: 0})
  account_amount:number

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