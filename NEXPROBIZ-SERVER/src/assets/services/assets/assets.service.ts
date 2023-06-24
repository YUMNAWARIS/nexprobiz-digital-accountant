import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { error } from 'console';
import { Data } from 'src/assets/dtos/createAssetDto';
import { Filters } from 'src/assets/dtos/queryFiltersDto';
import { Asset } from 'src/assets/models/assets.entity';
import { Depreciation, Frequency } from 'src/assets/models/depreciation.entity';
import { Connection, Repository } from 'typeorm';

@Injectable()
export class AssetsService {
  constructor(@InjectRepository(Asset) private assetRepo: Repository<Asset>, @InjectRepository(Depreciation) private depreciationRepo:Repository<Depreciation>,private connection: Connection){}

  async createNewAssetAccount(payloadData:Data){
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect()
    await queryRunner.startTransaction()
    try{
      const asset =  this.assetRepo.create({
        name: payloadData.name,
        acquisition_date: payloadData.acquisition_date,
        details: payloadData?.details || '',
        purchase_date: payloadData.purchase_date,
        purchasing_cost: payloadData.purchasing_cost
      })
      await queryRunner.manager.save(asset)
      let depreciation:any;
      if (payloadData.enableDepreciation){
        depreciation = this.depreciationRepo.create({
          salvage_value: payloadData.salvage_value,
          useful_life: payloadData.useful_life,
          adjustment_frequency: Frequency[payloadData.adjustment_frequency],
          depreciation_expense: (Number(payloadData.purchasing_cost) - Number(payloadData.salvage_value)) / Number(payloadData.useful_life),
          asset: asset
        })
        asset.depreciation = depreciation
        await queryRunner.manager.save(asset)
        await queryRunner.manager.save(depreciation)
      }
      await queryRunner.commitTransaction()
      return {
        ... asset,
        ... depreciation
      }

    }catch(e){
      console.log(e);
      await queryRunner.rollbackTransaction()
      throw new Error("Something went wrong.")
    }finally{
      await queryRunner.release()
    }
  }

  async getAll(filters: Filters){
    const query = this.assetRepo.createQueryBuilder("asset");
    query.leftJoinAndSelect("asset.depreciation", "depreciation");
    if (filters.id) {
      query.andWhere("asset.id = :id", { id: filters.id });
    }
    if (filters.adjustment_frequency) {
      query.andWhere("asset.depreciation.adjustment_frequency = :frequency", { frequency: filters.adjustment_frequency });
    }
    if (filters.name) {
      query.andWhere("asset.name ILIKE :name", { name: `%${filters.name}%` });
    }
    if (filters.sold !== undefined) {
      query.andWhere("asset.isSold = :isSold", { isSold: filters.sold });
    }
    if (filters.depreciated !== undefined) {
      query.andWhere("asset.depreciation.isDepreciatedFully = :isDepreciatedFully", { isDepreciatedFully: filters.depreciated });
    }
    const result = await query.getMany();
    return result;
  }

  async getById(id: string) {
    const query = this.assetRepo.createQueryBuilder("asset");
    query.leftJoinAndSelect("asset.depreciation", "depreciation");
    query.andWhere("asset.id = :id", { id });
    const result = query.getOne();
    if(result) return result
    return new NotFoundException("Unablel to find Asset with given Id")
  }
}
