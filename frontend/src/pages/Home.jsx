import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HeartPulse,
  HeartHandshake,
  Car,
  ChefHat,
  Home as HomeIcon,
  TreePine,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Globe2,
  Smartphone,
  Download,
  QrCode,
  Star,
  Users,
  ChevronRight,
  Compass,
  MessageSquare,
  Lock,
  Menu,
  X,
  Stethoscope,
  BookOpen,
  Calendar,
  Layers,
  MapPin,
  Clock,
  Shield,
  Award
} from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { createQrMatrix } from '../utils/qrCode';
import markDark from '../assets/branding/homelyserv-mark-dark.png';
import appIcon from '../assets/branding/homelyserv-app-icon.png';

const DOWNLOAD_URL = 'https://www.homelyserv.com/download';

export default function Home() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Generate QR Code matrix once
  const qrMatrix = useMemo(() => {
    try {
      return createQrMatrix(DOWNLOAD_URL);
      /* eslint-disable-next-line no-unused-vars */
    } catch (e) {
      return [];
    }
  }, []);

  // Smooth scroll helper for internal anchor links
  const scrollToSection = (e, id) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentYear = new Date().getFullYear();

  // Home services list (8 items with dedicated local images)
  const homeServicesList = [
    {
      id: 'nurse',
      icon: HeartPulse,
      image: '/images/services/nurse.jpg',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
      iconBg: 'bg-teal-600 text-white',
      title: t('home.homeServices.nurse.title'),
      desc: t('home.homeServices.nurse.desc')
    },
    {
      id: 'elderly_caregiver',
      icon: HeartHandshake,
      image: '/images/services/elderly-care.jpg',
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
      iconBg: 'bg-rose-600 text-white',
      title: t('home.homeServices.caregiver.title'),
      desc: t('home.homeServices.caregiver.desc')
    },
    {
      id: 'driver',
      icon: Car,
      image: '/images/services/driver.jpg',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      iconBg: 'bg-blue-600 text-white',
      title: t('home.homeServices.driver.title'),
      desc: t('home.homeServices.driver.desc')
    },
    {
      id: 'cook',
      icon: ChefHat,
      image: '/images/services/cook.jpg',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-600 text-white',
      title: t('home.homeServices.cook.title'),
      desc: t('home.homeServices.cook.desc')
    },
    {
      id: 'house_manager',
      icon: HomeIcon,
      image: '/images/services/house-manager.jpg',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      iconBg: 'bg-indigo-600 text-white',
      title: t('home.homeServices.houseManager.title'),
      desc: t('home.homeServices.houseManager.desc')
    },
    {
      id: 'private_tutor',
      icon: GraduationCap,
      image: '/images/services/private-tutor.jpg',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
      iconBg: 'bg-purple-600 text-white',
      title: t('home.homeServices.tutor.title'),
      desc: t('home.homeServices.tutor.desc')
    },
    {
      id: 'security_guard',
      icon: ShieldCheck,
      image: '/images/services/security-guard.jpg',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      iconBg: 'bg-slate-700 text-white',
      title: t('home.homeServices.security.title'),
      desc: t('home.homeServices.security.desc')
    },
    {
      id: 'gardener',
      icon: TreePine,
      image: '/images/services/gardener.jpg',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
      iconBg: 'bg-teal-700 text-white',
      title: t('home.homeServices.gardener.title'),
      desc: t('home.homeServices.gardener.desc')
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-red-600 selection:text-white">
      {/* ========================================================= */}
      {/* 1. STICKY TOP NAVIGATION BAR */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo Brand Link */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <img
              src={markDark}
              alt="HomelyServ Logo"
              className="h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 leading-tight">
                Homely<span className="text-red-600">Serv</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-700">
                Home • Health • Education
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-700">
            <a
              href="#ecosystem"
              onClick={(e) => scrollToSection(e, 'ecosystem')}
              className="hover:text-red-600 transition-colors"
            >
              {t('home.nav.services')}
            </a>
            <a
              href="#healthcare"
              onClick={(e) => scrollToSection(e, 'healthcare')}
              className="hover:text-red-600 transition-colors"
            >
              {t('home.nav.healthcare')}
            </a>
            <a
              href="#education"
              onClick={(e) => scrollToSection(e, 'education')}
              className="hover:text-red-600 transition-colors"
            >
              {t('home.nav.education')}
            </a>
            <a
              href="#home-services"
              onClick={(e) => scrollToSection(e, 'home-services')}
              className="hover:text-red-600 transition-colors"
            >
              {t('home.nav.homeServices')}
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => scrollToSection(e, 'how-it-works')}
              className="hover:text-red-600 transition-colors"
            >
              {t('home.nav.howItWorks')}
            </a>
            <a
              href="#global"
              onClick={(e) => scrollToSection(e, 'global')}
              className="hover:text-red-600 transition-colors"
            >
              {t('home.nav.global')}
            </a>
            <a
              href="#mobile-app"
              onClick={(e) => scrollToSection(e, 'mobile-app')}
              className="hover:text-red-600 transition-colors"
            >
              {t('home.nav.app')}
            </a>
          </nav>

          {/* Actions & Language Switcher */}
          <div className="hidden lg:flex items-center gap-3">
            <LanguageSwitcher />

            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
            >
              {t('home.nav.signIn')}
            </Link>

            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-sm hover:shadow transition transform active:scale-95"
            >
              {t('home.nav.register')}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-red-500"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top duration-200">
            <div className="flex flex-col space-y-2">
              <a
                href="#ecosystem"
                onClick={(e) => scrollToSection(e, 'ecosystem')}
                className="py-2 px-3 text-base font-semibold text-slate-700 rounded-md hover:bg-slate-50"
              >
                {t('home.nav.services')}
              </a>
              <a
                href="#healthcare"
                onClick={(e) => scrollToSection(e, 'healthcare')}
                className="py-2 px-3 text-base font-semibold text-slate-700 rounded-md hover:bg-slate-50"
              >
                {t('home.nav.healthcare')}
              </a>
              <a
                href="#education"
                onClick={(e) => scrollToSection(e, 'education')}
                className="py-2 px-3 text-base font-semibold text-slate-700 rounded-md hover:bg-slate-50"
              >
                {t('home.nav.education')}
              </a>
              <a
                href="#home-services"
                onClick={(e) => scrollToSection(e, 'home-services')}
                className="py-2 px-3 text-base font-semibold text-slate-700 rounded-md hover:bg-slate-50"
              >
                {t('home.nav.homeServices')}
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => scrollToSection(e, 'how-it-works')}
                className="py-2 px-3 text-base font-semibold text-slate-700 rounded-md hover:bg-slate-50"
              >
                {t('home.nav.howItWorks')}
              </a>
              <a
                href="#global"
                onClick={(e) => scrollToSection(e, 'global')}
                className="py-2 px-3 text-base font-semibold text-slate-700 rounded-md hover:bg-slate-50"
              >
                {t('home.nav.global')}
              </a>
              <a
                href="#mobile-app"
                onClick={(e) => scrollToSection(e, 'mobile-app')}
                className="py-2 px-3 text-base font-semibold text-slate-700 rounded-md hover:bg-slate-50"
              >
                {t('home.nav.app')}
              </a>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 font-bold text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                {t('home.nav.signIn')}
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-sm"
              >
                {t('home.nav.register')}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* 2. GLOBAL HERO SECTION (PHOTOGRAPHY-DRIVEN) */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-200/80 py-16 lg:py-24">
        {/* Background decorative grid and subtle ambient lights */}
        <div className="absolute inset-0 bg-[radial-gradient(#dc2626_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-red-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-teal-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Hero Copy (6 cols on lg) */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-start">
              {/* Global Ecosystem Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200/80 text-red-700 text-xs sm:text-sm font-bold tracking-wide shadow-2xs">
                <Globe2 size={16} className="text-red-600 shrink-0" />
                <span>{t('home.hero.badge')}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                {t('home.hero.headlineStart')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-600 to-teal-700">
                  {t('home.hero.headlineHighlight')}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
                {t('home.hero.subtitle')}
              </p>

              {/* Primary Call to Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a
                  href="#ecosystem"
                  onClick={(e) => scrollToSection(e, 'ecosystem')}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-base shadow-lg shadow-red-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center flex items-center justify-center gap-2"
                >
                  <span>{t('home.hero.ctaPrimary')}</span>
                  <ArrowRight size={18} />
                </a>

                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-base border-2 border-slate-200 shadow-sm transition text-center"
                >
                  {t('home.hero.ctaSecondary')}
                </Link>
              </div>

              {/* Verified Trust Stats Ribbon */}
              <div className="pt-6 border-t border-slate-200/90 grid grid-cols-3 gap-4 max-w-xl">
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    {t('home.hero.stat1Number')}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">
                    {t('home.hero.stat1Label')}
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-teal-700">
                    {t('home.hero.stat2Number')}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">
                    {t('home.hero.stat2Label')}
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-red-600">
                    {t('home.hero.stat3Number')}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">
                    {t('home.hero.stat3Label')}
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Visual Photography Composition (6 cols on lg) */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-full max-w-lg">
                {/* Decorative border highlight */}
                <div className="absolute -inset-2 bg-gradient-to-r from-red-500/20 via-teal-500/20 to-slate-200/50 rounded-3xl blur-xl" />

                {/* Primary Hero Photograph Panel */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 group">
                  <img
                    src="/images/hero/hero-family-care.jpg"
                    alt="HomelyServ Global Platform Ecosystem"
                    className="w-full h-80 sm:h-96 lg:h-[430px] object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Subtle dark gradient overlay at bottom for readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-end p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                        {t('home.hero.badgeLive')}
                      </span>
                      <span className="text-xs font-medium text-slate-200">
                        {t('home.hero.previewSub')}
                      </span>
                    </div>
                    <p className="text-white font-bold text-lg leading-tight">
                      {t('home.hero.previewTitle')}
                    </p>
                  </div>
                </div>

                {/* Floating Glass Pill: Verified Doctor & Health */}
                <div className="absolute -top-4 -left-4 sm:-left-6 bg-white/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-in fade-in duration-500">
                  <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold shrink-0">
                    <Stethoscope size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">
                      {t('home.ecosystem.healthCardTitle')}
                    </div>
                    <div className="text-[11px] font-medium text-teal-700 flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-teal-600" />
                      <span>{t('home.whyUs.pillar1Title')}</span>
                    </div>
                  </div>
                </div>

                {/* Floating Glass Pill: Certified Education & Tutors */}
                <div className="absolute -bottom-4 -right-4 sm:-right-6 bg-white/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-in fade-in duration-500">
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">
                      {t('home.ecosystem.eduCardTitle')}
                    </div>
                    <div className="text-[11px] font-medium text-indigo-600 flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-indigo-600" />
                      <span>{t('home.education.studentTitle')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. THE 3-PILLAR ECOSYSTEM SECTION (LARGE PROMINENT PHOTOS) */}
      {/* ========================================================= */}
      <section id="ecosystem" className="py-20 lg:py-28 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-red-600 uppercase bg-red-50 px-3.5 py-1 rounded-full border border-red-100">
              {t('home.ecosystem.tag')}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              {t('home.ecosystem.title')}
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              {t('home.ecosystem.subtitle')}
            </p>
          </div>

          {/* 3 Major Pillar Cards with prominent photography */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1: Home Services */}
            <div className="rounded-3xl border-2 border-slate-200/90 bg-white hover:border-red-500 transition-all duration-300 shadow-sm hover:shadow-xl overflow-hidden flex flex-col group">
              <div className="relative h-56 sm:h-64 overflow-hidden bg-slate-100">
                <img
                  src="/images/services/house-manager.jpg"
                  alt={t('home.ecosystem.homeCardTitle')}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-white/95 text-red-700 shadow-md border border-red-100 flex items-center gap-1.5">
                    <HomeIcon size={14} className="text-red-600" />
                    <span>Home</span>
                  </span>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                    {t('home.ecosystem.homeCardTitle')}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('home.ecosystem.homeCardDesc')}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <a
                    href="#home-services"
                    onClick={(e) => scrollToSection(e, 'home-services')}
                    className="inline-flex items-center gap-2 font-bold text-sm text-red-600 group-hover:text-red-700"
                  >
                    <span>{t('home.ecosystem.homeCardCta')}</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            </div>

            {/* Pillar 2: Healthcare & Doctors */}
            <div className="rounded-3xl border-2 border-teal-200/90 bg-teal-50/20 hover:border-teal-600 transition-all duration-300 shadow-sm hover:shadow-xl overflow-hidden flex flex-col group">
              <div className="relative h-56 sm:h-64 overflow-hidden bg-teal-100">
                <img
                  src="/images/services/nurse.jpg"
                  alt={t('home.ecosystem.healthCardTitle')}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-white/95 text-teal-800 shadow-md border border-teal-200 flex items-center gap-1.5">
                    <Stethoscope size={14} className="text-teal-700" />
                    <span>Health</span>
                  </span>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                    {t('home.ecosystem.healthCardTitle')}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('home.ecosystem.healthCardDesc')}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <a
                    href="#healthcare"
                    onClick={(e) => scrollToSection(e, 'healthcare')}
                    className="inline-flex items-center gap-2 font-bold text-sm text-teal-800 group-hover:text-teal-900"
                  >
                    <span>{t('home.ecosystem.healthCardCta')}</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            </div>

            {/* Pillar 3: Education & Tutoring */}
            <div className="rounded-3xl border-2 border-slate-200/90 bg-white hover:border-indigo-600 transition-all duration-300 shadow-sm hover:shadow-xl overflow-hidden flex flex-col group">
              <div className="relative h-56 sm:h-64 overflow-hidden bg-slate-100">
                <img
                  src="/images/services/private-tutor.jpg"
                  alt={t('home.ecosystem.eduCardTitle')}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-white/95 text-indigo-700 shadow-md border border-indigo-200 flex items-center gap-1.5">
                    <BookOpen size={14} className="text-indigo-600" />
                    <span>Education</span>
                  </span>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                    {t('home.ecosystem.eduCardTitle')}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('home.ecosystem.eduCardDesc')}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <a
                    href="#education"
                    onClick={(e) => scrollToSection(e, 'education')}
                    className="inline-flex items-center gap-2 font-bold text-sm text-indigo-700 group-hover:text-indigo-800"
                  >
                    <span>{t('home.ecosystem.eduCardCta')}</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. HEALTHCARE SECTION (SPLIT WITH PROMINENT PHOTOGRAPHY) */}
      {/* ========================================================= */}
      <section id="healthcare" className="py-20 lg:py-28 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs sm:text-sm font-bold tracking-wider text-teal-800 uppercase bg-teal-50 px-3.5 py-1 rounded-full border border-teal-200">
                {t('home.healthcare.tag')}
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {t('home.healthcare.title')}
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                {t('home.healthcare.subtitle')}
              </p>

              {/* 4 Key Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center gap-2.5 text-teal-800 font-bold text-base mb-1.5">
                    <ShieldCheck size={18} className="shrink-0" />
                    <h4>{t('home.healthcare.feature1Title')}</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-normal">
                    {t('home.healthcare.feature1Desc')}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center gap-2.5 text-teal-800 font-bold text-base mb-1.5">
                    <MapPin size={18} className="shrink-0" />
                    <h4>{t('home.healthcare.feature2Title')}</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-normal">
                    {t('home.healthcare.feature2Desc')}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center gap-2.5 text-teal-800 font-bold text-base mb-1.5">
                    <HeartPulse size={18} className="shrink-0" />
                    <h4>{t('home.healthcare.feature3Title')}</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-normal">
                    {t('home.healthcare.feature3Desc')}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center gap-2.5 text-teal-800 font-bold text-base mb-1.5">
                    <Calendar size={18} className="shrink-0" />
                    <h4>{t('home.healthcare.feature4Title')}</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-normal">
                    {t('home.healthcare.feature4Desc')}
                  </p>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  to="/register?role=employer"
                  className="px-6 py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md transition"
                >
                  {t('home.healthcare.doctorCta')}
                </Link>
                <Link
                  to="/register?role=doctor"
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-2xs transition"
                >
                  {t('home.healthcare.doctorRoleCta')}
                </Link>
              </div>
            </div>

            {/* Right Visual Image Column */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-full max-w-lg">
                <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 aspect-4/3 relative group">
                  <img
                    src="/images/services/nurse.jpg"
                    alt="Healthcare and Medical Consultations on HomelyServ"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex items-end p-6">
                    <div className="text-white space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-600 text-white text-xs font-bold shadow-md">
                        <Stethoscope size={14} />
                        <span>{t('home.healthcare.feature1Title')}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-200">
                        {t('home.healthcare.feature2Desc')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. EDUCATION SECTION (BALANCED SPLIT WITH PROMINENT PHOTO) */}
      {/* ========================================================= */}
      <section id="education" className="py-20 lg:py-28 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-indigo-700 uppercase bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-100">
              {t('home.education.tag')}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              {t('home.education.title')}
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              {t('home.education.subtitle')}
            </p>
          </div>

          {/* Upper Featured Photography Banner */}
          <div className="mb-12 rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-slate-900 relative group h-72 sm:h-96">
            <img
              src="/images/services/private-tutor.jpg"
              alt="Education and Tutoring on HomelyServ"
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex items-end p-8">
              <div className="text-white max-w-2xl space-y-2">
                <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider">
                  {t('home.education.tag')}
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {t('home.education.title')}
                </h3>
                <p className="text-sm sm:text-base text-slate-200">
                  {t('home.education.subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Two Balanced Columns: For Students vs For Teachers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Column 1: For Students & Families */}
            <div className="rounded-2xl border-2 border-slate-200/90 bg-slate-50/50 p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <GraduationCap size={24} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  {t('home.education.studentTitle')}
                </h3>
                <ul className="space-y-3 pt-2">
                  <li className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle2 size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                    <span>{t('home.education.studentPillar1')}</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle2 size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                    <span>{t('home.education.studentPillar2')}</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle2 size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                    <span>{t('home.education.studentPillar3')}</span>
                  </li>
                </ul>
              </div>

              <div>
                <Link
                  to="/register?role=student"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition"
                >
                  <span>{t('home.education.studentCta')}</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Column 2: For Educators & Tutors */}
            <div className="rounded-2xl border-2 border-slate-200/90 bg-slate-50/50 p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  {t('home.education.teacherTitle')}
                </h3>
                <ul className="space-y-3 pt-2">
                  <li className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle2 size={18} className="text-teal-700 shrink-0 mt-0.5" />
                    <span>{t('home.education.teacherPillar1')}</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle2 size={18} className="text-teal-700 shrink-0 mt-0.5" />
                    <span>{t('home.education.teacherPillar2')}</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle2 size={18} className="text-teal-700 shrink-0 mt-0.5" />
                    <span>{t('home.education.teacherPillar3')}</span>
                  </li>
                </ul>
              </div>

              <div>
                <Link
                  to="/register?role=teacher"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-sm transition"
                >
                  <span>{t('home.education.teacherCta')}</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. HOME SERVICES SECTION (8 SPECIALTIES WITH LOCAL PHOTOS) */}
      {/* ========================================================= */}
      <section id="home-services" className="py-20 lg:py-28 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-red-600 uppercase bg-red-50 px-3.5 py-1 rounded-full border border-red-100">
              {t('home.homeServices.tag')}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              {t('home.homeServices.title')}
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              {t('home.homeServices.subtitle')}
            </p>
          </div>

          {/* 8 Photo Service Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {homeServicesList.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* Photo container */}
                  <div className="relative h-44 overflow-hidden bg-slate-100">
                    <img
                      src={service.image}
                      alt={service.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-xs shadow-2xs ${service.badgeColor}`}>
                        {service.title}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${service.iconBg}`}>
                          <Icon size={16} />
                        </div>
                        <h4 className="font-bold text-slate-900 text-base">
                          {service.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {service.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <Link
                        to={`/register?role=employer&category=${service.id}`}
                        className="text-xs font-bold text-red-600 group-hover:text-red-700 inline-flex items-center gap-1"
                      >
                        <span>{t('home.homeServices.ctaExplore')}</span>
                        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. ONE GLOBAL PLATFORM SECTION (5 PARTICIPANT ROLES) */}
      {/* ========================================================= */}
      <section className="py-20 lg:py-28 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-teal-800 uppercase bg-teal-50 px-3.5 py-1 rounded-full border border-teal-200">
              {t('home.onePlatform.tag')}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              {t('home.onePlatform.title')}
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              {t('home.onePlatform.subtitle')}
            </p>
          </div>

          {/* 5 Distinct Roles Subtle Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* 1: Workers */}
            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50 hover:bg-white hover:border-red-400 hover:shadow-lg transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <HomeIcon size={22} />
                </div>
                <h4 className="font-bold text-slate-900 text-lg">
                  {t('home.onePlatform.roleWorker')}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('home.onePlatform.roleWorkerDesc')}
                </p>
              </div>
              <div className="pt-6">
                <Link
                  to="/register?role=worker"
                  className="text-xs font-bold text-red-600 group-hover:text-red-700 inline-flex items-center gap-1"
                >
                  <span>{t('home.nav.register')}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* 2: Employers */}
            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50 hover:bg-white hover:border-slate-800 hover:shadow-lg transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center font-bold">
                  <Users size={22} />
                </div>
                <h4 className="font-bold text-slate-900 text-lg">
                  {t('home.onePlatform.roleEmployer')}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('home.onePlatform.roleEmployerDesc')}
                </p>
              </div>
              <div className="pt-6">
                <Link
                  to="/register?role=employer"
                  className="text-xs font-bold text-slate-800 group-hover:text-slate-900 inline-flex items-center gap-1"
                >
                  <span>{t('home.nav.register')}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* 3: Doctors */}
            <div className="rounded-2xl border border-teal-200 p-6 bg-teal-50/30 hover:bg-white hover:border-teal-600 hover:shadow-lg transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <Stethoscope size={22} />
                </div>
                <h4 className="font-bold text-slate-900 text-lg">
                  {t('home.onePlatform.roleDoctor')}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('home.onePlatform.roleDoctorDesc')}
                </p>
              </div>
              <div className="pt-6">
                <Link
                  to="/register?role=doctor"
                  className="text-xs font-bold text-teal-800 group-hover:text-teal-900 inline-flex items-center gap-1"
                >
                  <span>{t('home.nav.register')}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* 4: Teachers */}
            <div className="rounded-2xl border border-indigo-200 p-6 bg-indigo-50/30 hover:bg-white hover:border-indigo-600 hover:shadow-lg transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <BookOpen size={22} />
                </div>
                <h4 className="font-bold text-slate-900 text-lg">
                  {t('home.onePlatform.roleTeacher')}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('home.onePlatform.roleTeacherDesc')}
                </p>
              </div>
              <div className="pt-6">
                <Link
                  to="/register?role=teacher"
                  className="text-xs font-bold text-indigo-700 group-hover:text-indigo-800 inline-flex items-center gap-1"
                >
                  <span>{t('home.nav.register')}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* 5: Students */}
            <div className="rounded-2xl border border-purple-200 p-6 bg-purple-50/30 hover:bg-white hover:border-purple-600 hover:shadow-lg transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <GraduationCap size={22} />
                </div>
                <h4 className="font-bold text-slate-900 text-lg">
                  {t('home.onePlatform.roleStudent')}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('home.onePlatform.roleStudentDesc')}
                </p>
              </div>
              <div className="pt-6">
                <Link
                  to="/register?role=student"
                  className="text-xs font-bold text-purple-700 group-hover:text-purple-800 inline-flex items-center gap-1"
                >
                  <span>{t('home.nav.register')}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. WHY HOMELYSERV (6 TRUST PILLARS) */}
      {/* ========================================================= */}
      <section id="why-us" className="py-20 lg:py-28 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-red-600 uppercase bg-red-50 px-3.5 py-1 rounded-full border border-red-100">
              {t('home.whyUs.tag')}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              {t('home.whyUs.title')}
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              {t('home.whyUs.subtitle')}
            </p>
          </div>

          {/* 6 Trust & Architecture Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 1: Verified Credentials */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
              <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">
                {t('home.whyUs.pillar1Title')}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t('home.whyUs.pillar1Desc')}
              </p>
            </div>

            {/* 2: Direct Connection */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
              <div className="h-10 w-10 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                <MessageSquare size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">
                {t('home.whyUs.pillar2Title')}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t('home.whyUs.pillar2Desc')}
              </p>
            </div>

            {/* 3: Multilingual Interface */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Globe2 size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">
                {t('home.whyUs.pillar3Title')}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t('home.whyUs.pillar3Desc')}
              </p>
            </div>

            {/* 4: Smart Scheduling */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Calendar size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">
                {t('home.whyUs.pillar4Title')}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t('home.whyUs.pillar4Desc')}
              </p>
            </div>

            {/* 5: Data Security */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
              <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Lock size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">
                {t('home.whyUs.pillar5Title')}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t('home.whyUs.pillar5Desc')}
              </p>
            </div>

            {/* 6: Global & Mobile Freedom */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
              <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                <Smartphone size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">
                {t('home.whyUs.pillar6Title')}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t('home.whyUs.pillar6Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 9. UNIVERSAL HOW IT WORKS SECTION (3 STEPS) */}
      {/* ========================================================= */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-red-600 uppercase bg-red-50 px-3.5 py-1 rounded-full border border-red-100">
              {t('home.howItWorks.tag')}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              {t('home.howItWorks.title')}
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              {t('home.howItWorks.subtitle')}
            </p>
          </div>

          {/* 3 Step Process Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1: Discover */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 relative space-y-4">
              <div className="h-12 w-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {t('home.howItWorks.step1Title')}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t('home.howItWorks.step1Desc')}
              </p>
            </div>

            {/* Step 2: Connect */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 relative space-y-4">
              <div className="h-12 w-12 rounded-xl bg-teal-700 text-white flex items-center justify-center font-black text-lg shadow-sm">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {t('home.howItWorks.step2Title')}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t('home.howItWorks.step2Desc')}
              </p>
            </div>

            {/* Step 3: Manage */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 relative space-y-4">
              <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-sm">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {t('home.howItWorks.step3Title')}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t('home.howItWorks.step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 10. GLOBAL REACH SECTION (LARGE COMMUNITY IMAGE) */}
      {/* ========================================================= */}
      <section id="global" className="py-20 lg:py-28 bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Narrative */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs sm:text-sm font-bold tracking-wider text-teal-400 uppercase bg-teal-950/80 px-3.5 py-1 rounded-full border border-teal-800">
                {t('home.globalReach.tag')}
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {t('home.globalReach.title')}
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                {t('home.globalReach.subtitle')}
              </p>

              {/* Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <h4 className="font-bold text-white text-base mb-1">
                    {t('home.globalReach.card1Title')}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300">
                    {t('home.globalReach.card1Desc')}
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <h4 className="font-bold text-white text-base mb-1">
                    {t('home.globalReach.card2Title')}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300">
                    {t('home.globalReach.card2Desc')}
                  </p>
                </div>
              </div>

              {/* Badges for the 6 official languages */}
              <div className="pt-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  {t('home.globalReach.languagesTitle')}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <span className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-100 border border-slate-700">
                    English (EN)
                  </span>
                  <span className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-100 border border-slate-700">
                    العربية (AR)
                  </span>
                  <span className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-100 border border-slate-700">
                    Français (FR)
                  </span>
                  <span className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-100 border border-slate-700">
                    Русский (RU)
                  </span>
                  <span className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-100 border border-slate-700">
                    Türkçe (TR)
                  </span>
                  <span className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-100 border border-slate-700">
                    Deutsch (DE)
                  </span>
                </div>
              </div>
            </div>

            {/* Right Global Visual Feature (Large local photo card) */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-full max-w-lg">
                <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-950 aspect-16/10 relative group">
                  <img
                    src="/social/homelyserv-share.jpg"
                    alt="HomelyServ Global Reach"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent flex flex-col justify-end p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
                        <Globe2 size={18} />
                      </div>
                      <span className="text-sm font-bold text-white">
                        {t('home.globalReach.card1Title')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      {t('home.globalReach.subtitle')}
                    </p>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <Link
                    to="/register"
                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-500 transition shadow-md"
                  >
                    <span>{t('home.globalReach.cta')}</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 11. MOBILE APP SECTION & VERIFIED QR CODE (WITH LOCAL ASSETS) */}
      {/* ========================================================= */}
      <section id="mobile-app" className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3">
                <img
                  src={appIcon}
                  alt="HomelyServ Android App Icon"
                  className="h-12 w-12 rounded-2xl shadow-md border border-slate-200"
                />
                <span className="text-xs sm:text-sm font-bold tracking-wider text-red-600 uppercase bg-red-50 px-3.5 py-1 rounded-full border border-red-100">
                  {t('home.appSection.tag')}
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
                {t('home.appSection.title')}
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                {t('home.appSection.subtitle')}
              </p>

              {/* App Features List */}
              <ul className="space-y-3 pt-2">
                <li className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                  <CheckCircle2 size={18} className="text-teal-700 shrink-0" />
                  <span>{t('home.appSection.bullet1')}</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                  <CheckCircle2 size={18} className="text-teal-700 shrink-0" />
                  <span>{t('home.appSection.bullet2')}</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                  <CheckCircle2 size={18} className="text-teal-700 shrink-0" />
                  <span>{t('home.appSection.bullet3')}</span>
                </li>
              </ul>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  to="/download"
                  className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition shadow-sm"
                >
                  <Download size={18} />
                  <span>{t('home.appSection.downloadBtn')}</span>
                </Link>
                <Link
                  to="/download"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
                >
                  <span>{t('home.appSection.viewPageBtn')}</span>
                </Link>
              </div>
            </div>

            {/* Right: Real Scannable SVG QR Code Card + Local App Preview */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="bg-white rounded-3xl p-8 border-2 border-slate-200/90 shadow-2xl max-w-sm w-full text-center space-y-6">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-lg text-slate-900">
                    {t('home.appSection.tag')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('home.appSection.scanPrompt')}
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-center">
                  {qrMatrix && qrMatrix.length > 0 ? (
                    <svg
                      viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                      className="w-56 h-56 max-w-full rounded-lg"
                      shapeRendering="crispEdges"
                    >
                      <rect width="100%" height="100%" fill="#ffffff" />
                      {qrMatrix.map((row, r) =>
                        row.map((dark, c) =>
                          dark ? (
                            <rect
                              key={`${r}-${c}`}
                              x={c}
                              y={r}
                              width={1}
                              height={1}
                              fill="#0f172a"
                            />
                          ) : null
                        )
                      )}
                    </svg>
                  ) : (
                    <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400">
                      <QrCode size={48} className="mb-2 text-slate-300" />
                      <span className="text-xs font-semibold">QR Code</span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 font-medium break-all">
                  {DOWNLOAD_URL}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 12. FINAL CALL TO ACTION (RED GRADIENT BANNER) */}
      {/* ========================================================= */}
      <section className="py-20 lg:py-24 bg-gradient-to-r from-red-600 via-red-600 to-red-700 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(white_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            {t('home.finalCta.headline')}
          </h2>
          <p className="text-base sm:text-lg text-red-100 max-w-2xl mx-auto font-normal">
            {t('home.finalCta.subheadline')}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-red-600 font-extrabold text-base shadow-xl hover:bg-slate-50 transition transform hover:-translate-y-0.5 active:translate-y-0 text-center"
            >
              {t('home.finalCta.primaryBtn')}
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-red-800/80 hover:bg-red-800 text-white font-bold text-base border border-red-500 shadow-sm transition text-center"
            >
              {t('home.finalCta.secondaryBtn')}
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 13. OFFICIAL BRAND FOOTER */}
      {/* ========================================================= */}
      <footer className="bg-slate-950 text-slate-300 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
            {/* Column 1: Brand Info (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={markDark}
                  alt="HomelyServ Logo"
                  className="h-10 w-auto object-contain brightness-0 invert"
                />
                <span className="font-extrabold text-xl text-white tracking-tight">
                  Homely<span className="text-red-500">Serv</span>
                </span>
              </div>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                {t('home.footer.tagline')}
              </p>
            </div>

            {/* Column 2: Ecosystem Pillars */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white tracking-wider uppercase">
                {t('home.footer.categories')}
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#home-services"
                    onClick={(e) => scrollToSection(e, 'home-services')}
                    className="text-slate-400 hover:text-white transition"
                  >
                    {t('home.footer.homeServices')}
                  </a>
                </li>
                <li>
                  <a
                    href="#healthcare"
                    onClick={(e) => scrollToSection(e, 'healthcare')}
                    className="text-slate-400 hover:text-white transition"
                  >
                    {t('home.footer.healthcare')}
                  </a>
                </li>
                <li>
                  <a
                    href="#education"
                    onClick={(e) => scrollToSection(e, 'education')}
                    className="text-slate-400 hover:text-white transition"
                  >
                    {t('home.footer.education')}
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Platform Links */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white tracking-wider uppercase">
                {t('home.footer.quickLinks')}
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/about" className="text-slate-400 hover:text-white transition">
                    {t('home.footer.about')}
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-slate-400 hover:text-white transition">
                    {t('home.footer.contact')}
                  </Link>
                </li>
                <li>
                  <Link to="/help" className="text-slate-400 hover:text-white transition">
                    {t('home.footer.help')}
                  </Link>
                </li>
                <li>
                  <Link to="/download" className="text-slate-400 hover:text-white transition">
                    {t('home.nav.app')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Legal & Trust */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white tracking-wider uppercase">
                {t('home.footer.legal')}
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/privacy" className="text-slate-400 hover:text-white transition">
                    {t('home.footer.privacy')}
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-slate-400 hover:text-white transition">
                    {t('home.footer.terms')}
                  </Link>
                </li>
                <li>
                  <Link to="/refund-policy" className="text-slate-400 hover:text-white transition">
                    {t('home.footer.refund')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              {t('home.footer.copyright', { year: currentYear })}
            </div>
            <div className="flex items-center gap-6">
              <span>Home • Health • Education</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
