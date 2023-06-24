import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { ReceiablesService } from '../services/receiables.service';
import { CreateReceivableDto } from '../dtos/createReceivables.dto';
import { Receivables } from '../models/receivables.entity';
import { ReceivableFilter } from '../dtos/receivablesFilters.dto';

@Controller('/account-books/receivables')
export class ReceivablesController {
  constructor(private receivableService: ReceiablesService){}

  @Post()
  async createNewReceivable(@Body() data: CreateReceivableDto){
    const payload = plainToClass(Receivables, data)
    const result = await this.receivableService.createNewReceivable(payload)
    return result
  }

  @Get()
  async getAll(@Query() filters: ReceivableFilter){
    const result = await this.receivableService.getAll(filters)
    return result;
  }

  @Get('/:id')
  async getOneById(@Param('id') id:string){
    const result = await this.receivableService.getOneById(id)
    return result
  }
}
