import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { colors, fonts } from '@/lib/theme';

interface NoticeBannerProps {
  message: string;
  tone?: 'blue' | 'emerald';
  tag: string;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({ message, tone = 'blue', tag }) => {
  const isBlue = tone === 'blue';
  return (
    <View style={[styles.banner, { backgroundColor: isBlue ? colors.accentSoft : colors.successSoft }]}>
      <View style={[styles.pin, { backgroundColor: isBlue ? colors.surface : colors.white }]}>
        <MapPin size={14} color={isBlue ? colors.accent : colors.emerald700} />
      </View>
      <Text style={styles.message}>{message}</Text>
      <View style={[styles.tag, { backgroundColor: isBlue ? colors.accent : colors.emerald600 }]}>
        <Text style={styles.tagText}>{tag}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 22,
  },
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    maxWidth: 96,
  },
  tagText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 9,
    textAlign: 'center',
  },
});
