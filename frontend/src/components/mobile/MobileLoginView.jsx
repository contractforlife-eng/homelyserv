import React from 'react';

const MobileLoginView = ({ children, branding, footer }) => {
  return (
    <div className="min-h-dvh flex flex-col bg-white">
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm">
          {branding}
          <div className="mt-6">
            {children}
          </div>
        </div>
      </div>
      {footer}
    </div>
  );
};

export default MobileLoginView;
