import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';
import { History as HistoryIcon, FileText, Calendar, Clock, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function HistoryScreen() {
  const { user, getEmployeeInspections, getEmployeePositiveInterventions } = useApp();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const inspections = getEmployeeInspections(user.id);
  const positiveInterventions = getEmployeePositiveInterventions(user.id);

  const allInspections = [
    ...inspections.plant.map(i => ({ ...i, type: 'plant' as const })),
    ...inspections.quickHitch.map(i => ({ ...i, type: 'quickhitch' as const })),
    ...inspections.vehicle.map(i => ({ ...i, type: 'vehicle' as const })),
    ...inspections.bucketChange.map(i => ({ ...i, type: 'bucketchange' as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const allItems = [
    ...allInspections.map(i => ({ ...i, itemType: 'inspection' as const })),
    ...positiveInterventions.map(i => ({ ...i, itemType: 'intervention' as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getInspectionTitle = (inspection: typeof allInspections[0]) => {
    switch (inspection.type) {
      case 'plant':
        return 'Plant Daily Inspection';
      case 'quickhitch':
        return 'Quick Hitch Inspection';
      case 'vehicle':
        return 'Vehicle Inspection';
      case 'bucketchange':
        return 'Bucket Change Check';
    }
  };

  const getInspectionSubtitle = (inspection: typeof allInspections[0]) => {
    switch (inspection.type) {
      case 'plant':
        return 'plantNumber' in inspection ? `Plant #${inspection.plantNumber}` : '';
      case 'quickhitch':
        return 'quickHitchModel' in inspection ? inspection.quickHitchModel : '';
      case 'vehicle':
        return 'vehicleRegistration' in inspection ? inspection.vehicleRegistration : '';
      case 'bucketchange':
        return 'bucketType' in inspection ? inspection.bucketType : '';
    }
  };

  const handleInspectionPress = (inspection: typeof allInspections[0]) => {
    router.push({
      pathname: '/inspection-detail',
      params: { id: inspection.id, type: inspection.type },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'My Checks',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24 }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>My Checks</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>View your inspection history</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{allInspections.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Inspections</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{positiveInterventions.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Interventions</Text>
          </View>
        </View>

        {allItems.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <HistoryIcon size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Checks Yet</Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Your completed inspections will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.inspectionsList}>
            {allItems.map((item) => {
              if (item.itemType === 'intervention') {
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.inspectionCard, { backgroundColor: colors.card }]}
                    activeOpacity={0.7}
                    onPress={() => router.push({
                      pathname: '/intervention-detail',
                      params: { id: item.id },
                    })}
                  >
                    <View style={styles.inspectionHeader}>
                      <View style={[styles.inspectionIcon, { backgroundColor: '#dcfce7' }]}>
                        <AlertTriangle size={20} color="#10b981" />
                      </View>
                      <View style={styles.inspectionInfo}>
                        <Text style={[styles.inspectionTitle, { color: colors.text }]}>Positive Intervention</Text>
                        <Text style={[styles.inspectionSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                          {item.hazardDescription}
                        </Text>
                      </View>
                      <ChevronRight size={20} color={colors.textSecondary} />
                    </View>

                    <View style={styles.inspectionDetails}>
                      <View style={styles.inspectionDetail}>
                        <Calendar size={14} color={colors.textSecondary} />
                        <Text style={[styles.inspectionDetailText, { color: colors.textSecondary }]}>
                          {formatDate(item.createdAt)}
                        </Text>
                      </View>
                      <View style={styles.inspectionDetail}>
                        <Clock size={14} color={colors.textSecondary} />
                        <Text style={[styles.inspectionDetailText, { color: colors.textSecondary }]}>
                          {formatTime(item.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }

              const inspection = item;
              return (
              <TouchableOpacity
                key={inspection.id}
                style={[styles.inspectionCard, { backgroundColor: colors.card }]}
                activeOpacity={0.7}
                onPress={() => handleInspectionPress(inspection)}
              >
                <View style={styles.inspectionHeader}>
                  <View
                    style={[
                      styles.inspectionIcon,
                      {
                        backgroundColor:
                          inspection.type === 'plant'
                            ? '#dbeafe'
                            : inspection.type === 'quickhitch'
                            ? '#ccfbf1'
                            : inspection.type === 'vehicle'
                            ? '#fef3c7'
                            : '#fce7f3',
                      },
                    ]}
                  >
                    <FileText
                      size={20}
                      color={
                        inspection.type === 'plant'
                          ? '#1e40af'
                          : inspection.type === 'quickhitch'
                          ? '#0d9488'
                          : inspection.type === 'vehicle'
                          ? '#f59e0b'
                          : '#ec4899'
                      }
                    />
                  </View>
                  <View style={styles.inspectionInfo}>
                    <Text style={[styles.inspectionTitle, { color: colors.text }]}>{getInspectionTitle(inspection)}</Text>
                    <Text style={[styles.inspectionSubtitle, { color: colors.textSecondary }]}>{getInspectionSubtitle(inspection)}</Text>
                  </View>
                  <ChevronRight size={20} color={colors.textSecondary} />
                </View>

                <View style={styles.inspectionDetails}>
                  <View style={styles.inspectionDetail}>
                    <Calendar size={14} color={colors.textSecondary} />
                    <Text style={[styles.inspectionDetailText, { color: colors.textSecondary }]}>
                      {formatDate(inspection.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.inspectionDetail}>
                    <Clock size={14} color={colors.textSecondary} />
                    <Text style={[styles.inspectionDetailText, { color: colors.textSecondary }]}>
                      {formatTime(inspection.createdAt)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1e40af',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center' as const,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  inspectionsList: {
    gap: 12,
  },
  inspectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inspectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inspectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inspectionInfo: {
    flex: 1,
  },
  inspectionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1e293b',
    marginBottom: 2,
  },
  inspectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  inspectionDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  inspectionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inspectionDetailText: {
    fontSize: 12,
    color: '#64748b',
  },
});
