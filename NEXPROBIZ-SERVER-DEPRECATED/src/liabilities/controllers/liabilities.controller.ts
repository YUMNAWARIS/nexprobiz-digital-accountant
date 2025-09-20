import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { LiabilitiesService } from '../services/liabilities.service';
import { CreaeLiabilityDto } from '../dtos/createLiability.dto';
import { Liability } from '../models/liabilties.entity';

@Controller('/account-books/liabilities')
export class LiabilitiesController {
  constructor(private liabilityService: LiabilitiesService){}

  @Post()
  async createNewReceivable(@Body() data: CreaeLiabilityDto){
    const payload = plainToClass(Liability, data)
    const result = await this.liabilityService.createNewLiability(payload)
    return result
  }

  @Get()
  async getAll(@Query() filters: any){
    const result = await this.liabilityService.getAll(filters)
    return result;
  }

  @Get('/:id')
  async getOneById(@Param('id') id:string){
    const result = await this.liabilityService.getOneById(id)
    return result
  }
}
