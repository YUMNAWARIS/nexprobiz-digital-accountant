import { Test, TestingModule } from '@nestjs/testing';
import { ReceivablesController } from '../../receivables/controllers/receivables.controller';

describe('ReceivablesController', () => {
  let controller: ReceivablesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReceivablesController],
    }).compile();

    controller = module.get<ReceivablesController>(ReceivablesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
