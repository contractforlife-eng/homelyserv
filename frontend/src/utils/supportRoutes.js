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