import { randomBytes } from 'node:crypto';

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';

const SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    const user = this.usersRepository.create({
      ...data,
      password: hashedPassword,
    });
    return this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'password',
        'isEmailVerified',
        'isActive',
        'avatarUrl',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async createFromOidc(data: {
    firstName: string;
    lastName: string;
    email: string;
  }): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const randomPassword = randomBytes(32).toString('base64url');
    const hashedPassword = await bcrypt.hash(randomPassword, SALT_ROUNDS);
    const user = this.usersRepository.create({
      ...data,
      password: hashedPassword,
      isEmailVerified: true,
    });
    return this.usersRepository.save(user);
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.usersRepository.update(
      { id: userId },
      { isEmailVerified: true },
    );
  }
}
