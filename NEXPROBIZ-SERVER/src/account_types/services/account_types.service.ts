import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountTypes } from '../models/account_types.entity';
import { Repository, createQueryBuilder } from 'typeorm';

@Injectable()
export class AccountTypesService {

  constructor (@InjectRepository(AccountTypes) private account_type_repo: Repository<AccountTypes>){}

  async getAll(){
    const account_types = await this.account_type_repo.find()
    return account_types
  }

  async getById(id: number){
    const account_type = await this.account_type_repo.findOneBy({code:id})
    return account_type
  }

  async getByTitle(title: string) {
    const account_type = this.account_type_repo.findOneBy({title: title})
    return account_type
  }
}
