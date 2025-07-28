
import React from 'react';
import { DocumentCard } from './DocumentCard';

const SectionHeader = ({ title, count }: { title: string, count?: number }) => (
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    {count && (
      <span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
        {count} {count === 1 ? 'document' : 'documents'}
      </span>
    )}
  </div>
);

export function DocumentsTab() {
  return (
    <div className="space-y-10">
      {/* Identity Documents Section */}
      <div>
        <SectionHeader title="Identity Documents" count={2} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </div>

      {/* Employment Documents Section */}
      <div>
        <SectionHeader title="Employment Documents" count={3} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </div>

      {/* Compliance Documents Section */}
      <div>
        <SectionHeader title="Compliance Documents" count={3} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </div>
    </div>
  );
}
