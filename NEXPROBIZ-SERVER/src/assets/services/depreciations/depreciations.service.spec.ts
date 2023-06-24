import { Test, TestingModule } from '@nestjs/testing';
import { DepreciationsService } from './depreciations.service';

describe('DepreciationsService', () => {
  let service: DepreciationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DepreciationsService],
    }).compile();

    service = module.get<DepreciationsService>(DepreciationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
