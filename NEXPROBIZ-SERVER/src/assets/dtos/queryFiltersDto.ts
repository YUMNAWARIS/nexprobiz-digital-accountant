import { Optional } from "@nestjs/common"
import { Transform } from "class-transformer"
import { IsBoolean, IsDecimal, IsISO8601, IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, Matches, Max, Min, matches } from "class-validator"


export class Filters {

  @IsString()
  @IsOptional()
  id: string

  @IsString()
  @IsIn(["YEARLY" , "MONTHLY" , "WEEKLY"])
  @IsOptional()
  adjustment_frequency: "YEARLY" | "MONTHLY" | "WEEKLY"

  @IsString()
  @Matches(/[a-zA-Z0-9\s]{1,100}/g, {
    message: "Name should be alpha-numeric. "
  })
  @IsOptional()
  name: string

  @IsBoolean()
  @IsOptional()
  sold: boolean

  @IsBoolean()
  @IsOptional()
  depreciated: boolean
}