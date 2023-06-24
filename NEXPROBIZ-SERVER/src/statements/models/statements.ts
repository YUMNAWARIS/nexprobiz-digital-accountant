import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class statements{ 

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  name: string

  @Column('text')
  type: string // income statement, cash flow statement, owners equity statement

  @Column('numeric')
  for_financial_year: number

  @CreateDateColumn()
  date_created: Date

  @Column('json')
  data: object

  @Column('text')
  notes: string
}