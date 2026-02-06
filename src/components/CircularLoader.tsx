import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CircularLoaderProps {
  /** Size of the loader in pixels */
  size?: number;
  /** Stroke width of the circle */
  strokeWidth?: number;
  /** Whether to show the pulsing animation */
  showPulse?: boolean;
  /** Primary text to display */
  title?: string;
  /** Secondary text to display */
  subtitle?: string;
  /** Additional className */
  className?: string;
}

export const CircularLoader = ({
  size = 80,
  strokeWidth = 4,
  showPulse = true,
  title,
  subtitle,
  className,
}: CircularLoaderProps) => {
  const [rotation, setRotation] = useState(0);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const center = size / 2;

  // Smooth rotation animation
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 3) % 360);
    }, 16);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer glow effect */}
        {showPulse && (
          <div 
            className="absolute inset-0 rounded-full bg-primary/20 animate-ping"
            style={{ animationDuration: '2s' }}
          />
        )}
        
        {/* Background circle */}
        <svg
          width={size}
          height={size}
          className="absolute inset-0"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
        </svg>
        
        {/* Animated gradient arc */}
        <svg
          width={size}
          height={size}
          className="absolute inset-0"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <defs>
            <linearGradient id="loaderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="url(#loaderGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.7} ${circumference * 0.3}`}
          />
        </svg>
        
        {/* Inner pulsing dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-3 h-3 rounded-full bg-primary shadow-lg"
            style={{
              boxShadow: '0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--primary) / 0.5)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>
      
      {/* Text content */}
      {(title || subtitle) && (
        <div className="text-center space-y-1">
          {title && (
            <p className="text-base font-medium text-foreground">{title}</p>
          )}
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
};
