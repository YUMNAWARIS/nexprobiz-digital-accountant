import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { OwnersWithdrawlsService } from '../services/owners_withdrawls.service';
import { WithDrawlData } from '../dtos/createDto';

@Controller('/account-books/withdrawls')
export class OwnersWithdrawlsController {

  constructor (private withdrawlService: OwnersWithdrawlsService){}

  @Post()
  async createNewAsset(@Body() data:WithDrawlData){
    return await this.withdrawlService.createOne(data)
  }

  @Get()
  async getAssetsAll(@Query() filters:any){
    return await this.withdrawlService.getAll()
  }

  @Get('/:id')
  async getByID(@Param('id') id:string){
    return await this.withdrawlService.getOne(id)
  }
}
