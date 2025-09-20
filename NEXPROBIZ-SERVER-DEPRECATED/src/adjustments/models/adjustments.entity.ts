import { Depreciation } from "src/assets/models/depreciation.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Adjustments {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: "timestamp",
    nullable: false,
  })
  period_start: Date;

  @Column({
    type: "timestamp",
    nullable: false,
  })
  period_end: Date;

  @Column('numeric', {nullable:false})
  accumulated_depreciation: number;

  @Column('numeric', {nullable: false})
  net_book_value: number;

  @Column('json', {nullable: true})
  data: object

  @CreateDateColumn()
  created_at: Date

  @ManyToOne(()=> Depreciation, (dep)=> dep.adjustment)
  depreciation: Depreciation
}