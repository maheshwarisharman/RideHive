import { supabase } from '../../lib/supabase';
import { useAuthStore, ProfileData, PrivateProfileData } from './authStore';

export const authService = {
  /**
   * Request 6-digit email OTP from Supabase Auth
   */
  async sendOtp(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) return { error };
      useAuthStore.getState().setPendingEmail(email.trim().toLowerCase());
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  },

  /**
   * Verify the 6-digit OTP code
   */
  async verifyOtp(email: string, token: string): Promise<{ error: Error | null; session: any }> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        type: 'email',
      });

      if (error) return { error, session: null };

      if (data.session) {
        useAuthStore.getState().setSession(data.session);
        await authService.fetchProfiles(data.session.user.id);
      }

      return { error: null, session: data.session };
    } catch (err: any) {
      return { error: err, session: null };
    }
  },

  /**
   * Fetch user public and private profile data
   */
  async fetchProfiles(userId: string): Promise<void> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        const mapped: ProfileData = {
          id: (profile as any).id,
          fullName: (profile as any).full_name,
          avatarUrl: (profile as any).avatar_url,
          rideCount: (profile as any).ride_count || 0,
          ratingAvg: Number((profile as any).rating_avg) || 5.0,
          ratingCount: (profile as any).rating_count || 0,
        };
        useAuthStore.getState().setProfile(mapped);
      }

      const { data: privateProfile } = await supabase
        .from('profile_private')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (privateProfile) {
        const mappedPrivate: PrivateProfileData = {
          phone: (privateProfile as any).phone,
          upiId: (privateProfile as any).upi_id,
          lateCancellations: (privateProfile as any).late_cancellations || 0,
        };
        useAuthStore.getState().setPrivateProfile(mappedPrivate);
      }
    } catch (err) {
      // Profile fetch can fail silently or log in dev
    }
  },

  /**
   * Complete user onboarding profile
   */
  async completeOnboarding(
    userId: string,
    fullName: string,
    avatarUrl?: string | null,
    phone?: string | null,
    upiId?: string | null
  ): Promise<{ error: Error | null }> {
    try {
      const { error: profileError } = await (supabase.from('profiles') as any).upsert({
        id: userId,
        full_name: fullName.trim(),
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      });

      if (profileError) return { error: profileError };

      const { error: privateError } = await (supabase.from('profile_private') as any).upsert({
        user_id: userId,
        phone: phone ? phone.trim() : null,
        upi_id: upiId ? upiId.trim() : null,
        updated_at: new Date().toISOString(),
      });

      if (privateError) return { error: privateError };

      await authService.fetchProfiles(userId);
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    useAuthStore.getState().reset();
  },
};
