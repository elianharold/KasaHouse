import { Injectable, NotFoundException } from '@nestjs/common';
import type { PublicUserProfile, User, UserRole } from '@kasahouse/shared-types';
import { DomainException } from '../../common/errors/domain.exception';
import { normalizeEmail } from '../../common/utils/email';
import { UsersRepository } from './users.repository';
import { toPublicUserProfile, toUser } from './user.mapper';

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  async getMe(userId: string): Promise<User> {
    const row = await this.repo.findById(userId);
    if (!row) throw new NotFoundException('Account not found');
    return toUser(row);
  }

  async updateMe(
    userId: string,
    patch: { fullName?: string; addRole?: UserRole; email?: string },
  ): Promise<User> {
    const current = await this.repo.findById(userId);
    if (!current) throw new NotFoundException('Account not found');

    const data: { fullName?: string; roles?: UserRole[]; email?: string } = {};
    if (patch.fullName !== undefined) data.fullName = patch.fullName.trim();

    if (patch.addRole && !current.roles.includes(patch.addRole)) {
      data.roles = [...(current.roles as UserRole[]), patch.addRole];
    }

    if (patch.email !== undefined) {
      const email = normalizeEmail(patch.email);
      if (email !== current.email) {
        const taken = await this.repo.findByEmail(email);
        if (taken && taken.id !== userId) {
          throw new DomainException(
            'EMAIL_TAKEN',
            'That email is already linked to another account.',
          );
        }
        data.email = email;
      }
    }

    if (Object.keys(data).length === 0) return toUser(current);

    const updated = await this.repo.update(userId, data);
    return toUser(updated);
  }

  async getPublicProfile(userId: string): Promise<PublicUserProfile> {
    const row = await this.repo.findPublicById(userId);
    if (!row) {
      throw new DomainException('USER_NOT_FOUND', 'That person is no longer on KasaHouse.');
    }
    return toPublicUserProfile(row);
  }
}
