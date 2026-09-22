import { Linking } from 'react-native';

export async function callPhone(phone: string): Promise<boolean> {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned) return false;
  try {
    await Linking.openURL(`tel:${cleaned}`);
    return true;
  } catch (error) {
    console.warn('Unable to open dialer:', error);
    return false;
  }
}
