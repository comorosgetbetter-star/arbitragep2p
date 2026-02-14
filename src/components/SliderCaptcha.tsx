import { useState, useRef, useCallback, useEffect } from 'react';
import { Check, RotateCcw } from 'lucide-react';

interface SliderCaptchaProps {
  onVerify: (verified: boolean) => void;
}

const PUZZLE_SIZE = 44;
const TOLERANCE = 5;

const SliderCaptcha = ({ onVerify }: SliderCaptchaProps) => {
  const [targetX, setTargetX] = useState(0);
  const [sliderX, setSliderX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [verified, setVerified] = useState(false);
  const [failed, setFailed] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const trackWidth = 280;
  const maxSlide = trackWidth - PUZZLE_SIZE;

  const generateTarget = useCallback(() => {
    const min = maxSlide * 0.3;
    const max = maxSlide * 0.85;
    return Math.floor(Math.random() * (max - min) + min);
  }, [maxSlide]);

  useEffect(() => {
    setTargetX(generateTarget());
  }, [generateTarget]);

  const reset = () => {
    setSliderX(0);
    setVerified(false);
    setFailed(false);
    setTargetX(generateTarget());
    onVerify(false);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (verified) return;
    setIsDragging(true);
    setFailed(false);
    startXRef.current = e.clientX - sliderX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || verified) return;
    const newX = Math.max(0, Math.min(maxSlide, e.clientX - startXRef.current));
    setSliderX(newX);
  };

  const handlePointerUp = () => {
    if (!isDragging || verified) return;
    setIsDragging(false);

    if (Math.abs(sliderX - targetX) <= TOLERANCE) {
      setVerified(true);
      setSliderX(targetX);
      onVerify(true);
    } else {
      setFailed(true);
      setTimeout(() => {
        setSliderX(0);
        setFailed(false);
      }, 600);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Verify you're human</p>

      {/* Puzzle image area */}
      <div className="relative w-full rounded-lg overflow-hidden bg-muted/50 border border-border/50" style={{ height: 100 }}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-primary/30"
              style={{
                width: 20 + (i * 8),
                height: 20 + (i * 8),
                left: `${15 + i * 14}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
            />
          ))}
        </div>

        {/* Target slot (where piece should go) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 border-2 border-dashed rounded-md transition-colors"
          style={{
            left: targetX,
            width: PUZZLE_SIZE,
            height: PUZZLE_SIZE,
            borderColor: verified ? 'hsl(var(--success, 142 71% 45%))' : failed ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
            backgroundColor: verified ? 'hsl(var(--success, 142 71% 45%) / 0.15)' : 'hsl(var(--primary) / 0.08)',
          }}
        />

        {/* Sliding puzzle piece */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-md shadow-lg transition-colors flex items-center justify-center"
          style={{
            left: sliderX,
            width: PUZZLE_SIZE,
            height: PUZZLE_SIZE,
            backgroundColor: verified
              ? 'hsl(var(--success, 142 71% 45%))'
              : failed
                ? 'hsl(var(--destructive))'
                : 'hsl(var(--primary))',
            transition: isDragging ? 'none' : 'left 0.3s ease, background-color 0.3s ease',
          }}
        >
          {verified ? (
            <Check className="h-5 w-5 text-white" />
          ) : (
            <div className="w-5 h-5 rounded-sm border-2 border-white/60" />
          )}
        </div>
      </div>

      {/* Slider track */}
      <div className="relative flex items-center gap-2">
        <div
          ref={trackRef}
          className="relative h-10 rounded-full border border-border/50 flex items-center"
          style={{ width: trackWidth }}
        >
          {/* Track fill */}
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-colors"
            style={{
              width: sliderX + PUZZLE_SIZE / 2,
              backgroundColor: verified
                ? 'hsl(var(--success, 142 71% 45%) / 0.15)'
                : 'hsl(var(--primary) / 0.1)',
              transition: isDragging ? 'none' : 'width 0.3s ease',
            }}
          />

          {/* Track label */}
          {sliderX === 0 && !verified && (
            <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground pointer-events-none select-none">
              Slide to align the piece →
            </span>
          )}

          {/* Slider thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none"
            style={{
              left: sliderX,
              backgroundColor: verified
                ? 'hsl(var(--success, 142 71% 45%))'
                : 'hsl(var(--primary))',
              transition: isDragging ? 'none' : 'left 0.3s ease, background-color 0.3s ease',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {verified ? (
              <Check className="h-4 w-4 text-white" />
            ) : (
              <span className="text-white text-lg font-bold">⇒</span>
            )}
          </div>
        </div>

        {/* Reset button */}
        {(failed || verified) && (
          <button
            type="button"
            onClick={reset}
            className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Status text */}
      {verified && (
        <p className="text-xs text-success flex items-center gap-1" style={{ color: 'hsl(142 71% 45%)' }}>
          <Check className="h-3 w-3" /> Verification passed
        </p>
      )}
      {failed && (
        <p className="text-xs text-destructive">Try again — align the piece with the slot</p>
      )}
    </div>
  );
};

export default SliderCaptcha;
