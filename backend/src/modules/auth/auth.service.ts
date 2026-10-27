import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

import { getEnv } from '../../config/env';
import { HttpError } from '../../shared/errors/http-error';
import { createUser, findUserByEmail } from '../users/users.service';
import { toPublicUser } from '../users/users.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse, JwtPayload } from './auth.types';

const PASSWORD_SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRES_IN: SignOptions['expiresIn'] = '15m';

const signAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, getEnv('JWT_ACCESS_SECRET'), {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
};

export const registerUser = async (dto: RegisterDto): Promise<AuthResponse> => {
  const existingUser = await findUserByEmail(dto.email);

  if (existingUser) {
    throw new HttpError(409, 'Email is already registered');
  }

  const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);
  const user = await createUser({
    email: dto.email,
    passwordHash,
    ...(dto.name ? { name: dto.name } : {}),
  });

  return {
    user,
    tokens: {
      accessToken: signAccessToken({ sub: user.id, email: user.email }),
    },
  };
};

export const loginUser = async (dto: LoginDto): Promise<AuthResponse> => {
  const user = await findUserByEmail(dto.email);

  if (!user) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const publicUser = toPublicUser(user);

  return {
    user: publicUser,
    tokens: {
      accessToken: signAccessToken({ sub: publicUser.id, email: publicUser.email }),
    },
  };
};
