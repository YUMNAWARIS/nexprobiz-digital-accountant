import { IsBoolean, IsISO8601, IsIn, IsNumber, IsOptional, IsString, Matches, Min } from "class-validator";

export class PaymentDetailsDto {
  @IsString()
  payment_method: string

  @IsString()
  payment_status: string

  @IsISO8601()
  payment_date: string

}

export class VendorDetails {
  @IsString()
  name: string

  @IsString()
  email: string

  @IsString()
  address: string  

  @IsString()
  description: string
}

export enum payable_type {
  ON_ACCOUNT = 'on_account',
  NOTE = 'note'
}

export class CreatePayableDto {

  @IsString()
  @Matches(/[a-zA-Z0-9\s]{3,50}/g, {
    message: "Please Enter a valid name for account"
  })
  account: string

  @IsString()
  @IsOptional()
  description: string;
  
  @IsISO8601()
  date_due: Date;

  @IsString()
  @IsIn(['ON_ACCOUNT', 'NOTE'])
  type: payable_type


  @IsOptional()
  vendor_details: VendorDetails


  @IsNumber()
  @IsOptional()
  amount_due: number;

  @IsNumber()
  @Min(0.0)
  total_amount: number;

  @IsBoolean()
  is_paid: boolean

  @IsOptional()
  payment_details: PaymentDetailsDto
}
