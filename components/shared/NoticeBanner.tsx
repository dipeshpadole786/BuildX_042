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
    <View style={[styles.banner, { backgroundColor: isBlue ? colors.blue600 : colors.emerald600 }]}>
      <MapPin size={16} color={isBlue ? colors.amber300 : colors.emerald200} />
      <Text style={styles.message}>{message}</Text>
      <View style={[styles.tag, { backgroundColor: isBlue ? colors.blue800 : colors.emerald800 }]}>
        <Text style={styles.tagText}>{tag}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  message: {
    flex: 1,
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
  },
  tag: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    maxWidth: 92,
  },
  tagText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 0.3,
  },
});
