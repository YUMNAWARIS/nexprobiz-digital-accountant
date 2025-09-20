import { Controller, Get } from '@nestjs/common';
import { ClosingsService } from '../services/closings.service';

@Controller('closings')
export class ClosingsController {
  constructor(private closingService : ClosingsService){}

  @Get()
  async getAll () {
    const res = await this.closingService.getAllClosings()
    return res
  }

  @Get('/close')
  async close(){
    const res = await this.closingService.close()
    return res
  }
}
