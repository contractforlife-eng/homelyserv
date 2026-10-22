import { Capacitor, registerPlugin } from '@capacitor/core';

const NativeFamilyTracking = registerPlugin('HomelyServFamilyTracking');

export const isAndroidFamilyTrackingAvailable = () => Capacitor.getPlatform() === 'android';
export const getNativeTrackingStatus = () => NativeFamilyTracking.getStatus();
export const requestForegroundTrackingPermissions = () => NativeFamilyTracking.requestForegroundPermissions();
export const requestSupportingTrackingPermissions = () => NativeFamilyTracking.requestSupportingPermissions();
export const openBackgroundTrackingSettings = () => NativeFamilyTracking.openBackgroundPermissionSettings();
export const activateNativeTracking = (options) => NativeFamilyTracking.activate(options);
export const stopNativeTracking = () => NativeFamilyTracking.stop();

export default NativeFamilyTracking;
