import { Test, TestingModule } from '@nestjs/testing';
import { OwnersEquityService } from './owners_equity.service';

describe('OwnersEquityService', () => {
  let service: OwnersEquityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OwnersEquityService],
    }).compile();

    service = module.get<OwnersEquityService>(OwnersEquityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
