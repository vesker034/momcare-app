import type { ChecklistCategory, ChecklistItem, Prisma } from '@prisma/client';

import { prisma } from '../../database/prisma.service';
import { HttpError } from '../../shared/errors/http-error';

type ChecklistItemWithProgress = ChecklistItem & {
  userProgress: Array<{
    isCompleted: boolean;
  }>;
};

export interface ChecklistItemResponse {
  id: string;
  week: number;
  title: string;
  description: string | null;
  category: ChecklistCategory;
  sortOrder: number;
  isDefault: boolean;
  isOwnedByUser: boolean;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItemWriteInput {
  week: number;
  title: string;
  description?: string | null;
  category: ChecklistCategory;
}

const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 500;

const checklistCategoryValues = new Set<ChecklistCategory>([
  'DOCUMENTS',
  'HEALTH',
  'DOCTOR',
  'HOSPITAL_BAG',
  'BABY',
  'OTHER',
]);

const toResponse = (
  item: ChecklistItemWithProgress,
  userId: string,
): ChecklistItemResponse => {
  return {
    id: item.id,
    week: item.week,
    title: item.title,
    description: item.description,
    category: item.category,
    sortOrder: item.sortOrder,
    isDefault: item.isDefault,
    isOwnedByUser: item.ownerUserId === userId,
    isCompleted: item.userProgress[0]?.isCompleted ?? false,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
};

const assertWeek = (week: number): void => {
  if (!Number.isInteger(week) || week < 1 || week > 42) {
    throw new HttpError(400, 'week must be an integer from 1 to 42');
  }
};

const normalizeTitle = (value: unknown): string => {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'title must be a string');
  }

  const title = value.trim();

  if (title.length === 0) {
    throw new HttpError(400, 'title must not be empty');
  }

  if (title.length > TITLE_MAX_LENGTH) {
    throw new HttpError(400, `title must be at most ${TITLE_MAX_LENGTH} characters`);
  }

  return title;
};

const normalizeDescription = (value: unknown): string | null => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, 'description must be a string');
  }

  const description = value.trim();

  if (description.length === 0) {
    return null;
  }

  if (description.length > DESCRIPTION_MAX_LENGTH) {
    throw new HttpError(
      400,
      `description must be at most ${DESCRIPTION_MAX_LENGTH} characters`,
    );
  }

  return description;
};

export const parseChecklistCategory = (value: unknown): ChecklistCategory => {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'category must be a string');
  }

  const category = value.trim().toUpperCase() as ChecklistCategory;

  if (!checklistCategoryValues.has(category)) {
    throw new HttpError(
      400,
      `category must be one of: ${[...checklistCategoryValues].join(', ')}`,
    );
  }

  return category;
};

export const parseChecklistWriteInput = (body: unknown): ChecklistItemWriteInput => {
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'Request body must be an object');
  }

  const payload = body as Record<string, unknown>;
  const week = Number(payload.week);
  assertWeek(week);

  return {
    week,
    title: normalizeTitle(payload.title),
    description: normalizeDescription(payload.description),
    category: parseChecklistCategory(payload.category),
  };
};

export const getChecklistItemsByWeek = async (
  userId: string,
  week: number,
): Promise<ChecklistItemResponse[]> => {
  assertWeek(week);

  const items = await prisma.checklistItem.findMany({
    where: {
      week,
      OR: [{ isDefault: true, ownerUserId: null }, { ownerUserId: userId }],
    },
    include: {
      userProgress: {
        where: { userId },
        select: { isCompleted: true },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  return items.map((item) => toResponse(item as ChecklistItemWithProgress, userId));
};

const getOwnedItemOrThrow = async (userId: string, checklistItemId: string) => {
  const item = await prisma.checklistItem.findUnique({
    where: { id: checklistItemId },
  });

  if (!item) {
    throw new HttpError(404, 'Checklist item was not found');
  }

  if (item.isDefault || item.ownerUserId !== userId) {
    throw new HttpError(403, 'Only personal checklist items can be changed');
  }

  return item;
};

export const createPersonalChecklistItem = async (
  userId: string,
  input: ChecklistItemWriteInput,
): Promise<ChecklistItemResponse> => {
  const created = await prisma.checklistItem.create({
    data: {
      week: input.week,
      title: input.title,
      description: input.description,
      category: input.category,
      sortOrder: 1000,
      isDefault: false,
      ownerUserId: userId,
    },
    include: {
      userProgress: {
        where: { userId },
        select: { isCompleted: true },
      },
    },
  });

  return toResponse(created as ChecklistItemWithProgress, userId);
};

export const updatePersonalChecklistItem = async (
  userId: string,
  checklistItemId: string,
  input: ChecklistItemWriteInput,
): Promise<ChecklistItemResponse> => {
  await getOwnedItemOrThrow(userId, checklistItemId);

  const updated = await prisma.checklistItem.update({
    where: { id: checklistItemId },
    data: {
      week: input.week,
      title: input.title,
      description: input.description,
      category: input.category,
    } satisfies Prisma.ChecklistItemUpdateInput,
    include: {
      userProgress: {
        where: { userId },
        select: { isCompleted: true },
      },
    },
  });

  return toResponse(updated as ChecklistItemWithProgress, userId);
};

export const deletePersonalChecklistItem = async (
  userId: string,
  checklistItemId: string,
): Promise<void> => {
  await getOwnedItemOrThrow(userId, checklistItemId);

  await prisma.checklistItem.delete({
    where: { id: checklistItemId },
  });
};

export const toggleChecklistItem = async (
  userId: string,
  checklistItemId: string,
): Promise<ChecklistItemResponse> => {
  const item = await prisma.checklistItem.findFirst({
    where: {
      id: checklistItemId,
      OR: [{ isDefault: true, ownerUserId: null }, { ownerUserId: userId }],
    },
  });

  if (!item) {
    throw new HttpError(404, 'Checklist item was not found');
  }

  const existingProgress = await prisma.userChecklistProgress.findUnique({
    where: {
      userId_checklistItemId: {
        userId,
        checklistItemId,
      },
    },
  });

  await prisma.userChecklistProgress.upsert({
    where: {
      userId_checklistItemId: {
        userId,
        checklistItemId,
      },
    },
    create: {
      userId,
      checklistItemId,
      isCompleted: true,
    },
    update: {
      isCompleted: !(existingProgress?.isCompleted ?? false),
    },
  });

  const updatedItem = await prisma.checklistItem.findUnique({
    where: { id: checklistItemId },
    include: {
      userProgress: {
        where: { userId },
        select: { isCompleted: true },
      },
    },
  });

  if (!updatedItem) {
    throw new HttpError(404, 'Checklist item was not found');
  }

  return toResponse(updatedItem as ChecklistItemWithProgress, userId);
};
