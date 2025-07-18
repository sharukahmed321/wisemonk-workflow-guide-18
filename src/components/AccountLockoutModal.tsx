
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Shield, Clock, Mail } from 'lucide-react';

interface AccountLockoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  lockoutData: {
    isLocked: boolean;
    lockedUntil: string | null;
    lockReason: string | null;
    failedAttempts: number;
  } | null;
  userEmail: string;
}

export function AccountLockoutModal({ 
  isOpen, 
  onClose, 
  lockoutData, 
  userEmail 
}: AccountLockoutModalProps) {
  if (!lockoutData?.isLocked) return null;

  const lockedUntil = lockoutData.lockedUntil ? new Date(lockoutData.lockedUntil) : null;
  const now = new Date();
  const remainingTime = lockedUntil ? Math.max(0, Math.floor((lockedUntil.getTime() - now.getTime()) / 1000 / 60)) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-center">Account Temporarily Locked</DialogTitle>
          <DialogDescription className="text-center">
            Your account has been locked due to multiple failed login attempts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Protection Active</strong>
              <br />
              {lockoutData.lockReason || 'Too many failed login attempts detected'}
            </AlertDescription>
          </Alert>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Failed attempts:</span>
              <span className="font-medium">{lockoutData.failedAttempts}/5</span>
            </div>
            
            {remainingTime > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Time remaining:</span>
                <span className="font-medium flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {remainingTime} minutes
                </span>
              </div>
            )}
          </div>

          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              <strong>Need immediate access?</strong>
              <br />
              Check your email for account recovery options or contact support.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button onClick={onClose} className="w-full">
              I understand
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              Locked account: {userEmail}
            </div>
          </div>

          <div className="pt-4 border-t text-center text-xs text-muted-foreground">
            For security questions, contact{' '}
            <a href="mailto:security@yourapp.com" className="text-primary hover:underline">
              security@yourapp.com
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
