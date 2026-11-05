/**
 * Handles Android hardware back button and navigation history
 * in Capacitor environment.
 */
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import toast from 'react-hot-toast';

export const ROLE_ROOT_PATHS = {
  WORKER: '/worker-dashboard',
  EMPLOYER: '/employer-dashboard',
  ADMIN: '/admin',
  DOCTOR: '/doctor-dashboard',
  TEACHER: '/teacher-dashboard',
  STUDENT: '/student-dashboard',
  SUPPORT: '/support-dashboard',
  SUPPORT_HELPER: '/sup-help',
};

export const GUEST_ROOT_PATHS = ['/login', '/', '/register'];

export const EXIT_TOAST_MESSAGES = {
  en: 'Press back again to exit',
  ar: 'اضغط رجوع مرة أخرى للخروج',
  fr: 'Appuyez à nouveau pour quitter',
  de: 'Erneut tippen zum Beenden',
  ru: 'Нажмите назад еще раз для выхода',
  tr: 'Çıkmak için tekrar geri basın',
};

export const getExitToastMessage = (lng = 'en') => {
  const code = String(lng || 'en').slice(0, 2).toLowerCase();
  return EXIT_TOAST_MESSAGES[code] || EXIT_TOAST_MESSAGES.en;
};

/**
 * Checks if the current pathname is a root/dashboard location where
 * pressing back should prompt to exit.
 */
export const isRootPath = (pathname, role, isAuthenticated) => {
  const normPath = pathname.replace(/\/+$/, '') || '/';
  if (!isAuthenticated) {
    return GUEST_ROOT_PATHS.includes(normPath);
  }
  const normRole = (role || '').toUpperCase();
  const expectedRoot = ROLE_ROOT_PATHS[normRole];
  if (expectedRoot && normPath === expectedRoot) {
    return true;
  }
  // If authenticated but for some reason on guest pages or default dashboard path
  if (Object.values(ROLE_ROOT_PATHS).includes(normPath)) {
    return true;
  }
  return false;
};

/**
 * Checks if an open modal, dialog, or drawer overlay exists and closes it.
 * Returns true if an active element was closed, false otherwise.
 */
export const dismissTopmostOverlay = () => {
  if (typeof document === 'undefined') {
    return false;
  }
  // 1. Mobile navigation drawer backdrop / close button
  const drawerCloseBtn = document.querySelector('button[aria-label="Close menu"], button[aria-label="Close"], button[aria-label="close"]');
  const drawerOpen = document.querySelector('.lg\\:hidden.fixed.inset-0.bg-black\\/50');
  if (drawerOpen) {
    drawerOpen.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return true;
  }

  // 2. Active modal / dialog close button or overlay
  const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]'));
  if (dialogs.length > 0) {
    const topmostDialog = dialogs[dialogs.length - 1];
    // Check for a close button inside the dialog
    const closeBtn = topmostDialog.querySelector('button[aria-label*="Close" i], button[aria-label*="close" i], button[aria-label*="cancel" i], button[aria-label*="Cancel" i]');
    if (closeBtn) {
      closeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return true;
    }
    // Alternatively click the dialog backdrop if it acts as overlay
    if (topmostDialog.classList.contains('fixed') && topmostDialog.classList.contains('inset-0')) {
      topmostDialog.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return true;
    }
  }

  return false;
};

/**
 * Main Android back button handler logic.
 * Parameterized for unit testing and clean execution.
 */
export const createBackButtonHandler = ({
  navigate,
  getCurrentLocation,
  getAuthState,
  getLanguage,
  exitApp = () => App.exitApp(),
  notify = (msg) => toast(msg, { id: 'exit-app-toast', duration: 2000 }),
  exitTimeoutMs = 2000,
}) => {
  let lastBackPressTime = 0;

  return async (canGoBackFromCapacitor) => {
    // Step 1: Check and dismiss any open modal or drawer
    const dismissed = dismissTopmostOverlay();
    if (dismissed) {
      return;
    }

    const { pathname, key } = getCurrentLocation();
    const { isAuthenticated, role } = getAuthState();

    // Step 2: Determine if at root / role dashboard
    const atRoot = isRootPath(pathname, role, isAuthenticated);

    if (atRoot) {
      const now = Date.now();
      if (now - lastBackPressTime < exitTimeoutMs) {
        await exitApp();
      } else {
        lastBackPressTime = now;
        const msg = getExitToastMessage(getLanguage());
        notify(msg);
      }
      return;
    }

    // Step 3: Not at root. Navigate back within app history.
    // If browser/Capacitor history exists and location key is not 'default', go back
    if (canGoBackFromCapacitor !== false && key && key !== 'default') {
      navigate(-1);
      return;
    }

    // Step 4: If history stack cannot go back cleanly or is at the start of session,
    // safely navigate to the role dashboard or login instead of exiting abruptly or looping.
    if (isAuthenticated) {
      const target = ROLE_ROOT_PATHS[(role || '').toUpperCase()] || '/';
      navigate(target, { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };
};

/**
 * Initializes the Capacitor back button listener.
 * Returns an unregister function.
 */
export const setupAndroidBackButton = ({
  navigate,
  locationRef,
  authRef,
  i18nRef,
}) => {
  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  const handler = createBackButtonHandler({
    navigate,
    getCurrentLocation: () => locationRef.current,
    getAuthState: () => authRef.current,
    getLanguage: () => i18nRef.current,
  });

  let backListener = null;

  App.addListener('backButton', ({ canGoBack }) => {
    handler(canGoBack).catch((err) => {
      console.warn('[BackButton] Error handling back event:', err);
    });
  }).then((handle) => {
    backListener = handle;
  }).catch((err) => {
    console.warn('[BackButton] Failed to register listener:', err);
  });

  return () => {
    if (backListener && typeof backListener.remove === 'function') {
      backListener.remove();
    }
  };
};
