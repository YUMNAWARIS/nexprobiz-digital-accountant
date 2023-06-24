import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OwnersEquity } from '../models/owners_equity.entity';
import { Repository } from 'typeorm';
import { Owners } from 'src/owners/models/owners.entity';
import { CreateEquityDto } from '../dtos/createEquity.dto';
import { NotFoundError } from 'rxjs';

@Injectable()
export class OwnersEquityService {

  constructor (@InjectRepository(OwnersEquity) private equityRepo: Repository<OwnersEquity>, @InjectRepository(Owners) private ownersRepo: Repository<Owners>){}

  async createEquity(payload: CreateEquityDto){
    const id = '75ae97af-7f66-4d9c-ab9e-770e14806e4b'
    const result = this.equityRepo.create(payload);
    const owner = await this.ownersRepo.findOneBy({id})
    if(!owner) return new NotFoundException("Owners with given Id not found.")
    result.owner = owner
    return await this.equityRepo.save(result)
  }

  async getAll() {
     return await this.equityRepo.find()
  }

  async getOne(id:string){
    return await this.equityRepo.findOneBy({id})
  }
}

