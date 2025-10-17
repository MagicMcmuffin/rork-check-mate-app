import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Calendar, Download, Search } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import * as Sharing from 'expo-sharing';

export default function MyTrainingScreen() {
  const { user, tickets } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState<string>('all');

  const trainingRecords = useMemo(() => {
    return tickets
      .filter(t => t.employeeId === user?.id && t.type === 'training')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tickets, user?.id]);

  const filteredRecords = useMemo(() => {
    return trainingRecords.filter(record => {
      const matchesSearch = record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           record.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (filterYear === 'all') return matchesSearch;
      
      const recordYear = new Date(record.createdAt).getFullYear().toString();
      return matchesSearch && recordYear === filterYear;
    });
  }, [trainingRecords, searchQuery, filterYear]);

  const years = useMemo(() => {
    const yearsSet = new Set(
      trainingRecords.map(record => new Date(record.createdAt).getFullYear().toString())
    );
    return ['all', ...Array.from(yearsSet).sort((a, b) => b.localeCompare(a))];
  }, [trainingRecords]);

  const stats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const thisYear = trainingRecords.filter(
      r => new Date(r.createdAt).getFullYear() === currentYear
    ).length;
    const total = trainingRecords.length;
    const withCert = trainingRecords.filter(r => r.fileUri).length;

    return { thisYear, total, withCert };
  }, [trainingRecords]);

  const handleDownload = async (record: any) => {
    if (!record.fileUri) {
      Alert.alert('No Certificate', 'This training record has no attached certificate.');
      return;
    }

    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = record.fileUri;
        link.download = record.fileName || 'training-certificate';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(record.fileUri, {
            mimeType: record.mimeType,
            dialogTitle: `Download ${record.fileName}`,
          });
        } else {
          Alert.alert('Sharing Unavailable', 'File sharing is not available on this device.');
        }
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', 'Failed to download certificate.');
    }
  };

  const groupByMonth = (records: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    records.forEach(record => {
      const date = new Date(record.createdAt);
      const monthYear = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(record);
    });
    return grouped;
  };

  const groupedRecords = useMemo(() => groupByMonth(filteredRecords), [filteredRecords]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#1e293b' },
          headerTintColor: '#fff',
          title: 'Training History',
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <BookOpen size={48} color="#8b5cf6" />
          <Text style={styles.headerTitle}>Training History</Text>
          <Text style={styles.headerSubtitle}>
            Track all your completed training courses
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#8b5cf6' }]}>{stats.thisYear}</Text>
            <Text style={styles.statLabel}>This Year</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#3b82f6' }]}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.withCert}</Text>
            <Text style={styles.statLabel}>With Cert</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search training..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {years.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.filterChip,
                  filterYear === year && styles.filterChipActive,
                ]}
                onPress={() => setFilterYear(year)}
              >
                <Text style={[
                  styles.filterChipText,
                  filterYear === year && styles.filterChipTextActive,
                ]}>
                  {year === 'all' ? 'All Years' : year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {filteredRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <BookOpen size={64} color="#475569" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery || filterYear !== 'all' ? 'No training found' : 'No training records yet'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery || filterYear !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Your completed training courses will appear here'}
            </Text>
          </View>
        ) : (
          <View style={styles.recordsList}>
            {Object.entries(groupedRecords).map(([monthYear, records]) => (
              <View key={monthYear}>
                <Text style={styles.monthHeader}>{monthYear}</Text>
                {records.map((record: any) => (
                  <View key={record.id} style={styles.recordCard}>
                    <View style={styles.recordHeader}>
                      <View style={styles.recordIconContainer}>
                        <BookOpen size={24} color="#8b5cf6" />
                      </View>
                      <View style={styles.recordContent}>
                        <Text style={styles.recordTitle}>{record.title}</Text>
                        <View style={styles.recordMeta}>
                          <Calendar size={14} color="#64748b" />
                          <Text style={styles.recordDate}>
                            {new Date(record.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      {record.fileUri && (
                        <TouchableOpacity
                          style={styles.downloadButton}
                          onPress={() => handleDownload(record)}
                        >
                          <Download size={20} color="#3b82f6" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {record.expiryDate && (
                      <View style={styles.expiryBadge}>
                        <Text style={styles.expiryText}>
                          Valid until: {new Date(record.expiryDate).toLocaleDateString()}
                        </Text>
                      </View>
                    )}

                    {record.notes && (
                      <Text style={styles.recordNotes} numberOfLines={2}>{record.notes}</Text>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  filterChipText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  recordsList: {
    gap: 24,
  },
  monthHeader: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#8b5cf6',
    marginBottom: 12,
  },
  recordCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#8b5cf620',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordContent: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  recordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordDate: {
    fontSize: 13,
    color: '#64748b',
  },
  downloadButton: {
    padding: 4,
  },
  expiryBadge: {
    backgroundColor: '#8b5cf620',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  expiryText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '500' as const,
  },
  recordNotes: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
});
