import { Test, TestingModule } from '@nestjs/testing';
import { DepreciationController } from './depreciation.controller';

describe('DepreciationController', () => {
  let controller: DepreciationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepreciationController],
    }).compile();

    controller = module.get<DepreciationController>(DepreciationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
