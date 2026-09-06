import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  UserRole,
  type Listing,
  type ListingSummary,
  type PaginatedResult,
} from '@kasahouse/shared-types';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { Public } from '../../common/auth/public.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import { BrowseListingsQueryDto } from './dto/browse-listings.query.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { UpsertListingDto } from './dto/upsert-listing.dto';
import { ListingsService } from './listings.service';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Public()
  @Get()
  browse(
    @Query() query: BrowseListingsQueryDto,
  ): Promise<PaginatedResult<ListingSummary>> {
    return this.listings.browse(query);
  }

  @Get('mine')
  @Roles(UserRole.LANDLORD)
  listMine(
    @CurrentUser('id') ownerId: string,
    @Query() query: BrowseListingsQueryDto,
  ): Promise<PaginatedResult<ListingSummary>> {
    return this.listings.listMine(ownerId, query);
  }

  @Public()
  @Get(':id')
  getById(@Param('id') id: string): Promise<Listing> {
    return this.listings.getById(id);
  }

  @Post()
  @Roles(UserRole.LANDLORD)
  create(
    @CurrentUser('id') ownerId: string,
    @Body() dto: UpsertListingDto,
  ): Promise<Listing> {
    return this.listings.create(ownerId, dto);
  }

  @Put(':id')
  @Roles(UserRole.LANDLORD)
  update(
    @Param('id') id: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: UpsertListingDto,
  ): Promise<Listing> {
    return this.listings.update(id, ownerId, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.LANDLORD)
  changeStatus(
    @Param('id') id: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: ChangeStatusDto,
  ): Promise<Listing> {
    return this.listings.changeStatus(id, ownerId, dto.status);
  }

  @Delete(':id')
  @Roles(UserRole.LANDLORD)
  remove(
    @Param('id') id: string,
    @CurrentUser('id') ownerId: string,
  ): Promise<{ id: string }> {
    return this.listings.remove(id, ownerId);
  }
}
