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
  X
} from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { createQrMatrix } from '../utils/qrCode';

const DOWNLOAD_URL = 'https://www.homelyserv.com/download';

export default function Home() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('employer'); // 'employer' | 'worker'

  // Generate QR Code matrix once
  const qrMatrix = useMemo(() => {
    try {
      return createQrMatrix(DOWNLOAD_URL);
    } catch (e) {
      console.error('Failed to generate QR matrix', e);
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

  // Service item configuration mapping keys to icons and category params
  const serviceCategories = [
    {
      id: 'nurse',
      icon: HeartPulse,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBg: 'bg-emerald-500 text-white',
      title: t('home.services.nurse.title'),
      desc: t('home.services.nurse.description')
    },
    {
      id: 'elderly_caregiver',
      icon: HeartHandshake,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      iconBg: 'bg-rose-500 text-white',
      title: t('home.services.elderlyCaregiver.title'),
      desc: t('home.services.elderlyCaregiver.description')
    },
    {
      id: 'driver',
      icon: Car,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-600 text-white',
      title: t('home.services.driver.title'),
      desc: t('home.services.driver.description')
    },
    {
      id: 'cook',
      icon: ChefHat,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      iconBg: 'bg-amber-500 text-white',
      title: t('home.services.cook.title'),
      desc: t('home.services.cook.description')
    },
    {
      id: 'house_manager',
      icon: HomeIcon,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      iconBg: 'bg-indigo-600 text-white',
      title: t('home.services.houseManager.title'),
      desc: t('home.services.houseManager.description')
    },
    {
      id: 'gardener',
      icon: TreePine,
      badgeColor: 'bg-green-50 text-green-700 border-green-200',
      iconBg: 'bg-green-600 text-white',
      title: t('home.services.gardener.title'),
      desc: t('home.services.gardener.description')
    },
    {
      id: 'security_guard',
      icon: ShieldCheck,
      badgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
      iconBg: 'bg-slate-700 text-white',
      title: t('home.services.securityGuard.title'),
      desc: t('home.services.securityGuard.description')
    },
    {
      id: 'bodyguard',
      icon: UserCheck,
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
      iconBg: 'bg-red-600 text-white',
      title: t('home.services.bodyguard.title'),
      desc: t('home.services.bodyguard.description')
    },
    {
      id: 'private_tutor',
      icon: GraduationCap,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      iconBg: 'bg-purple-600 text-white',
      title: t('home.services.privateTutor.title'),
      desc: t('home.services.privateTutor.description')
    }
  ];

  const whyUsPillars = [
    {
      icon: ShieldCheck,
      title: t('home.whyUs.feature1Title'),
      desc: t('home.whyUs.feature1Desc'),
      color: 'text-emerald-600 bg-emerald-50'
    },
    {
      icon: Lock,
      title: t('home.whyUs.feature2Title'),
      desc: t('home.whyUs.feature2Desc'),
      color: 'text-blue-600 bg-blue-50'
    },
    {
      icon: MessageSquare,
      title: t('home.whyUs.feature3Title'),
      desc: t('home.whyUs.feature3Desc'),
      color: 'text-indigo-600 bg-indigo-50'
    },
    {
      icon: Star,
      title: t('home.whyUs.feature4Title'),
      desc: t('home.whyUs.feature4Desc'),
      color: 'text-amber-600 bg-amber-50'
    },
    {
      icon: Globe2,
      title: t('home.whyUs.feature5Title'),
      desc: t('home.whyUs.feature5Desc'),
      color: 'text-teal-600 bg-teal-50'
    },
    {
      icon: Compass,
      title: t('home.whyUs.feature6Title'),
      desc: t('home.whyUs.feature6Desc'),
      color: 'text-rose-600 bg-rose-50'
    }
  ];

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* ========================================================= */}
      {/* 1. HEADER / NAVIGATION */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group focus:outline-none">
              <img
                src="/branding/homelyserv-mark-dark.png"
                alt="HomelyServ"
                className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                Homely<span className="text-red-600">Serv</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <a
                href="#services"
                onClick={(e) => scrollToSection(e, 'services')}
                className="hover:text-red-600 transition-colors py-1"
              >
                {t('home.nav.services')}
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => scrollToSection(e, 'how-it-works')}
                className="hover:text-red-600 transition-colors py-1"
              >
                {t('home.nav.howItWorks')}
              </a>
              <a
                href="#why-homelyserv"
                onClick={(e) => scrollToSection(e, 'why-homelyserv')}
                className="hover:text-red-600 transition-colors py-1"
              >
                {t('home.nav.whyUs')}
              </a>
              <a
                href="#global-reach"
                onClick={(e) => scrollToSection(e, 'global-reach')}
                className="hover:text-red-600 transition-colors py-1"
              >
                {t('home.nav.global')}
              </a>
              <a
                href="#mobile-app"
                onClick={(e) => scrollToSection(e, 'mobile-app')}
                className="hover:text-red-600 transition-colors py-1"
              >
                {t('home.nav.app')}
              </a>
            </nav>

            {/* Actions & Language Switcher */}
            <div className="hidden lg:flex items-center gap-4">
              <LanguageSwitcher />
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-700 hover:text-red-600 px-3 py-2 transition"
              >
                {t('home.nav.signIn')}
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center text-sm font-semibold px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 active:scale-95 transition shadow-sm hover:shadow"
              >
                {t('home.nav.register')}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              <LanguageSwitcher />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 shadow-xl">
            <a
              href="#services"
              onClick={(e) => scrollToSection(e, 'services')}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-red-600"
            >
              {t('home.nav.services')}
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => scrollToSection(e, 'how-it-works')}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-red-600"
            >
              {t('home.nav.howItWorks')}
            </a>
            <a
              href="#why-homelyserv"
              onClick={(e) => scrollToSection(e, 'why-homelyserv')}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-red-600"
            >
              {t('home.nav.whyUs')}
            </a>
            <a
              href="#global-reach"
              onClick={(e) => scrollToSection(e, 'global-reach')}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-red-600"
            >
              {t('home.nav.global')}
            </a>
            <a
              href="#mobile-app"
              onClick={(e) => scrollToSection(e, 'mobile-app')}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-red-600"
            >
              {t('home.nav.app')}
            </a>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full text-center py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                {t('home.nav.signIn')}
              </Link>
              <Link
                to="/register"
                className="w-full text-center py-2.5 text-base font-semibold bg-red-600 text-white rounded-lg shadow hover:bg-red-700"
              >
                {t('home.nav.register')}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100/70 pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200/60">
        {/* Background Decorative Blobs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-60 -left-40 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200/80 text-red-700 text-xs sm:text-sm font-semibold tracking-wide shadow-xs mx-auto lg:mx-0">
                <Sparkles size={16} className="text-red-600 animate-pulse" />
                <span>{t('home.hero.badge')}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                {t('home.hero.headlineStart')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">
                  {t('home.hero.headlineHighlight')}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                {t('home.hero.subtitle')}
              </p>

              {/* Dual Role CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/register?role=employer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-red-600 text-white font-bold text-base shadow-lg shadow-red-600/25 hover:bg-red-700 hover:shadow-xl hover:shadow-red-600/30 active:scale-[0.98] transition-all group"
                >
                  <span>{t('home.hero.ctaPrimary')}</span>
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/register?role=worker"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-white text-slate-800 border-2 border-slate-200 font-bold text-base hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all"
                >
                  <span>{t('home.hero.ctaSecondary')}</span>
                </Link>
              </div>

              {/* Hero Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80">
                <div className="text-left">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('home.hero.stat1Number')}</div>
                  <div className="text-xs sm:text-sm font-medium text-slate-500">{t('home.hero.stat1Label')}</div>
                </div>
                <div className="text-left">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('home.hero.stat2Number')}</div>
                  <div className="text-xs sm:text-sm font-medium text-slate-500">{t('home.hero.stat2Label')}</div>
                </div>
                <div className="text-left">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('home.hero.stat3Number')}</div>
                  <div className="text-xs sm:text-sm font-medium text-slate-500">{t('home.hero.stat3Label')}</div>
                </div>
              </div>
            </div>

            {/* Right Hero Interactive Marketplace Showcase Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl bg-white border border-slate-200/80 shadow-2xl p-6 sm:p-8 space-y-6">
                {/* Showcase Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
                      <Users size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{t('home.hero.previewProfileTitle')}</h3>
                      <p className="text-xs text-slate-500">{t('home.hero.previewProfileSub')}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    {t('home.hero.badgeLive')}
                  </span>
                </div>

                {/* Micro Candidate Cards Preview */}
                <div className="space-y-3">
                  {/* Candidate 1 */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                        <HeartPulse size={18} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{t('home.services.nurse.title')}</span>
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        </div>
                        <div className="text-xs text-slate-500">{t('home.hero.previewActiveStatus')}</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 shadow-xs">
                      {t('home.hero.previewActiveStatus')}
                    </span>
                  </div>

                  {/* Candidate 2 */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        <Car size={18} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{t('home.services.driver.title')}</span>
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        </div>
                        <div className="text-xs text-slate-500">{t('home.hero.previewActiveStatus')}</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 shadow-xs">
                      {t('home.hero.previewActiveStatus')}
                    </span>
                  </div>

                  {/* Candidate 3 */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                        <GraduationCap size={18} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{t('home.services.privateTutor.title')}</span>
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        </div>
                        <div className="text-xs text-slate-500">{t('home.hero.previewActiveStatus')}</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 shadow-xs">
                      {t('home.hero.previewActiveStatus')}
                    </span>
                  </div>
                </div>

                {/* Showcase Footer Action */}
                <div className="pt-2">
                  <Link
                    to="/register?role=employer"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition"
                  >
                    <span>{t('home.services.exploreAction')}</span>
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. POPULAR SERVICES GRID */}
      {/* ========================================================= */}
      <section id="services" className="py-20 lg:py-28 bg-white border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-red-600 uppercase bg-red-50 px-3 py-1 rounded-full border border-red-100">
              {t('home.services.tag')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t('home.services.title')}
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              {t('home.services.subtitle')}
            </p>
          </div>

          {/* 9 Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {serviceCategories.map((service) => {
              const IconComponent = service.icon;
              return (
                <div
                  key={service.id}
                  className="group relative bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 hover:border-red-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header: Icon & Category Tag */}
                    <div className="flex items-center justify-between">
                      <div className={`p-3.5 rounded-xl ${service.iconBg} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent size={24} />
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${service.badgeColor}`}>
                        {service.title}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                        {service.title}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                        {service.desc}
                      </p>
                    </div>
                  </div>

                  {/* Card Action Link */}
                  <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      to={`/register?role=employer&category=${service.id}`}
                      className="text-sm font-semibold text-slate-900 group-hover:text-red-600 flex items-center gap-1.5 transition-colors"
                    >
                      <span>{t('home.services.exploreAction')}</span>
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link
                      to={`/register?role=worker&category=${service.id}`}
                      className="text-xs font-medium text-slate-500 hover:text-slate-800"
                    >
                      {t('home.nav.findJobs')}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. HOW IT WORKS (TABBED WORKFLOW FOR BOTH SIDES) */}
      {/* ========================================================= */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-slate-50 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-red-600 uppercase bg-red-50 px-3 py-1 rounded-full border border-red-100">
              {t('home.howItWorks.tag')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t('home.howItWorks.title')}
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              {t('home.howItWorks.subtitle')}
            </p>

            {/* Persona Switcher Tabs */}
            <div className="inline-flex p-1.5 rounded-xl bg-white border border-slate-200 shadow-sm mt-6">
              <button
                type="button"
                onClick={() => setActiveTab('employer')}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'employer'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('home.howItWorks.forEmployers')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('worker')}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'worker'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('home.howItWorks.forWorkers')}
              </button>
            </div>
          </div>

          {/* Workflow Steps Content */}
          {activeTab === 'employer' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative space-y-4">
                <div className="h-12 w-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-extrabold text-lg">
                  1
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {t('home.howItWorks.employerStep1Title')}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {t('home.howItWorks.employerStep1Desc')}
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative space-y-4">
                <div className="h-12 w-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-extrabold text-lg">
                  2
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {t('home.howItWorks.employerStep2Title')}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {t('home.howItWorks.employerStep2Desc')}
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative space-y-4">
                <div className="h-12 w-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-extrabold text-lg">
                  3
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {t('home.howItWorks.employerStep3Title')}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {t('home.howItWorks.employerStep3Desc')}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative space-y-4">
                <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-lg">
                  1
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {t('home.howItWorks.workerStep1Title')}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {t('home.howItWorks.workerStep1Desc')}
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative space-y-4">
                <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-lg">
                  2
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {t('home.howItWorks.workerStep2Title')}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {t('home.howItWorks.workerStep2Desc')}
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative space-y-4">
                <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-lg">
                  3
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {t('home.howItWorks.workerStep3Title')}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {t('home.howItWorks.workerStep3Desc')}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. WHY HOMELYSERV (PLATFORM CAPABILITIES & TRUST) */}
      {/* ========================================================= */}
      <section id="why-homelyserv" className="py-20 lg:py-28 bg-white border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-red-600 uppercase bg-red-50 px-3 py-1 rounded-full border border-red-100">
              {t('home.whyUs.tag')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t('home.whyUs.title')}
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              {t('home.whyUs.subtitle')}
            </p>
          </div>

          {/* 6 Core Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyUsPillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="p-8 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-lg transition duration-200 space-y-4"
                >
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${pillar.color}`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{pillar.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. GLOBAL REACH & CROSS-BORDER OPPORTUNITIES */}
      {/* ========================================================= */}
      <section id="global-reach" className="py-20 lg:py-28 bg-slate-900 text-white relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Global Story */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs sm:text-sm font-bold tracking-wider text-red-400 uppercase bg-red-950/80 px-3 py-1 rounded-full border border-red-800">
                {t('home.globalSection.tag')}
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                {t('home.globalSection.title')}
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                {t('home.globalSection.subtitle')}
              </p>

              {/* Key Global Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                  <h4 className="font-bold text-white text-base">{t('home.globalSection.card1Title')}</h4>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">{t('home.globalSection.card1Desc')}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                  <h4 className="font-bold text-white text-base">{t('home.globalSection.card2Title')}</h4>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">{t('home.globalSection.card2Desc')}</p>
                </div>
              </div>
            </div>

            {/* Right Global Visual Representation */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-slate-800/90 border border-slate-700 p-8 space-y-6">
                <div className="flex items-center gap-4 border-b border-slate-700 pb-4">
                  <div className="h-12 w-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                    <Globe2 size={26} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">{t('home.globalSection.card3Title')}</h4>
                    <p className="text-xs sm:text-sm text-slate-300">{t('home.globalSection.card3Desc')}</p>
                  </div>
                </div>

                {/* Multilingual Support Badges */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {t('home.whyUs.feature3Title')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs font-medium text-slate-100">🇬🇧 English</span>
                    <span className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs font-medium text-slate-100">🇪🇬 العربية</span>
                    <span className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs font-medium text-slate-100">🇫🇷 Français</span>
                    <span className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs font-medium text-slate-100">🇷🇺 Русский</span>
                    <span className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs font-medium text-slate-100">🇹🇷 Türkçe</span>
                    <span className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs font-medium text-slate-100">🇩🇪 Deutsch</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/register"
                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-500 transition shadow-md"
                  >
                    <span>{t('home.hero.previewGlobalReachSub')}</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. MOBILE APP SECTION & SCANNABLE QR CODE */}
      {/* ========================================================= */}
      <section id="mobile-app" className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs sm:text-sm font-bold tracking-wider text-red-600 uppercase bg-red-50 px-3 py-1 rounded-full border border-red-100">
                {t('home.appSection.tag')}
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
                {t('home.appSection.title')}
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                {t('home.appSection.subtitle')}
              </p>

              {/* App Features List */}
              <ul className="space-y-3 pt-2">
                <li className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  <span>{t('home.appSection.bullet1')}</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  <span>{t('home.appSection.bullet2')}</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
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
                  <span>{t('home.appSection.downloadButton')}</span>
                </Link>
                <Link
                  to="/download"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
                >
                  <span>{t('home.appSection.viewDownloadPage')}</span>
                </Link>
              </div>
            </div>

            {/* Right: Real Scannable SVG QR Code Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="bg-white rounded-3xl p-8 border-2 border-slate-200/90 shadow-2xl max-w-sm w-full text-center space-y-6">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-lg text-slate-900">{t('home.appSection.tag')}</h3>
                  <p className="text-xs text-slate-500">{t('home.appSection.scanPrompt')}</p>
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
                    <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                      <QrCode size={64} />
                    </div>
                  )}
                </div>

                {/* Scan Info */}
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 py-2 rounded-lg">
                  <Smartphone size={16} className="text-slate-500" />
                  <span>https://www.homelyserv.com/download</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. FINAL HIGH-IMPACT CALL TO ACTION */}
      {/* ========================================================= */}
      <section className="py-20 lg:py-24 bg-gradient-to-r from-red-600 to-rose-700 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            {t('home.finalCta.headline')}
          </h2>
          <p className="text-lg sm:text-xl text-red-100 max-w-2xl mx-auto font-normal">
            {t('home.finalCta.subheadline')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register?role=employer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-red-600 font-extrabold text-base hover:bg-red-50 shadow-xl transition active:scale-[0.98]"
            >
              <span>{t('home.finalCta.findHelpBtn')}</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/register?role=worker"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-red-900/60 border border-red-300/40 text-white font-bold text-base hover:bg-red-900/90 transition shadow-sm"
            >
              <span>{t('home.finalCta.findJobBtn')}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 9. GLOBAL FOOTER WITH ALL LEGAL & SYSTEM LINKS */}
      {/* ========================================================= */}
      <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 pb-12 border-b border-slate-800">
            {/* Column 1: Brand & Bio */}
            <div className="col-span-2 space-y-4">
              <Link to="/" className="flex items-center gap-2 focus:outline-none">
                <span className="font-extrabold text-2xl tracking-tight text-white">
                  Homely<span className="text-red-500">Serv</span>
                </span>
              </Link>
              <p className="text-sm text-slate-300 max-w-sm leading-relaxed">
                {t('home.footer.tagline')}
              </p>
            </div>

            {/* Column 2: Platform Links */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white tracking-wider uppercase">
                {t('home.footer.quickLinks')}
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/register?role=employer" className="text-slate-300 hover:text-white transition">
                    {t('home.nav.findProfessionals')}
                  </Link>
                </li>
                <li>
                  <Link to="/register?role=worker" className="text-slate-300 hover:text-white transition">
                    {t('home.nav.findJobs')}
                  </Link>
                </li>
                <li>
                  <Link to="/download" className="text-slate-300 hover:text-white transition">
                    {t('home.footer.download')}
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-slate-300 hover:text-white transition">
                    {t('home.footer.about')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Support Links */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white tracking-wider uppercase">
                {t('home.footer.categories')}
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/help" className="text-slate-300 hover:text-white transition">
                    {t('home.footer.help')}
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-slate-300 hover:text-white transition">
                    {t('home.footer.contact')}
                  </Link>
                </li>
                <li>
                  <Link to="/delete-account" className="text-slate-300 hover:text-white transition">
                    {t('home.footer.deleteAccount')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Legal & Policies */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white tracking-wider uppercase">
                {t('home.footer.legal')}
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/terms" className="text-slate-300 hover:text-white transition">
                    {t('home.footer.terms')}
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-slate-300 hover:text-white transition">
                    {t('home.footer.privacy')}
                  </Link>
                </li>
                <li>
                  <Link to="/refund-policy" className="text-slate-300 hover:text-white transition">
                    {t('home.footer.refund')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright and Language info */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div>
              {t('home.footer.copyright', { year: currentYear })}
            </div>
            <div className="flex items-center gap-6">
              <span>{t('home.footer.tagline')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

