import { z } from 'zod';

export const allowedDomain = '@bmu.edu.in';

export const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address.')
    .refine((val) => val.endsWith(allowedDomain), {
      message: 'Access restricted: Only @bmu.edu.in student/faculty emails are allowed.',
    }),
});

export type EmailFormData = z.infer<typeof emailSchema>;

export const otpSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, 'Please enter the 6-digit OTP sent to your university email.')
    .regex(/^[0-9]{6}$/, 'OTP must contain numbers only.'),
});

export type OtpFormData = z.infer<typeof otpSchema>;

export const onboardingStepOneSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(50, 'Name cannot exceed 50 characters.'),
  avatarUrl: z.string().optional().nullable(),
});

export type OnboardingStepOneData = z.infer<typeof onboardingStepOneSchema>;

export const onboardingStepTwoSchema = z.object({
  phone: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^\+?[0-9]{10,14}$/.test(val), {
      message: 'Please enter a valid 10-digit phone number.',
    }),
  upiId: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(val), {
      message: 'Please enter a valid UPI ID (e.g. username@okhdfcbank).',
    }),
});

export type OnboardingStepTwoData = z.infer<typeof onboardingStepTwoSchema>;
