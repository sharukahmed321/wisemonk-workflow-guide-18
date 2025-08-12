
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
import { DateOfBirthPicker } from '@/components/ui/date-of-birth-picker';
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
  data: {
    fullName: string;
    fatherName: string;
    dateOfBirth?: Date;
    aadhaarNumber: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
  };
  onComplete: (data: any) => void;
  onPrevious: () => void;
}

export function PersonalDetailsStep({ data, onComplete, onPrevious }: PersonalDetailsStepProps) {
  const [formData, setFormData] = useState({
    fullName: data?.fullName || '',
    fatherName: data?.fatherName || '',
    dateOfBirth: data?.dateOfBirth || undefined,
    aadhaarNumber: data?.aadhaarNumber || '',
    addressLine1: data?.addressLine1 || '',
    addressLine2: data?.addressLine2 || '',
    city: data?.city || '',
    state: data?.state || '',
    pincode: data?.pincode || ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { toast } = useToast()

  const isFormValid = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    if (!formData.fatherName.trim()) {
      newErrors.fatherName = "Father's name is required";
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of Birth is required";
    }
    if (!formData.aadhaarNumber || formData.aadhaarNumber.length !== 12) {
      newErrors.aadhaarNumber = "Valid 12-digit Aadhaar number is required";
    }
    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = "Address Line 1 is required";
    }
    if (!formData.addressLine2.trim()) {
      newErrors.addressLine2 = "Address Line 2 is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }
    if (!formData.pincode || formData.pincode.length !== 6) {
      newErrors.pincode = "Valid 6-digit pincode is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (isFormValid()) {
      onComplete(formData);
    } else {
      toast({
        variant: "destructive",
        title: "Please fill all required fields",
        description: "Check the form for errors.",
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
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
              Full Name *
            </Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              className="w-full"
              required
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName}</p>
            )}
          </div>

          {/* Father's Name */}
          <div className="space-y-2">
            <Label htmlFor="fatherName" className="text-sm font-medium text-foreground">
              Father's Name *
            </Label>
            <Input
              id="fatherName"
              type="text"
              value={formData.fatherName}
              onChange={(e) => setFormData(prev => ({ ...prev, fatherName: e.target.value }))}
              className="w-full"
              required
            />
            {errors.fatherName && (
              <p className="text-sm text-destructive">{errors.fatherName}</p>
            )}
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
            />
            {errors.dateOfBirth && (
              <p className="text-sm text-destructive">{errors.dateOfBirth}</p>
            )}
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
            <div className="flex justify-end">
              <div className="text-sm text-muted-foreground">
                {formData.aadhaarNumber.length}/12
              </div>
            </div>
            {errors.aadhaarNumber && (
              <p className="text-sm text-destructive">{errors.aadhaarNumber}</p>
            )}
          </div>

          {/* Address Line 1 */}
          <div className="space-y-2">
            <Label htmlFor="addressLine1" className="text-sm font-medium text-foreground">
              Address Line 1 *
            </Label>
            <Input
              id="addressLine1"
              type="text"
              value={formData.addressLine1}
              onChange={(e) => setFormData(prev => ({ ...prev, addressLine1: e.target.value }))}
              placeholder="Street address, apartment, suite, etc."
              className="w-full"
              required
            />
            {errors.addressLine1 && (
              <p className="text-sm text-destructive">{errors.addressLine1}</p>
            )}
          </div>

          {/* Address Line 2 */}
          <div className="space-y-2">
            <Label htmlFor="addressLine2" className="text-sm font-medium text-foreground">
              Address Line 2 *
            </Label>
            <Input
              id="addressLine2"
              type="text"
              value={formData.addressLine2}
              onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
              placeholder="Landmark, area, district"
              className="w-full"
              required
            />
            {errors.addressLine2 && (
              <p className="text-sm text-destructive">{errors.addressLine2}</p>
            )}
          </div>

          {/* City and State */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium text-foreground">
                City *
              </Label>
              <Input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full"
                required
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm font-medium text-foreground">
                State *
              </Label>
              <Input
                id="state"
                type="text"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                className="w-full"
                required
              />
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state}</p>
              )}
            </div>
          </div>

          {/* Pincode */}
          <div className="space-y-2">
            <Label htmlFor="pincode" className="text-sm font-medium text-foreground">
              Pincode *
            </Label>
            <Input
              id="pincode"
              type="text"
              value={formData.pincode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setFormData(prev => ({ ...prev, pincode: value }));
              }}
              placeholder="Enter 6-digit pincode"
              className="w-full"
              maxLength={6}
              required
            />
            {errors.pincode && (
              <p className="text-sm text-destructive">{errors.pincode}</p>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              className="px-6"
            >
              Back
            </Button>
            <Button
              type="submit"
              className="px-6"
            >
              Next
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
