import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AttemptTimerProps {
  startTime: string;
  durationMinutes: number;
  onTimeExpired: () => void;
  className?: string;
}

export const AttemptTimer: React.FC<AttemptTimerProps> = ({
  startTime,
  durationMinutes,
  onTimeExpired,
  className
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const startTimeMs = new Date(startTime).getTime();
    const durationMs = durationMinutes * 60 * 1000;
    const endTimeMs = startTimeMs + durationMs;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTimeMs - now);
      
      setTimeRemaining(remaining);
      
      if (remaining === 0 && !isExpired) {
        setIsExpired(true);
        onTimeExpired();
      }
    };

    // Update immediately
    updateTimer();

    // Set up interval to update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationMinutes, onTimeExpired, isExpired]);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    const totalTime = durationMinutes * 60 * 1000;
    const timeRemainingRatio = timeRemaining / totalTime;
    
    if (timeRemainingRatio > 0.5) return 'bg-green-500';
    if (timeRemainingRatio > 0.25) return 'bg-yellow-500';
    if (timeRemainingRatio > 0.1) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTimerVariant = () => {
    const totalTime = durationMinutes * 60 * 1000;
    const timeRemainingRatio = timeRemaining / totalTime;
    
    if (timeRemainingRatio > 0.25) return 'default';
    if (timeRemainingRatio > 0.1) return 'secondary';
    return 'destructive';
  };

  if (isExpired) {
    return (
      <Badge variant="destructive" className={cn('text-sm font-mono', className)}>
        <AlertTriangle className="w-4 h-4 mr-1" />
        Time Expired
      </Badge>
    );
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Badge variant={getTimerVariant()} className="text-sm font-mono">
        <Clock className="w-4 h-4 mr-1" />
        {formatTime(timeRemaining)}
      </Badge>
      
      {/* Progress bar */}
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
        <div 
          className={cn('h-full transition-all duration-1000', getTimerColor())}
          style={{
            width: `${(timeRemaining / (durationMinutes * 60 * 1000)) * 100}%`
          }}
        />
      </div>
    </div>
  );
};

export default AttemptTimer;