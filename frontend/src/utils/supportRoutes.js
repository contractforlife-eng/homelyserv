// Role-aware support navigation helpers.
// Routes referenced here are the real, existing protected routes in App.jsx.

export const getMessagesRoute = (role) => {
  switch ((role || '').toUpperCase()) {
    case 'WORKER':
      return '/worker-messages';
    case 'EMPLOYER':
      return '/employer-messages';
    case 'ADMIN':
      return '/admin/messages';
    case 'SUPPORT':
      return '/support-messages';
    default:
      // Safe fallback: /messages redirects to the role's messaging area,
      // or to the login page when the visitor is not authenticated.
      return '/messages';
  }
};

export const getComplaintsRoute = (role) => {
  switch ((role || '').toUpperCase()) {
    case 'WORKER':
      return '/worker-complaints';
    case 'EMPLOYER':
      return '/employer-complaints';
    case 'ADMIN':
      return '/admin/complaints';
    case 'SUPPORT':
      return '/support-complaints';
    default:
      // Safe fallback: the public contact page (no fabricated routes).
      return '/contact';
  }
};

// Roles that may hire WORKER accounts and pay the HomelyServ commission for
// their OWN hires. Mirrors backend/src/services/hireAuthorization.js
// (HIRING_CALLER_ROLES) so the frontend and backend share one role list.
// EMPLOYER behaviour is unchanged.
export const HIRING_ROLES = ['EMPLOYER', 'TEACHER', 'DOCTOR'];

export const isHiringRole = (role) =>
  HIRING_ROLES.includes(String(role || '').toUpperCase());