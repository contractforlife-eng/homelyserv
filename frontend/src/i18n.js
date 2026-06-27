import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English
const en = {
  translation: {
    appName: 'HomelyServ',
    signIn: 'Sign in to your account',
    email: 'Email address',
    password: 'Password',
    login: 'Login',
    noAccount: "Don't have an account?",
    createOne: 'Create one',
    orSignInWith: 'Or sign in with',
    language: 'Language',
    welcome: 'Welcome back!',
    dashboard: 'Dashboard',
    search: 'Search Workers',
    myHires: 'My Hires',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Logout',
    register: 'Register',
    fullName: 'Full Name',
    role: 'Role',
    phone: 'Phone',
    city: 'City',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    signInLink: 'Sign in'
  }
};

// Arabic
const ar = {
  translation: {
    appName: 'هوملي سيرف',
    signIn: 'تسجيل الدخول إلى حسابك',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    login: 'تسجيل الدخول',
    noAccount: 'ليس لديك حساب؟',
    createOne: 'إنشاء حساب',
    orSignInWith: 'أو سجل عبر',
    language: 'اللغة',
    welcome: 'مرحباً بعودتك!',
    dashboard: 'لوحة التحكم',
    search: 'البحث عن عمال',
    myHires: 'توظيفاتي',
    profile: 'الملف الشخصي',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    register: 'إنشاء حساب',
    fullName: 'الاسم الكامل',
    role: 'الدور',
    phone: 'الهاتف',
    city: 'المدينة',
    createAccount: 'إنشاء حساب',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',
    signInLink: 'تسجيل الدخول'
  }
};

// Russian
const ru = {
  translation: {
    appName: 'ХомлиСерв',
    signIn: 'Войдите в свой аккаунт',
    email: 'Электронная почта',
    password: 'Пароль',
    login: 'Войти',
    noAccount: 'Нет аккаунта?',
    createOne: 'Создать',
    orSignInWith: 'Или войдите через',
    language: 'Язык',
    welcome: 'С возвращением!',
    dashboard: 'Панель управления',
    search: 'Поиск работников',
    myHires: 'Мои наймы',
    profile: 'Профиль',
    settings: 'Настройки',
    logout: 'Выйти',
    register: 'Регистрация',
    fullName: 'Полное имя',
    role: 'Роль',
    phone: 'Телефон',
    city: 'Город',
    createAccount: 'Создать аккаунт',
    alreadyHaveAccount: 'Уже есть аккаунт?',
    signInLink: 'Войти'
  }
};

// Turkish
const tr = {
  translation: {
    appName: 'HomlyServ',
    signIn: 'Hesabınıza giriş yapın',
    email: 'E-posta adresi',
    password: 'Şifre',
    login: 'Giriş Yap',
    noAccount: 'Hesabınız yok mu?',
    createOne: 'Hesap oluştur',
    orSignInWith: 'Veya ile giriş yap',
    language: 'Dil',
    welcome: 'Tekrar hoş geldiniz!',
    dashboard: 'Kontrol Paneli',
    search: 'İşçi Ara',
    myHires: 'Kiralamalarım',
    profile: 'Profil',
    settings: 'Ayarlar',
    logout: 'Çıkış Yap',
    register: 'Kayıt Ol',
    fullName: 'Ad Soyad',
    role: 'Rol',
    phone: 'Telefon',
    city: 'Şehir',
    createAccount: 'Hesap Oluştur',
    alreadyHaveAccount: 'Zaten hesabınız var mı?',
    signInLink: 'Giriş Yap'
  }
};

// French
const fr = {
  translation: {
    appName: 'HomelyServ',
    signIn: 'Connectez-vous à votre compte',
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    login: 'Se connecter',
    noAccount: "Vous n'avez pas de compte ?",
    createOne: 'Créer un compte',
    orSignInWith: 'Ou connectez-vous avec',
    language: 'Langue',
    welcome: 'Bon retour !',
    dashboard: 'Tableau de bord',
    search: 'Rechercher des travailleurs',
    myHires: 'Mes embauches',
    profile: 'Profil',
    settings: 'Paramètres',
    logout: 'Se déconnecter',
    register: "S'inscrire",
    fullName: 'Nom complet',
    role: 'Rôle',
    phone: 'Téléphone',
    city: 'Ville',
    createAccount: 'Créer un compte',
    alreadyHaveAccount: 'Vous avez déjà un compte ?',
    signInLink: 'Se connecter'
  }
};

// Dutch
const nl = {
  translation: {
    appName: 'HomelyServ',
    signIn: 'Log in op uw account',
    email: 'E-mailadres',
    password: 'Wachtwoord',
    login: 'Inloggen',
    noAccount: 'Geen account?',
    createOne: 'Een aanmaken',
    orSignInWith: 'Of log in met',
    language: 'Taal',
    welcome: 'Welkom terug!',
    dashboard: 'Dashboard',
    search: 'Zoek werknemers',
    myHires: 'Mijn aanwervingen',
    profile: 'Profiel',
    settings: 'Instellingen',
    logout: 'Uitloggen',
    register: 'Registreren',
    fullName: 'Volledige naam',
    role: 'Rol',
    phone: 'Telefoon',
    city: 'Stad',
    createAccount: 'Account aanmaken',
    alreadyHaveAccount: 'Al een account?',
    signInLink: 'Inloggen'
  }
};

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: en,
      ar: ar,
      ru: ru,
      tr: tr,
      fr: fr,
      nl: nl
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;