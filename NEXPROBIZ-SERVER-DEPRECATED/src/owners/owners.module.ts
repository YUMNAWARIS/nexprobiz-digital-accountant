import { Module } from '@nestjs/common';
import { OwnersController } from './controllers/owners.controller';
import { OwnersService } from './services/owners.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Owners } from './models/owners.entity';

@Module({
  controllers: [OwnersController],
  providers: [OwnersService],
  imports: [
    TypeOrmModule.forFeature([Owners])
  ]
})
export class OwnersModule {}
