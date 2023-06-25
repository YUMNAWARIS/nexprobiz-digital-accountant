import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class CurrentAsset{

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', {nullable: false})
  account_name: string;

  @Column('text', {default: ''})
  type: string;

  @CreateDateColumn()
  date_added: Date;

  @Column('numeric', {nullable: false, default: 0})
  total_cost: number;

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

  @Column('text' , {default: ''})
  notes: string
}