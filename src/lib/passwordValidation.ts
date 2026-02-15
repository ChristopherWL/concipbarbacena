import { z } from 'zod';

// Strong password requirements:
// - Minimum 8 characters
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one number
// - At least one special character

export const strongPasswordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .max(100, 'Senha deve ter no máximo 100 caracteres')
  .refine((password) => /[A-Z]/.test(password), {
    message: 'Senha deve conter pelo menos uma letra maiúscula',
  })
  .refine((password) => /[a-z]/.test(password), {
    message: 'Senha deve conter pelo menos uma letra minúscula',
  })
  .refine((password) => /[0-9]/.test(password), {
    message: 'Senha deve conter pelo menos um número',
  })
  .refine((password) => /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/.test(password), {
    message: 'Senha deve conter pelo menos um caractere especial (!@#$%^&*...)',
  });

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  const strengthMap: Record<number, { label: string; color: string }> = {
    0: { label: 'Muito fraca', color: 'bg-red-500' },
    1: { label: 'Fraca', color: 'bg-red-400' },
    2: { label: 'Regular', color: 'bg-yellow-500' },
    3: { label: 'Boa', color: 'bg-yellow-400' },
    4: { label: 'Forte', color: 'bg-green-500' },
    5: { label: 'Muito forte', color: 'bg-green-600' },
  };

  const strength = strengthMap[score] || strengthMap[0];

  return {
    score,
    label: strength.label,
    color: strength.color,
    requirements,
  };
}

export function getPasswordRequirementsList(): Array<{ key: keyof PasswordStrength['requirements']; label: string }> {
  return [
    { key: 'minLength', label: 'Mínimo 8 caracteres' },
    { key: 'hasUppercase', label: 'Uma letra maiúscula' },
    { key: 'hasLowercase', label: 'Uma letra minúscula' },
    { key: 'hasNumber', label: 'Um número' },
    { key: 'hasSpecial', label: 'Um caractere especial (!@#$%...)' },
  ];
}
