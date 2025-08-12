import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Upload } from 'lucide-react';

interface ProgressRecoveryAlertProps {
  hasProgress: boolean;
  hasLostFiles: boolean;
  lostFileNames: string[];
  onResumeProgress: () => void;
  onStartFresh: () => void;
}

export function ProgressRecoveryAlert({
  hasProgress,
  hasLostFiles,
  lostFileNames,
  onResumeProgress,
  onStartFresh
}: ProgressRecoveryAlertProps) {
  if (!hasProgress) return null;

  return (
    <Alert className="mb-6 border-primary/20 bg-primary/5">
      <RefreshCw className="h-4 w-4" />
      <AlertDescription className="space-y-3">
        <div>
          <p className="font-medium text-foreground">
            Previous progress detected
          </p>
          <p className="text-sm text-muted-foreground">
            We found your previous session data. You can continue where you left off.
          </p>
        </div>

        {hasLostFiles && (
          <div className="bg-warning/10 border border-warning/20 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-warning">
                  Some files need to be re-uploaded
                </p>
                <p className="text-xs text-muted-foreground">
                  The following files were previously uploaded but need to be selected again:
                </p>
                <ul className="text-xs text-muted-foreground list-disc list-inside">
                  {lostFileNames.map((fileName, index) => (
                    <li key={index}>{fileName}</li>
                  ))}
                </ul>
                <div className="flex items-center gap-1 text-xs text-warning">
                  <Upload className="h-3 w-3" />
                  <span>You'll need to re-select these files to continue</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onResumeProgress}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Continue Progress
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onStartFresh}
          >
            Start Fresh
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}