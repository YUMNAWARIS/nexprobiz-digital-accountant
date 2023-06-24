import { Module } from '@nestjs/common';
import { AssetsController } from './controllers/assets.controller';
import { DepreciationController } from './controllers/depreciation.controller';
import { AssetsService } from './services/assets/assets.service';
import { DepreciationsService } from './services/depreciations/depreciations.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from './models/assets.entity';
import { Depreciation } from './models/depreciation.entity';

@Module({
  controllers: [AssetsController, DepreciationController],
  providers: [AssetsService, DepreciationsService],
  imports: [
    TypeOrmModule.forFeature([Asset, Depreciation])
  ]
})
export class AssetsModule {}
