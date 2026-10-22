import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
const configuredTileUrl = String(import.meta.env.VITE_FAMILY_TRACKING_TILE_URL || '').trim();
const configuredTileAttribution = String(import.meta.env.VITE_FAMILY_TRACKING_TILE_ATTRIBUTION || '').trim();

const MapViewport = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 16);
    if (points.length > 1) map.fitBounds(points, { padding: [30, 30], maxZoom: 17 });
  }, [map, points]);
  return null;
};

const formatTime = (value, timeZone) => value
  ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(new Date(value))
  : 'No successful observation';

const getTrackingLabel = (status) => {
  if (!status) return 'Status unavailable';
  if (status.activationState === 'ACTIVE' && status.collectionEnabled) return 'Active on student device';
  if (status.activationState === 'PAUSED') return 'Paused';
  if (status.activationState?.startsWith('AWAITING_')) return 'Activation incomplete';
  return 'Not activated';
};

const FamilyTracking = () => {
  const { studentId } = useParams();
  const [selectedDate, setSelectedDate] = useState('');
  const [status, setStatus] = useState(null);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState(false);

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
      setError(requestError?.response?.data?.message || 'Unable to load family tracking data.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

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
        if (active) setError(requestError?.response?.data?.message || 'Unable to load movement history.');
      } finally {
        if (active) setHistoryLoading(false);
      }
    };
    loadHistory();
    return () => { active = false; };
  }, [selectedDate, status?.todayDate, studentId]);

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
    const confirmed = window.confirm(
      'Approve this student-device activation? Location may be collected in the background only after the student grants Android permissions. A persistent notification will remain visible while tracking runs.'
    );
    if (!confirmed) return;
    try {
      setApproving(true);
      setError('');
      await approveFamilyTrackingSafeguard(studentId);
      await loadSummary();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to approve the tracking safeguard.');
    } finally {
      setApproving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <RolePageHeader
          title="HomelyServ Family Tracking"
          subtitle={status?.student?.fullName ? `${status.student.fullName} — Recorded Location & Movement History` : 'Recorded Location & Movement History'}
          icon={MapPinned}
          actions={(
            <Link to="/parent-students" className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30">
              <ArrowLeft size={17} /> My Children
            </Link>
          )}
        />

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            <AlertCircle size={20} /><span>{error}</span>
            <button type="button" onClick={loadSummary} className="ml-auto text-sm font-bold underline">Retry</button>
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
                <p className="text-xs font-semibold uppercase text-gray-500">Last recorded location</p>
                <p className="mt-1 font-bold text-gray-900 dark:text-white">{formatTime(current?.recordedAt, status?.timeZone)}</p>
                {current ? (
                  <p className="mt-1 text-xs text-gray-500">
                    Accuracy {Math.round(current.accuracy)} m{lastUpdateIsStale ? ' • Stale observation, not live' : ' • Recent observation, not live'}
                  </p>
                ) : <p className="mt-1 text-xs text-gray-500">No observation within the 24-hour last-known policy.</p>}
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {status?.activationState === 'PAUSED' ? <PauseCircle className="mb-3 text-amber-600" /> : <ShieldCheck className="mb-3 text-teal-600" />}
                <p className="text-xs font-semibold uppercase text-gray-500">Tracking & permission</p>
                <p className="mt-1 font-bold text-gray-900 dark:text-white">{getTrackingLabel(status)}</p>
                <p className="text-xs text-gray-500">{String(status?.permissionStatus || 'NOT_REQUESTED').replaceAll('_', ' ')}</p>
                {!status?.nativePermissionVerified && <p className="text-xs text-amber-600">Native permission is not verified; collection remains unavailable.</p>}
                {status?.activationState === 'AWAITING_AGE_SAFEGUARD' && (
                  <button type="button" disabled={approving} onClick={approveSafeguard} className="mt-3 rounded-lg bg-teal-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                    {approving ? 'Approving…' : 'Approve age safeguard'}
                  </button>
                )}
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <CalendarDays className="mb-3 text-teal-600" />
                <p className="text-xs font-semibold uppercase text-gray-500">History plan</p>
                <p className="mt-1 font-bold text-gray-900 dark:text-white">{status?.premium ? 'Premium — 90 days' : 'Free — 3 days'}</p>
                <p className="text-xs text-gray-500">Calendar days use {status?.timeZone || 'the student timezone'}.</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-col gap-3 border-b border-gray-100 p-5 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">Recorded movement for selected day</h2>
                  <p className="text-xs text-gray-500">Only recorded points from this date are shown. Gaps, poor accuracy, and implausible jumps are not joined.</p>
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

              {!configuredTileUrl && (
                <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  Basemap tiles are disabled until HomelyServ approves a privacy-compliant map provider. Recorded geometry remains interactive without third-party tile requests.
                </div>
              )}

              {historyLoading ? (
                <div className="flex min-h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
              ) : observations.length === 0 ? (
                <div className="flex min-h-96 flex-col items-center justify-center px-6 text-center">
                  <Navigation className="mb-3 h-12 w-12 text-gray-300" />
                  <h3 className="font-bold text-gray-800 dark:text-gray-100">No observations for this date</h3>
                  <p className="mt-1 max-w-lg text-sm text-gray-500">No current or last-known marker is placed on an unrelated historical day.</p>
                </div>
              ) : (
                <div className="h-[520px] w-full">
                  <MapContainer center={mapCenter} zoom={15} scrollWheelZoom className="h-full w-full" aria-label="Recorded child movement map">
                    {configuredTileUrl && (
                      <TileLayer attribution={configuredTileAttribution} url={configuredTileUrl} />
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
                            <strong>Recorded observation</strong><br />
                            <Clock3 size={13} className="inline" /> {formatTime(point.recordedAt, history?.timeZone)}<br />
                            Accuracy: {Math.round(point.accuracy)} m<br />
                            {point.speed != null && <>Speed: {point.speed.toFixed(1)} m/s<br /></>}
                            {point.heading != null && <>Heading: {Math.round(point.heading)}°</>}
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
                        <Popup>Valid route geometry start<br />{formatTime(routeStart.recordedAt, history?.timeZone)}</Popup>
                      </Marker>
                    )}
                    {routeEnd && (
                      <Marker position={[routeEnd.latitude, routeEnd.longitude]} icon={routeEndIcon}>
                        <Popup>Valid route geometry end<br />{formatTime(routeEnd.recordedAt, history?.timeZone)}</Popup>
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
