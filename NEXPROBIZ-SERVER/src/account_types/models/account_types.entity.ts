import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

export enum AccountTypesOptions {
  ASSET = 'asset',
  CURRENT_ASSET = 'current_asset',
  EXPENSE = 'expense',
  REVENUE = 'revenue',
  PAYABLE = 'payable',
  RECEIVEABLE = 'receivable',
  LIABILITY = 'liability',
  OWNERS_EQUITY = 'owners_equity',
  OWNERS_WITHDRAWL = 'owners_withdrawl'
}
@Entity()
export class AccountTypes {
  @Column({
    type: 'enum',
    enum: AccountTypesOptions,
    nullable:false,
    unique: true
  })
  title: string
  
  @PrimaryGeneratedColumn('increment')
  code: number

  @Column('text', {nullable:true})
  description: string
}