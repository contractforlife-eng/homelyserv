import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download as DownloadIcon, Facebook, ShieldCheck, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import appIcon from '../assets/homelyserv-app-icon.png';

const RELEASE_MANIFEST_URL = '/downloads/android/1.0.0-1/release.json';
const FALLBACK_DOWNLOAD_URL = '/downloads/android/HomelyServ-1.0.0-1.apk';

const formatBytes = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

const setMeta = (attribute, value, content) => {
  let element = document.head.querySelector(`meta[${attribute}="${value}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, value);
    element.dataset.downloadPage = 'true';
    document.head.appendChild(element);
  }
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
  element.href = href;
};

const Download = () => {
  const { t, i18n } = useTranslation();
  const [release, setRelease] = useState(null);
  const [releaseError, setReleaseError] = useState(false);
  const [copied, setCopied] = useState('');

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
    setMeta('name', 'description', t('downloadPage.seoDescription'));
    setMeta('property', 'og:title', t('downloadPage.seoTitle'));
    setMeta('property', 'og:description', t('downloadPage.seoDescription'));
    setMeta('property', 'og:url', 'https://homelyserv.com/download');
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:image', `${window.location.origin}/favicon.png`);
    setMeta('name', 'twitter:card', 'summary');
    setMeta('name', 'twitter:title', t('downloadPage.seoTitle'));
    setMeta('name', 'twitter:description', t('downloadPage.seoDescription'));
    setCanonical('https://homelyserv.com/download');

    return () => {
      document.title = previousTitle;
      document.head.querySelectorAll('[data-download-page="true"]').forEach((element) => element.remove());
      document.head.querySelector('link[rel="canonical"][data-download-page="true"]')?.remove();
    };
  }, [i18n.language, t]);

  const downloadUrl = release?.downloadUrl || FALLBACK_DOWNLOAD_URL;
  const releaseDate = useMemo(() => {
    if (!release?.releaseDate) return '—';
    return new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
      new Date(`${release.releaseDate}T00:00:00`)
    );
  }, [i18n.language, release?.releaseDate]);

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
              <img src="/favicon.png" alt="HomelyServ" className="h-11 w-11 object-contain brightness-0 invert" />
              <span className="text-lg font-bold tracking-tight">HomelyServ</span>
            </div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-red-100">{t('downloadPage.officialRelease')}</p>
            <h1 className="max-w-2xl text-4xl font-black tracking-tight sm:text-6xl">{t('downloadPage.title')}</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-red-50 sm:text-lg">{t('downloadPage.heroDescription')}</p>
            <a
              href={downloadUrl}
              download
              className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-base font-extrabold text-red-700 shadow-xl transition hover:bg-red-50 focus-visible:outline-white sm:w-auto"
            >
              <DownloadIcon size={21} aria-hidden="true" />
              {t('downloadPage.downloadApk')}
            </a>
            <div className="mt-6 grid max-w-xl grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <HeroStat label={t('downloadPage.version')} value={release?.versionName || '—'} />
              <HeroStat label={t('downloadPage.apkSize')} value={release ? formatBytes(release.sizeBytes) : '—'} />
              <HeroStat label={t('downloadPage.minimumAndroid')} value={release?.minAndroid || '—'} />
              <HeroStat label={t('downloadPage.releaseDate')} value={releaseDate} />
            </div>
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

export default Download;
