import { IsBoolean, IsISO8601, IsNumber, IsOptional, IsString, Matches, Min } from "class-validator";

export class PaymentDetailsDto{
  @IsString()
  payment_method: string

  @IsString()
  payment_status: string

  @IsISO8601()
  payment_date: string

}

export class CreateExpenseDto{

  @IsString()
  @Matches(/[a-zA-Z0-9\s]{3,50}/g, {
    message: "Please Enter a valid name for account"
  })
  account :string

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @Min(0.0)
  amount: number

  @IsBoolean()
  is_paid: boolean

  @IsOptional()
  payment_details: PaymentDetailsDto
}
