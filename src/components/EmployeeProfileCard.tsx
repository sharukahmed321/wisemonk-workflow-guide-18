import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, MapPin, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  job_title: string | null;
  department: string | null;
  date_of_birth: string | null;
}

export default function EmployeeProfileCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    avatar_url: '',
    job_title: '',
    department: '',
    date_of_birth: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // First try to get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone, avatar_url, job_title, department')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Try to get employee data for additional fields including profile picture
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('date_of_birth, job_title, department, phone, profile_picture_url, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      // Combine profile and employee data, prioritizing employee data
      const combinedData: ProfileData = {
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        email: profile?.email || user.email || '',
        phone: employee?.phone || profile?.phone || '',
        avatar_url: employee?.profile_picture_url || employee?.avatar_url || profile?.avatar_url || '',
        job_title: employee?.job_title || profile?.job_title || '',
        department: employee?.department || profile?.department || '',
        date_of_birth: employee?.date_of_birth || ''
      };

      setProfileData(combinedData);
      setFormData(combinedData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      // Update profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          job_title: formData.job_title,
          department: formData.department
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // If user has an employee record, update that too
      const { data: employeeExists } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (employeeExists) {
        const { error: employeeError } = await supabase
          .from('employees')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            job_title: formData.job_title,
            department: formData.department,
            date_of_birth: formData.date_of_birth || null
          })
          .eq('user_id', user.id);

        if (employeeError) throw employeeError;
      }

      setProfileData(formData);
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error", 
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    const firstName = formData.first_name || '';
    const lastName = formData.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 w-full max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and settings.</p>
        </div>
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and settings.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Picture Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Picture
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Avatar className="h-24 w-24 mx-auto mb-4">
              <AvatarImage src={formData.avatar_url || undefined} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">Change Photo</Button>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  value={formData.first_name || ''} 
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  value={formData.last_name || ''} 
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email} 
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <Input 
                  id="phone" 
                  value={formData.phone || ''} 
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="birthday" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Birthday
                </Label>
                <Input 
                  id="birthday" 
                  type="date" 
                  value={formData.date_of_birth || ''} 
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input 
                  id="jobTitle" 
                  value={formData.job_title || ''} 
                  onChange={(e) => handleInputChange('job_title', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <Input 
                id="department" 
                value={formData.department || ''} 
                onChange={(e) => handleInputChange('department', e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}