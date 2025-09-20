import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OwnersEquityService } from '../services/owners_equity.service';
import { CreateEquityDto } from '../dtos/createEquity.dto';

@Controller('account-books/equity')
export class OwnersEquityController {
  constructor(private equityService: OwnersEquityService){}

  @Post()
  async reateEquity( @Body() data:CreateEquityDto){
    return await this.equityService.createEquity(data)
  }

  @Get()
  async getAll(){
    return await this.equityService.getAll()
  }

  @Get('/:id')
  async getById( @Param('id') id:string ){
    return this.equityService.getOne(id)
  }

}
