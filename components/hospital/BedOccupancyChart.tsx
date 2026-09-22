import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { BarChart3, PieChart as PieIcon } from 'lucide-react-native';
import { SectionCard } from '@/components/shared/SectionCard';
import { mockHospitals } from '@/lib/mockData';
import { colors, fonts } from '@/lib/theme';

const SERIES = [
  { key: 'generalOccupied' as const, color: '#EF4444', label: 'General Occupied' },
  { key: 'generalFree' as const, color: '#10B981', label: 'General Free' },
  { key: 'icuOccupied' as const, color: '#F59E0B', label: 'ICU Occupied' },
  { key: 'icuFree' as const, color: '#3B82F6', label: 'ICU Free' },
];

export const BedOccupancyChart: React.FC = () => {
  const deptData = mockHospitals[0].departmentOccupancy;
  const totalGeneralOccupied = deptData.reduce((sum, row) => sum + row.generalOccupied, 0);
  const totalGeneralFree = deptData.reduce((sum, row) => sum + row.generalFree, 0);
  const totalIcuOccupied = deptData.reduce((sum, row) => sum + row.icuOccupied, 0);
  const totalIcuFree = deptData.reduce((sum, row) => sum + row.icuFree, 0);
  const total = totalGeneralOccupied + totalGeneralFree + totalIcuOccupied + totalIcuFree;
  const busy = total === 0 ? 0 : Math.round(((totalGeneralOccupied + totalIcuOccupied) / total) * 100);

  const donut = [
    { name: 'General Occupied', value: totalGeneralOccupied, color: '#EF4444' },
    { name: 'General Free', value: totalGeneralFree, color: '#10B981' },
    { name: 'ICU Occupied', value: totalIcuOccupied, color: '#F59E0B' },
    { name: 'ICU Free', value: totalIcuFree, color: '#3B82F6' },
  ];

  const maxValue = Math.max(1, ...deptData.flatMap((row) => SERIES.map((series) => row[series.key])));
  const chartHeight = 150;

  return (
    <View style={styles.wrap}>
      <SectionCard
        title={
          <View style={styles.titleRow}>
            <BarChart3 size={18} color={colors.blue600} />
            <Text style={styles.title}>Departmental Bed & ICU Occupancy</Text>
          </View>
        }
        subtitle="Capacity across General, ICU, Emergency, Maternity, and Pediatric units"
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={[styles.bars, { height: chartHeight + 28 }]}>
              {deptData.map((row) => (
                <View key={row.department} style={styles.group}>
                  <View style={[styles.barRow, { height: chartHeight }]}>
                    {SERIES.map((series) => (
                      <View
                        key={series.key}
                        style={{
                          width: 12,
                          height: Math.max(3, (row[series.key] / maxValue) * chartHeight),
                          backgroundColor: series.color,
                          borderTopLeftRadius: 4,
                          borderTopRightRadius: 4,
                        }}
                      />
                    ))}
                  </View>
                  <Text style={styles.deptLabel} numberOfLines={2}>
                    {row.department}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.legend}>
              {SERIES.map((series) => (
                <View key={series.key} style={styles.legendItem}>
                  <View style={[styles.swatch, { backgroundColor: series.color }]} />
                  <Text style={styles.legendText}>{series.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SectionCard>

      <SectionCard
        title={
          <View style={styles.titleRow}>
            <PieIcon size={18} color={colors.emerald600} />
            <Text style={styles.title}>Overall Occupancy Ratio</Text>
          </View>
        }
        subtitle="General versus ICU bed allocation"
      >
        <View style={styles.donutWrap}>
          <Donut segments={donut} />
          <View style={styles.donutCenter} pointerEvents="none">
            <Text style={styles.busy}>{busy}%</Text>
            <Text style={styles.busyLabel}>CAPACITY BUSY</Text>
          </View>
        </View>
        <View style={styles.legend}>
          <LegendCount color="#EF4444" label={`Gen Busy (${totalGeneralOccupied})`} />
          <LegendCount color="#10B981" label={`Gen Free (${totalGeneralFree})`} />
          <LegendCount color="#F59E0B" label={`ICU Busy (${totalIcuOccupied})`} />
          <LegendCount color="#3B82F6" label={`ICU Free (${totalIcuFree})`} />
        </View>
      </SectionCard>
    </View>
  );
};

function Donut({ segments }: { segments: { value: number; color: string }[] }) {
  const size = 180;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  let offset = 0;

  return (
    <Svg width={size} height={size}>
      <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
        {segments.map((segment, index) => {
          const length = (segment.value / total) * circumference;
          const circle = (
            <Circle
              key={`${segment.color}-${index}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={segment.color}
              strokeWidth={stroke}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset}
              fill="none"
            />
          );
          offset += length;
          return circle;
        })}
      </G>
    </Svg>
  );
}

function LegendCount({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: 16, color: colors.slate900 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 18, paddingHorizontal: 4 },
  group: { width: 78, alignItems: 'center' },
  barRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  deptLabel: { marginTop: 8, fontFamily: fonts.semibold, fontSize: 10, color: colors.slate600, textAlign: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontFamily: fonts.medium, fontSize: 11, color: colors.slate700 },
  donutWrap: { alignItems: 'center', justifyContent: 'center', height: 190 },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  busy: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.slate900 },
  busyLabel: { fontFamily: fonts.bold, fontSize: 10, color: colors.slate500, letterSpacing: 0.4 },
});
