
import React from 'react';
import { Users, DollarSign } from 'lucide-react';
export function BrandingSection() {
  return (
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center px-8 py-8 bg-gradient-to-br from-brand-50 via-background to-purple-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-lg w-full">
        <div className="flex items-center gap-4 mb-8">
          {/* Inline SVG logo */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-12 h-12 text-primary"
          >
            <path
              d="M2.87598 20.729C6.82298 29.7 13.5 48 17.394 48C21.642 48 28.957 17.94 34.094 19.652C38.342 21.068 42.755 48 46.294 48C49.833 48 51.73 22.867 52.084 15.08M52.084 15.08L48.806 17.33L53.146 8L55.624 18.619L52.084 15.08Z"
              stroke="currentColor"
              strokeWidth="5"
              strokeMiterlimit="16"
              className="logo_mark"
            />
          </svg>
          <h1 className="text-3xl font-bold text-foreground">Wisemonk</h1>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Your trusted partner to hire and pay in India
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We enable global companies to onboard, manage, and pay full-time employees in India—without setting up a local entity.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center mt-1">
                <Users className="w-3 h-3 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Employer of Record (EOR)</h3>
                <p className="text-muted-foreground">
                  Hire full-time employees in India legally and compliantly
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center mt-1">
                <DollarSign className="w-3 h-3 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Payroll & Compliance</h3>
                <p className="text-muted-foreground">
                  From PF, ESI, and TDS to labor laws—we handle it all, so you don't have to.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}