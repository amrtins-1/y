import { IsEnum } from 'class-validator';
import { TicketStatus } from '../entities/enums';

export class UpdateTicketStatusRequest {
  @IsEnum(TicketStatus)
  status!: TicketStatus;
}
