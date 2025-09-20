import { Test, TestingModule } from '@nestjs/testing';
import { CurrentAssetsService } from './current_assets.service';

describe('CurrentAssetsService', () => {
  let service: CurrentAssetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CurrentAssetsService],
    }).compile();

    service = module.get<CurrentAssetsService>(CurrentAssetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
