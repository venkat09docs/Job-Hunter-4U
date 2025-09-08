import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CountdownTimerProps {
  targetDate?: string; // ISO string
  className?: string;
  showIcon?: boolean;
}

const CountdownTimer = ({ 
  targetDate = '2025-09-18T08:30:00+05:30', // September 18th, 2025 at 8:30 AM IST
  className = '',
  showIcon = true 
}: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetTime = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const timeUnits = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hours' },
    { value: timeLeft.minutes, label: 'Minutes' },
    { value: timeLeft.seconds, label: 'Seconds' }
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && <Clock className="h-4 w-4 text-orange" />}
      <div className="flex gap-2">
        {timeUnits.map((unit, index) => (
          <div key={unit.label} className="text-center">
            <Badge variant="outline" className="px-2 py-1 bg-orange/10 border-orange text-orange font-bold">
              {unit.value.toString().padStart(2, '0')}
            </Badge>
            <div className="text-xs text-muted-foreground mt-1">{unit.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountdownTimer;