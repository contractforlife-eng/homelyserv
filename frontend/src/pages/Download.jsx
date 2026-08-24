import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download as DownloadIcon, Facebook, MessageCircle, ShieldCheck, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import appIcon from '../assets/homelyserv-app-icon.png';
import markLight from '../assets/branding/homelyserv-mark-light.png';
import { createQrMatrix } from '../utils/qrCode';
import { classifyDevice } from '../utils/deviceType';

const RELEASE_MANIFEST_URL = '/downloads/android/1.0.3-4/release.json';
const FALLBACK_DOWNLOAD_URL = '/downloads/android/HomelyServ-1.0.3-4.apk';
const FALLBACK_RELEASE = {
  appName: 'HomelyServ',
  versionName: '1.0.3',
  versionCode: 4,
  releaseDate: '2026-08-24',
  sizeBytes: 97710063,
  minAndroid: 'Android 7.0',
  minSdk: 24,
  targetSdk: 36,
  packageName: 'com.homelyserv.app',
  sha256: '7483deac6d64c6201780f886ecaaaa461cd20d8589e16755da9e3fee6547770d',
  signingCertificateSha256: 'b52c2b1a9d4510993219b60b138530583e4ca29274cc32690f44f2f233674c50',
  downloadUrl: FALLBACK_DOWNLOAD_URL
};
const DOWNLOAD_PAGE_URL = 'https://homelyserv.com/download';
const SOCIAL_IMAGE_URL = 'https://www.homelyserv.com/downloads/android/homelyserv-android-share.jpg';
const SOCIAL_DESCRIPTION = 'Download the official HomelyServ Android app directly from homelyserv.com. View version, signing, checksum, and installation information.';
const UPDATE_NOTE_TRANSLATIONS = {
  en: 'Already have HomelyServ installed? Installing this version will update the existing app.',
  ar: 'هل لديك HomelyServ مثبتاً بالفعل؟ سيؤدي تثبيت هذا الإصدار إلى تحديث التطبيق الحالي.',
  fr: 'HomelyServ est déjà installé ? L’installation de cette version mettra à jour l’application existante.',
  ru: 'HomelyServ уже установлен? Установка этой версии обновит существующее приложение.',
  tr: 'HomelyServ zaten yüklü mü? Bu sürümün yüklenmesi mevcut uygulamayı güncelleyecektir.',
  de: 'HomelyServ bereits installiert? Die Installation dieser Version aktualisiert die vorhandene App.'
};

const formatBytes = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

const setMeta = (attribute, value, content) => {
  let element = document.head.querySelector(`meta[${attribute}="${value}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, value);
    element.dataset.downloadPage = 'true';
    document.head.appendChild(element);
  }
  element.dataset.downloadPage = 'true';
  element.setAttribute('content', content);
};

const setCanonical = (href) => {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    element.dataset.downloadPage = 'true';
    document.head.appendChild(element);
  }
  element.dataset.downloadPage = 'true';
  element.href = href;
};

const Download = () => {
  const { t, i18n } = useTranslation();
  const [release, setRelease] = useState(FALLBACK_RELEASE);
  const [releaseError, setReleaseError] = useState(false);
  const [copied, setCopied] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [deviceType, setDeviceType] = useState('unknown');

  useEffect(() => {
    setDeviceType(classifyDevice(navigator.userAgent, navigator.platform, navigator.maxTouchPoints));
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetch(RELEASE_MANIFEST_URL, { signal: controller.signal, cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`Release manifest returned ${response.status}`);
        return response.json();
      })
      .then(setRelease)
      .catch((error) => {
        if (error.name !== 'AbortError') setReleaseError(true);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = t('downloadPage.seoTitle');
    setMeta('name', 'description', SOCIAL_DESCRIPTION);
    setMeta('property', 'og:title', t('downloadPage.seoTitle'));
    setMeta('property', 'og:description', SOCIAL_DESCRIPTION);
    setMeta('property', 'og:url', DOWNLOAD_PAGE_URL);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', 'HomelyServ');
    setMeta('property', 'og:image', SOCIAL_IMAGE_URL);
    setMeta('property', 'og:image:secure_url', SOCIAL_IMAGE_URL);
    setMeta('property', 'og:image:type', 'image/jpeg');
    setMeta('property', 'og:image:width', '1200');
    setMeta('property', 'og:image:height', '630');
    setMeta('property', 'og:image:alt', 'HomelyServ official Android app');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', t('downloadPage.seoTitle'));
    setMeta('name', 'twitter:description', SOCIAL_DESCRIPTION);
    setMeta('name', 'twitter:image', SOCIAL_IMAGE_URL);
    setMeta('name', 'twitter:image:alt', 'HomelyServ official Android app');
    setCanonical(DOWNLOAD_PAGE_URL);

    return () => {
      document.title = previousTitle;
      document.head.querySelectorAll('[data-download-page="true"]').forEach((element) => element.remove());
      document.head.querySelector('link[rel="canonical"][data-download-page="true"]')?.remove();
    };
  }, [i18n.language, t]);

  const downloadUrl = release?.downloadUrl || FALLBACK_DOWNLOAD_URL;
  const minimumAndroid = release?.minAndroid?.endsWith('+')
    ? release.minAndroid
    : String(release?.minAndroid || 'Android 7.0') + '+';
  const updateNote = t('downloadPage.updateNote', {
    defaultValue: UPDATE_NOTE_TRANSLATIONS[i18n.language] || UPDATE_NOTE_TRANSLATIONS.en
  });
  const releaseDate = useMemo(() => {
    if (!release?.releaseDate) return '—';
    return new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
      new Date(`${release.releaseDate}T00:00:00`)
    );
  }, [i18n.language, release?.releaseDate]);

  const isAndroidVisitor = deviceType === 'android';
  const isIosVisitor = deviceType === 'ios';
  const showQrSection = deviceType !== 'android' && deviceType !== 'ios';

  const copyHash = async (type, value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      window.setTimeout(() => setCopied(''), 1800);
    } catch {
      setCopied('');
    }
  };

  const openShareWindow = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareOnWhatsApp = () => {
    const message = `${t('downloadPage.shareMessage')}\n${DOWNLOAD_PAGE_URL}`;
    openShareWindow(`https://wa.me/?text=${encodeURIComponent(message)}`);
  };

  const shareOnFacebook = () => {
    openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(DOWNLOAD_PAGE_URL)}`);
  };

  const copyDownloadLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(DOWNLOAD_PAGE_URL);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = DOWNLOAD_PAGE_URL;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        const copiedWithFallback = document.execCommand('copy');
        textArea.remove();
        if (!copiedWithFallback) throw new Error('Clipboard fallback failed');
      }
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      setLinkCopied(false);
    }
  };

  const technicalRows = release
    ? [
        [t('downloadPage.packageName'), release.packageName],
        [t('downloadPage.version'), release.versionName],
        [t('downloadPage.versionCode'), release.versionCode],
        [t('downloadPage.minimumAndroid'), `${release.minAndroid} (SDK ${release.minSdk})`],
        [t('downloadPage.targetSdk'), release.targetSdk],
        [t('downloadPage.apkSize'), `${release.sizeBytes.toLocaleString()} bytes (${formatBytes(release.sizeBytes)})`],
      ]
    : [];

  const storeStatuses = [
    ['direct', t('downloadPage.directDownload'), 'available'],
    ['uptodown', 'Uptodown', 'underReview'],
    ['huawei', 'Huawei AppGallery', 'comingSoon'],
    ['googlePlay', 'Google Play', 'comingSoon'],
  ];

  return (
    <main dir="ltr" className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-red-700 via-red-600 to-rose-500 px-5 pb-16 pt-10 text-white sm:px-8 sm:pt-14">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="mb-7 flex items-center gap-3">
              <img src={markLight} alt="HomelyServ" className="h-11 w-auto shrink-0 object-contain" />
              <span className="text-lg font-bold tracking-tight">HomelyServ</span>
            </div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-red-100">{t('downloadPage.officialRelease')}</p>
            <h1 className="max-w-2xl text-4xl font-black tracking-tight sm:text-6xl">
              {isIosVisitor ? t('downloadPage.iosTitle') : isAndroidVisitor ? t('downloadPage.androidVisitorTitle') : t('downloadPage.title')}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-red-50 sm:text-lg">
              {isIosVisitor ? t('downloadPage.iosDescription') : isAndroidVisitor ? t('downloadPage.androidVisitorDescription') : t('downloadPage.heroDescription')}
            </p>
            {isIosVisitor && (
              <div className="mt-5 max-w-xl rounded-2xl border border-white/25 bg-white/10 p-4 text-sm leading-6 text-red-50">
                <strong className="block text-base text-white">{t('downloadPage.iosTitle')}</strong>
                <span>{t('downloadPage.iosAndroidNote')}</span>
              </div>
            )}
            <a
              href={downloadUrl}
              download
              className={`mt-8 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-base font-extrabold shadow-xl transition focus-visible:outline-white sm:w-auto ${isIosVisitor ? 'border border-white/40 bg-white/15 text-white hover:bg-white/25' : 'bg-white text-red-700 hover:bg-red-50'}`}
            >
              <DownloadIcon size={21} aria-hidden="true" />
              {t('downloadPage.androidDownloadApk')}
            </a>
            <div className="mt-6 grid max-w-xl grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <HeroStat label={t('downloadPage.version')} value={release?.versionName || '—'} />
              <HeroStat label={t('downloadPage.apkSize')} value={release ? formatBytes(release.sizeBytes) : '—'} />
              <HeroStat label={t('downloadPage.minimumAndroid')} value={minimumAndroid} />
              <HeroStat label={t('downloadPage.releaseDate')} value={releaseDate} />
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-red-100">{updateNote}</p>
          </div>
          <div className="mx-auto w-full max-w-sm rounded-[2rem] border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-sm">
            <div className="rounded-[1.5rem] bg-white p-8 text-center text-slate-900">
              <img src={appIcon} alt="HomelyServ Android app icon" className="mx-auto h-40 w-40 rounded-[2rem] shadow-lg" />
              <div className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-emerald-700">
                <ShieldCheck size={18} aria-hidden="true" />
                {t('downloadPage.signedRelease')}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">{t('downloadPage.directDistribution')}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-6 px-5 py-10 sm:px-8 sm:py-14">
        <section className="grid gap-4 sm:grid-cols-3" aria-label={t('downloadPage.trustTitle')}>
          <TrustCard icon={<ShieldCheck />} title={t('downloadPage.trustOfficialTitle')} text={t('downloadPage.trustOfficialText')} />
          <TrustCard icon={<Smartphone />} title={t('downloadPage.trustHttpsTitle')} text={t('downloadPage.trustHttpsText')} />
          <TrustCard icon={<Check />} title={t('downloadPage.trustChecksumTitle')} text={t('downloadPage.trustChecksumText')} />
        </section>

        {showQrSection && (
        <section className="grid gap-6 rounded-3xl border border-red-100 bg-red-50/60 p-5 shadow-sm sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left lg:flex-col lg:text-center">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <QrCode />
            </div>
            <div className="mt-4 sm:ml-5 sm:mt-0 lg:ml-0 lg:mt-4">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900">{t('downloadPage.scanTitle')}</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">{t('downloadPage.scanDescription')}</p>
            </div>
          </div>

          <div>
            <SectionHeading title={t('downloadPage.shareTitle')} description={t('downloadPage.shareDescription')} />
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <ShareButton icon={<MessageCircle />} label={t('downloadPage.whatsapp')} onClick={shareOnWhatsApp} />
              <ShareButton icon={<Facebook />} label={t('downloadPage.facebook')} onClick={shareOnFacebook} />
              <ShareButton
                icon={linkCopied ? <Check /> : <Copy />}
                label={linkCopied ? t('downloadPage.linkCopied') : t('downloadPage.copyLink')}
                onClick={copyDownloadLink}
                active={linkCopied}
              />
            </div>
          </div>
        </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <SectionHeading title={t('downloadPage.technicalTitle')} description={t('downloadPage.technicalDescription')} />
          {release ? (
            <div className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {technicalRows.map(([label, value]) => <DetailRow key={label} label={label} value={value} />)}
              <HashRow label={t('downloadPage.apkSha256')} value={release.sha256} copied={copied === 'apk'} onCopy={() => copyHash('apk', release.sha256)} />
              <HashRow label={t('downloadPage.signingCertificateSha256')} value={release.signingCertificateSha256} copied={copied === 'certificate'} onCopy={() => copyHash('certificate', release.signingCertificateSha256)} />
            </div>
          ) : (
            <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              {releaseError ? t('downloadPage.metadataError') : t('downloadPage.metadataLoading')}
            </p>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <SectionHeading title={t('downloadPage.installTitle')} description={t('downloadPage.installDescription')} />
            <ol className="mt-6 space-y-4">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <li key={step} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-extrabold text-red-700">{step}</span>
                  <span className="pt-0.5 text-sm leading-6 text-slate-600">{t(`downloadPage.installStep${step}`)}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <SectionHeading title={t('downloadPage.storeTitle')} description={t('downloadPage.storeDescription')} />
            <div className="mt-6 space-y-3">
              {storeStatuses.map(([key, name, status]) => (
                <div key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="text-sm font-bold text-slate-700">{name}</span>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide ${status === 'available' ? 'bg-emerald-100 text-emerald-700' : status === 'underReview' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                    {t(`downloadPage.status.${status}`)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-8">
          <p className="font-bold text-slate-800">{t('downloadPage.reviewsTitle')}</p>
          <p className="mt-2 text-sm text-slate-500">{t('downloadPage.reviewsText')}</p>
        </section>

        <div className="flex justify-center pb-2">
          <a
            href="https://www.facebook.com/homelyserv"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:border-red-200 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <Facebook size={18} aria-hidden="true" />
            {t('downloadPage.followFacebook')}
          </a>
        </div>
      </div>
    </main>
  );
};

const HeroStat = ({ label, value }) => (
  <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-3 backdrop-blur-sm">
    <div className="text-[11px] font-semibold uppercase tracking-wide text-red-100">{label}</div>
    <div className="mt-1 truncate font-bold text-white">{value}</div>
  </div>
);

const TrustCard = ({ icon, title, text }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">{icon}</div>
    <h2 className="font-bold text-slate-900">{title}</h2>
    <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
  </div>
);

const SectionHeading = ({ title, description }) => (
  <div>
    <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
    <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="border-b border-slate-100 pb-3">
    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="mt-1 break-words text-sm font-semibold text-slate-800">{value}</dd>
  </div>
);

const HashRow = ({ label, value, copied, onCopy }) => (
  <div className="border-b border-slate-100 pb-3">
    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="mt-1 flex items-start gap-2">
      <code className="min-w-0 break-all text-xs leading-5 text-slate-700">{value}</code>
      <button type="button" onClick={onCopy} className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-600" aria-label={copied ? 'Copied' : 'Copy hash'} title={copied ? 'Copied' : 'Copy hash'}>
        {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
      </button>
    </dd>
  </div>
);

const QrCode = () => {
  const matrix = useMemo(() => createQrMatrix(DOWNLOAD_PAGE_URL), []);
  const quietZone = 4;
  const matrixSize = matrix.length;
  const viewBoxSize = matrixSize + quietZone * 2;

  return (
    <svg
      role="img"
      aria-label="https://homelyserv.com/download"
      className="h-40 w-40 sm:h-44 sm:w-44"
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={viewBoxSize} height={viewBoxSize} fill="white" />
      <path
        fill="#111827"
        shapeRendering="crispEdges"
        d={matrix.flatMap((row, rowIndex) => row.flatMap((dark, columnIndex) => (
          dark ? [`M${columnIndex + quietZone} ${rowIndex + quietZone}h1v1h-1z`] : []
        ))).join('')}
      />
    </svg>
  );
};

const ShareButton = ({ icon, label, onClick, active = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:text-red-600'}`}
  >
    {icon}
    {label}
  </button>
);

export default Download;
