import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { LogBox, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Activity, Hospital, Truck, User } from 'lucide-react-native';
import { AppHeader } from '@/components/shared/AppHeader';
import { colors, fonts } from '@/lib/theme';

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
        <SafeAreaView style={styles.safe} edges={['top']}>
          <AppHeader />
          <View style={styles.body}>
            <Tabs
              screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.blue700,
                tabBarInactiveTintColor: colors.slate500,
                tabBarHideOnKeyboard: true,
                tabBarStyle: styles.tabBar,
                tabBarLabelStyle: styles.tabLabel,
              }}
            >
              <Tabs.Screen
                name="index"
                options={{
                  title: 'Home',
                  tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />,
                }}
              />
              <Tabs.Screen
                name="ambulance"
                options={{
                  title: 'Driver',
                  tabBarIcon: ({ color, size }) => <Truck color={color} size={size} />,
                }}
              />
              <Tabs.Screen
                name="hospital"
                options={{
                  title: 'Hospital',
                  tabBarIcon: ({ color, size }) => <Hospital color={color} size={size} />,
                }}
              />
              <Tabs.Screen
                name="patient"
                options={{
                  title: 'Patient',
                  tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
                }}
              />
              <Tabs.Screen name="+not-found" options={{ href: null }} />
            </Tabs>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, backgroundColor: colors.white },
  body: { flex: 1, backgroundColor: colors.bg },
  tabBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  tabLabel: { fontFamily: fonts.bold, fontSize: 11 },
});
