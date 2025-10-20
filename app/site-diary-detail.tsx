/* eslint-disable @rork/linters/expo-router-enforce-safe-area-usage */
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack, useLocalSearchParams } from 'expo-router';
import { BookOpen, Download, Calendar, User, Cloud, ThermometerSun, Users } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { trpc } from '@/lib/trpc';

export default function SiteDiaryDetailScreen() {
  const { id } = useLocalSearchParams();
  useApp();
  const { colors } = useTheme();

  const diaryQuery = trpc.siteDiaries.get.useQuery({ id: id as string });
  const diary = diaryQuery.data;

  const handleDownload = () => {
    Alert.alert('Coming Soon', 'PDF download functionality will be implemented');
  };

  if (diaryQuery.isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Site Diary',
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!diary) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Site Diary',
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <Text style={[styles.errorText, { color: colors.text }]}>Site diary not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Site Diary',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
            <BookOpen size={28} color={colors.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{diary.projectName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: diary.status === 'completed' ? '#22c55e20' : '#f59e0b20' }]}>
            <Text style={[styles.statusText, { color: diary.status === 'completed' ? '#22c55e' : '#f59e0b' }]}>
              {diary.status === 'completed' ? 'Completed' : 'Draft'}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <TouchableOpacity
            style={[styles.downloadButton, { backgroundColor: colors.primary }]}
            onPress={handleDownload}
          >
            <Download size={20} color="#ffffff" />
            <Text style={styles.downloadButtonText}>Download PDF</Text>
          </TouchableOpacity>

          <View style={[styles.infoGrid, { backgroundColor: colors.card }]}>
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primary + '20' }]}>
                <Calendar size={20} color={colors.primary} />
              </View>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Date</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {new Date(diary.date).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primary + '20' }]}>
                <User size={20} color={colors.primary} />
              </View>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Supervisor</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {diary.supervisorName}
              </Text>
            </View>

            {diary.weather && (
              <View style={styles.infoItem}>
                <View style={[styles.infoIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Cloud size={20} color={colors.primary} />
                </View>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Weather</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {diary.weather}
                </Text>
              </View>
            )}

            {diary.temperature && (
              <View style={styles.infoItem}>
                <View style={[styles.infoIcon, { backgroundColor: colors.primary + '20' }]}>
                  <ThermometerSun size={20} color={colors.primary} />
                </View>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Temperature</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {diary.temperature}
                </Text>
              </View>
            )}

            {diary.workersOnSite !== null && diary.workersOnSite !== undefined && (
              <View style={styles.infoItem}>
                <View style={[styles.infoIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Users size={20} color={colors.primary} />
                </View>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Workers</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {diary.workersOnSite}
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Work Description</Text>
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
              {diary.workDescription}
            </Text>
          </View>

          {diary.progress && (
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Progress</Text>
              <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
                {diary.progress}
              </Text>
            </View>
          )}

          {diary.delays && (
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Delays</Text>
              <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
                {diary.delays}
              </Text>
            </View>
          )}

          {diary.safetyIssues && (
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Safety Issues</Text>
              <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
                {diary.safetyIssues}
              </Text>
            </View>
          )}

          {diary.visitors && (
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Visitors</Text>
              <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
                {diary.visitors}
              </Text>
            </View>
          )}

          {diary.equipmentUsed && diary.equipmentUsed.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Equipment Used</Text>
              {diary.equipmentUsed.map((equipment: any, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.listItem,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.listItemName, { color: colors.text }]}>
                    {equipment.name}
                  </Text>
                  {equipment.hours !== undefined && (
                    <Text style={[styles.listItemDetail, { color: colors.textSecondary }]}>
                      {equipment.hours} hours
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {diary.materials && diary.materials.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Materials Used</Text>
              {diary.materials.map((material: any, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.listItem,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.listItemName, { color: colors.text }]}>
                    {material.name}
                  </Text>
                  {(material.quantity || material.unit) && (
                    <Text style={[styles.listItemDetail, { color: colors.textSecondary }]}>
                      {material.quantity} {material.unit}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {diary.notes && (
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Notes</Text>
              <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
                {diary.notes}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  infoItem: {
    width: '47%',
    gap: 8,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  listItemName: {
    fontSize: 15,
    fontWeight: '600' as const,
    flex: 1,
  },
  listItemDetail: {
    fontSize: 13,
  },
  errorText: {
    fontSize: 16,
  },
});
