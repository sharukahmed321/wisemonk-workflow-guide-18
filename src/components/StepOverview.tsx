import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, User, Briefcase, IndianRupee, CheckCircle } from "lucide-react";

interface StepOverviewProps {
  onStart: () => void;
}

export function StepOverview({ onStart }: StepOverviewProps) {
  const steps = [
    {
      step: 1,
      title: "Personal Information",
      description: "Basic contact details",
      icon: User,
      fields: ["First & Last Name", "Email Address", "Phone Number"],
      time: "1-2 min"
    },
    {
      step: 2,
      title: "Job & Work Details",
      description: "Role specifications with AI assistance",
      icon: Briefcase,
      fields: ["Job Title & Seniority", "Work Location & Start Date", "Job Description (AI-generated)"],
      time: "2-3 min"
    },
    {
      step: 3,
      title: "Compensation & Agreement",
      description: "Salary details and final confirmation",
      icon: IndianRupee,
      fields: ["Salary & Currency", "Department & Employment Type", "Agreement Review"],
      time: "2-3 min"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Add New Employee</h2>
        <p className="text-muted-foreground">
          Complete the following 3 steps to add a new team member. Estimated time: 5-8 minutes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Card key={step.step} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Step {step.step}</CardTitle>
                    <p className="text-sm text-muted-foreground">{step.title}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{step.description}</p>
                <ul className="space-y-1">
                  {step.fields.map((field, index) => (
                    <li key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3 h-3" />
                      {field}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {step.time}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center space-y-4">
        <div className="bg-muted/30 rounded-lg p-4 text-sm">
          <p className="text-muted-foreground">
            <strong>Auto-save enabled:</strong> Your progress will be saved automatically. 
            You can return to complete the form later if needed.
          </p>
        </div>
        
        <Button onClick={onStart} size="lg" className="px-8">
          Start Adding Employee
        </Button>
      </div>
    </div>
  );
}