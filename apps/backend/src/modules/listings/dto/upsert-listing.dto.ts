import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  ListingPurpose,
  PropertyType,
  RentPeriod,
  type ListingAddOn,
  type ListingLocation,
  type UpsertListingPayload,
} from '@kasahouse/shared-types';

class ListingLocationDto implements ListingLocation {
  @IsString() @Length(2, 60) region!: string;
  @IsString() @Length(2, 60) city!: string;
  @IsString() @Length(2, 80) area!: string;

  @IsOptional() @IsString() @Length(0, 120) landmark?: string | null;
  @IsOptional() @IsNumber() @Min(-90) @Max(90) latitude?: number | null;
  @IsOptional() @IsNumber() @Min(-180) @Max(180) longitude?: number | null;
}

class ListingAddOnDto implements ListingAddOn {
  @IsString() @Length(1, 60) label!: string;

  @IsOptional() @IsInt() @Min(0) @Max(100_000_000) price!: number | null;
}

export class UpsertListingDto implements UpsertListingPayload {
  @IsEnum(ListingPurpose) purpose!: ListingPurpose;
  @IsEnum(PropertyType) propertyType!: PropertyType;

  @IsString() @Length(6, 120) title!: string;
  @IsString() @Length(20, 4000) description!: string;

  @IsNumber() @Min(1) @Max(1_000_000) priceCedis!: number;

  @IsOptional() @IsEnum(RentPeriod) rentPeriod?: RentPeriod | null;

  @IsOptional() @IsInt() @Min(0) @Max(24) advanceMonths?: number | null;
  @IsOptional() @IsInt() @Min(0) @Max(50) bedrooms?: number | null;
  @IsOptional() @IsInt() @Min(0) @Max(50) bathrooms?: number | null;

  @ValidateNested()
  @Type(() => ListingLocationDto)
  location!: ListingLocationDto;

  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @Length(1, 200, { each: true })
  requirements!: string[];

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ListingAddOnDto)
  addOns!: ListingAddOnDto[];
}
