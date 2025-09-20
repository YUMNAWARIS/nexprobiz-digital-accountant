import { Test, TestingModule } from '@nestjs/testing';
import { ClosingsController } from './closings.controller';

describe('ClosingsController', () => {
  let controller: ClosingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClosingsController],
    }).compile();

    controller = module.get<ClosingsController>(ClosingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
