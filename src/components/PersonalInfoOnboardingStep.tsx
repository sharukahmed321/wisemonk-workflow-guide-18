
import React from 'react';
import { useOnboardingContext } from './EmployeeOnboardingFlow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DateOfBirthPicker } from './ui/date-of-birth-picker';
import { Upload, User, Phone, Calendar, Users } from 'lucide-react';

export function PersonalInfoOnboardingStep() {
  // Check if we're within the onboarding context
  let context;
  try {
    context = useOnboardingContext();
  } catch (error) {
    // If not within OnboardingProvider, show error message
    return (
      <div className="absolute top-4 right-4 z-50">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 max-w-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-destructive/20 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Configuration Error</h3>
              <p className="text-xs text-muted-foreground">
                This component must be used within the Employee Onboarding Flow.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { data, updatePersonalInfo, errors } = context;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updatePersonalInfo({ profilePicture: file });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-2xl font-semibold text-foreground mb-2">Personal Information</h3>
        <p className="text-muted-foreground">
          Complete your profile with basic personal details
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Picture Upload */}
        <div className="space-y-2">
          <Label htmlFor="profilePicture" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Profile Picture (Optional)
          </Label>
          <div className="flex items-center gap-4">
            {data.personalInfo.profilePicture instanceof File && (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                <img 
                  src={URL.createObjectURL(data.personalInfo.profilePicture)} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <Input
              id="profilePicture"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="flex-1"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phoneNumber" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone Number *
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="Enter 10-digit phone number"
            value={data.personalInfo.phoneNumber || ''}
            onChange={(e) => updatePersonalInfo({ phoneNumber: e.target.value })}
            className={errors.phoneNumber ? 'border-destructive' : ''}
          />
          {errors.phoneNumber && (
            <p className="text-sm text-destructive">{errors.phoneNumber}</p>
          )}
        </div>

        {/* Gender Identity */}
        <div className="space-y-2">
          <Label htmlFor="genderIdentity" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Gender Identity *
          </Label>
          <Select 
            value={data.personalInfo.genderIdentity || ''} 
            onValueChange={(value) => updatePersonalInfo({ genderIdentity: value })}
          >
            <SelectTrigger className={errors.genderIdentity ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select gender identity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="non-binary">Non-binary</SelectItem>
              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.genderIdentity && (
            <p className="text-sm text-destructive">{errors.genderIdentity}</p>
          )}
        </div>

      </div>
    </div>
  );
}
