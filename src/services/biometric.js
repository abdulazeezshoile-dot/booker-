import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_OPTIN_KEY = '@booker:biometricOptIn';

export async function isBiometricAvailable() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

export async function setBiometricOptIn(enabled) {
  await AsyncStorage.setItem(BIOMETRIC_OPTIN_KEY, enabled ? '1' : '0');
}

export async function getBiometricOptIn() {
  const val = await AsyncStorage.getItem(BIOMETRIC_OPTIN_KEY);
  return val === '1';
}

export async function biometricAuthenticate() {
  return LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock with fingerprint',
    fallbackLabel: 'Use password',
    disableDeviceFallback: false,
  });
}
