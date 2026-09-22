import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Activity, Hospital, Siren, Truck, User } from 'lucide-react-native';
import { colors, fonts } from '@/lib/theme';

interface BottomNavigationProps {
  state: {
    index: number;
    routes: { key: string; name: string }[];
  };
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

const ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  index: Activity,
  ambulance: Truck,
  hospital: Hospital,
  patient: User,
  surge: Siren,
};

const LABELS: Record<string, string> = {
  index: 'Home',
  ambulance: 'Driver',
  hospital: 'Hospital',
  patient: 'Patient',
  surge: 'Surge',
};

export function BottomNavigation({ state, navigation }: BottomNavigationProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          if (!LABELS[route.name]) return null;
          const focused = state.index === index;
          const Icon = ICONS[route.name] ?? Activity;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          return (
            <Pressable key={route.key} onPress={onPress} style={styles.item} accessibilityRole="button">
              <View style={[styles.bubble, focused && styles.bubbleOn]}>
                <Icon size={20} color={focused ? colors.white : colors.textMuted} />
              </View>
              <Text style={[styles.label, focused && styles.labelOn]}>{LABELS[route.name] ?? route.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bg,
    paddingTop: 6,
    paddingHorizontal: 12,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  bubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleOn: { backgroundColor: colors.ink },
  label: { fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted },
  labelOn: { color: colors.text, fontFamily: fonts.bold },
});
