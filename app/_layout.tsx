import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { LogBox, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Header } from '@/components/Header';
import { EmergencyProvider } from '@/lib/emergency/store';
import { colors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

LogBox.ignoreLogs([
  'Overpass fetch error',
  'Public OSRM API fallback',
  'Nominatim Hospital Search',
  'Reverse geocode error',
  'Geocode error',
]);

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <EmergencyProvider>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <Header />
          <View style={styles.body}>
            <Tabs
              tabBar={(props) => (
                <BottomNavigation state={props.state} navigation={props.navigation} />
              )}
              screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
            >
              <Tabs.Screen name="index" options={{ title: 'Home' }} />
              <Tabs.Screen name="ambulance" options={{ title: 'Driver' }} />
              <Tabs.Screen name="hospital" options={{ title: 'Hospital' }} />
              <Tabs.Screen name="patient" options={{ title: 'Patient' }} />
              <Tabs.Screen name="blood" options={{ href: null, title: 'Blood' }} />
              <Tabs.Screen name="surge" options={{ title: 'Surge' }} />
              <Tabs.Screen name="+not-found" options={{ href: null }} />
            </Tabs>
          </View>
        </SafeAreaView>
        </EmergencyProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, backgroundColor: colors.bg },
});
