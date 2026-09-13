// frontend/src/components/VerificationBadge.jsx
import React from 'react';
import VerifiedBadge from './verification/VerifiedBadge';

const VerificationBadge = ({ verification, isVerified, userId, userRole, showLabel = true, size = 'sm', className = '' }) => {
  return (
    <VerifiedBadge
      verification={verification}
      isVerified={isVerified}
      showLabel={showLabel}
      size={size}
      className={className}
    />
  );
};

export default VerificationBadge;