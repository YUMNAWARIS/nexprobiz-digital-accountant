import { Test, TestingModule } from '@nestjs/testing';
import { ReceiablesService } from './receiables.service';

describe('ReceiablesService', () => {
  let service: ReceiablesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReceiablesService],
    }).compile();

    service = module.get<ReceiablesService>(ReceiablesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
