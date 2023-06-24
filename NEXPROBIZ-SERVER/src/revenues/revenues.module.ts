import { Module } from '@nestjs/common';
import { RevenuesController } from './controllers/revenues.controller';
import { RevenuesService } from './services/revenues.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Revenues } from './models/revenues.entity';

@Module({
  controllers: [RevenuesController],
  providers: [RevenuesService],
  imports: [
    TypeOrmModule.forFeature([Revenues])
  ]
})
export class RevenuesModule {}
