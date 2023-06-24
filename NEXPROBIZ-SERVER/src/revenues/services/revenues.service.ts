import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Revenues } from '../models/revenues.entity';
import { CreateRevenueDto } from '../dtos/createRevenue.dto';
import { RevenueFilter } from '../dtos/revenueFilter.dto';
import { plainToClass } from 'class-transformer';


@Injectable()
export class RevenuesService {
  constructor(@InjectRepository(Revenues) private revenueRepo: Repository<Revenues>){}

  async createNewExpense (payload: CreateRevenueDto){
    const transformer =  plainToClass( Revenues, payload)
    console.log(transformer);
    const revenues = this.revenueRepo.create(transformer);
    if(payload.is_received) {
      revenues.payment_detail = payload.payment_detail || 
      {
        payment_method: "",
        payment_status: "INCOMPLETE",
        payment_date: (new Date()).toISOString()
      }
    }
    return await this.revenueRepo.save(revenues)
  }

  async getAll (filters: RevenueFilter){
    const query = this.revenueRepo.createQueryBuilder("revenues");
    // if (filters.id) {
    //   query.andWhere("current_asset.id = :id", { id: filters.id });
    // }
    // if (filters.name) {
    //   query.andWhere("current_asset.name = :name", { frequency: filters.name });
    // }
    return await query.getMany();
  }

  async getOneById (id: string){
    const result = await this.revenueRepo.findOneBy({id})
    return result
  }
}

