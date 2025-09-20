import { Test, TestingModule } from '@nestjs/testing';
import { RevenuesController } from './revenues.controller';

describe('RevenuesController', () => {
  let controller: RevenuesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RevenuesController],
    }).compile();

    controller = module.get<RevenuesController>(RevenuesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
