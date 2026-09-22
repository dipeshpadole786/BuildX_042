import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, Clock, Hospital, Phone, Truck, UserCheck } from 'lucide-react-native';
import { SectionCard } from '@/components/shared/SectionCard';
import { mockTimelineEvents } from '@/lib/mockData';
import { colors, fonts } from '@/lib/theme';

function EventIcon({ type }: { type: string }) {
  switch (type) {
    case 'phone':
      return <Phone size={14} color={colors.blue600} />;
    case 'truck':
      return <Truck size={14} color={colors.amber600} />;
    case 'user':
      return <UserCheck size={14} color={colors.emerald600} />;
    case 'hospital':
      return <Hospital size={14} color={colors.purple600} />;
    default:
      return <CheckCircle2 size={14} color={colors.slate400} />;
  }
}

export const StatusTimeline: React.FC = () => {
  return (
    <SectionCard
      title={
        <View style={styles.titleRow}>
          <Clock size={18} color={colors.blue600} />
          <Text style={styles.title}>Incident Event Audit Log</Text>
        </View>
      }
      subtitle="Chronological log for dispatch, the ambulance crew, and the emergency room"
    >
      <View style={styles.list}>
        <View style={styles.line} />
        {mockTimelineEvents.map((event) => (
          <View key={event.id} style={styles.item}>
            <View style={[styles.dot, event.completed ? styles.dotDone : styles.dotPending]}>
              <EventIcon type={event.iconType} />
            </View>
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.stage}>{event.stageName}</Text>
                <Text style={[styles.time, event.completed ? styles.timeDone : styles.timePending]}>{event.timestamp}</Text>
              </View>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </SectionCard>
  );
};

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.slate900, flex: 1 },
  list: { paddingLeft: 8, gap: 14 },
  line: {
    position: 'absolute',
    left: 19,
    top: 8,
    bottom: 8,
    width: 2,
    backgroundColor: '#E2E8F0',
  },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    zIndex: 1,
  },
  dotDone: { borderColor: colors.emerald600 },
  dotPending: { borderColor: colors.borderStrong, backgroundColor: '#F1F5F9' },
  card: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 6,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' },
  stage: { flex: 1, fontFamily: fonts.bold, fontSize: 13, color: colors.slate900 },
  time: { fontFamily: fonts.medium, fontSize: 10, borderRadius: 6, overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 2 },
  timeDone: { backgroundColor: colors.emerald100, color: colors.emerald800 },
  timePending: { backgroundColor: '#E2E8F0', color: colors.slate600 },
  description: { fontFamily: fonts.regular, fontSize: 12, color: colors.slate600, lineHeight: 17 },
});
