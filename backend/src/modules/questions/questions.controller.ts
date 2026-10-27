import { Request, Router } from 'express';

import { HttpError } from '../../shared/errors/http-error';
import { asyncHandler } from '../../shared/http/async-handler';
import { AuthenticatedRequest, jwtGuard } from '../auth/jwt.guard';
import {
  parseCreateDoctorQuestionDto,
  parseUpdateDoctorQuestionDto,
} from './dto/doctor-question.dto';
import {
  createDoctorQuestion,
  deleteDoctorQuestion,
  getDoctorQuestion,
  getDoctorQuestions,
  updateDoctorQuestion,
} from './questions.service';

const getAuthenticatedUserId = (request: Request): string => {
  const user = (request as Partial<AuthenticatedRequest>).user;

  if (!user) {
    throw new HttpError(401, 'Invalid or missing token');
  }

  return user.id;
};

const getRouteId = (request: Request): string => {
  const id = request.params.id;

  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new HttpError(400, 'Doctor question id is required');
  }

  return id;
};

export const createQuestionsRouter = (): Router => {
  const router = Router();

  router.get(
    '/',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      const questions = await getDoctorQuestions(userId);

      response.json({ questions });
    }),
  );

  router.get(
    '/:id',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      const question = await getDoctorQuestion(userId, getRouteId(request));

      response.json({ question });
    }),
  );

  router.post(
    '/',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      const dto = parseCreateDoctorQuestionDto(request.body);
      const question = await createDoctorQuestion(userId, dto);

      response.status(201).json({ question });
    }),
  );

  router.patch(
    '/:id',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);
      const dto = parseUpdateDoctorQuestionDto(request.body);
      const question = await updateDoctorQuestion(userId, getRouteId(request), dto);

      response.json({ question });
    }),
  );

  router.delete(
    '/:id',
    jwtGuard,
    asyncHandler(async (request, response) => {
      const userId = getAuthenticatedUserId(request);

      await deleteDoctorQuestion(userId, getRouteId(request));
      response.status(204).send();
    }),
  );

  return router;
};
