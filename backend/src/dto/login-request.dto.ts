import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class LoginRequest {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  password!: string;

  @IsOptional()
  rememberMe?: boolean;
}
