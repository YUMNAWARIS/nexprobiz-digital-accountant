import { BadRequestException, Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { AccountTypesService } from '../services/account_types.service';
@Controller('account-types')
export class AccountTypesController {

  constructor(private account_type_service: AccountTypesService) { }

  @Get()
  async getAllAccountTypes() {
    const result = await this.account_type_service.getAll()
    if (!result) return new NotFoundException("Account types not found.")
    return {
      data: result,
      count: result.length
    }
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const code = parseInt(id)
    if (!code || isNaN(code)) return new BadRequestException('Please give a proper code number in request params.')
    const result = await this.account_type_service.getById(code)
    if (!result) return new NotFoundException(`Account type with code ${id} not found. Please enter a valid code.`)
    return {
      data: result
    }
  }
}
