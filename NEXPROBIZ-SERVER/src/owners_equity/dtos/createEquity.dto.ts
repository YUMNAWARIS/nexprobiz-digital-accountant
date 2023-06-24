import { IsNegative, IsNumber, IsOptional, IsString, Min } from "class-validator"

export class CreateEquityDto {

  @IsString()
  account_name: string

  @IsNumber()
  @Min(0.0)
  total_amount: number

  @IsOptional()
  @IsString()
  notes: string

}