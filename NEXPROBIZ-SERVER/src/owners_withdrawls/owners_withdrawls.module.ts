import { Module } from '@nestjs/common';
import { OwnersWithdrawlsController } from './controllers/owners_withdrawls.controller';
import { OwnersWithdrawlsService } from './services/owners_withdrawls.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OwnersWithdrawl } from './models/owners_withdrawls.entity';
import { Owners } from 'src/owners/models/owners.entity';

@Module({
  controllers: [OwnersWithdrawlsController],
  providers: [OwnersWithdrawlsService],
  imports: [
    TypeOrmModule.forFeature([OwnersWithdrawl, Owners])
  ]
})
export class OwnersWithdrawlsModule {}
