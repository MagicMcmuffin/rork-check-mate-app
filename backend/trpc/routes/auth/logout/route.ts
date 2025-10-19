import { publicProcedure } from '../../../create-context';
import { clearAuthCookie } from '../../../../lib/auth';

export const logoutProcedure = publicProcedure.mutation(async () => {
  const cookie = clearAuthCookie();

  return {
    success: true,
    cookie,
  };
});

export default logoutProcedure;
