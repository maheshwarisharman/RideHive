import { authService } from '../authService';
import { supabase } from '../../../lib/supabase';

describe('authService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithCredentials', () => {
    it('signs in user when password is correct', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { session: { user: { id: 'user-1', email: 'test@bmu.edu.in' } } },
        error: null,
      });

      const res = await authService.signInWithCredentials(
        'test@bmu.edu.in',
        'validpassword123'
      );

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@bmu.edu.in',
        password: 'validpassword123',
      });
      expect(res.session).toBeDefined();
      expect(res.error).toBeNull();
    });

    it('falls back to signUp if user does not exist', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Invalid login credentials' },
      });

      (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
        data: { session: { user: { id: 'new-user', email: 'new@bmu.edu.in' } } },
        error: null,
      });

      const res = await authService.signInWithCredentials(
        'new@bmu.edu.in',
        'validpassword123'
      );

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@bmu.edu.in',
        password: 'validpassword123',
      });
      expect(res.session).toBeDefined();
      expect(res.error).toBeNull();
    });
  });

  describe('sendOtp and verifyOtp', () => {
    it('invokes signInWithOtp', async () => {
      (supabase.auth.signInWithOtp as jest.Mock).mockResolvedValueOnce({
        data: {},
        error: null,
      });

      const res = await authService.sendOtp('student@bmu.edu.in');
      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'student@bmu.edu.in',
        options: { shouldCreateUser: true },
      });
      expect(res.error).toBeNull();
    });
  });
});
