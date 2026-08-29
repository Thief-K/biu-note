import { useState, useRef, useEffect, useCallback, type ReactNode, type TouchEvent } from 'react';
import { ArrowDown, Loader2 } from 'lucide-react';

export interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
  accentColor?: 'amber' | 'blue' | 'emerald' | string;
  className?: string;
  children: ReactNode;
}

const PULL_THRESHOLD = 54; // Activation threshold in pixels
const MAX_PULL_DISTANCE = 80; // Maximum allowed pull offset

export default function PullToRefresh({
  onRefresh,
  disabled = false,
  accentColor = 'amber',
  className = '',
  children
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const accentStyles: Record<string, { indicator: string; icon: string }> = {
    amber: {
      indicator: 'border-amber-500/40 text-amber-500 dark:text-amber-400 bg-zinc-900',
      icon: 'text-amber-500 dark:text-amber-400'
    },
    blue: {
      indicator: 'border-blue-500/40 text-blue-500 dark:text-blue-400 bg-zinc-900',
      icon: 'text-blue-500 dark:text-blue-400'
    },
    emerald: {
      indicator: 'border-emerald-500/40 text-emerald-500 dark:text-emerald-400 bg-zinc-900',
      icon: 'text-emerald-500 dark:text-emerald-400'
    }
  };

  const currentAccent = accentStyles[accentColor] || accentStyles.emerald;

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (disabled || isRefreshing) return;
    const container = containerRef.current;
    if (container && container.scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isPullingRef.current || disabled || isRefreshing) return;
    const container = containerRef.current;
    if (container && container.scrollTop > 0) {
      isPullingRef.current = false;
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diffY = currentY - startYRef.current;

    if (diffY > 0) {
      // Non-linear dampening formula
      const dampDistance = Math.min(MAX_PULL_DISTANCE, Math.pow(diffY, 0.85));
      setPullDistance(dampDistance);
    } else {
      setPullDistance(0);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPullDistance(PULL_THRESHOLD);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 350);
    }
  }, [onRefresh]);

  const handleTouchEnd = () => {
    if (!isPullingRef.current || isRefreshing) return;
    isPullingRef.current = false;

    if (pullDistance >= PULL_THRESHOLD) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
  };

  // Reset pull distance if disabled becomes true
  useEffect(() => {
    if (disabled) {
      setPullDistance(0);
      isPullingRef.current = false;
    }
  }, [disabled]);

  const isReady = pullDistance >= PULL_THRESHOLD;
  const progressRatio = Math.min(1, pullDistance / PULL_THRESHOLD);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative overflow-y-auto ${className}`}
    >
      {/* 🔄 Perfectly Horizontally Centered Floating Pull Indicator Badge */}
      <div
        className="absolute left-0 right-0 top-0 z-20 pointer-events-none flex items-center justify-center transition-transform duration-200 ease-out"
        style={{
          transform: `translate3d(0, ${pullDistance > 0 || isRefreshing ? pullDistance - 38 : -48}px, 0)`,
          opacity: pullDistance > 10 || isRefreshing ? 1 : 0
        }}
      >
        <div
          className={`w-8 h-8 rounded-full border grid place-items-center backdrop-blur-md transition-all select-none ${currentAccent.indicator}`}
        >
          {isRefreshing ? (
            <Loader2 className={`w-4 h-4 animate-spin ${currentAccent.icon}`} />
          ) : (
            <ArrowDown
              className={`w-4 h-4 transition-transform duration-200 ${currentAccent.icon}`}
              style={{
                transform: `rotate(${isReady ? 180 : progressRatio * 180}deg)`
              }}
            />
          )}
        </div>
      </div>

      {/* Content wrapper with matching spring offset */}
      <div
        className="h-full flex flex-col transition-transform duration-200 ease-out"
        style={{
          transform: pullDistance > 0 || isRefreshing ? `translate3d(0, ${pullDistance}px, 0)` : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
}
