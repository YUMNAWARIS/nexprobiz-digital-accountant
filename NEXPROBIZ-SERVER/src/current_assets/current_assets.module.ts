import { Module } from '@nestjs/common';
import { CurrentAssetsController } from './controllers/current_assets.controller';
import { CurrentAssetsService } from './services/current_assets.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrentAssets } from './models/current_assets.entity';

@Module({
  controllers: [CurrentAssetsController],
  providers: [CurrentAssetsService],
  imports : [
    TypeOrmModule.forFeature([CurrentAssets])
  ]
})
export class CurrentAssetsModule {}
