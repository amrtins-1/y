import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ProfileUpdateRequest {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(120)
  fullName!: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  @MaxLength(180)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(/^[0-9()+\-\s]{10,40}$/)
  phone?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{11}$/)
  cpf?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  currentPassword!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/)
  newPassword?: string;
}
