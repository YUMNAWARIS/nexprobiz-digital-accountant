import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Liability, LiabilityAccountType } from '../models/liabilties.entity';
import { account_type } from '../dtos/createLiability.dto';

@Injectable()
export class LiabilitiesService {
  constructor (@InjectRepository(Liability) private liabilityRepo: Repository<Liability>){}

  async createNewLiability(payload: Liability){
    const payable = this.liabilityRepo.create(payload);
    payable.type = LiabilityAccountType[payload.type]
    return await this.liabilityRepo.save(payable)
  }


  async getAll (filters: any){
    const query = this.liabilityRepo.createQueryBuilder("payables");
    // if (filters.id) {
    //   query.andWhere("current_asset.id = :id", { id: filters.id });
    // }
    // if (filters.name) {
    //   query.andWhere("current_asset.name = :name", { frequency: filters.name });
    // }
    return await query.getMany();
  }

  async getOneById (id: string){
    const result = await this.liabilityRepo.findOneBy({id})
    return result
  }
}

