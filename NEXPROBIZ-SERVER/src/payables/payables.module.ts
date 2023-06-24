import { Module } from '@nestjs/common';
import { PayablesController } from './controllers/payables.controller';
import { PayablesService } from './services/payables.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payables } from './models/payables.entity';

@Module({
  controllers: [PayablesController],
  providers: [PayablesService],
  imports: [
    TypeOrmModule.forFeature([Payables])
  ]
})
export class PayablesModule {}
