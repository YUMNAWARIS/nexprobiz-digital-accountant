import { Data } from "src/assets/dtos/createAssetDto"
import { IsBoolean, IsISO8601, IsNumber, IsOptional, IsString, Matches, Min } from "class-validator";

export class PaymentDetailsDto{
  @IsString()
  payment_method: string

  @IsString()
  payment_status: string

  @IsISO8601()
  payment_date: string

}
export class CreateRevenueDto {

  @IsString()
  account: string
  
  @IsString()
  @IsOptional()
  description: string

  @IsISO8601()
  date_received: Data


  @IsNumber()
  @Min(0.0)
  amount: number

  @IsBoolean()
  is_received: boolean

  @IsOptional()
  payment_detail: PaymentDetailsDto

  @IsString()
  @IsOptional()
  notes: string

}