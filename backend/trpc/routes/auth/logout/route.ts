import { publicProcedure } from '../../../create-context.js';
import { clearAuthCookie } from '../../../../lib/auth.js';

export const logoutProcedure = publicProcedure.mutation(async () => {
  const cookie = clearAuthCookie();

  return {
    success: true,
    cookie,
  };
});

export default logoutProcedure;
