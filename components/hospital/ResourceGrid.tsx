import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Microscope,
  Scan,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react-native';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { HospitalResource, mockHospitals } from '@/lib/mockData';
import { colors, fonts } from '@/lib/theme';

const CATEGORIES = [
  'All',
  'General Capacity',
  'Operation Theatre Equipment',
  'Patient Monitoring Equipment',
  'Diagnostic Imaging',
  'Laboratory',
];

export const ResourceGrid: React.FC = () => {
  const [resources, setResources] = useState<HospitalResource[]>(mockHospitals[0].resources);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const { width } = useWindowDimensions();
  const cardWidth = width >= 760 ? '31.5%' : '100%';

  const cycleStatus = (id: string) => {
    setResources((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (item.status === 'Available') {
          return { ...item, status: 'Limited', available: Math.max(0, item.available - 1) };
        }
        if (item.status === 'Limited') {
          return { ...item, status: 'Critical', available: 0 };
        }
        return { ...item, status: 'Available', available: item.total };
      })
    );
  };

  const filtered = resources.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStatus = filterStatus === 'All' || item.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesCategory && matchesStatus;
  });

  const counts = {
    available: resources.filter((item) => item.status === 'Available').length,
    limited: resources.filter((item) => item.status === 'Limited').length,
    critical: resources.filter((item) => item.status === 'Critical').length,
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.titleRow}>
            <ShieldCheck size={18} color={colors.emerald600} />
            <Text style={styles.title}>Facility Readiness & Equipment</Text>
          </View>
          <Text style={styles.subtitle}>Tap a resource to cycle Available, Limited, and Critical</Text>
        </View>
      </View>

      <View style={styles.summary}>
        <Text style={styles.okChip}>✓ {counts.available} OK</Text>
        <Text style={styles.limitedChip}>⚠ {counts.limited} Limited</Text>
        <Text style={styles.criticalChip}>✕ {counts.critical} Critical</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <FilterPill label="All" active={filterStatus === 'All'} activeColor={colors.blue600} icon={<Filter size={13} color={filterStatus === 'All' ? colors.white : colors.slate700} />} onPress={() => setFilterStatus('All')} />
        <FilterPill label="Available" active={filterStatus === 'Available'} activeColor={colors.emerald600} icon={<CheckCircle2 size={13} color={filterStatus === 'Available' ? colors.white : colors.slate700} />} onPress={() => setFilterStatus('Available')} />
        <FilterPill label="Limited" active={filterStatus === 'Limited'} activeColor={colors.amber500} icon={<AlertTriangle size={13} color={filterStatus === 'Limited' ? colors.white : colors.slate700} />} onPress={() => setFilterStatus('Limited')} />
        <FilterPill label="Critical" active={filterStatus === 'Critical'} activeColor={colors.red600} icon={<AlertOctagon size={13} color={filterStatus === 'Critical' ? colors.white : colors.slate700} />} onPress={() => setFilterStatus('Critical')} />
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {CATEGORIES.map((category) => (
          <Pressable
            key={category}
            onPress={() => setSelectedCategory(category)}
            style={[styles.catPill, selectedCategory === category && styles.catPillActive]}
          >
            <CategoryIcon category={category} />
            <Text style={[styles.catText, selectedCategory === category && styles.catTextActive]}>{category}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <Text style={styles.empty}>No resources match the selected filters.</Text>
      ) : (
        <View style={styles.grid}>
          {filtered.map((resource) => {
            const tone =
              resource.status === 'Available'
                ? { bg: '#F0FDF4', border: colors.emerald200, value: colors.emerald700 }
                : resource.status === 'Limited'
                  ? { bg: '#FFFBEB', border: colors.amber200, value: colors.amber700 }
                  : { bg: '#FEF2F2', border: colors.red200, value: colors.red700 };
            return (
              <Pressable
                key={resource.id}
                onPress={() => cycleStatus(resource.id)}
                style={[styles.resource, { width: cardWidth, backgroundColor: tone.bg, borderColor: tone.border }]}
              >
                <View style={styles.resourceTop}>
                  <Text style={styles.resourceName}>{resource.name}</Text>
                  <StatusBadge status={resource.status} size="sm" />
                </View>
                <View style={styles.catLine}>
                  <CategoryIcon category={resource.category} />
                  <Text style={styles.catLineText} numberOfLines={1}>
                    {resource.category}
                  </Text>
                </View>
                <View style={styles.resourceFoot}>
                  <Text style={styles.available}>
                    Available <Text style={{ color: tone.value, fontFamily: fonts.extrabold }}>{resource.available} / {resource.total}</Text>
                  </Text>
                  <Text style={styles.tap}>Tap to toggle</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
};

function FilterPill({
  label,
  active,
  activeColor,
  icon,
  onPress,
}: {
  label: string;
  active: boolean;
  activeColor: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.filterPill, active && { backgroundColor: activeColor, borderColor: activeColor }]}>
      {icon}
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </Pressable>
  );
}

function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case 'General Capacity':
      return <Activity size={14} color={colors.emerald600} />;
    case 'Operation Theatre Equipment':
      return <Stethoscope size={14} color={colors.blue600} />;
    case 'Patient Monitoring Equipment':
      return <ShieldCheck size={14} color={colors.cyan600} />;
    case 'Diagnostic Imaging':
      return <Scan size={14} color={colors.amber600} />;
    case 'Laboratory':
      return <Microscope size={14} color={colors.purple600} />;
    default:
      return <Filter size={14} color={colors.slate400} />;
  }
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  head: { flexDirection: 'row' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: 18, color: colors.slate900 },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, color: colors.slate500 },
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  okChip: chip(colors.emerald50, colors.emerald200, colors.emerald700),
  limitedChip: chip(colors.amber50, colors.amber200, colors.amber700),
  criticalChip: chip(colors.red50, colors.red200, colors.red700),
  filterRow: { gap: 8, paddingVertical: 2 },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterText: { fontFamily: fonts.bold, fontSize: 12, color: colors.slate700 },
  filterTextActive: { color: colors.white },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  catPillActive: { backgroundColor: colors.blue50, borderColor: colors.blue200 },
  catText: { fontFamily: fonts.bold, fontSize: 12, color: colors.slate600 },
  catTextActive: { color: colors.blue800 },
  empty: { textAlign: 'center', color: colors.slate400, fontFamily: fonts.medium, paddingVertical: 28 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  resource: { borderWidth: 1, borderRadius: 14, padding: 14, minHeight: 120, justifyContent: 'space-between' },
  resourceTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' },
  resourceName: { flex: 1, fontFamily: fonts.bold, fontSize: 14, color: colors.slate900 },
  catLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  catLineText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, color: colors.slate500 },
  resourceFoot: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.35)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  available: { fontFamily: fonts.regular, fontSize: 12, color: colors.slate500 },
  tap: { fontFamily: fonts.bold, fontSize: 10, color: colors.slate400 },
});

function chip(backgroundColor: string, borderColor: string, color: string) {
  return {
    backgroundColor,
    borderColor,
    color,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden' as const,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontFamily: fonts.bold,
    fontSize: 12,
  };
}
