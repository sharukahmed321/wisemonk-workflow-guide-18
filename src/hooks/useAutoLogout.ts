import { useCallback, useEffect, useRef, useState } from 'react';
import { useActivityTracker } from './useActivityTracker';

interface UseAutoLogoutOptions {
  timeoutMs?: number;
  warningMs?: number;
  onLogout: (reason: 'auto' | 'manual') => Promise<void>;
  enabled?: boolean;
}

export const useAutoLogout = ({
  timeoutMs = 30 * 60 * 1000, // 30 minutes
  warningMs = 60 * 1000, // 1 minute warning
  onLogout,
  enabled = true,
}: UseAutoLogoutOptions) => {
  const [showWarning, setShowWarning] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const countdownIntervalRef = useRef<number>();
  const lastActivityRef = useRef<number>(Date.now());

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, []);

  const startCountdown = useCallback(() => {
    setWarningCountdown(Math.ceil(warningMs / 1000));
    
    countdownIntervalRef.current = window.setInterval(() => {
      setWarningCountdown(prev => {
        if (prev <= 1) {
          // Auto logout when countdown reaches 0
          onLogout('auto');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [warningMs, onLogout]);

  const resetTimer = useCallback(() => {
    if (!enabled || !isOnline) return;
    
    clearAllTimers();
    setShowWarning(false);
    lastActivityRef.current = Date.now();

    // Set warning timer
    warningTimeoutRef.current = setTimeout(() => {
      // Check if tab is visible before showing warning
      if (!document.hidden) {
        setShowWarning(true);
        startCountdown();
      } else {
        // If tab is hidden, wait until it becomes visible
        const handleVisibilityChange = () => {
          if (!document.hidden) {
            setShowWarning(true);
            startCountdown();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }
    }, timeoutMs - warningMs);

    // Set auto logout timer
    timeoutRef.current = setTimeout(() => {
      onLogout('auto');
    }, timeoutMs);
  }, [enabled, isOnline, timeoutMs, warningMs, onLogout, startCountdown, clearAllTimers]);

  const extendSession = useCallback(() => {
    setShowWarning(false);
    resetTimer();
  }, [resetTimer]);

  const logoutNow = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    onLogout('manual');
  }, [onLogout, clearAllTimers]);

  // Track user activity
  useActivityTracker({
    onActivity: resetTimer,
    enabled: enabled && !showWarning,
    debounceMs: 5000, // 5 second debounce for activity
  });

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      resetTimer(); // Reset timer when coming back online
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      clearAllTimers(); // Pause timers when offline
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [resetTimer, clearAllTimers]);

  // Initialize timer
  useEffect(() => {
    if (enabled && isOnline) {
      resetTimer();
    }
    
    return clearAllTimers;
  }, [enabled, isOnline, resetTimer, clearAllTimers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return {
    showWarning,
    warningCountdown,
    extendSession,
    logoutNow,
    getLastActivity: () => lastActivityRef.current,
    isOnline,
  };
};