import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart3, Hospital as HospitalIcon, Locate, ShieldCheck, Truck } from 'lucide-react-native';
import { AmbulanceFeed } from '@/components/hospital/AmbulanceFeed';
import { ResourceGrid } from '@/components/hospital/ResourceGrid';
import { BedOccupancyChart } from '@/components/hospital/BedOccupancyChart';
import { NoticeBanner } from '@/components/shared/NoticeBanner';
import { Hospital, mockHospitals } from '@/lib/mockData';
import { getRealLocationAndHospitals, getSavedAssignedHospital } from '@/lib/locationStore';
import { getDeviceCoordinates } from '@/lib/geo';
import { colors, fonts, shadow } from '@/lib/theme';

type TabId = 'feed' | 'readiness' | 'occupancy';

const TABS: { id: TabId; label: string; icon: typeof Truck; color: string }[] = [
  { id: 'feed', label: 'Incoming', icon: Truck, color: colors.red500 },
  { id: 'readiness', label: 'Readiness', icon: ShieldCheck, color: colors.emerald500 },
  { id: 'occupancy', label: 'Beds', icon: BarChart3, color: colors.cyan600 },
];

export default function HospitalScreen() {
  const [currentHospital, setCurrentHospital] = useState<Hospital>(mockHospitals[0]);
  const [activeTab, setActiveTab] = useState<TabId>('feed');
  const [isLocating, setIsLocating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSavedAssignedHospital(mockHospitals[0]).then((saved) => {
      if (!cancelled) setCurrentHospital(saved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDetect = async () => {
    setIsLocating(true);
    setNotice('Searching for the nearest real hospital...');
    const coords = await getDeviceCoordinates();
    const lat = coords?.lat ?? 21.1384;
    const lng = coords?.lng ?? 79.1235;
    const live = await getRealLocationAndHospitals(lat, lng);
    setCurrentHospital(live.assignedHospital);
    setIsLocating(false);
    setNotice(`Synced to ${live.assignedHospital.name} (${live.assignedHospital.distanceKm} km away)`);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      {notice ? <NoticeBanner message={notice} tag="HOSPITAL SYNC" /> : null}

      <View style={styles.headerCard}>
        <View style={styles.titleRow}>
          <View style={styles.iconBox}>
            <HospitalIcon size={24} color={colors.blue600} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{currentHospital.name}</Text>
            <Text style={styles.meta} numberOfLines={3}>
              {currentHospital.address}
              {'\n'}
              <Text style={styles.level}>{currentHospital.traumaCenterLevel}</Text>
              {currentHospital.traumaCenterLevel.includes(`${currentHospital.distanceKm} km`) ? null : (
                <Text style={styles.distance}>{` · ${currentHospital.distanceKm} km`}</Text>
              )}
            </Text>
          </View>
        </View>

        <Pressable style={styles.syncBtn} onPress={handleDetect} disabled={isLocating}>
          <Locate size={14} color={colors.white} />
          <Text style={styles.syncText}>{isLocating ? 'Locating...' : 'Sync nearest hospital'}</Text>
        </Pressable>

        <View style={styles.tabs}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)} style={[styles.tab, active && styles.tabActive]}>
                <Icon size={14} color={tab.color} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {activeTab === 'feed' ? <AmbulanceFeed /> : null}
      {activeTab === 'readiness' ? <ResourceGrid /> : null}
      {activeTab === 'occupancy' ? <BedOccupancyChart /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32, gap: 14 },
  headerCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
    ...shadow.card,
  },
  titleRow: { flexDirection: 'row', gap: 10 },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.blue50,
    borderWidth: 1,
    borderColor: colors.blue200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.slate900 },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.slate500, marginTop: 4, lineHeight: 17 },
  level: { color: colors.emerald700, fontFamily: fonts.bold },
  distance: { color: colors.blue700, fontFamily: fonts.bold },
  syncBtn: {
    backgroundColor: colors.blue600,
    borderRadius: 12,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  syncText: { color: colors.white, fontFamily: fonts.extrabold, fontSize: 12 },
  tabs: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 14, padding: 4, gap: 4 },
  tab: { flex: 1, minHeight: 38, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  tabActive: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  tabText: { fontFamily: fonts.bold, fontSize: 12, color: colors.slate600 },
  tabTextActive: { color: colors.blue700 },
});
