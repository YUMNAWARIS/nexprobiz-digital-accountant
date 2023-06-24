import { Test, TestingModule } from '@nestjs/testing';
import { RevenuesService } from './revenues.service';

describe('RevenuesService', () => {
  let service: RevenuesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RevenuesService],
    }).compile();

    service = module.get<RevenuesService>(RevenuesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
