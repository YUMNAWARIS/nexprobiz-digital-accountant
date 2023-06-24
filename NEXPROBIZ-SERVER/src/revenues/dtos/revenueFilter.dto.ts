import { IsBoolean, IsISO8601, IsNumber, IsOptional, IsString, Matches, Min } from "class-validator";
export class RevenueFilter{

  @IsString()
  @IsOptional()
  id :string

  @IsNumber()
  @Min(0.0)
  @IsOptional()
  amount: number

  @IsBoolean()
  @IsOptional()
  is_received: boolean

  @IsOptional()
  @IsBoolean()
  is_closed: boolean
}
