
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentCard } from './DocumentCard';

export function DocumentsTab() {
  return (
    <div className="space-y-8">
      {/* Identity Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Identity Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DocumentCard
              title="Aadhaar Card"
              type="identity"
              status="verified"
              uploadedDate="15 Dec 2024"
              hasFile={true}
            />
            <DocumentCard
              title="PAN Card"
              type="identity"
              status="pending"
              uploadedDate="20 Dec 2024"
              hasFile={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Employment Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Employment Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DocumentCard
              title="Employment Agreement"
              type="employment"
              status="verified"
              uploadedDate="01 Mar 2022"
              hasFile={true}
            />
            <DocumentCard
              title="Offer Letter"
              type="employment"
              status="verified"
              uploadedDate="25 Feb 2022"
              hasFile={true}
            />
            <DocumentCard
              title="Relieving Letter"
              type="employment"
              status="not_uploaded"
              hasFile={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* Compliance Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Compliance Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DocumentCard
              title="Background Verification"
              type="compliance"
              status="verified"
              uploadedDate="10 Mar 2022"
              hasFile={true}
            />
            <DocumentCard
              title="Medical Certificate"
              type="compliance"
              status="expired"
              uploadedDate="15 Mar 2022"
              expiryDate="15 Mar 2024"
              hasFile={true}
            />
            <DocumentCard
              title="Insurance Documents"
              type="compliance"
              status="pending"
              uploadedDate="20 Dec 2024"
              hasFile={true}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
