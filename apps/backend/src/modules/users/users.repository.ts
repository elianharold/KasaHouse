import { Injectable } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findPublicById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, fullName: true, roles: true, createdAt: true, kycStatus: true },
    });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  /** Cascades to the user's listings, media rows, refresh tokens; nulls OTP links. */
  delete(id: string): Promise<User> {
    return this.prisma.user.delete({ where: { id } });
  }
}
