import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AutoSaveOptions {
  key: string;
  data: any;
  delay?: number;
  onSave?: (data: any) => void;
  enabled?: boolean;
}

export function useAutoSave({
  key,
  data,
  delay = 2000,
  onSave,
  enabled = true
}: AutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedDataRef = useRef<string>('');
  const { toast } = useToast();

  const debouncedSave = useCallback(() => {
    if (!enabled) return;

    const currentData = JSON.stringify(data);
    
    // Only save if data has actually changed
    if (currentData === lastSavedDataRef.current) return;

    try {
      localStorage.setItem(key, currentData);
      lastSavedDataRef.current = currentData;
      
      if (onSave) {
        onSave(data);
      }

      // Optional: Show subtle save indicator
      console.log(`Auto-saved progress for ${key}`);
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast({
        title: "Auto-save failed",
        description: "Unable to save progress. Please ensure you have enough storage space.",
        variant: "destructive",
      });
    }
  }, [key, data, enabled, onSave, toast]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(debouncedSave, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [debouncedSave, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Force save function for manual saves
  const forceSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    debouncedSave();
  }, [debouncedSave]);

  return { forceSave };
}