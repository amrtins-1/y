import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TicketStatus } from '../entities/enums';

export class AdminReplyRequest {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  subject?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  message!: string;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}
