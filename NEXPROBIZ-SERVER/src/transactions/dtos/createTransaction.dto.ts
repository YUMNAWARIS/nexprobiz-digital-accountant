import { Type } from "class-transformer";
import { IsDefined, IsISO8601, IsNotEmptyObject, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";

export class TransactionEntry {
  @IsString()
  id: string

  @IsString()
  type: string
}


export class CreateTransactionDto {
  @IsString()
  description: string;

  @IsDefined()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => TransactionEntry)
  debit: TransactionEntry

  @IsDefined()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => TransactionEntry)
  credit: TransactionEntry

  @IsNumber()
  amount: number

  @IsOptional()
  notes: string
}