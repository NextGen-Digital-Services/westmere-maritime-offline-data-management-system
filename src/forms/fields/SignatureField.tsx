import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, Check } from 'lucide-react';

interface SignatureFieldProps {
  value?: string; // Base64 data URL
  onChange: (val: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export const SignatureField: React.FC<SignatureFieldProps> = ({
  value = '',
  onChange,
  disabled = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHasDrawn(true);
      };
      img.src = value;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  }, [value]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#0A2540';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
    onChange('');
  };

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed rounded bg-canvas-subtle overflow-hidden">
        <canvas
          ref={canvasRef}
          width={450}
          height={140}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`w-full h-32 block touch-none ${disabled ? 'cursor-not-allowed opacity-75' : 'cursor-crosshair'}`}
        />
        {!hasDrawn && !disabled && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-canvas-muted text-xs">
            <PenTool className="w-5 h-5 mb-1 text-ocean" />
            <span>Draw officer digital sign-off with stylus or mouse</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-xs">
          {hasDrawn ? (
            <span className="text-seaGreen flex items-center space-x-1 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>Signature Captured</span>
            </span>
          ) : (
            <span className="text-canvas-muted">Awaiting digital signature</span>
          )}
        </div>
        {!disabled && hasDrawn && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center space-x-1 text-xs text-coralRed hover:underline font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>
    </div>
  );
};
