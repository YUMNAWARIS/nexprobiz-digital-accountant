import { OwnersEquity } from "src/owners_equity/models/owners_equity.entity";
import { OwnersWithdrawls } from "src/owners_withdrawls/models/owners_withdrawls.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Owners{

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('text', {nullable: false})
  name: string

  @Column('text')
  email: string

  @Column('text')
  phone: string

  @Column('json')
  address: {
    street: string,
    city: string,
    country_code: string,
    state:string,
    zip_code: number
  }

  @Column('text')
  description: string

  @Column('text')
  national_id: string

  @Column('int4')
  owner_ship_percentage: number

  @CreateDateColumn()
  date_created: string

  @Column('json')
  data: object

  @OneToMany(()=> OwnersEquity, (owner_equity) => owner_equity.owner)
  owner_equity: OwnersEquity

  @OneToMany(()=> OwnersWithdrawls, (owner_withdrawl) => owner_withdrawl.owner)
  owner_withdrawl: OwnersWithdrawls
}