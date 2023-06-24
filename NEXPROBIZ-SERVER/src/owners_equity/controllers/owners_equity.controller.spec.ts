import { Test, TestingModule } from '@nestjs/testing';
import { OwnersEquityController } from './owners_equity.controller';

describe('OwnersEquityController', () => {
  let controller: OwnersEquityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OwnersEquityController],
    }).compile();

    controller = module.get<OwnersEquityController>(OwnersEquityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
