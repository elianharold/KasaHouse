import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import {
  ListingPurpose,
  PropertyType,
  type BrowseListingsQuery,
} from '@kasahouse/shared-types';

export class BrowseListingsQueryDto implements BrowseListingsQuery {
  @IsOptional() @IsEnum(ListingPurpose) purpose?: ListingPurpose;
  @IsOptional() @IsEnum(PropertyType) propertyType?: PropertyType;

  @IsOptional() @IsString() @Length(1, 60) city?: string;
  @IsOptional() @IsString() @Length(1, 80) area?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) minPrice?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) maxPrice?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) minBedrooms?: number;

  @IsOptional() @IsString() @Length(1, 120) q?: string;

  @IsOptional()
  @IsIn(['newest', 'price_asc', 'price_desc'])
  sort?: 'newest' | 'price_asc' | 'price_desc';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) pageSize?: number;
}
