import type { DoctorQuestion, DoctorQuestionStatus } from '@prisma/client';

import { prisma } from '../../database/prisma.service';
import { HttpError } from '../../shared/errors/http-error';
import type { CreateDoctorQuestionDto, UpdateDoctorQuestionDto } from './dto/doctor-question.dto';

type DoctorQuestionWithVisitId = DoctorQuestion & {
  visitId: string | null;
};

export interface DoctorQuestionResponse {
  id: string;
  question: string;
  answer: string | null;
  status: DoctorQuestionStatus;
  visitId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DoctorQuestionCreateData {
  question: string;
  answer?: string | null;
  status: DoctorQuestionStatus;
  visitId?: string | null;
}

interface DoctorQuestionUpdateData {
  question?: string;
  answer?: string | null;
  status?: DoctorQuestionStatus;
  visitId?: string | null;
}

const toResponse = (doctorQuestion: DoctorQuestion): DoctorQuestionResponse => {
  const questionWithVisitId = doctorQuestion as DoctorQuestionWithVisitId;

  return {
    id: doctorQuestion.id,
    question: doctorQuestion.question,
    answer: doctorQuestion.answer,
    status: doctorQuestion.status,
    visitId: questionWithVisitId.visitId,
    createdAt: doctorQuestion.createdAt.toISOString(),
    updatedAt: doctorQuestion.updatedAt.toISOString(),
  };
};

const ensureOwnedVisitExists = async (userId: string, visitId: string): Promise<void> => {
  const visit = await prisma.visit.findFirst({
    where: {
      id: visitId,
      userId,
    },
  });

  if (!visit) {
    throw new HttpError(404, 'Visit was not found');
  }
};

const buildCreateData = async (
  userId: string,
  dto: CreateDoctorQuestionDto,
): Promise<DoctorQuestionCreateData> => {
  if (dto.visitId) {
    await ensureOwnedVisitExists(userId, dto.visitId);
  }

  return {
    question: dto.question,
    answer: dto.answer,
    status: dto.status,
    visitId: dto.visitId,
  };
};

const buildUpdateData = async (
  userId: string,
  dto: UpdateDoctorQuestionDto,
): Promise<DoctorQuestionUpdateData> => {
  if (dto.visitId) {
    await ensureOwnedVisitExists(userId, dto.visitId);
  }

  return {
    ...(dto.question !== undefined ? { question: dto.question } : {}),
    ...(dto.answer !== undefined ? { answer: dto.answer } : {}),
    ...(dto.status !== undefined ? { status: dto.status } : {}),
    ...(dto.visitId !== undefined ? { visitId: dto.visitId } : {}),
  };
};

const findOwnedDoctorQuestion = async (
  userId: string,
  doctorQuestionId: string,
): Promise<DoctorQuestion> => {
  const doctorQuestion = await prisma.doctorQuestion.findFirst({
    where: {
      id: doctorQuestionId,
      userId,
    },
  });

  if (!doctorQuestion) {
    throw new HttpError(404, 'Doctor question was not found');
  }

  return doctorQuestion;
};

export const getDoctorQuestions = async (userId: string): Promise<DoctorQuestionResponse[]> => {
  const doctorQuestions = await prisma.doctorQuestion.findMany({
    where: { userId },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return doctorQuestions.map(toResponse);
};

export const getDoctorQuestion = async (
  userId: string,
  doctorQuestionId: string,
): Promise<DoctorQuestionResponse> => {
  const doctorQuestion = await findOwnedDoctorQuestion(userId, doctorQuestionId);

  return toResponse(doctorQuestion);
};

export const createDoctorQuestion = async (
  userId: string,
  dto: CreateDoctorQuestionDto,
): Promise<DoctorQuestionResponse> => {
  const data = await buildCreateData(userId, dto);
  const doctorQuestion = await prisma.doctorQuestion.create({
    data: {
      userId,
      ...data,
    },
  });

  return toResponse(doctorQuestion);
};

export const updateDoctorQuestion = async (
  userId: string,
  doctorQuestionId: string,
  dto: UpdateDoctorQuestionDto,
): Promise<DoctorQuestionResponse> => {
  await findOwnedDoctorQuestion(userId, doctorQuestionId);

  const doctorQuestion = await prisma.doctorQuestion.update({
    where: { id: doctorQuestionId },
    data: await buildUpdateData(userId, dto),
  });

  return toResponse(doctorQuestion);
};

export const deleteDoctorQuestion = async (
  userId: string,
  doctorQuestionId: string,
): Promise<void> => {
  await findOwnedDoctorQuestion(userId, doctorQuestionId);

  await prisma.doctorQuestion.delete({
    where: { id: doctorQuestionId },
  });
};
