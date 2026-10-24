import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Clock3,
  Loader2,
  LocateFixed,
  MapPinned,
  Navigation,
  PauseCircle,
  ShieldCheck
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import RolePageHeader from '../components/common/RolePageHeader';
import {
  getFamilyTrackingCurrent,
  getFamilyTrackingHistory,
  getFamilyTrackingStatus,
  approveFamilyTrackingSafeguard
} from '../services/parentStudentService';

const markerIcon = (color, size = 18) => L.divIcon({
  className: '',
  html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:999px;background:${color};border:3px solid white;box-shadow:0 1px 6px rgba(0,0,0,.45)"></span>`,
  iconSize: [size, size],
  iconAnchor: [size / 2, size / 2]
});

const routeStartIcon = markerIcon('#16a34a', 22);
const routeEndIcon = markerIcon('#dc2626', 22);
const recordedPointIcon = markerIcon('#0d9488', 14);

// Approved privacy-compliant basemap provider default (CartoDB Voyager raster tiles)
// Displays clear roads, street names, and building shapes with high-contrast labels.
const DEFAULT_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const DEFAULT_TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>';

const configuredTileUrl = String(import.meta.env.VITE_FAMILY_TRACKING_TILE_URL || DEFAULT_TILE_URL).trim();
const configuredTileAttribution = String(import.meta.env.VITE_FAMILY_TRACKING_TILE_ATTRIBUTION || DEFAULT_TILE_ATTRIBUTION).trim();

const MapViewport = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 16);
    if (points.length > 1) map.fitBounds(points, { padding: [30, 30], maxZoom: 17 });
  }, [map, points]);
  return null;
};

const formatTime = (value, timeZone, fallback) => value
  ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(new Date(value))
  : fallback;

const FamilyTracking = () => {
  const { t } = useTranslation();
  const { studentId } = useParams();
  const [selectedDate, setSelectedDate] = useState('');
  const [status, setStatus] = useState(null);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [tileRetryKey, setTileRetryKey] = useState(0);

  const getTrackingLabel = useCallback((trackingStatus) => {
    if (!trackingStatus) return t('familyTracking.statusUnavailable');
    if (trackingStatus.activationState === 'ACTIVE' && trackingStatus.collectionEnabled) return t('familyTracking.statusActive');
    if (trackingStatus.activationState === 'PAUSED') return t('familyTracking.statusPaused');
    if (trackingStatus.activationState?.startsWith('AWAITING_')) return t('familyTracking.statusIncomplete');
    return t('familyTracking.statusNotActivated');
  }, [t]);

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [statusResponse, currentResponse] = await Promise.all([
        getFamilyTrackingStatus(studentId),
        getFamilyTrackingCurrent(studentId)
      ]);
      setStatus(statusResponse.status);
      setCurrent(currentResponse.location);
      setSelectedDate((existing) => existing || statusResponse.status.todayDate);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || t('familyTracking.statusUnavailable'));
    } finally {
      setLoading(false);
    }
  }, [studentId, t]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (!selectedDate || !status?.todayDate) return;
    let active = true;
    const loadHistory = async () => {
      try {
        setHistoryLoading(true);
        setError('');
        const response = await getFamilyTrackingHistory(
          studentId,
          selectedDate === status.todayDate ? null : selectedDate
        );
        if (active) setHistory(response);
      } catch (requestError) {
        if (active) setError(requestError?.response?.data?.message || t('familyTracking.noObservationsForDate'));
      } finally {
        if (active) setHistoryLoading(false);
      }
    };
    loadHistory();
    return () => { active = false; };
  }, [selectedDate, status?.todayDate, studentId, t]);

  const observations = history?.observations || [];
  const mapPoints = useMemo(
    () => observations.map((point) => [point.latitude, point.longitude]),
    [observations]
  );
  const routeGeometry = useMemo(
    () => (history?.routeSegments || []).flat(),
    [history?.routeSegments]
  );
  const routeStart = routeGeometry[0] || null;
  const routeEnd = routeGeometry.at(-1) || null;
  const mapCenter = mapPoints.at(-1) || [30.0444, 31.2357];
  const lastUpdateIsStale = current?.recordedAt
    ? Date.now() - new Date(current.recordedAt).getTime() > 15 * 60 * 1000
    : false;

  const approveSafeguard = async () => {
    const confirmed = window.confirm(t('familyTracking.approveSafeguardConfirm'));
    if (!confirmed) return;
    try {
      setApproving(true);
      setError('');
      await approveFamilyTrackingSafeguard(studentId);
      await loadSummary();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || t('familyTracking.errVerificationFailed'));
    } finally {
      setApproving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <RolePageHeader
          title={t('familyTracking.guardianTitle')}
          subtitle={status?.student?.fullName ? `${status.student.fullName} — ${t('familyTracking.guardianSubtitle')}` : t('familyTracking.guardianSubtitle')}
          icon={MapPinned}
          actions={(
            <Link to="/parent-students" className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30">
              <ArrowLeft size={17} /> {t('familyTracking.myChildren')}
            </Link>
          )}
        />

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            <AlertCircle size={20} /><span>{error}</span>
            <button type="button" onClick={loadSummary} className="ml-auto text-sm font-bold underline">{t('familyTracking.retry')}</button>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-80 items-center justify-center rounded-2xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
            <Loader2 className="h-9 w-9 animate-spin text-teal-600" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <LocateFixed className="mb-3 text-red-600" />
                <p className="text-xs font-semibold uppercase text-gray-500">{t('familyTracking.lastRecordedLocation')}</p>
                <p className="mt-1 font-bold text-gray-900 dark:text-white">{formatTime(current?.recordedAt, status?.timeZone, t('familyTracking.noSuccessfulObservation'))}</p>
                {current ? (
                  <p className="mt-1 text-xs text-gray-500">
                    {t('familyTracking.accuracyMeters', { accuracy: Math.round(current.accuracy) })} • {lastUpdateIsStale ? t('familyTracking.staleObservation') : t('familyTracking.recentObservation')}
                  </p>
                ) : <p className="mt-1 text-xs text-gray-500">{t('familyTracking.noRecentObservation')}</p>}
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {status?.activationState === 'PAUSED' ? <PauseCircle className="mb-3 text-amber-600" /> : <ShieldCheck className="mb-3 text-teal-600" />}
                <p className="text-xs font-semibold uppercase text-gray-500">{t('familyTracking.trackingAndPermission')}</p>
                <p className="mt-1 font-bold text-gray-900 dark:text-white">{getTrackingLabel(status)}</p>
                <p className="text-xs text-gray-500">{String(status?.permissionStatus || 'NOT_REQUESTED').replaceAll('_', ' ')}</p>
                {!status?.nativePermissionVerified && <p className="text-xs text-amber-600">{t('familyTracking.nativeUnverifiedWarning')}</p>}
                {status?.activationState === 'AWAITING_AGE_SAFEGUARD' && (
                  <button type="button" disabled={approving} onClick={approveSafeguard} className="mt-3 rounded-lg bg-teal-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                    {approving ? t('familyTracking.approvingSafeguard') : t('familyTracking.approveSafeguardBtn')}
                  </button>
                )}
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <CalendarDays className="mb-3 text-teal-600" />
                <p className="text-xs font-semibold uppercase text-gray-500">{t('familyTracking.historyPlan')}</p>
                <p className="mt-1 font-bold text-gray-900 dark:text-white">{status?.premium ? t('familyTracking.premiumPlan') : t('familyTracking.freePlan')}</p>
                <p className="text-xs text-gray-500">{t('familyTracking.studentTimezoneNotice', { timeZone: status?.timeZone || 'UTC' })}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-col gap-3 border-b border-gray-100 p-5 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">{t('familyTracking.recordedMovementTitle')}</h2>
                  <p className="text-xs text-gray-500">{t('familyTracking.recordedMovementDesc')}</p>
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <CalendarDays size={17} className="text-teal-600" />
                  <input
                    type="date"
                    value={selectedDate}
                    min={status?.earliestAvailableDate}
                    max={status?.todayDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900"
                  />
                </label>
              </div>

              {tileError && (
                <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200 flex items-center justify-between">
                  <span>{t('familyTracking.tileLoadErrorNotice', 'Map tiles could not be loaded. Please check your internet connection.')}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTileError(false);
                      setTileRetryKey((prev) => prev + 1);
                    }}
                    className="font-semibold underline ml-2"
                  >
                    {t('familyTracking.retry')}
                  </button>
                </div>
              )}

              {historyLoading ? (
                <div className="flex min-h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
              ) : observations.length === 0 ? (
                <div className="flex min-h-96 flex-col items-center justify-center px-6 text-center">
                  <Navigation className="mb-3 h-12 w-12 text-gray-300" />
                  <h3 className="font-bold text-gray-800 dark:text-gray-100">{t('familyTracking.noObservationsForDate')}</h3>
                  <p className="mt-1 max-w-lg text-sm text-gray-500">{t('familyTracking.noObservationsDesc')}</p>
                </div>
              ) : (
                <div className="h-[520px] w-full">
                  <MapContainer center={mapCenter} zoom={15} scrollWheelZoom className="h-full w-full" aria-label="Recorded child movement map">
                    {configuredTileUrl && (
                      <TileLayer
                        key={`tile-layer-${tileRetryKey}`}
                        attribution={configuredTileAttribution}
                        url={configuredTileUrl}
                        eventHandlers={{
                          tileerror: () => setTileError(true),
                          tileload: () => setTileError(false)
                        }}
                      />
                    )}
                    <MapViewport points={mapPoints} />
                    {(history?.routeSegments || []).map((segment, index) => (
                      <Polyline
                        key={`${selectedDate}-${index}`}
                        positions={segment.map((point) => [point.latitude, point.longitude])}
                        pathOptions={{ color: '#0d9488', weight: 5, opacity: 0.8 }}
                      />
                    ))}
                    {observations.map((point) => (
                      <React.Fragment key={point.id}>
                        <Marker position={[point.latitude, point.longitude]} icon={recordedPointIcon}>
                          <Popup>
                            <strong>{t('familyTracking.recordedObservation')}</strong><br />
                            <Clock3 size={13} className="inline" /> {formatTime(point.recordedAt, history?.timeZone, '')}<br />
                            {t('familyTracking.accuracyMeters', { accuracy: Math.round(point.accuracy) })}<br />
                            {point.speed != null && <>{t('familyTracking.speedUnit', { speed: point.speed.toFixed(1) })}<br /></>}
                            {point.heading != null && <>{t('familyTracking.headingUnit', { heading: Math.round(point.heading) })}</>}
                          </Popup>
                        </Marker>
                        <Circle
                          center={[point.latitude, point.longitude]}
                          radius={point.accuracy}
                          pathOptions={{ color: point.lowAccuracy ? '#f59e0b' : '#0d9488', fillOpacity: 0.05, weight: 1 }}
                        />
                      </React.Fragment>
                    ))}
                    {routeStart && (
                      <Marker position={[routeStart.latitude, routeStart.longitude]} icon={routeStartIcon}>
                        <Popup>{t('familyTracking.routeStart')}<br />{formatTime(routeStart.recordedAt, history?.timeZone, '')}</Popup>
                      </Marker>
                    )}
                    {routeEnd && (
                      <Marker position={[routeEnd.latitude, routeEnd.longitude]} icon={routeEndIcon}>
                        <Popup>{t('familyTracking.routeEnd')}<br />{formatTime(routeEnd.recordedAt, history?.timeZone, '')}</Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FamilyTracking;
