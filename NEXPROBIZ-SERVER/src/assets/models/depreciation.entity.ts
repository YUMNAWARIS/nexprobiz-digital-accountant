import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Asset } from './assets.entity';
import { Adjustments } from 'src/adjustments/models/adjustments.entity';
export enum Frequency {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}
@Entity()
export class Depreciation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('numeric')
  useful_life: number;

  @Column('numeric')
  salvage_value: number;

  @Column({
    type: 'text',
    default: 'LINEAR DEPRECIATION METHOD'
  })
  depreciation_method: string;

  @Column('numeric')
  depreciation_expense: number;

  @Column('boolean', {
    default: false
  })
  isDepreciatedFully: boolean;

  @Column({
    type: "enum",
    enum: Frequency,
    default: Frequency.YEARLY,
  })
  adjustment_frequency: Frequency

  @Column('int4', { default: 0 })
  total_adjustment_made: number;

  @Column('text', {nullable: true})
  notes: string

  @OneToOne(()=> Asset, (asset)=> asset.depreciation)
  asset: Asset

  @OneToMany(()=> Adjustments, (adj) => adj.depreciation)
  adjustment: Adjustments
}
