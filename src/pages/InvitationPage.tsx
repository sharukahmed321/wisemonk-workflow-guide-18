
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getInvitationByToken, acceptInvitation, InvitationData } from '@/lib/invitationUtils';
import { CheckCircle, Mail, User, Briefcase, Building } from 'lucide-react';

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (token) {
      const inv = getInvitationByToken(token);
      if (inv) {
        if (inv.status === 'accepted') {
          navigate(`/preboarding/${inv.employeeId}`);
          return;
        }
        setInvitation(inv);
      }
    }
    setLoading(false);
  }, [token, navigate]);

  const handleAcceptInvitation = async () => {
    if (!invitation || !password || password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields and ensure passwords match.",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error", 
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setAccepting(true);

    // Simulate account creation
    setTimeout(() => {
      const acceptedInvitation = acceptInvitation(invitation.token);
      if (acceptedInvitation) {
        // Simulate user authentication
        localStorage.setItem('mock_user', JSON.stringify({
          id: `user_${acceptedInvitation.employeeId}`,
          email: acceptedInvitation.email,
          firstName: acceptedInvitation.firstName,
          lastName: acceptedInvitation.lastName
        }));

        toast({
          title: "Welcome to the team!",
          description: "Your account has been created successfully."
        });

        // Redirect to preboarding
        navigate(`/preboarding/${acceptedInvitation.employeeId}`);
      }
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation || !token) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              This invitation link is invalid or has expired.
            </p>
            <Button onClick={() => navigate('/')}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to the Team!
          </h1>
          <p className="text-muted-foreground">
            You've been invited to join our organization. Let's get you set up.
          </p>
        </div>

        {/* Invitation Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Invitation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{invitation.firstName} {invitation.lastName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="font-medium">{invitation.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Job Title</p>
                  <p className="font-medium">{invitation.jobTitle}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Building className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{invitation.department}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Setup */}
        <Card>
          <CardHeader>
            <CardTitle>Create Your Account</CardTitle>
            <p className="text-sm text-muted-foreground">
              Set up your password to access your account and complete the preboarding process.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={accepting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={accepting}
              />
            </div>

            <div className="bg-muted/30 rounded-lg p-4 text-sm">
              <p className="font-medium text-foreground mb-2">What happens next?</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Complete your personal details</li>
                <li>• Upload required documents</li>
                <li>• Review and sign employment agreement</li>
                <li>• Join the team!</li>
              </ul>
            </div>

            <Button 
              onClick={handleAcceptInvitation}
              disabled={accepting || !password || !confirmPassword}
              className="w-full"
            >
              {accepting ? 'Creating Account...' : 'Accept Invitation & Continue'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
