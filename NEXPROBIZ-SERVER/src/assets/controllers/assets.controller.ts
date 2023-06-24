import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AssetsService } from '../services/assets/assets.service';
import { Data } from '../dtos/createAssetDto';
import { Filters } from '../dtos/queryFiltersDto';

@Controller('/account-books/assets')
export class AssetsController {

  constructor (private assetService: AssetsService){}

  @Post()
  async createNewAsset(@Body() data:Data){
    const result =  await this.assetService.createNewAssetAccount(data)
    return result;
  }

  @Get()
  async getAssetsAll(@Query() filters:Filters){
    const result = await this.assetService.getAll(filters)
    return result
  }

  @Get('/:id')
  async getByID(@Param('id') id:string){
    const result = await this.assetService.getById(id)
    return result;
  }
}
