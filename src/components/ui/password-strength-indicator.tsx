import { Check, X } from 'lucide-react';
import { checkPasswordStrength, getPasswordRequirementsList } from '@/lib/passwordValidation';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrengthIndicator({ password, showRequirements = true }: PasswordStrengthIndicatorProps) {
  const strength = checkPasswordStrength(password);
  const requirements = getPasswordRequirementsList();

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Força da senha:</span>
          <span className={`font-medium ${strength.score >= 4 ? 'text-green-500' : strength.score >= 3 ? 'text-yellow-500' : 'text-red-500'}`}>
            {strength.label}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                level <= strength.score ? strength.color : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Requirements list */}
      {showRequirements && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
          {requirements.map(({ key, label }) => {
            const met = strength.requirements[key];
            return (
              <div
                key={key}
                className={`flex items-center gap-1.5 ${met ? 'text-green-500' : 'text-muted-foreground'}`}
              >
                {met ? (
                  <Check className="h-3 w-3 flex-shrink-0" />
                ) : (
                  <X className="h-3 w-3 flex-shrink-0" />
                )}
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
