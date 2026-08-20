import { registerPlugin } from '@capacitor/core';

const HomelyServBiometricUnlock = registerPlugin('HomelyServBiometricUnlock');

export const isAvailable = () => HomelyServBiometricUnlock.isAvailable();
export const isEnabled = () => HomelyServBiometricUnlock.isEnabled();
export const enable = (token) => HomelyServBiometricUnlock.enable({ token });
export const unlock = () => HomelyServBiometricUnlock.unlock();
export const disable = () => HomelyServBiometricUnlock.disable();

export default HomelyServBiometricUnlock;
