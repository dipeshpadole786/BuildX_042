import { Linking, Platform } from 'react-native';

export const EMERGENCY_SMS_NUMBER = '8788964882';

export const EMERGENCY_SMS_BODY =
  ' EMERGENCY ALERT\nCritical medical emergency detected.\nPlease check the emergency dashboard immediately.';

/** Opens the phone SMS app. Android still requires the user to press Send. */
export async function openEmergencySms(body: string = EMERGENCY_SMS_BODY): Promise<boolean> {
  const encoded = encodeURIComponent(body);
  const url =
    Platform.OS === 'ios'
      ? `sms:${EMERGENCY_SMS_NUMBER}&body=${encoded}`
      : `sms:${EMERGENCY_SMS_NUMBER}?body=${encoded}`;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
