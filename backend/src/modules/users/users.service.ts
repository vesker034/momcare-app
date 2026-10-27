import { prisma } from '../../database/prisma.service';
import { PublicUser, toPublicUser } from './users.types';

interface CreateUserInput {
  email: string;
  passwordHash: string;
  name?: string;
}

export const findUserByEmail = (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const findPublicUserById = async (id: string): Promise<PublicUser | null> => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  return user ? toPublicUser(user) : null;
};

export const createUser = async (input: CreateUserInput): Promise<PublicUser> => {
  const user = await prisma.user.create({
    data: input,
  });

  return toPublicUser(user);
};
import { Prisma } from '@prisma/client';
import { HttpError } from '../../shared/errors/http-error';

export const updateUserName = async (id: string, name: string): Promise<PublicUser> => {
  try {
    const user = await prisma.user.update({ where: { id }, data: { name } });
    return toPublicUser(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new HttpError(404, 'Пользователь не найден.');
    }
    throw error;
  }
};
