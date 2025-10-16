import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, BookOpen, Download, Calendar } from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateApprenticeshipLearningPDF } from '@/lib/pdf-generator';
import type { ApprenticeshipEntry } from '@/types';

export default function ApprenticeshipHistoryScreen() {
  const { company, getCompanyApprenticeshipEntries } = useApp();
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const entries = getCompanyApprenticeshipEntries();

  const handleDownload = async (entry: ApprenticeshipEntry) => {
    if (!company) return;
    try {
      await generateApprenticeshipLearningPDF(entry, company.name);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
      console.error('PDF generation error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const backgroundColor = isDarkMode ? '#0f172a' : '#f8fafc';

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Learning History',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ paddingLeft: 16, paddingRight: 16 }}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.header, { backgroundColor: colors.card }]}>
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#1e3a5f' : '#fef3c7' }]}>
              <BookOpen size={28} color="#f59e0b" />
            </View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Apprenticeship Learning History</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              View and download all learning entries
            </Text>
          </View>

          {entries.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <BookOpen size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No learning entries yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Learning entries will appear here
              </Text>
            </View>
          ) : (
            <View style={styles.entriesList}>
              {entries.map((entry) => (
                <View key={entry.id} style={[styles.entryCard, { backgroundColor: colors.card }]}>
                  <TouchableOpacity
                    style={styles.entryHeader}
                    onPress={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  >
                    <View style={styles.entryHeaderLeft}>
                      <View style={[styles.entryIconCircle, { backgroundColor: isDarkMode ? '#1e3a5f' : '#fef3c7' }]}>
                        <BookOpen size={20} color="#f59e0b" />
                      </View>
                      <View style={styles.entryHeaderText}>
                        <Text style={[styles.entryName, { color: colors.text }]}>
                          {entry.apprenticeName}
                        </Text>
                        <View style={styles.entryMeta}>
                          <Calendar size={12} color={colors.textSecondary} />
                          <Text style={[styles.entryDate, { color: colors.textSecondary }]}>
                            {formatDate(entry.date)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.downloadButton, { backgroundColor: isDarkMode ? '#1e3a5f' : '#dbeafe' }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDownload(entry);
                      }}
                    >
                      <Download size={18} color="#1e40af" />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {expandedId === entry.id && (
                    <View style={[styles.entryDetails, { borderTopColor: colors.border }]}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                        What was learned:
                      </Text>
                      <Text style={[styles.detailText, { color: colors.text }]}>
                        {entry.learningDescription}
                      </Text>

                      {entry.pictures && entry.pictures.length > 0 && (
                        <View style={styles.picturesSection}>
                          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                            Pictures ({entry.pictures.length}):
                          </Text>
                          <View style={styles.picturesGrid}>
                            {entry.pictures.map((pic, idx) => (
                              <Image
                                key={idx}
                                source={{ uri: pic }}
                                style={styles.picture}
                              />
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyState: {
    padding: 48,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  entriesList: {
    gap: 12,
  },
  entryCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  entryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  entryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  entryHeaderText: {
    flex: 1,
  },
  entryName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryDate: {
    fontSize: 13,
  },
  downloadButton: {
    padding: 10,
    borderRadius: 10,
  },
  entryDetails: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 8,
    marginTop: 8,
  },
  detailText: {
    fontSize: 15,
    lineHeight: 22,
  },
  picturesSection: {
    marginTop: 8,
  },
  picturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  picture: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
});
