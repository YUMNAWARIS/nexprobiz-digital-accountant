import { Controller, Get, Param } from '@nestjs/common';
import { OwnersService } from '../services/owners.service';

@Controller('owners')
export class OwnersController {
  constructor (public ownerService: OwnersService){}
  @Get('')
  async getById(){
    const id = '75ae97af-7f66-4d9c-ab9e-770e14806e4b'
    const result = await this.ownerService.getById(id)
    return result
  }
}
