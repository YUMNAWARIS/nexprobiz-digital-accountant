import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RevenuesService } from '../services/revenues.service';
import { RevenueFilter } from '../dtos/revenueFilter.dto';
import { CreateRevenueDto } from '../dtos/createRevenue.dto';

@Controller('/account-books/revenues')
export class RevenuesController {

  constructor(private revenueService: RevenuesService){}

  @Post()
  async createNewRevenue(@Body() data: CreateRevenueDto){
    const result = await this.revenueService.createNewExpense(data)
    return result
  }

  @Get()
  async getAll(@Query() filters: RevenueFilter){
    const result = await this.revenueService.getAll(filters)
    return result;
  }

  @Get(':id')
  async getOneById(@Param('id') id:string){
    const result = await this.revenueService.getOneById(id)
    return result
  }
}
