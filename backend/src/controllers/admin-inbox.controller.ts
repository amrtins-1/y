import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { AdminReplyRequest } from '../dto/admin-reply-request.dto';
import { TicketStatus } from '../entities/enums';
import { AdminInboxService } from '../services/admin-inbox.service';

@Controller('api/admin/inbox')
export class AdminInboxController {
  constructor(private readonly adminInboxService: AdminInboxService) {}

  @Get()
  getSummary() {
    return this.adminInboxService.getInboxSummary();
  }

  @Post('contact-messages/:id/reply')
  replyToContactMessage(@Param('id') id: string, @Body() body: AdminReplyRequest) {
    return this.adminInboxService.replyToContactMessage(id, body);
  }

  @Post('consultancy-requests/:id/reply')
  replyToConsultancyRequest(@Param('id') id: string, @Body() body: AdminReplyRequest) {
    return this.adminInboxService.replyToConsultancyRequest(id, body);
  }

  @Put('contact-messages/:id/status')
  updateContactStatus(@Param('id') id: string, @Body('status') status: TicketStatus) {
    return this.adminInboxService.updateContactStatus(id, status);
  }

  @Put('consultancy-requests/:id/status')
  updateConsultancyStatus(@Param('id') id: string, @Body('status') status: TicketStatus) {
    return this.adminInboxService.updateConsultancyStatus(id, status);
  }
}
