import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams, useRouter } from "next/navigation";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Alert, AlertDescription } from "./ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PasswordUpdateForm } from "./PasswordUpdateForm";

interface UserExistenceStatus {
  exists: boolean;
  email_verified: boolean;
  profile_exists: boolean;
  user_id: string | null;
  status: "new_user" | "unverified" | "partial_registration" | "complete" | "unknown";
}

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const mode = searchParams.get("mode");

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: userCheck, error: checkError } = await supabase.rpc("check_user_exists", {
        user_email: data.email.toLowerCase().trim(),
      });

      if (checkError) {
        setError("An error occurred while checking user. Please try again.");
        return;
      }

      const userStatus = userCheck as unknown as UserExistenceStatus;

      if (!userStatus.exists) {
        setError("User not found. Please sign up first.");
        return;
      }

      if (!userStatus.email_verified) {
        setError("Email not verified. Please check your email for verification link.");
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/?mode=update-password`,
      });

      if (resetError) {
        setError("Failed to send reset email. Please try again.");
        return;
      }

      setIsSuccess(true);
      toast({
        title: "Password reset sent!",
        description: "Check your email for the password reset link.",
      });
    } catch (error: any) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setError(null);
    form.reset();
    onClose();
  };

  // 👉 If `?mode=update-password`, show the update form instead of reset dialog
  if (mode === "update-password") {
    return (
      <PasswordUpdateForm
        onSuccess={() => {
          toast({ title: "Password updated successfully!" });
          router.push("/login");
        }}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset your password</DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Password reset instructions have been sent to your email address.
              </AlertDescription>
            </Alert>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
