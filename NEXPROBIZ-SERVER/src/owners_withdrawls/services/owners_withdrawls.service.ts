import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { OwnersWithdrawls } from '../models/owners_withdrawls.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { WithDrawlData } from '../dtos/createDto';
import { Owners } from 'src/owners/models/owners.entity';

@Injectable()
export class OwnersWithdrawlsService {
  constructor(@InjectRepository(OwnersWithdrawls) private withDrawlRepo: Repository<OwnersWithdrawls>, @InjectRepository(Owners) private ownerRepo: Repository<Owners>){}
  
  async createOne(payload: WithDrawlData){
    const id = '75ae97af-7f66-4d9c-ab9e-770e14806e4b'
    const result = this.withDrawlRepo.create(payload)
    const owner = await this.ownerRepo.findOneBy({id})
    if (!owner) return new BadRequestException("Owner Not found")
    result.owner = owner
    await this.withDrawlRepo.save(result)
    return result
  }

  async getAll(){
    return await this.withDrawlRepo.find()
  }

  async getOne(id: string){
    return await this.withDrawlRepo.findOneBy({id})
  }
}
