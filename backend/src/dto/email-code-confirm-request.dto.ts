import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class EmailCodeConfirmRequest {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  @Matches(/^\d{6}$/)
  code!: string;
}
