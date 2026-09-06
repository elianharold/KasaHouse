import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import type { PublicUserProfile, User } from '@kasahouse/shared-types';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { Public } from '../../common/auth/public.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  getMe(@CurrentUser('id') userId: string): Promise<User> {
    return this.users.getMe(userId);
  }

  @Patch('me')
  updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<User> {
    return this.users.updateMe(userId, dto);
  }

  @Public()
  @Get(':id/public')
  getPublicProfile(@Param('id') id: string): Promise<PublicUserProfile> {
    return this.users.getPublicProfile(id);
  }
}
