import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  CheckCircle, 
  FileText, 
  Edit, 
  User, 
  Building2, 
  MapPin,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  getClientData, 
  updateUserDetails, 
  updateCompanyDetails, 
  updateBusinessAddress,
  type UserDetails,
  type CompanyDetails,
  type BusinessAddress
} from "@/lib/clientData";

// Validation schemas
const userDetailsSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  designation: z.string().min(1, 'Job title is required'),
});

const companyDetailsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  legalName: z.string().min(1, 'Legal name is required'),
  country: z.string().min(1, 'Please select a country'),
  employeeCount: z.string().min(1, 'Please select employee count'),
});

const addressSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
});

function getCompletionStatus(data: any) {
  const isEmpty = (obj: any) => !obj || Object.values(obj).some(v => !v || v === '');
  
  const profileComplete = !isEmpty(data.userDetails) && !isEmpty(data.companyDetails);
  const addressComplete = !isEmpty(data.businessAddress);
  const msaComplete = data.msaStatus?.signed;
  
  return { profileComplete, addressComplete, msaComplete };
}

function StatusBadge({ complete, label }: { complete: boolean; label?: string }) {
  if (complete) {
    return (
      <Badge variant="default" className="bg-success text-success-foreground">
        <CheckCircle className="mr-1 h-3 w-3" />
        Complete
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-warning/10 text-warning-foreground border-warning/20">
      <AlertCircle className="mr-1 h-3 w-3" />
      {label || 'Incomplete'}
    </Badge>
  );
}

function ProfileEditDialog({ userData, companyData, onSave }: { 
  userData: UserDetails; 
  companyData: CompanyDetails;
  onSave: () => void; 
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const userForm = useForm<UserDetails>({
    resolver: zodResolver(userDetailsSchema),
    defaultValues: userData,
  });

  const companyForm = useForm<CompanyDetails>({
    resolver: zodResolver(companyDetailsSchema),
    defaultValues: companyData,
  });

  const countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 
    'France', 'India', 'Japan', 'Singapore', 'Netherlands'
  ];

  const employeeCounts = [
    '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'
  ];

  const handleSave = () => {
    const userValid = userForm.trigger();
    const companyValid = companyForm.trigger();
    
    Promise.all([userValid, companyValid]).then(([userOk, companyOk]) => {
      if (userOk && companyOk) {
        updateUserDetails(userForm.getValues());
        updateCompanyDetails(companyForm.getValues());
        toast({
          title: "Success",
          description: "Profile information updated successfully.",
        });
        setOpen(false);
        onSave();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile & Company Information</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </h3>
            <Form {...userForm}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={userForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={userForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={userForm.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., HR Manager, CEO, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
          </div>

          <Separator />

          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company Information
            </h3>
            <Form {...companyForm}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={companyForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="legalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Legal Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter legal company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={companyForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="employeeCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Employees *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee count" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employeeCounts.map((count) => (
                            <SelectItem key={count} value={count}>
                              {count} employees
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Form>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddressEditDialog({ addressData, onSave }: { 
  addressData: BusinessAddress;
  onSave: () => void; 
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<BusinessAddress>({
    resolver: zodResolver(addressSchema),
    defaultValues: addressData,
  });

  const handleSave = (data: BusinessAddress) => {
    updateBusinessAddress(data);
    toast({
      title: "Success",
      description: "Business address updated successfully.",
    });
    setOpen(false);
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Business Address</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Business Street, Suite 100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Save Address
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Settings() {
  const [clientData, setClientData] = useState(getClientData());
  const { profileComplete, addressComplete, msaComplete } = getCompletionStatus(clientData);
  
  const refreshData = () => {
    setClientData(getClientData());
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Company Information</h1>
          <p className="text-muted-foreground mt-0.5">Manage your personal and company details</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="space-y-4">
          {/* Profile & Company Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile & Company Information
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your personal and company details
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge complete={profileComplete} />
                  <ProfileEditDialog 
                    userData={clientData.userDetails}
                    companyData={clientData.companyDetails}
                    onSave={refreshData}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="font-medium mb-3">Personal Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <span className="text-sm text-muted-foreground">First Name</span>
                    <p className="font-medium">{clientData.userDetails.firstName || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Last Name</span>
                    <p className="font-medium">{clientData.userDetails.lastName || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-sm text-muted-foreground">Job Title</span>
                    <p className="font-medium">{clientData.userDetails.designation || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Company Info */}
              <div>
                <h3 className="font-medium mb-3">Company Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Company Name</span>
                    <p className="font-medium">{clientData.companyDetails.companyName || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Legal Name</span>
                    <p className="font-medium">{clientData.companyDetails.legalName || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Country</span>
                    <p className="font-medium">{clientData.companyDetails.country || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Number of Employees</span>
                    <p className="font-medium">
                      {clientData.companyDetails.employeeCount ? `${clientData.companyDetails.employeeCount} employees` : 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Address */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Business Address
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your company's registered business address
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge complete={addressComplete} />
                  <AddressEditDialog 
                    addressData={clientData.businessAddress}
                    onSave={refreshData}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <span className="text-sm text-muted-foreground">Street Address</span>
                  <p className="font-medium">{clientData.businessAddress.address || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">City</span>
                  <p className="font-medium">{clientData.businessAddress.city || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">State</span>
                  <p className="font-medium">{clientData.businessAddress.state || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Postal Code</span>
                  <p className="font-medium">{clientData.businessAddress.postalCode || 'Not provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Documents */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Legal Documents
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Master Service Agreement and compliance documents
                  </p>
                </div>
                <StatusBadge complete={msaComplete} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Master Service Agreement (MSA)</p>
                      <p className="text-sm text-muted-foreground">
                        {clientData.msaStatus?.signed 
                          ? `Signed on ${new Date(clientData.msaStatus.signedDate).toLocaleDateString()}` 
                          : 'Agreement pending signature'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge 
                      complete={clientData.msaStatus?.signed} 
                      label={clientData.msaStatus?.signed ? 'Signed' : 'Pending'}
                    />
                    {!clientData.msaStatus?.signed && (
                      <Button variant="outline" size="sm">
                        Review & Sign
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}