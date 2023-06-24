import { Module } from '@nestjs/common';
import { OwnersEquityController } from './controllers/owners_equity.controller';
import { OwnersEquityService } from './services/owners_equity.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Owners } from 'src/owners/models/owners.entity';
import { OwnersEquity } from './models/owners_equity.entity';

@Module({
  controllers: [OwnersEquityController],
  providers: [OwnersEquityService],
  imports: [
    TypeOrmModule.forFeature([Owners, OwnersEquity])
  ]
})
export class OwnersEquityModule {}
