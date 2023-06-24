import { Owners } from "src/owners/models/owners.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class OwnersEquity {

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', {nullable: false} )
  account_name: string

  @Column('numeric', {nullable:false, default: 0})
  total_amount: number

  @Column('text' , {default: ""})
  notes: string

  @CreateDateColumn()
  date_created: Date
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

  @ManyToOne(() => Owners, (owner) => owner.owner_equity)
  @JoinColumn()
  owner: Owners


}