import { Controller, Get } from '@nestjs/common';
import { AccountTypesService } from '../services/account_types.service';
@Controller('account-types')
export class AccountTypesController {

  constructor (private account_type_service: AccountTypesService){}

  @Get()
  getAllAccountTypes(){}

  @Get('/minimal')
  getMinimal(){}

  @Get(':id')
  getById(){}
}
