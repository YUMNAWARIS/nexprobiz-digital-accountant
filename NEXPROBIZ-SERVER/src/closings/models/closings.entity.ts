
import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Closings {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false
  })
  closing_date: Date

  @Column('text' , {default: ""})
  description: string;

  @Column('int4', {nullable: false})
  financial_year: number

  @Column({
    type: 'numeric',
    nullable: false
  })  
  total_expenses: number

  @Column({
    type: 'numeric',
    nullable: false
  })  
  total_revenues: number

  @Column({
    type: 'numeric',
    nullable: false
  })  
  total_earnings: number

  @Column({
    type: 'numeric',
    nullable: false
  })
  total_withdrawls: number

  @Column('json', {default: {}})
  data: object
 
  @Column('text' , {default: ''})
  notes: string
}