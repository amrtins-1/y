import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, UsePipes } from '@nestjs/common';
import { AdminReplyRequest } from '../dto/admin-reply-request.dto';
import { AdminInboxService } from '../services/admin-inbox.service';
import { STRICT_BODY_VALIDATION_PIPE } from '../validation/strict-body-validation.pipe';
import { UpdateTicketStatusRequest } from '../dto/update-ticket-status-request.dto';

@Controller('api/admin/inbox')
export class AdminInboxController {
  constructor(private readonly adminInboxService: AdminInboxService) {}

  @Get()
  getSummary() {
    return this.adminInboxService.getInboxSummary();
  }

  @Post('contact-messages/:id/reply')
  @UsePipes(STRICT_BODY_VALIDATION_PIPE)
  replyToContactMessage(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() body: AdminReplyRequest) {
    return this.adminInboxService.replyToContactMessage(id, body);
  }

  @Post('consultancy-requests/:id/reply')
  @UsePipes(STRICT_BODY_VALIDATION_PIPE)
  replyToConsultancyRequest(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() body: AdminReplyRequest) {
    return this.adminInboxService.replyToConsultancyRequest(id, body);
  }

  @Put('contact-messages/:id/status')
  @UsePipes(STRICT_BODY_VALIDATION_PIPE)
  updateContactStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateTicketStatusRequest,
  ) {
    return this.adminInboxService.updateContactStatus(id, body.status);
  }

  @Put('consultancy-requests/:id/status')
  @UsePipes(STRICT_BODY_VALIDATION_PIPE)
  updateConsultancyStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateTicketStatusRequest,
  ) {
    return this.adminInboxService.updateConsultancyStatus(id, body.status);
  }
}
