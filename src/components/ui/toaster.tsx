
import { Toast } from '@/hooks/use-toast';
import { useToast } from '@/hooks/use-toast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            rounded-lg border p-4 shadow-lg transition-all duration-300
            ${toast.variant === 'destructive' 
              ? 'bg-destructive text-destructive-foreground border-destructive' 
              : 'bg-background text-foreground border-border'
            }
          `}
        >
          <div className="font-semibold">{toast.title}</div>
          {toast.description && (
            <div className="text-sm text-muted-foreground mt-1">{toast.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}
