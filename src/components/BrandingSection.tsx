
import React from 'react';
import { Users, Clock } from 'lucide-react';

export function BrandingSection() {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Image failed to load:', e.currentTarget.src);
    console.error('Error event:', e);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('Image loaded successfully:', e.currentTarget.src);
  };

  return (
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center px-8 py-8 bg-gradient-to-br from-brand-50 via-background to-purple-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 max-w-lg w-full">
        <div className="flex items-center gap-4 mb-8">
          <img 
            src="/lovable-uploads/0748a3d4-1f22-484d-96dc-85520406b146.png" 
            alt="Wisemonk" 
            className="w-12 h-12 object-cover" 
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
          <h1 className="text-3xl font-bold text-foreground">Wisemonk</h1>
        </div>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Your trusted partner to hire and pay in India
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We enable the global companies to onboard, manage, and pay full-time employees in India—without setting up a local entity.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center mt-1">
                <Users className="w-3 h-3 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Employer of Record (EOR)</h3>
                <p className="text-muted-foreground">Efficiently manage your workforce and employee data</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center mt-1">
                <Clock className="w-3 h-3 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Time & Attendance</h3>
                <p className="text-muted-foreground">Track working hours and attendance seamlessly</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
