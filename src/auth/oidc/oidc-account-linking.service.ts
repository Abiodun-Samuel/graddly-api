import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserOidcIdentity } from '../../users/entities/user-oidc-identity.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { UsersService } from '../../users/users.service.js';

import { IOidcAuthProfile } from './interfaces/oidc-auth-profile.interface.js';

import type { OidcProvisioningMode } from './oidc-provisioning-mode.js';

const MAX_NAME_LENGTH = 100;

function truncateName(value: string): string {
  return value.trim().slice(0, MAX_NAME_LENGTH);
}

function capitalizeWord(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function deriveNamesFromProfile(profile: IOidcAuthProfile): {
  firstName: string;
  lastName: string;
} {
  if (profile.givenName && profile.familyName) {
    return {
      firstName: truncateName(profile.givenName),
      lastName: truncateName(profile.familyName),
    };
  }

  if (profile.givenName) {
    return {
      firstName: truncateName(profile.givenName),
      lastName: 'User',
    };
  }

  const email = profile.email ?? '';
  const localPart = email.split('@')[0] ?? 'user';
  const parts = localPart.split(/[._-]+/u).filter(Boolean);

  if (parts.length >= 2) {
    return {
      firstName: truncateName(capitalizeWord(parts[0])),
      lastName: truncateName(parts.slice(1).map(capitalizeWord).join(' ')),
    };
  }

  return {
    firstName: truncateName(capitalizeWord(parts[0] ?? 'User')),
    lastName: 'User',
  };
}

@Injectable()
export class OidcAccountLinkingService {
  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
    @InjectRepository(UserOidcIdentity)
    private readonly identitiesRepository: Repository<UserOidcIdentity>,
  ) {}

  async resolveUserForLogin(
    profile: IOidcAuthProfile,
    issuer: string,
  ): Promise<User> {
    const email = profile.email!;

    const existingBySub = await this.findUserByIssuerAndSubject(
      issuer,
      profile.sub,
    );
    if (existingBySub) {
      if (existingBySub.email !== email) {
        throw new ForbiddenException(
          'One Login identity does not match the linked account email',
        );
      }
      return existingBySub;
    }

    const userByEmail = await this.usersService.findByEmail(email);
    if (userByEmail) {
      const existingIdentity = await this.findIdentityByUserAndIssuer(
        userByEmail.id,
        issuer,
      );
      if (existingIdentity && existingIdentity.subject !== profile.sub) {
        throw new ForbiddenException(
          'This Graddly account is already linked to a different One Login identity',
        );
      }

      await this.linkIdentity(userByEmail.id, issuer, profile.sub);
      if (!userByEmail.isEmailVerified) {
        await this.usersService.markEmailVerified(userByEmail.id);
        userByEmail.isEmailVerified = true;
      }

      return userByEmail;
    }

    if (this.getProvisioningMode() === 'link_existing') {
      throw new ForbiddenException(
        'No linked account for this One Login identity. Contact your administrator or sign up with email and password.',
      );
    }

    const { firstName, lastName } = deriveNamesFromProfile(profile);
    const user = await this.usersService.createFromOidc({
      email,
      firstName,
      lastName,
    });
    await this.linkIdentity(user.id, issuer, profile.sub);
    return user;
  }

  private getProvisioningMode(): OidcProvisioningMode {
    return this.config.get<OidcProvisioningMode>(
      'app.oidc.provisioningMode',
      'auto_create',
    );
  }

  private async findUserByIssuerAndSubject(
    issuer: string,
    subject: string,
  ): Promise<User | null> {
    const identity = await this.identitiesRepository.findOne({
      where: { issuer, subject },
      relations: ['user'],
    });
    return identity?.user ?? null;
  }

  private async findIdentityByUserAndIssuer(
    userId: string,
    issuer: string,
  ): Promise<UserOidcIdentity | null> {
    return this.identitiesRepository.findOne({
      where: { userId, issuer },
    });
  }

  private async linkIdentity(
    userId: string,
    issuer: string,
    subject: string,
  ): Promise<UserOidcIdentity> {
    const identity = this.identitiesRepository.create({
      userId,
      issuer,
      subject,
      linkedAt: new Date(),
    });
    return this.identitiesRepository.save(identity);
  }
}
