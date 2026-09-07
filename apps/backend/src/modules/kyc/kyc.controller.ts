import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import type { KycStatusResponse, SubmitKycResult } from '@kasahouse/shared-types';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { Public } from '../../common/auth/public.decorator';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { KycService } from './kyc.service';

@Controller('kyc')
export class KycController {
  constructor(private readonly kyc: KycService) {}

  @Get('status')
  getStatus(@CurrentUser('id') userId: string): Promise<KycStatusResponse> {
    return this.kyc.getStatus(userId);
  }

  @Post('submit')
  submit(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitKycDto,
  ): Promise<SubmitKycResult> {
    return this.kyc.submit(userId, dto);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string | undefined>,
  ): Promise<{ received: true }> {
    const raw = req.rawBody?.toString('utf8') ?? JSON.stringify(req.body ?? {});
    await this.kyc.handleWebhook(headers, raw);
    return { received: true };
  }
}
