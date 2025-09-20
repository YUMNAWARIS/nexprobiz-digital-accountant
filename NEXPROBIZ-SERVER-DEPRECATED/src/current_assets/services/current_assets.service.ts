import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CurrentAsset } from '../models/current_assets.entity';
import { Repository } from 'typeorm';
import { CreateCurrentAssetDto } from '../dtos/createCurrentAsset.dto';
import { CurrentAssetsFilters } from '../dtos/currentAssetsFilters';

@Injectable()
export class CurrentAssetsService {
  constructor(@InjectRepository(CurrentAsset) private assetRepo: Repository<CurrentAsset>){}

  async createNewCurrentAsset(payloadData: CreateCurrentAssetDto){

      const current_asset =  this.assetRepo.create(payloadData)
      return await this.assetRepo.save(current_asset)
  }

  async getAll(filters: CurrentAssetsFilters){
    const query = this.assetRepo.createQueryBuilder("current_assets");
    if (filters.id) {
      query.andWhere("current_asset.id = :id", { id: filters.id });
    }
    if (filters.name) {
      query.andWhere("current_asset.name = :name", { frequency: filters.name });
    }
    return query.getMany();
  }

  async getById(id: string){
    return await this.assetRepo.findOneBy({id})
  }
}
