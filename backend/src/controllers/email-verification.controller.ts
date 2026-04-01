import { Body, Controller, Get, HttpCode, Post, Query, Redirect } from '@nestjs/common';
import { EmailVerificationService } from '../services/email-verification.service';
import { EmailVerificationRequest } from '../dto/email-verification-request.dto';
import { EmailCodeConfirmRequest } from '../dto/email-code-confirm-request.dto';

@Controller('api/email-verification')
export class EmailVerificationController {
  constructor(private readonly emailVerificationService: EmailVerificationService) {}

  @Post('request')
  @HttpCode(204)
  async request(@Body() request: EmailVerificationRequest): Promise<void> {
    await this.emailVerificationService.requestVerification(request.email);
  }

  @Get('confirm')
  @Redirect('', 302)
  async confirm(@Query('token') token: string) {
    const confirmed = await this.emailVerificationService.confirmByToken(token);
    const base = (process.env.APP_FRONTEND_BASE_URL || 'http://localhost:4321').replace(/\/$/, '');
    const redirectUrl = confirmed ? `${base}/login?emailConfirmed=1` : `${base}/login?emailConfirmed=0`;
    return { url: redirectUrl };
  }

  @Post('confirm-code')
  async confirmCode(@Body() request: EmailCodeConfirmRequest) {
    const confirmed = await this.emailVerificationService.confirmByCode(request.email, request.code);
    if (!confirmed) {
      throw new Error('Codigo invalido ou expirado.');
    }
    return { confirmed: true, message: 'E-mail confirmado com sucesso.' };
  }

  @Get('status')
  status() {
    return { message: 'Email verification endpoint active' };
  }
}
