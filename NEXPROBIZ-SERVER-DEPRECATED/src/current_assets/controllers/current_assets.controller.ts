import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentAssetsService } from '../services/current_assets.service';
import { CurrentAssetsFilters } from '../dtos/currentAssetsFilters';
import { CreateCurrentAssetDto } from '../dtos/createCurrentAsset.dto';

@Controller('/account-books/current-assets')
export class CurrentAssetsController {
  constructor(private currentAssetService: CurrentAssetsService) { }

  @Post()
  async createCurrentAsset(@Body() data: CreateCurrentAssetDto) {
    return await this.currentAssetService.createNewCurrentAsset(data)
  }

  @Get()
  async getAll(@Query() filters: CurrentAssetsFilters) {
    const result =  await this.currentAssetService.getAll(filters)
    return result
  }
  @Get('/:id')
  async getById(@Param('id') id: string) {
    return await this.currentAssetService.getById(id)
  }
}
