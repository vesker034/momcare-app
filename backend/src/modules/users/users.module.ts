import { Express, Router } from 'express';
import { asyncHandler } from '../../shared/http/async-handler';
import { AuthenticatedRequest, jwtGuard } from '../auth/jwt.guard';
import { parseUpdateUserDto } from './dto/update-user.dto';
import { updateUserName } from './users.service';

export const registerUsersModule = (app: Express): void => {
  const router = Router();
  router.patch('/me', jwtGuard, asyncHandler(async (request, response) => {
    const { name } = parseUpdateUserDto(request.body);
    const user = await updateUserName((request as AuthenticatedRequest).user.id, name);
    response.json({ user });
  }));
  app.use('/users', router);
};
