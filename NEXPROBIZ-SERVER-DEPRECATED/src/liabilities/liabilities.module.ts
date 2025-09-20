import { Module } from '@nestjs/common';
import { LiabilitiesController } from './controllers/liabilities.controller';
import { LiabilitiesService } from './services/liabilities.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Liability } from './models/liabilties.entity';

@Module({
  controllers: [LiabilitiesController],
  providers: [LiabilitiesService],
  imports : [
    TypeOrmModule.forFeature([Liability])
  ]
})
export class LiabilitiesModule {}
