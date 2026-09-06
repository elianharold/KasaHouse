import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * A business-rule failure with a stable machine code the mobile app switches on
 * (e.g. "OTP_EXPIRED", "KYC_REQUIRED"). Extends HttpException so Nest routing
 * and the global filter handle it uniformly.
 */
export class DomainException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly meta?: Record<string, unknown>,
  ) {
    super({ code, message, meta }, status);
  }
}
