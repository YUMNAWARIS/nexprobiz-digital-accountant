import { Test, TestingModule } from '@nestjs/testing';
import { OwnersWithdrawlsController } from './owners_withdrawls.controller';

describe('OwnersWithdrawlsController', () => {
  let controller: OwnersWithdrawlsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OwnersWithdrawlsController],
    }).compile();

    controller = module.get<OwnersWithdrawlsController>(OwnersWithdrawlsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
