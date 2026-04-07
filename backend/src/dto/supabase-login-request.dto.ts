import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SupabaseLoginRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  accessToken!: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
