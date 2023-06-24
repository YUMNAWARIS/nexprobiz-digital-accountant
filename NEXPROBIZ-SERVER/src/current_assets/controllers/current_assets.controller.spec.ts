import { Test, TestingModule } from '@nestjs/testing';
import { CurrentAssetsController } from './current_assets.controller';

describe('CurrentAssetsController', () => {
  let controller: CurrentAssetsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CurrentAssetsController],
    }).compile();

    controller = module.get<CurrentAssetsController>(CurrentAssetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
