import {
  emailSchema,
  credentialsSchema,
  otpSchema,
  onboardingStepOneSchema,
  onboardingStepTwoSchema,
} from '../authSchemas';

describe('authSchemas', () => {
  describe('emailSchema', () => {
    it('accepts valid @bmu.edu.in email', () => {
      const result = emailSchema.safeParse({ email: 'sharman.m22@bmu.edu.in' });
      expect(result.success).toBe(true);
    });

    it('converts email to lowercase and trims whitespace', () => {
      const result = emailSchema.parse({ email: '  Student.Name@BMU.EDU.IN  ' });
      expect(result.email).toBe('student.name@bmu.edu.in');
    });

    it('rejects non-bmu email domains', () => {
      const result = emailSchema.safeParse({ email: 'user@gmail.com' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Only @bmu.edu.in');
      }
    });

    it('rejects invalid email formats', () => {
      const result = emailSchema.safeParse({ email: 'not-an-email' });
      expect(result.success).toBe(false);
    });
  });

  describe('otpSchema', () => {
    it('accepts valid 6 digit string', () => {
      expect(otpSchema.safeParse({ code: '123456' }).success).toBe(true);
    });

    it('rejects non-numeric characters', () => {
      expect(otpSchema.safeParse({ code: '12a456' }).success).toBe(false);
    });

    it('rejects codes shorter or longer than 6 digits', () => {
      expect(otpSchema.safeParse({ code: '12345' }).success).toBe(false);
      expect(otpSchema.safeParse({ code: '1234567' }).success).toBe(false);
    });
  });

  describe('onboardingStepTwoSchema', () => {
    it('accepts valid phone and UPI ID', () => {
      const result = onboardingStepTwoSchema.safeParse({
        phone: '9876543210',
        upiId: 'student@okhdfcbank',
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty/optional phone and UPI ID', () => {
      const result = onboardingStepTwoSchema.safeParse({
        phone: '',
        upiId: '',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid UPI ID formats', () => {
      const result = onboardingStepTwoSchema.safeParse({
        upiId: 'invalid-upi-without-at',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('credentialsSchema', () => {
    it('accepts valid bmu email and password >= 6 characters', () => {
      const result = credentialsSchema.safeParse({
        email: 'student.22@bmu.edu.in',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-bmu email even with valid password', () => {
      const result = credentialsSchema.safeParse({
        email: 'user@gmail.com',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects passwords shorter than 6 characters', () => {
      const result = credentialsSchema.safeParse({
        email: 'student.22@bmu.edu.in',
        password: '12345',
      });
      expect(result.success).toBe(false);
    });
  });
});
