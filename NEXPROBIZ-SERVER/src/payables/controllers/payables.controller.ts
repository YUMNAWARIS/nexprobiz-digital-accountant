import { plainToClass } from 'class-transformer';
import { CreatePayableDto } from '../dtos/createPayables.dto';
import { PayableFilter } from '../dtos/payablesFilters.dto';
import { PayablesService } from '../services/payables.service';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Payables } from '../models/payables.entity';

@Controller('account-books/payables')
export class PayablesController {
  constructor(private payableService: PayablesService){}

  @Post()
  async createNewPayable(@Body() data: CreatePayableDto){
    const payload = plainToClass(Payables, data)
    const result = await this.payableService.createNewPayable(payload)
    return result
  }

  @Get()
  async getAll(@Query() filters: PayableFilter){
    const result = await this.payableService.getAll(filters)
    return result;
  }

  @Get('/:id')
  async getOneById(@Param('id') id:string){
    const result = await this.payableService.getOneById(id)
    return result
  }
}
