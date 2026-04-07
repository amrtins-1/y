import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class EmailCodeConfirmRequest {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(180)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/)
  code!: string;
}
