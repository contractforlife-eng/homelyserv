import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShoppingBag, Plus, Search, MapPin, Phone, MessageCircle, Share2,
  Flag, Pencil, Trash2, CheckCircle, AlertCircle, Crown, ChevronLeft, ChevronRight, ImageOff,
  ArrowLeft, ArrowRight
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import SupportLayout from '../layouts/SupportLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import { countries } from '../utils/countries';
import { getCallingCodeByCountry } from '../utils/countryCallingCodes';
import { sanitizeMarketplaceListReturnPath } from '../utils/safeReturnPath';

const MAX_IMAGE = 5 * 1024 * 1024;
const MESSAGE_ROUTES = {
  WORKER: '/worker-messages',
  EMPLOYER: '/employer-messages',
  DOCTOR: '/doctor-messages',
  TEACHER: '/teacher-messages',
  STUDENT: '/student-messages',
  ADMIN: '/admin/messages',
  SUPPORT: '/support-messages',
  SUPPORT_HELPER: '/sup-help/messages'
};

const Marketplace = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const user = useAuthStore((state) => state.user);
  const role = String(user?.role || '').toUpperCase();
  const isSupport = role === 'SUPPORT' || role === 'SUPPORT_HELPER';
  const canModerate = role === 'ADMIN' || role === 'SUPPORT';
  const isNew = location.pathname === '/marketplace/new';
  const isMine = location.pathname === '/marketplace/mine';
  const isEdit = Boolean(id && location.pathname.endsWith('/edit'));
  const isDetail = Boolean(id && !isEdit);

  // Pagination and query state initialized from URL search params
  const urlPage = Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1);
  const urlSearch = searchParams.get('search') || '';
  const urlCountry = searchParams.get('country') || '';
  const urlRegion = searchParams.get('region') || '';
  const urlModeration = searchParams.get('moderation') === 'true';

  const [page, setPage] = useState(urlPage);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(urlSearch);
  const [country, setCountry] = useState(urlCountry);
  const [region, setRegion] = useState(urlRegion);
  const [moderation, setModeration] = useState(urlModeration && canModerate);

  const [failedImages, setFailedImages] = useState({});

  const handleImageError = useCallback((key) => {
    setFailedImages((prev) => ({ ...prev, [key]: true }));
  }, []);
  const [listings, setListings] = useState([]);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'USD',
    country: '',
    region: '',
    city: '',
    locationDescription: '',
    phone: '',
    whatsapp: ''
  });
  const [whatsappCountryCode, setWhatsappCountryCode] = useState('');
  const [whatsappLocalNumber, setWhatsappLocalNumber] = useState('');
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  // Synchronize state with URL parameters when URL changes (e.g. browser back/forward)
  useEffect(() => {
    const p = Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1);
    const s = searchParams.get('search') || '';
    const c = searchParams.get('country') || '';
    const r = searchParams.get('region') || '';
    const m = searchParams.get('moderation') === 'true' && canModerate;

    setPage(p);
    setSearch(s);
    setCountry(c);
    setRegion(r);
    setModeration(m);
    setFailedImages({});
  }, [searchParams, canModerate]);

  const updateQueryParams = useCallback((newParams) => {
    const current = Object.fromEntries(searchParams.entries());
    const merged = { ...current, ...newParams };

    // Clean up empty params
    Object.keys(merged).forEach((k) => {
      if (!merged[k] || merged[k] === 'false' || (k === 'page' && merged[k] === 1)) {
        delete merged[k];
      }
    });

    setSearchParams(merged, { replace: true });
  }, [searchParams, setSearchParams]);

  const theme = useMemo(() => ({
    WORKER: { button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500', price: 'text-red-600', ring: 'ring-red-500' },
    EMPLOYER: { button: 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500', price: 'text-teal-600', ring: 'ring-teal-500' },
    ADMIN: { button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500', price: 'text-amber-600', ring: 'ring-amber-500' },
    DOCTOR: { button: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500', price: 'text-rose-600', ring: 'ring-rose-500' },
    TEACHER: { button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500', price: 'text-amber-600', ring: 'ring-amber-500' },
    STUDENT: { button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500', price: 'text-blue-600', ring: 'ring-blue-500' },
    SUPPORT: { button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500', price: 'text-green-600', ring: 'ring-green-500' },
    SUPPORT_HELPER: { button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500', price: 'text-red-600', ring: 'ring-red-500' }
  }[role] || { button: 'bg-slate-700 hover:bg-slate-800 focus:ring-slate-500', price: 'text-slate-700', ring: 'ring-slate-500' }), [role]);
  const primary = theme.button;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (isNew) return;
      if (isDetail || isEdit) {
        const response = await api.get(`/api/marketplace/${id}`);
        const it = response.data.listing;
        setListing(it);
        if (isEdit && it) {
          setForm({
            title: it.title || '',
            description: it.description || '',
            price: it.price || '',
            currency: it.currency || 'USD',
            country: it.country || '',
            region: it.region || '',
            city: it.city || '',
            locationDescription: it.locationDescription || '',
            phone: it.phone || '',
            whatsapp: it.whatsapp || ''
          });
          setWhatsappCountryCode(it.country || '');
          setWhatsappLocalNumber(it.whatsapp || '');
        }
      } else if (moderation && canModerate) {
        const response = await api.get('/api/marketplace/admin/reports', { params: { page, limit: 12 } });
        setListings(response.data.listings || []);
        const totalPages = response.data.pages || 1;
        setPages(totalPages);
        setTotal(response.data.total || 0);
        if (page > totalPages && totalPages > 0) {
          setPage(totalPages);
          updateQueryParams({ page: totalPages });
        }
      } else if (isMine) {
        const response = await api.get('/api/marketplace/mine', { params: { page, limit: 12 } });
        setListings(response.data.listings || []);
        const totalPages = response.data.pages || 1;
        setPages(totalPages);
        setTotal(response.data.total || 0);
        if (page > totalPages && totalPages > 0) {
          setPage(totalPages);
          updateQueryParams({ page: totalPages });
        }
      } else {
        const response = await api.get('/api/marketplace', {
          params: {
            page,
            limit: 12,
            search: search || undefined,
            country: country || undefined,
            region: region || undefined
          }
        });
        setListings(response.data.listings || []);
        const totalPages = response.data.pages || 1;
        setPages(totalPages);
        setTotal(response.data.total || 0);
        if (page > totalPages && totalPages > 0) {
          setPage(totalPages);
          updateQueryParams({ page: totalPages });
        }
      }
    } catch (requestError) {
      setError(t(`marketplace.validation.${requestError.response?.data?.code}`, { defaultValue: t('marketplace.loadError') }));
      setListing(null);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [id, isNew, isDetail, isEdit, isMine, moderation, canModerate, page, search, country, region, updateQueryParams, t]);

  useEffect(() => {
    load();
  }, [load]);

  // When seller selects country in form, default whatsapp country code if not set
  const handleCountryChange = (e) => {
    const c = e.target.value;
    setForm((prev) => ({ ...prev, country: c }));
    if (!whatsappCountryCode) {
      setWhatsappCountryCode(c);
    }
  };

  const handleSameAsPhone = () => {
    if (!form.phone) return;
    const c = form.country || whatsappCountryCode;
    setWhatsappCountryCode(c);
    setWhatsappLocalNumber(form.phone);
    setForm((prev) => ({ ...prev, whatsapp: form.phone }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!isEdit && !image) return setError(t('marketplace.required'));
    if (image && (image.size > MAX_IMAGE || !['image/jpeg', 'image/png', 'image/webp'].includes(image.type))) {
      return setError(t('marketplace.invalidImage'));
    }

    // Build normalized WhatsApp payload
    const finalWhatsApp = whatsappLocalNumber.trim();
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key !== 'whatsapp') payload.append(key, value);
    });
    if (finalWhatsApp) {
      payload.append('whatsapp', finalWhatsApp);
    }
    if (image) payload.append('image', image);

    setSaving(true);
    try {
      const response = isEdit ? await api.put(`/api/marketplace/${id}`, payload) : await api.post('/api/marketplace', payload);
      navigate(`/marketplace/${response.data.listing._id}`, { replace: true });
    } catch (requestError) {
      setError(t(`marketplace.validation.${requestError.response?.data?.code}`, { defaultValue: t('marketplace.error') }));
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action, successMessage) => {
    setError('');
    try {
      await action();
      if (successMessage) setNotice(successMessage);
    } catch (requestError) {
      setError(t(`marketplace.validation.${requestError.response?.data?.code}`, { defaultValue: t('marketplace.error') }));
    }
  };

  const updateStatus = (item, status) => runAction(async () => {
    await api.patch(`/api/marketplace/${item._id}/status`, { status });
    await load();
  }, t('marketplace.statusSuccess'));

  const remove = (item) => {
    if (!window.confirm(t('marketplace.deleteConfirm'))) return;
    runAction(async () => {
      await api.delete(`/api/marketplace/${item._id}`);
      navigate('/marketplace/mine');
    }, t('marketplace.deleteSuccess'));
  };

  const chat = () => runAction(async () => {
    const response = await api.post(`/api/marketplace/${listing._id}/chat`);
    navigate(MESSAGE_ROUTES[role] || '/messages', {
      state: {
        conversationId: response.data.conversationId,
        sellerId: response.data.sellerId,
        marketplaceContext: response.data.context
      }
    });
  });

  const share = () => runAction(async () => {
    const url = `${window.location.origin}/marketplace/${listing._id}`;
    if (navigator.share) {
      await navigator.share({ title: listing.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      setNotice(t('marketplace.copied'));
    }
  });

  const report = async () => {
    const reason = window.prompt(t('marketplace.reportPrompt'));
    if (!reason) return;
    runAction(async () => {
      await api.post(`/api/marketplace/${listing._id}/report`, { reason });
    }, t('marketplace.reported'));
  };

  const moderate = (item, action) => runAction(async () => {
    await api.patch(`/api/marketplace/admin/${item._id}/moderate`, { action });
    await load();
  });

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pages || newPage === page) return;
    setPage(newPage);
    updateQueryParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (updates) => {
    setPage(1);
    updateQueryParams({ ...updates, page: 1 });
  };

  // Pagination range calculation with ellipsis
  const paginationRange = useMemo(() => {
    const totalPages = pages;
    const current = page;
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const leftSibling = Math.max(current - 1, 2);
    const rightSibling = Math.min(current + 1, totalPages - 1);

    const showLeftEllipsis = leftSibling > 2;
    const showRightEllipsis = rightSibling < totalPages - 1;

    if (!showLeftEllipsis && showRightEllipsis) {
      const leftRange = [1, 2, 3, 4];
      return [...leftRange, '...', totalPages];
    }
    if (showLeftEllipsis && !showRightEllipsis) {
      const rightRange = [totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      return [1, '...', ...rightRange];
    }
    if (showLeftEllipsis && showRightEllipsis) {
      return [1, '...', current - 1, current, current + 1, '...', totalPages];
    }
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [pages, page]);

  // Premium seller card glowing treatment
  const card = (item) => {
    const isPremium = item.seller?.isPremium === true;
    const isVerified = item.seller?.isVerified === true;
    const sellerName = item.seller?.displayName || t('marketplace.seller');
    const imageFailed = Boolean(failedImages[item._id] || !item.image?.url);
    const returnUrl = `${location.pathname}${location.search}`;

    return (
      <button
        key={item._id}
        onClick={() => navigate(`/marketplace/${item._id}`, { state: { returnTo: returnUrl } })}
        className={`w-full h-full flex flex-col text-start bg-white dark:bg-slate-800 rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all ${
          isPremium
            ? 'border-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.35)] dark:shadow-[0_0_15px_rgba(168,85,247,0.25)] ring-1 ring-purple-400/50'
            : 'border-slate-200 dark:border-slate-700'
        }`}
      >
        <div className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-slate-900 overflow-hidden flex-shrink-0">
          {!imageFailed ? (
            <img
              src={item.image?.url}
              alt={item.title}
              onError={() => handleImageError(item._id)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-slate-400 dark:text-slate-500">
              <ImageOff className="w-8 h-8 stroke-[1.5]" />
              <span className="text-xs font-medium text-center">{t('marketplace.imageUnavailable')}</span>
            </div>
          )}
          <div className="absolute top-3 start-3 flex flex-wrap gap-1.5 items-center">
            {item.status !== 'ACTIVE' && (
              <span className="rounded-full bg-slate-900/85 px-3 py-1 text-xs text-white">
                {t(`marketplace.${item.status === 'SOLD' ? 'sold' : 'hidden'}`)}
              </span>
            )}
            {isPremium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-700/90 text-white px-2.5 py-0.5 text-xs font-semibold shadow-sm backdrop-blur-sm">
                <Crown className="w-3.5 h-3.5 text-yellow-300" />
                {t('marketplace.premiumSeller')}
              </span>
            )}
          </div>
        </div>
        <div className="p-4 flex flex-col flex-1 justify-between gap-3 w-full">
          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.title}</h3>
            <p className={`font-bold text-lg ${theme.price}`}>
              {Number(item.price).toLocaleString(i18n.language)} {item.currency}
            </p>
          </div>

          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-700">
            {/* Seller identity row */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[140px]" title={sellerName}>
                {sellerName}
              </span>
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  isVerified ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {isVerified ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    {t('marketplace.verified')}
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                    {t('marketplace.notVerified')}
                  </>
                )}
              </span>
            </div>

            <p className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{item.city}, {item.region}</span>
            </p>
          </div>
        </div>
      </button>
    );
  };

  let content;
  if (loading) {
    content = <p className="p-8 text-center text-slate-500">{t('marketplace.loading')}</p>;
  } else if (isNew || isEdit) {
    const currentCallingCode = getCallingCodeByCountry(whatsappCountryCode || form.country);

    content = (
      <form onSubmit={submit} className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-2xl border p-5 md:p-7 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {t(isEdit ? 'marketplace.edit' : 'marketplace.create')}
        </h2>

        <label className="block">
          <span className="text-sm font-semibold">{t('marketplace.titleLabel')}</span>
          <input
            required
            minLength="3"
            maxLength="120"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1 w-full rounded-xl border p-3 bg-transparent text-slate-900 dark:text-white"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">{t('marketplace.description')}</span>
          <textarea
            required
            minLength="10"
            maxLength="3000"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-xl border p-3 bg-transparent min-h-32 text-slate-900 dark:text-white"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">{t('marketplace.image')}</span>
          <input
            type="file"
            required={!isEdit}
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-100 dark:file:bg-slate-700"
          />
          <small className="text-slate-500">{t('marketplace.imageHint')}</small>
        </label>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-semibold">{t('marketplace.price')}</span>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="mt-1 w-full rounded-xl border p-3 bg-transparent text-slate-900 dark:text-white"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">{t('marketplace.currency')}</span>
            <input
              required
              pattern="[A-Za-z]{3}"
              maxLength="3"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
              className="mt-1 w-full rounded-xl border p-3 bg-transparent text-slate-900 dark:text-white"
            />
          </label>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-sm font-semibold">{t('marketplace.country')}</span>
            <select
              required
              value={form.country}
              onChange={handleCountryChange}
              className="mt-1 w-full rounded-xl border p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">—</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">{t('marketplace.region')}</span>
            <input
              required
              maxLength="120"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="mt-1 w-full rounded-xl border p-3 bg-transparent text-slate-900 dark:text-white"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">{t('marketplace.city')}</span>
            <input
              required
              maxLength="120"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="mt-1 w-full rounded-xl border p-3 bg-transparent text-slate-900 dark:text-white"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold">{t('marketplace.location')}</span>
          <input
            required
            maxLength="500"
            value={form.locationDescription}
            onChange={(e) => setForm({ ...form, locationDescription: e.target.value })}
            className="mt-1 w-full rounded-xl border p-3 bg-transparent text-slate-900 dark:text-white"
          />
        </label>

        {/* Contact Phone */}
        <label className="block">
          <span className="text-sm font-semibold">{t('marketplace.phone')}</span>
          <input
            type="tel"
            required
            maxLength="32"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="mt-1 w-full rounded-xl border p-3 bg-transparent text-slate-900 dark:text-white"
          />
          <small className="block mt-1 text-amber-700 dark:text-amber-400">{t('marketplace.phoneDisclosure')}</small>
        </label>

        {/* WhatsApp Contact Section */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {t('marketplace.whatsappNumber')}
            </span>
            {form.phone && (
              <button
                type="button"
                onClick={handleSameAsPhone}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {t('marketplace.sameAsPhone')}
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t('marketplace.country')}</label>
              <select
                value={whatsappCountryCode}
                onChange={(e) => setWhatsappCountryCode(e.target.value)}
                className="w-full rounded-xl border p-2.5 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              >
                <option value="">{t('marketplace.allCountries')}</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} {getCallingCodeByCountry(c.code) ? `(+${getCallingCodeByCountry(c.code)})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">{t('marketplace.whatsapp')}</label>
              <div className="relative flex rounded-xl border overflow-hidden bg-white dark:bg-slate-800">
                {currentCallingCode && (
                  <span className="inline-flex items-center px-3 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-e">
                    +{currentCallingCode}
                  </span>
                )}
                <input
                  type="tel"
                  maxLength="32"
                  placeholder={currentCallingCode ? '01012345678' : '+201012345678'}
                  value={whatsappLocalNumber}
                  onChange={(e) => setWhatsappLocalNumber(e.target.value)}
                  className="w-full p-2.5 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <small className="block text-xs text-slate-500 dark:text-slate-400">
            {t('marketplace.whatsappDisclaimer')}
          </small>
        </div>

        <p className="rounded-xl bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
          {t('marketplace.prohibited')}
        </p>

        <div className="flex gap-3">
          <button disabled={saving} className={`${primary} text-white px-5 py-3 rounded-xl font-semibold`}>
            {t(isEdit ? 'marketplace.save' : 'marketplace.publish')}
          </button>
          <button type="button" onClick={() => navigate('/marketplace')} className="px-5 py-3 rounded-xl border">
            {t('marketplace.cancel')}
          </button>
        </div>
      </form>
    );
  } else if (isDetail) {
    const viewerId = user?.id || user?._id;
    const isOwner = String(listing?.ownerId) === String(viewerId);
    const isPremium = listing?.seller?.isPremium === true;
    const isVerified = listing?.seller?.isVerified === true;
    const sellerName = listing?.seller?.displayName || t('marketplace.seller');

    const whatsappDigits = listing?.whatsapp ? String(listing.whatsapp).replace(/\D/g, '') : null;
    const encodedMessage = listing ? encodeURIComponent(`Listing: ${listing.title} (${window.location.href})`) : '';
    const whatsappUrl = whatsappDigits ? `https://wa.me/${whatsappDigits}?text=${encodedMessage}` : null;
    const detailImageFailed = Boolean(failedImages[listing?._id] || !listing?.image?.url);

    // Validate return destination from navigation state, defaulting safely to /marketplace
    const targetReturnTo = sanitizeMarketplaceListReturnPath(location.state?.returnTo) || '/marketplace';
    const isRtl = i18n.language === 'ar';

    content = listing ? (
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Back to listings button */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => navigate(targetReturnTo)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{t('marketplace.backToListings')}</span>
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="w-full aspect-[4/3] rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
          {!detailImageFailed ? (
            <img
              src={listing.image?.url}
              alt={listing.title}
              onError={() => handleImageError(listing._id)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-slate-400 dark:text-slate-500">
              <ImageOff className="w-12 h-12 stroke-[1.5]" />
              <span className="text-sm font-medium">{t('marketplace.imageUnavailable')}</span>
            </div>
          )}
        </div>
        <section
          className={`bg-white dark:bg-slate-800 rounded-2xl border p-6 space-y-4 ${
            isPremium
              ? 'border-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.35)] dark:shadow-[0_0_15px_rgba(168,85,247,0.25)] ring-1 ring-purple-400/50'
              : 'border-slate-200 dark:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-start gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{listing.title}</h1>
              {isPremium && (
                <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-purple-700 text-white px-2.5 py-0.5 text-xs font-semibold shadow-sm">
                  <Crown className="w-3.5 h-3.5 text-yellow-300" />
                  {t('marketplace.premiumSeller')}
                </span>
              )}
            </div>
            <span className="text-sm font-semibold rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1">
              {t(listing.status === 'ACTIVE' ? 'marketplace.active' : 'marketplace.sold')}
            </span>
          </div>

          <p className={`text-2xl font-bold ${theme.price}`}>
            {Number(listing.price).toLocaleString(i18n.language)} {listing.currency}
          </p>

          {/* Seller Information Block */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{t('marketplace.seller')}</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{sellerName}</p>
            </div>
            <div className="text-end">
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  isVerified
                    ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {isVerified ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    {t('marketplace.verified')}
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                    {t('marketplace.notVerified')}
                  </>
                )}
              </span>
            </div>
          </div>

          <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">{listing.description}</p>
          <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            {listing.locationDescription}, {listing.city}, {listing.region}
          </p>

          {/* Contact Numbers */}
          <div className="space-y-1.5 pt-2 border-t">
            <a href={`tel:${listing.phone}`} className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white hover:underline">
              <Phone className="w-4 h-4" />
              {listing.phone}
            </a>
            {whatsappUrl && (
              <div>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t('marketplace.chatOnWhatsApp')} ({listing.whatsapp})
                </a>
              </div>
            )}
          </div>

          {notice && <p className="text-green-600 font-medium">{notice}</p>}

          <div className="flex flex-wrap gap-2 pt-2">
            {!isOwner && listing.status === 'ACTIVE' && (
              <>
                <a href={`tel:${listing.phone}`} className={`${primary} text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium`}>
                  <Phone className="w-4 h-4" />
                  {t('marketplace.call')}
                </a>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {t('marketplace.chatOnWhatsApp')}
                  </a>
                )}
                <button onClick={chat} className="border px-4 py-2 rounded-xl flex items-center gap-2 font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
                  <MessageCircle className="w-4 h-4" />
                  {t('marketplace.chat')}
                </button>
              </>
            )}
            <button onClick={share} className="border px-4 py-2 rounded-xl flex items-center gap-2 font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
              <Share2 className="w-4 h-4" />
              {t('marketplace.share')}
            </button>
            {!isOwner && (
              <button onClick={report} className="border px-4 py-2 rounded-xl flex items-center gap-2 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
                <Flag className="w-4 h-4" />
                {t('marketplace.report')}
              </button>
            )}
          </div>

          {isOwner && (
            <div className="border-t pt-4 flex flex-wrap gap-2">
              <button onClick={() => navigate(`/marketplace/${listing._id}/edit`)} className="border px-4 py-2 rounded-xl flex items-center gap-2 font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
                <Pencil className="w-4 h-4" />
                {t('marketplace.edit')}
              </button>
              <button onClick={() => updateStatus(listing, listing.status === 'SOLD' ? 'ACTIVE' : 'SOLD')} className="border px-4 py-2 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
                {t(listing.status === 'SOLD' ? 'marketplace.reactivate' : 'marketplace.markSold')}
              </button>
              <button onClick={() => remove(listing)} className="border border-red-300 text-red-600 px-4 py-2 rounded-xl flex items-center gap-2 font-medium hover:bg-red-50 dark:hover:bg-red-950/30">
                <Trash2 className="w-4 h-4" />
                {t('marketplace.delete')}
              </button>
            </div>
          )}
        </section>
        </div>
      </div>
    ) : (
      <p className="p-8 text-center text-slate-500">{t('marketplace.notFound')}</p>
    );
  } else {
    // Browse, Mine, or Moderation list view
    content = (
      <>
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => {
              setModeration(false);
              navigate('/marketplace');
            }}
            className={`border rounded-xl px-4 py-2 font-medium ${
              !isMine && !moderation ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : ''
            }`}
          >
            {t('marketplace.browse')}
          </button>
          <button
            onClick={() => {
              setModeration(false);
              navigate('/marketplace/mine');
            }}
            className={`border rounded-xl px-4 py-2 font-medium ${
              isMine ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : ''
            }`}
          >
            {t('marketplace.myListings')}
          </button>
          <button
            onClick={() => navigate('/marketplace/new')}
            className={`${primary} text-white rounded-xl px-4 py-2 flex items-center gap-2 font-medium`}
          >
            <Plus className="w-4 h-4" />
            {t('marketplace.create')}
          </button>
          {canModerate && (
            <button
              onClick={() => {
                setModeration(true);
                handleFilterChange({ moderation: 'true' });
              }}
              className={`border rounded-xl px-4 py-2 font-medium ${
                moderation ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : ''
              }`}
            >
              {t('marketplace.moderation')}
            </button>
          )}
        </div>

        {/* Search & Location Filters */}
        {!isMine && !moderation && (
          <div className="grid md:grid-cols-3 gap-3 mb-5">
            <label className="relative">
              <Search className="absolute start-3 top-3.5 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  handleFilterChange({ search: e.target.value });
                }}
                placeholder={t('marketplace.search')}
                className="w-full border rounded-xl py-2.5 ps-10 pe-3 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </label>
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                handleFilterChange({ country: e.target.value });
              }}
              className="border rounded-xl p-2.5 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            >
              <option value="">{t('marketplace.allCountries')}</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            <input
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                handleFilterChange({ region: e.target.value });
              }}
              placeholder={t('marketplace.region')}
              className="border rounded-xl p-2.5 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>
        )}

        {/* Listings Grid */}
        {listings.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {listings.map((item) => (
              <div key={item._id} className="w-full flex flex-col">
                {card(item)}
                {moderation && (
                  <div className="mt-2.5 p-3 rounded-xl border bg-slate-50 dark:bg-slate-900/50 space-y-2">
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold block mb-1">{t('marketplace.reports')}:</span>
                      {(item.reports || []).map((entry, idx) => (
                        <p key={`${entry.reporterId}-${idx}`} className="italic">• {entry.reason}</p>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      {item.status === 'HIDDEN' ? (
                        <button
                          onClick={() => moderate(item, 'RESTORE')}
                          className="border px-3 py-1 text-xs rounded-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          {t('marketplace.restore')}
                        </button>
                      ) : (
                        <button
                          onClick={() => moderate(item, 'HIDE')}
                          className="border px-3 py-1 text-xs rounded-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          {t('marketplace.hide')}
                        </button>
                      )}
                      <button
                        onClick={() => moderate(item, 'REMOVE')}
                        className="border border-red-300 text-red-600 px-3 py-1 text-xs rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        {t('marketplace.remove')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="p-8 text-center text-slate-500">
            {t(moderation ? 'marketplace.noReports' : 'marketplace.noListings')}
          </p>
        )}

        {/* Complete Numbered Pagination with Ellipses */}
        {pages > 1 && (
          <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
            {/* Previous Button */}
            <button
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              aria-label={t('marketplace.previous')}
            >
              {i18n.language === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span className="hidden sm:inline">{t('marketplace.previous')}</span>
            </button>

            {/* Numbered Page Buttons & Ellipses */}
            {paginationRange.map((pageItem, index) => {
              if (pageItem === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 py-1 text-sm font-semibold text-slate-400 select-none"
                  >
                    …
                  </span>
                );
              }

              const isCurrent = pageItem === page;
              return (
                <button
                  key={`page-${pageItem}`}
                  onClick={() => handlePageChange(pageItem)}
                  className={`min-w-9 h-9 px-3 py-1 text-sm font-semibold rounded-xl border transition-colors ${
                    isCurrent
                      ? `${primary} text-white border-transparent shadow-sm`
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {pageItem}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              disabled={page >= pages}
              onClick={() => handlePageChange(page + 1)}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              aria-label={t('marketplace.next')}
            >
              <span className="hidden sm:inline">{t('marketplace.next')}</span>
              {i18n.language === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        )}
      </>
    );
  }

  const body = (
    <div className="p-4 md:p-6 max-w-7xl mx-auto" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {!isSupport && <DashboardHeader title={t('marketplace.title')} icon={ShoppingBag} />}
      {error && <p className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-red-700 dark:text-red-300 text-sm">{error}</p>}
      {content}
    </div>
  );

  return isSupport ? (
    <SupportLayout allowedRoles={['SUPPORT', 'SUPPORT_HELPER', 'ADMIN']} headerTitle="marketplace.title">
      {body}
    </SupportLayout>
  ) : (
    <DashboardLayout>{body}</DashboardLayout>
  );
};

export default Marketplace;
