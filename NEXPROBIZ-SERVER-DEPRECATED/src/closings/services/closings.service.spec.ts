import { Test, TestingModule } from '@nestjs/testing';
import { ClosingsService } from './closings.service';

describe('ClosingsService', () => {
  let service: ClosingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClosingsService],
    }).compile();

    service = module.get<ClosingsService>(ClosingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
