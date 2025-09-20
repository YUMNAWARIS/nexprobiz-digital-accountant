import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Owners } from '../models/owners.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class OwnersService {

  constructor(@InjectRepository(Owners) private ownerRepo: Repository<Owners>){}

  async getById(id:string){
    const result =  await this.ownerRepo.findOneBy({id: id})
    console.log(result);
    if(result) return result
    return new NotFoundException(`Owners with id ${id} not found.`)
  }
}
