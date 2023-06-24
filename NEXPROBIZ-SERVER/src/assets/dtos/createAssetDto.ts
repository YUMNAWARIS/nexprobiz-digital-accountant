import { IsBoolean, IsDecimal, IsISO8601, IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, Matches, Max, Min, matches } from "class-validator"

export class Data {

  @IsISO8601()
  acquisition_date: Date

  @IsString()
  @IsIn(["YEARLY" , "MONTHLY" , "WEEKLY"])
  adjustment_frequency: "YEARLY" | "MONTHLY" | "WEEKLY"

  @IsString()
  @IsIn(["LINEAR DEPRECIATION METHOD"])
  depreciation_method: "LINEAR DEPRECIATION METHOD"

  @IsString()
  @IsOptional()
  details: string

  @IsBoolean()
  @IsOptional()
  enableDepreciation: boolean

  @IsString()
  @Matches(/[a-zA-Z0-9\s]{1,100}/g, {
    message: "Name should be alpha-numeric. "
  })
  name: string

  @IsString()
  @IsOptional()
  notes: string

  @IsISO8601()
  purchase_date: Date

  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(999999999)
  purchasing_cost: number

  @IsNumber()
  @Min(0)
  @Max(999999999)
  salvage_value: number

  @IsInt()
  @IsPositive()
  @Min(1)
  @Max(50)
  useful_life: number
}