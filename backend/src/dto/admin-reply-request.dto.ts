import { TicketStatus } from '../entities/enums';

export class AdminReplyRequest {
  subject?: string;
  message!: string;
  status?: TicketStatus;
}
