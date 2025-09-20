
import { IsBoolean, IsIn,  IsOptional, IsPositive, IsString, Matches, Max, Min, matches } from "class-validator"


export class CurrentAssetsFilters {

  @IsString()
  @IsOptional()
  id: string

  @IsString()
  @Matches(/[a-zA-Z0-9\s]{1,100}/g, {
    message: "Name should be alpha-numeric. "
  })
  @IsOptional()
  name: string

}