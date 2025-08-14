import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

interface AutoLogoutWarningModalProps {
  isOpen: boolean;
  countdown: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
}

export const AutoLogoutWarningModal: React.FC<AutoLogoutWarningModalProps> = ({
  isOpen,
  countdown,
  onStayLoggedIn,
  onLogoutNow,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Session Timeout Warning
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              You've been inactive for a while. For your security, you'll be automatically 
              logged out in:
            </p>
            <div className="text-center">
              <span className="text-2xl font-mono font-bold text-warning">
                {formatTime(countdown)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Click "Stay Logged In" to continue your session, or "Logout Now" to sign out immediately.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onLogoutNow}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout Now
          </Button>
          <Button
            onClick={onStayLoggedIn}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Stay Logged In
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};