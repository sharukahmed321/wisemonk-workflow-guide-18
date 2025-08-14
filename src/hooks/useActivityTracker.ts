import { useCallback, useEffect, useRef } from 'react';

interface UseActivityTrackerOptions {
  onActivity: () => void;
  debounceMs?: number;
  enabled?: boolean;
}

export const useActivityTracker = ({ 
  onActivity, 
  debounceMs = 1000,
  enabled = true 
}: UseActivityTrackerOptions) => {
  const debounceRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  const debouncedActivity = useCallback(() => {
    if (!enabled) return;
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      const now = Date.now();
      // Only trigger if enough time has passed since last activity
      if (now - lastActivityRef.current >= debounceMs) {
        lastActivityRef.current = now;
        onActivity();
      }
    }, debounceMs);
  }, [onActivity, debounceMs, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'touchmove',
      'click',
      'focus',
    ];

    const handleActivity = () => debouncedActivity();

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Handle visibility change (pause tracking when tab is hidden)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleActivity();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // Cleanup
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [debouncedActivity, enabled]);

  return {
    getLastActivity: () => lastActivityRef.current,
  };
};