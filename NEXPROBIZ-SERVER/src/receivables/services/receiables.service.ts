import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receivable } from '../models/receivables.entity';
import { receivable_type } from '../dtos/createReceivables.dto';
import { ReceivableFilter } from '../dtos/receivablesFilters.dto';


@Injectable()
export class ReceiablesService {
  constructor (@InjectRepository(Receivable) private payablesRepo: Repository<Receivable>){}

  async createNewReceivable(payload: Receivable){
    const payable = this.payablesRepo.create(payload);
    payable.type = receivable_type[payload.type]
    return await this.payablesRepo.save(payable)
  }


  async getAll (filters: ReceivableFilter){
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

