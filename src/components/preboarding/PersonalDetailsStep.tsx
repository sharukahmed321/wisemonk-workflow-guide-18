import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DateOfBirthPicker } from './DateOfBirthPicker';
import { useToast } from "@/components/ui/use-toast"

interface PersonalDetails {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  gender: string;
  aadhaarNumber: string;
  panNumber: string;
  mobileNumber: string;
  emergencyContact: string;
}

interface PersonalDetailsStepProps {
  onNext: (data: PersonalDetails) => void;
  onBack: () => void;
  initialData?: PersonalDetails;
}

export function PersonalDetailsStep({ onNext, onBack, initialData }: PersonalDetailsStepProps) {
  const [formData, setFormData] = useState<PersonalDetails>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    dateOfBirth: initialData?.dateOfBirth || null,
    gender: initialData?.gender || '',
    aadhaarNumber: initialData?.aadhaarNumber || '',
    panNumber: initialData?.panNumber || '',
    mobileNumber: initialData?.mobileNumber || '',
    emergencyContact: initialData?.emergencyContact || '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { toast } = useToast()

  useEffect(() => {
    // Set initial data when it changes
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const isFormValid = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of Birth is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (isFormValid()) {
      onNext(formData);
    } else {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "Please check the form for errors.",
      })
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-foreground">Personal Details</CardTitle>
        <CardDescription className="text-muted-foreground">
          Please provide your personal information for our records
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
              First Name *
            </Label>
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full"
              required
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
              Last Name *
            </Label>
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full"
              required
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth" className="text-sm font-medium text-foreground">
              Date of Birth *
            </Label>
            <DateOfBirthPicker
              value={formData.dateOfBirth}
              onChange={(date) => setFormData(prev => ({ ...prev, dateOfBirth: date }))}
              placeholder="Select your date of birth"
              required
            />
            {errors.dateOfBirth && (
              <p className="text-sm text-destructive">{errors.dateOfBirth}</p>
            )}
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Gender *</Label>
            <RadioGroup
              value={formData.gender}
              onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Male" id="male" />
                <Label htmlFor="male" className="text-sm text-foreground">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Female" id="female" />
                <Label htmlFor="female" className="text-sm text-foreground">Female</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Other" id="other" />
                <Label htmlFor="other" className="text-sm text-foreground">Other</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Aadhaar Number */}
          <div className="space-y-2">
            <Label htmlFor="aadhaarNumber" className="text-sm font-medium text-foreground">
              Aadhaar Number *
            </Label>
            <Input
              id="aadhaarNumber"
              type="text"
              value={formData.aadhaarNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                setFormData(prev => ({ ...prev, aadhaarNumber: value }));
              }}
              placeholder="Enter 12-digit Aadhaar number"
              className="w-full"
              maxLength={12}
              required
            />
            <div className="text-sm text-muted-foreground">
              {formData.aadhaarNumber.length}/12
            </div>
          </div>

          {/* PAN Number */}
          <div className="space-y-2">
            <Label htmlFor="panNumber" className="text-sm font-medium text-foreground">
              PAN Number *
            </Label>
            <Input
              id="panNumber"
              type="text"
              value={formData.panNumber}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().slice(0, 10);
                setFormData(prev => ({ ...prev, panNumber: value }));
              }}
              placeholder="Enter PAN number (e.g., ABCDE1234F)"
              className="w-full"
              maxLength={10}
              required
            />
          </div>

          {/* Mobile Number */}
          <div className="space-y-2">
            <Label htmlFor="mobileNumber" className="text-sm font-medium text-foreground">
              Mobile Number *
            </Label>
            <Input
              id="mobileNumber"
              type="tel"
              value={formData.mobileNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData(prev => ({ ...prev, mobileNumber: value }));
              }}
              placeholder="Enter 10-digit mobile number"
              className="w-full"
              maxLength={10}
              required
            />
          </div>

          {/* Emergency Contact */}
          <div className="space-y-2">
            <Label htmlFor="emergencyContact" className="text-sm font-medium text-foreground">
              Emergency Contact Number *
            </Label>
            <Input
              id="emergencyContact"
              type="tel"
              value={formData.emergencyContact}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData(prev => ({ ...prev, emergencyContact: value }));
              }}
              placeholder="Enter 10-digit emergency contact number"
              className="w-full"
              maxLength={10}
              required
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="px-6"
            >
              Back
            </Button>
            <Button
              type="submit"
              className="px-6"
              disabled={!isFormValid()}
            >
              Next
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
