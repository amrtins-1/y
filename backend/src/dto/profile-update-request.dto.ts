import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class ProfileUpdateRequest {
  @IsNotEmpty()
  fullName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  cpf?: string;

  @IsNotEmpty()
  currentPassword!: string;

  @IsOptional()
  newPassword?: string;
}
