// Input validation utilities for security

export const INPUT_LIMITS = {
  EMAIL_MAX: 254, // RFC 5321 limit
  NAME_MAX: 100,
  PHONE_MAX: 20,
  MESSAGE_MAX: 2000,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
} as const;

export const validateEmail = (email: string): boolean => {
  if (!email || email.length > INPUT_LIMITS.EMAIL_MAX) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < INPUT_LIMITS.PASSWORD_MIN) {
    errors.push(`Password must be at least ${INPUT_LIMITS.PASSWORD_MIN} characters`);
  }
  
  if (password.length > INPUT_LIMITS.PASSWORD_MAX) {
    errors.push(`Password must not exceed ${INPUT_LIMITS.PASSWORD_MAX} characters`);
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return { isValid: errors.length === 0, errors };
};

export const sanitizeInput = (input: string, maxLength: number): string => {
  if (!input) return '';
  
  // Remove null bytes and control characters except whitespace
  const sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim and limit length
  return sanitized.trim().slice(0, maxLength);
};

export const validateName = (name: string): boolean => {
  if (!name || name.length === 0 || name.length > INPUT_LIMITS.NAME_MAX) return false;
  // Allow letters, spaces, hyphens, apostrophes, and basic punctuation
  const nameRegex = /^[a-zA-Z\s\-'.]+$/;
  return nameRegex.test(name.trim());
};

export const validatePhone = (phone: string): boolean => {
  if (!phone) return true; // Optional field
  if (phone.length > INPUT_LIMITS.PHONE_MAX) return false;
  // Allow digits, spaces, parentheses, hyphens, plus sign
  const phoneRegex = /^[\d\s\(\)\-\+]+$/;
  return phoneRegex.test(phone);
};

export const validateMessage = (message: string): boolean => {
  return message.length <= INPUT_LIMITS.MESSAGE_MAX;
};