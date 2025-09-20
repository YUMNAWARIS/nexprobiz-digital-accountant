import { IsBoolean, IsISO8601, IsIn, IsNumber, IsOptional, IsString, Matches, Min } from "class-validator";

export const account_type = {
  UNEARNED_REVENUE : 'UNEARNED_REVENUE',
  ACCRUED_EXPENSE : 'ACCRUED_EXPENSE',
  OTHERS : 'OTHERS'
}

export class CreaeLiabilityDto {

  @IsString()
  @Matches(/[a-zA-Z0-9\s]{3,50}/g, {
    message: "Please Enter a valid name for account"
  })
  account: string

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsIn([account_type.ACCRUED_EXPENSE, account_type.OTHERS, account_type.UNEARNED_REVENUE])
  type: string

  @IsNumber()
  @IsOptional()
  amount_due: number;

  @IsNumber()
  @Min(0.0)
  total_amount: number;
}
