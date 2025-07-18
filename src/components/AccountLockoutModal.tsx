
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Shield, Clock, Mail } from 'lucide-react';

interface SecurityStatus {
  email: string;
  is_locked: boolean;
  locked_until: string | null;
  lock_reason: string | null;
  failed_attempts: number;
  last_failed_login: string | null;
  last_successful_login: string | null;
  email_verified: boolean;
  email_verified_at: string | null;
  verification_attempts: number;
  last_verification_sent: string | null;
}

interface AccountLockoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  lockoutData: SecurityStatus | null;
  userEmail: string;
}

export function AccountLockoutModal({ 
  isOpen, 
  onClose, 
  lockoutData, 
  userEmail 
}: AccountLockoutModalProps) {
  if (!lockoutData?.is_locked) return null;

  const lockedUntil = lockoutData.locked_until ? new Date(lockoutData.locked_until) : null;
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
              {lockoutData.lock_reason || 'Too many failed login attempts detected'}
            </AlertDescription>
          </Alert>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Failed attempts:</span>
              <span className="font-medium">{lockoutData.failed_attempts}/5</span>
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
