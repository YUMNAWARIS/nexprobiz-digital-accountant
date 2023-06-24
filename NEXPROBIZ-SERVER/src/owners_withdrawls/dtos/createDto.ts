import { IsNumber, IsString, Min } from "class-validator";

export class WithDrawlData{

  @IsString()
  account_name:string;

  @IsNumber()
  @Min(0.00)
  amount: number
}