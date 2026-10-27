import type { Visit, VisitStatus } from '@prisma/client';

import { prisma } from '../../database/prisma.service';
import { HttpError } from '../../shared/errors/http-error';
import type { CreateVisitDto, UpdateVisitDto } from './dto/visit.dto';

type VisitWithPreparationNotes = Visit & {
  preparationNotes: string | null;
};

export interface VisitResponse {
  id: string;
  title: string;
  specialist: string | null;
  date: string;
  time: string | null;
  location: string | null;
  notes: string | null;
  preparationNotes: string | null;
  status: VisitStatus;
  createdAt: string;
  updatedAt: string;
}

interface VisitCreateData {
  title: string;
  doctorName?: string | null;
  clinic?: string | null;
  visitDate: Date;
  notes?: string | null;
  preparationNotes?: string | null;
  status: VisitStatus;
}

interface VisitUpdateData {
  title?: string;
  doctorName?: string | null;
  clinic?: string | null;
  visitDate?: Date;
  notes?: string | null;
  preparationNotes?: string | null;
  status?: VisitStatus;
}

const DEFAULT_TIME = '00:00';

const toDateString = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

const toTimeString = (date: Date): string | null => {
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();

  if (hours === 0 && minutes === 0) {
    return null;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const buildVisitDate = (date: string, time?: string | null): Date => {
  return new Date(`${date}T${time ?? DEFAULT_TIME}:00.000Z`);
};

const toResponse = (visit: Visit): VisitResponse => {
  const visitWithPreparationNotes = visit as VisitWithPreparationNotes;

  return {
    id: visit.id,
    title: visit.title,
    specialist: visit.doctorName,
    date: toDateString(visit.visitDate),
    time: toTimeString(visit.visitDate),
    location: visit.clinic,
    notes: visit.notes,
    preparationNotes: visitWithPreparationNotes.preparationNotes,
    status: visit.status,
    createdAt: visit.createdAt.toISOString(),
    updatedAt: visit.updatedAt.toISOString(),
  };
};

const buildCreateData = (dto: CreateVisitDto): VisitCreateData => {
  return {
    title: dto.title,
    doctorName: dto.specialist,
    clinic: dto.location,
    visitDate: buildVisitDate(dto.date, dto.time),
    notes: dto.notes,
    preparationNotes: dto.preparationNotes,
    status: dto.status,
  };
};

const buildUpdateData = (existingVisit: Visit, dto: UpdateVisitDto): VisitUpdateData => {
  const currentDate = toDateString(existingVisit.visitDate);
  const currentTime = toTimeString(existingVisit.visitDate);
  const shouldUpdateVisitDate = dto.date !== undefined || dto.time !== undefined;

  return {
    ...(dto.title !== undefined ? { title: dto.title } : {}),
    ...(dto.specialist !== undefined ? { doctorName: dto.specialist } : {}),
    ...(dto.location !== undefined ? { clinic: dto.location } : {}),
    ...(shouldUpdateVisitDate
      ? {
          visitDate: buildVisitDate(
            dto.date ?? currentDate,
            dto.time === undefined ? currentTime : dto.time,
          ),
        }
      : {}),
    ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
    ...(dto.preparationNotes !== undefined ? { preparationNotes: dto.preparationNotes } : {}),
    ...(dto.status !== undefined ? { status: dto.status } : {}),
  };
};

const findOwnedVisit = async (userId: string, visitId: string): Promise<Visit> => {
  const visit = await prisma.visit.findFirst({
    where: {
      id: visitId,
      userId,
    },
  });

  if (!visit) {
    throw new HttpError(404, 'Visit was not found');
  }

  return visit;
};

export const getVisits = async (userId: string): Promise<VisitResponse[]> => {
  const visits = await prisma.visit.findMany({
    where: { userId },
    orderBy: {
      visitDate: 'asc',
    },
  });

  return visits.map(toResponse);
};

export const getUpcomingVisits = async (userId: string): Promise<VisitResponse[]> => {
  const visits = await prisma.visit.findMany({
    where: {
      userId,
      status: 'PLANNED',
      visitDate: {
        gte: new Date(),
      },
    },
    orderBy: {
      visitDate: 'asc',
    },
  });

  return visits.map(toResponse);
};

export const getVisit = async (userId: string, visitId: string): Promise<VisitResponse> => {
  const visit = await findOwnedVisit(userId, visitId);

  return toResponse(visit);
};

export const createVisit = async (
  userId: string,
  dto: CreateVisitDto,
): Promise<VisitResponse> => {
  const visit = await prisma.visit.create({
    data: {
      userId,
      ...buildCreateData(dto),
    },
  });

  return toResponse(visit);
};

export const updateVisit = async (
  userId: string,
  visitId: string,
  dto: UpdateVisitDto,
): Promise<VisitResponse> => {
  const existingVisit = await findOwnedVisit(userId, visitId);

  const visit = await prisma.visit.update({
    where: { id: visitId },
    data: buildUpdateData(existingVisit, dto),
  });

  return toResponse(visit);
};

export const deleteVisit = async (userId: string, visitId: string): Promise<void> => {
  await findOwnedVisit(userId, visitId);

  await prisma.visit.delete({
    where: { id: visitId },
  });
};
