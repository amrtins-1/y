import { IsEmail, IsNotEmpty } from 'class-validator';

export class EmailVerificationRequest {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
