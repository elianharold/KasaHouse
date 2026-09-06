import { IsIn } from 'class-validator';
import type { ChangeListingStatusPayload } from '@kasahouse/shared-types';

export class ChangeStatusDto implements ChangeListingStatusPayload {
  @IsIn(['PUBLISHED', 'UNLISTED', 'DRAFT'])
  status!: 'PUBLISHED' | 'UNLISTED' | 'DRAFT';
}
