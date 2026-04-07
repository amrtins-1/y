import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterRequest {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(180)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(/^[0-9()+\-\s]{10,40}$/)
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/)
  password!: string;
}
