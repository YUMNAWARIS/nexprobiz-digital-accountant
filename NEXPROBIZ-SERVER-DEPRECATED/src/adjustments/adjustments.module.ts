import { Module } from '@nestjs/common';
import { AdjustmentsController } from './controllers/adjustments.controller';
import { AdjustmentsService } from './services/adjustments/adjustments.service';

@Module({
  controllers: [AdjustmentsController],
  providers: [AdjustmentsService]
})
export class AdjustmentsModule {}
