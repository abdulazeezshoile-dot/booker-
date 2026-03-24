import { IsString, MinLength } from 'class-validator';

export class VerifyPaymentDto {
  @IsString()
  @MinLength(6)
  reference: string;
}
