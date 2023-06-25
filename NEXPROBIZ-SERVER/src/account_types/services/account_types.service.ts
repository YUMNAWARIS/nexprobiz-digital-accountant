import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountTypes } from '../models/account_types.entity';

@Injectable()
export class AccountTypesService {

  constructor (@InjectRepository(AccountTypes) account_type_repo: AccountTypes){}
}
