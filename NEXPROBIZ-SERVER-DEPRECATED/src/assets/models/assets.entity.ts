import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Depreciation } from "./depreciation.entity";
import { Adjustments } from "src/adjustments/models/adjustments.entity";

@Entity()
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({
    type: 'text',
    nullable: false
  })
  name: string

  @Column({type: "text"})
  details: string

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false
  })
  acquisition_date: Date
  
  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false
  })  
  purchase_date: Date

  @Column({
    type: 'numeric',
    nullable: false
  })
  purchasing_cost: number

  @Column({
    type: 'boolean',
    default: false
  })
  isSold: boolean

  @Column('json',{
    default: {}
  })
  sellingDetails: object

  @OneToOne(()=> Depreciation, (dep)=> dep.asset)
  @JoinColumn()
  depreciation: Depreciation

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
}