import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Droplet, MapPin } from 'lucide-react-native';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { MapHospital, PulseMap } from '@/components/map/PulseMap';
import {
  BLOOD_GROUPS,
  BloodGroup,
  BloodSearchResult,
  NAGPUR_REFERENCE,
  parseBloodGroup,
  searchBloodAvailability,
  StockLevel,
} from '@/lib/bloodBanks';
import { colors, fonts, radius } from '@/lib/theme';

const LEVEL_LABEL: Record<StockLevel, string> = {
  available: 'Available',
  limited: 'Limited',
  unavailable: 'Unavailable',
};

export default function BloodScreen() {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<BloodGroup | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const results = useMemo(() => (group ? searchBloodAvailability(group) : null), [group]);

  const choose = (next: BloodGroup) => {
    setGroup(next);
    setQuery(next);
    setFocusedId(null);
    setDetailsId(null);
  };

  const onType = (text: string) => {
    const next = text.toUpperCase();
    setQuery(next);
    const parsed = parseBloodGroup(next);
    if (parsed) {
      setGroup(parsed);
      setFocusedId(null);
      setDetailsId(null);
    } else if (next.trim() === '') {
      setGroup(null);
    }
  };

  const markers: MapHospital[] = useMemo(() => {
    if (!results || !group) return [];
    return [...results.available, ...results.unavailable].map((row) => toMapHospital(row, group, focusedId));
  }, [results, group, focusedId]);

  const focus = results
    ? [...results.available, ...results.unavailable].find((row) => row.bank.id === focusedId)
    : undefined;
  const focusPoint: [number, number] = focus ? [focus.bank.lat, focus.bank.lng] : NAGPUR_REFERENCE;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.demoRow}>
        <Badge label="Demo / Mock Blood Availability" tone="wait" />
      </View>
      <Text style={styles.title}>Search blood group</Text>
      <Text style={styles.disclaimer}>Sample Nagpur inventory for this demo. Not a live hospital feed.</Text>

      <Card>
        <Text style={styles.label}>Blood group</Text>
        <View style={styles.selector}>
          <Droplet size={18} color={colors.primary} />
          <Input
            value={query}
            onChangeText={onType}
            placeholder="Type O+"
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.field}
          />
        </View>
        <View style={styles.groupGrid}>
          {BLOOD_GROUPS.map((item) => {
            const selected = item === group;
            const typedMatch = query.trim().length > 0 && item.startsWith(query.trim().toUpperCase());
            return (
              <Pressable
                key={item}
                onPress={() => choose(item)}
                style={[styles.groupChip, selected && styles.groupChipOn, !selected && typedMatch && styles.groupChipHint]}
              >
                <Text style={[styles.groupText, selected && styles.groupTextOn]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {group && results ? (
        <>
          <Text style={styles.section}>Nearby availability · {group}</Text>
          <PulseMap
            placesOnly
            height={240}
            ambulancePos={NAGPUR_REFERENCE}
            targetPos={focusPoint}
            startName="Nagpur"
            targetName={focus?.bank.name ?? group}
            bannerTitle="Demo blood map"
            bannerSubtitle={focus ? `${group} · ${focus.bank.name}` : `${group} near Nagpur`}
            hospitals={markers}
            onSelectHospital={(hospital) => {
              setFocusedId(hospital.id);
              setDetailsId(hospital.id);
            }}
          />

          {results.available.length === 0 ? (
            <Card tone="warning">
              <Text style={styles.emptyTitle}>No immediate availability found</Text>
              <Text style={styles.emptyBody}>
                None of the demo Nagpur sites currently list {group} in stock. You can search another group.
              </Text>
              <Pressable
                style={styles.again}
                onPress={() => {
                  setGroup(null);
                  setQuery('');
                  setFocusedId(null);
                  setDetailsId(null);
                }}
              >
                <Text style={styles.againText}>Search again</Text>
              </Pressable>
            </Card>
          ) : (
            results.available.map((row) => (
              <ResultCard
                key={row.bank.id}
                row={row}
                open={detailsId === row.bank.id}
                onDetails={() => setDetailsId((current) => (current === row.bank.id ? null : row.bank.id))}
                onNavigate={() => setFocusedId(row.bank.id)}
              />
            ))
          )}

          {results.unavailable.length > 0 ? (
            <>
              <Text style={styles.section}>Currently unavailable</Text>
              {results.unavailable.map((row) => (
                <ResultCard
                  key={row.bank.id}
                  row={row}
                  open={detailsId === row.bank.id}
                  onDetails={() => setDetailsId((current) => (current === row.bank.id ? null : row.bank.id))}
                  onNavigate={() => setFocusedId(row.bank.id)}
                />
              ))}
            </>
          ) : null}
        </>
      ) : (
        <Text style={styles.hint}>Select a blood group to see nearby demo stock.</Text>
      )}
    </ScrollView>
  );
}

function ResultCard({
  row,
  open,
  onDetails,
  onNavigate,
}: {
  row: BloodSearchResult;
  open: boolean;
  onDetails: () => void;
  onNavigate: () => void;
}) {
  const tone = row.level === 'available' ? 'ok' : row.level === 'limited' ? 'wait' : 'neutral';
  return (
    <Card tone={row.level === 'unavailable' ? 'surface' : row.level === 'limited' ? 'warning' : 'accent'}>
      <View style={styles.cardHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hospital}>{row.bank.name}</Text>
          <View style={styles.distanceRow}>
            <MapPin size={12} color={colors.textSecondary} />
            <Text style={styles.distance}>{row.bank.distanceKm} km away</Text>
          </View>
        </View>
        <Badge label={LEVEL_LABEL[row.level]} tone={tone} />
      </View>
      <Text style={styles.units}>
        {row.group} — {row.units} units available
      </Text>
      <Text style={styles.updated}>Updated {row.bank.updatedMinutesAgo} minutes ago</Text>
      {open ? (
        <View style={styles.inventory}>
          {row.bank.stock.map((item) => (
            <Text key={item.group} style={styles.inventoryLine}>
              {item.group} — {item.units} units available
            </Text>
          ))}
          <Text style={styles.address}>{row.bank.address}</Text>
        </View>
      ) : null}
      <View style={styles.actions}>
        <Pressable style={styles.secondary} onPress={onDetails}>
          <Text style={styles.secondaryText}>{open ? 'Hide details' : 'View details'}</Text>
        </Pressable>
        <Pressable style={styles.primary} onPress={onNavigate}>
          <Text style={styles.primaryText}>Navigate</Text>
        </Pressable>
      </View>
    </Card>
  );
}

function toMapHospital(row: BloodSearchResult, group: BloodGroup, focusedId: string | null): MapHospital {
  return {
    id: row.bank.id,
    name: row.bank.name,
    address: row.bank.address,
    distanceKm: row.bank.distanceKm,
    etaMins: Math.max(4, Math.round(row.bank.distanceKm * 3)),
    generalBedsFree: 0,
    icuBedsFree: 0,
    lat: row.bank.lat,
    lng: row.bank.lng,
    markerNote: `${group} — ${row.units} units available`,
    markerUpdated: `Updated ${row.bank.updatedMinutesAgo} minutes ago`,
    markerTone: row.level,
    ...(focusedId === row.bank.id ? { lat: row.bank.lat, lng: row.bank.lng } : {}),
  };
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28, gap: 12 },
  demoRow: { alignItems: 'flex-start' },
  title: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.text, letterSpacing: -0.5 },
  disclaimer: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginTop: -4 },
  label: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  selector: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  field: { flex: 1, backgroundColor: colors.bg, fontSize: 18, fontFamily: fonts.bold },
  groupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  groupChip: {
    minWidth: 64,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupChipOn: { backgroundColor: colors.ink },
  groupChipHint: { backgroundColor: colors.accentSoft },
  groupText: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  groupTextOn: { color: colors.white },
  section: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginTop: 4 },
  hint: { fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary, paddingVertical: 12 },
  emptyTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text },
  emptyBody: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginTop: 6 },
  again: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  againText: { color: colors.white, fontFamily: fonts.bold, fontSize: 13 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  hospital: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.text },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  distance: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary },
  units: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginTop: 12 },
  updated: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  inventory: { marginTop: 12, gap: 4, backgroundColor: colors.surface, borderRadius: 16, padding: 12 },
  inventoryLine: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  address: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  secondary: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  primary: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontFamily: fonts.bold, fontSize: 14, color: colors.white },
});
