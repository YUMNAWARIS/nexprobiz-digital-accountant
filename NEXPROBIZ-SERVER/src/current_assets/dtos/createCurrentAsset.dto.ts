import { IsNumber, IsOptional, IsString, Matches, Min } from "class-validator";

export class CreateCurrentAssetDto{
  @IsString()
  account_name: string

  @IsString()
  @IsOptional()
  notes: string

  @IsString()
  type: string;

  @IsNumber()
  @Min(0.0)
  total_cost: number;

}