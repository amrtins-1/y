import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class RegisterRequest {
  @IsNotEmpty()
  fullName!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsOptional()
  phone?: string;

  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
