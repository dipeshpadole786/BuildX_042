import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Hospital, Navigation, Truck, UserCheck } from 'lucide-react-native';
import { colors, fonts } from '@/lib/theme';

interface StageStepperProps {
  stages: string[];
  currentStageIndex: number;
  onSelectStage?: (index: number) => void;
}

function StageIcon({ index, color }: { index: number; color: string }) {
  const props = { size: 14, color };
  switch (index) {
    case 0:
      return <Navigation {...props} />;
    case 1:
    case 3:
      return <Truck {...props} />;
    case 2:
      return <UserCheck {...props} />;
    case 4:
      return <Hospital {...props} />;
    default:
      return <Check {...props} />;
  }
}

export const StageStepper: React.FC<StageStepperProps> = ({ stages, currentStageIndex, onSelectStage }) => {
  const progress = (currentStageIndex / Math.max(1, stages.length - 1)) * 100;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[styles.wrap, { width: Math.max(stages.length * 72, 300) }]}>
        <View style={styles.track} />
        <LinearGradient
          colors={[colors.blue600, '#06B6D4', colors.emerald500]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.trackActive, { width: `${progress}%` }]}
        />
        <View style={styles.row}>
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            const iconColor = isCompleted || isCurrent ? colors.white : colors.slate400;
            return (
              <Pressable
                key={`${stage}-${idx}`}
                disabled={!onSelectStage}
                onPress={() => onSelectStage?.(idx)}
                style={styles.step}
              >
                <View
                  style={[
                    styles.bubble,
                    isCompleted && styles.bubbleDone,
                    isCurrent && styles.bubbleCurrent,
                    !isCompleted && !isCurrent && styles.bubbleUpcoming,
                  ]}
                >
                  {isCompleted ? <Check size={14} color={colors.white} strokeWidth={3} /> : <StageIcon index={idx} color={iconColor} />}
                </View>
                <Text
                  numberOfLines={2}
                  style={[
                    styles.label,
                    isCurrent && styles.labelCurrent,
                    isCompleted && styles.labelDone,
                    !isCompleted && !isCurrent && styles.labelUpcoming,
                  ]}
                >
                  {stage}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 6,
    minHeight: 78,
    justifyContent: 'flex-start',
  },
  track: {
    position: 'absolute',
    top: 22,
    left: 16,
    right: 16,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  trackActive: {
    position: 'absolute',
    top: 22,
    left: 16,
    height: 4,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  step: { width: 64, alignItems: 'center' },
  bubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleDone: {
    backgroundColor: colors.emerald600,
    borderWidth: 3,
    borderColor: colors.emerald100,
  },
  bubbleCurrent: {
    backgroundColor: colors.blue600,
    borderWidth: 3,
    borderColor: colors.blue100,
    transform: [{ scale: 1.06 }],
  },
  bubbleUpcoming: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  label: {
    marginTop: 6,
    fontSize: 10,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    lineHeight: 13,
  },
  labelCurrent: { color: colors.blue700, fontFamily: fonts.extrabold },
  labelDone: { color: colors.emerald700 },
  labelUpcoming: { color: colors.slate400 },
});
