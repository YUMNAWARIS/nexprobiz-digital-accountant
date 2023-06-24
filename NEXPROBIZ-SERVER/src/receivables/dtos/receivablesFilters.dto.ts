import { IsBoolean, IsISO8601, IsIn, IsNumber, IsOptional, IsString, Matches, Min } from "class-validator";
export class ReceivableFilter{

  @IsString()
  @IsOptional()
  id :string

  @IsNumber()
  @Min(0.0)
  @IsOptional()
  amount_due: number

  @IsNumber()
  @Min(0.0)
  @IsOptional()
  total_amount: number

  @IsBoolean()
  @IsOptional()
  is_paid: boolean

  @IsString()
  @IsIn(['ON_ACCOUNT', 'NOTE'])
  @IsOptional()
  payable_type: string

}
