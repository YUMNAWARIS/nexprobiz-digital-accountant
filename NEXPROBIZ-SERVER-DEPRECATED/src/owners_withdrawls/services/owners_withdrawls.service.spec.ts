import { Test, TestingModule } from '@nestjs/testing';
import { OwnersWithdrawlsService } from './owners_withdrawls.service';

describe('OwnersWithdrawlsService', () => {
  let service: OwnersWithdrawlsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OwnersWithdrawlsService],
    }).compile();

    service = module.get<OwnersWithdrawlsService>(OwnersWithdrawlsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
