import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payable, payable_type } from '../models/payables.entity';
import { Repository } from 'typeorm';
import { PayableFilter } from '../dtos/payablesFilters.dto';

@Injectable()
export class PayablesService {
  constructor (@InjectRepository(Payable) private payablesRepo: Repository<Payable>){}

  async createNewPayable(payload: Payable){
    const payable = this.payablesRepo.create(payload);
    payable.type = payable_type[payload.type]
    return await this.payablesRepo.save(payable)
  }


  async getAll (filters: PayableFilter){
    const query = this.payablesRepo.createQueryBuilder("payables");
    // if (filters.id) {
    //   query.andWhere("current_asset.id = :id", { id: filters.id });
    // }
    // if (filters.name) {
    //   query.andWhere("current_asset.name = :name", { frequency: filters.name });
    // }
    return await query.getMany();
  }

  async getOneById (id: string){
    const result = await this.payablesRepo.findOneBy({id})
    return result
  }
}
