import { Module } from '@nestjs/common';
import { AccountTypesService } from './services/account_types.service';
import { AccountTypesController } from './controller/account_types.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountTypes } from './models/account_types.entity';

@Module({
  providers: [AccountTypesService],
  controllers: [AccountTypesController],
  imports: [
    TypeOrmModule.forFeature([AccountTypes])
  ]
})
export class AccountTypesModule {}
