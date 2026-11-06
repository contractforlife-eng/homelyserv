import React from 'react';
import UserAvatar from './users/UserAvatar';
import { isStaffRole } from '../utils/staffIdentityPolicy';

export default function WallAvatar({ author = {} }) {
  const premium = !isStaffRole(author.role) && author.isPremium === true;
  return <UserAvatar name={author.displayName || author.fullName || ''}
    image={author.profileImage || null} role={author.role} size="md" isPremium={premium}
    className={`wall-person-avatar ${premium ? 'wall-premium-avatar' : ''}`} />;
}
