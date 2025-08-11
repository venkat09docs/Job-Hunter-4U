import { validatePasswordStrength } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

export const PasswordStrengthMeter = ({ password, className }: PasswordStrengthMeterProps) => {
  if (!password) return null;
  
  const { strength, errors } = validatePasswordStrength(password);
  
  const getStrengthColor = () => {
    switch (strength) {
      case 'weak':
        return 'bg-destructive';
      case 'medium':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-green-500';
      default:
        return 'bg-muted';
    }
  };
  
  const getStrengthWidth = () => {
    switch (strength) {
      case 'weak':
        return 'w-1/3';
      case 'medium':
        return 'w-2/3';
      case 'strong':
        return 'w-full';
      default:
        return 'w-0';
    }
  };
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Password strength:</span>
        <span className={cn(
          "text-sm font-medium capitalize",
          strength === 'weak' && "text-destructive",
          strength === 'medium' && "text-yellow-600",
          strength === 'strong' && "text-green-600"
        )}>
          {strength}
        </span>
      </div>
      
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn(
          "h-full transition-all duration-300",
          getStrengthColor(),
          getStrengthWidth()
        )} />
      </div>
      
      {errors.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1">
          {errors.map((error, index) => (
            <li key={index} className="flex items-center gap-1">
              <span className="text-destructive">•</span>
              {error}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};