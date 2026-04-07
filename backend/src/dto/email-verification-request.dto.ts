import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class EmailVerificationRequest {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(180)
  email!: string;
}
