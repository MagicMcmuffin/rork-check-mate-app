import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Award, Calendar, Download, FileText } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import * as Sharing from 'expo-sharing';

export default function MyCertificationsScreen() {
  const { user, tickets } = useApp();

  const certifications = useMemo(() => {
    return tickets
      .filter(t => t.employeeId === user?.id && (t.type === 'certificate' || t.type === 'license'))
      .sort((a, b) => {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      });
  }, [tickets, user?.id]);

  const stats = useMemo(() => {
    const now = new Date();
    let valid = 0;
    let expiringSoon = 0;
    let expired = 0;

    certifications.forEach(cert => {
      if (!cert.expiryDate) {
        valid++;
        return;
      }
      const expiry = new Date(cert.expiryDate);
      const daysUntil = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil < 0) {
        expired++;
      } else if (daysUntil <= 30) {
        expiringSoon++;
      } else {
        valid++;
      }
    });

    return { valid, expiringSoon, expired, total: certifications.length };
  }, [certifications]);

  const getStatusInfo = (expiryDate?: string) => {
    if (!expiryDate) {
      return { status: 'valid', color: '#10b981', text: 'No Expiry' };
    }

    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntil = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      return { status: 'expired', color: '#ef4444', text: 'Expired' };
    } else if (daysUntil <= 30) {
      return { status: 'expiring', color: '#f59e0b', text: `${daysUntil} days left` };
    } else {
      return { status: 'valid', color: '#10b981', text: 'Valid' };
    }
  };

  const handleDownload = async (cert: any) => {
    if (!cert.fileUri) {
      Alert.alert('No File', 'This certification has no attached file.');
      return;
    }

    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = cert.fileUri;
        link.download = cert.fileName || 'certification-file';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(cert.fileUri, {
            mimeType: cert.mimeType,
            dialogTitle: `Download ${cert.fileName}`,
          });
        } else {
          Alert.alert('Sharing Unavailable', 'File sharing is not available on this device.');
        }
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', 'Failed to download file.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#1e293b' },
          headerTintColor: '#fff',
          title: 'My Certifications',
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Award size={48} color="#10b981" />
          <Text style={styles.headerTitle}>My Certifications</Text>
          <Text style={styles.headerSubtitle}>
            All your certificates and licenses in one place
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.valid}</Text>
            <Text style={styles.statLabel}>Valid</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{stats.expiringSoon}</Text>
            <Text style={styles.statLabel}>Expiring Soon</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#ef4444' }]}>{stats.expired}</Text>
            <Text style={styles.statLabel}>Expired</Text>
          </View>
        </View>

        {certifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Award size={64} color="#475569" />
            <Text style={styles.emptyStateTitle}>No certifications yet</Text>
            <Text style={styles.emptyStateText}>
              Add your certificates and licenses to track their expiry dates
            </Text>
          </View>
        ) : (
          <View style={styles.certificationsList}>
            {certifications.map((cert) => {
              const statusInfo = getStatusInfo(cert.expiryDate);
              
              return (
                <View key={cert.id} style={styles.certCard}>
                  <View style={styles.certHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                      <Text style={styles.statusBadgeText}>{statusInfo.text}</Text>
                    </View>
                    {cert.fileUri && (
                      <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={() => handleDownload(cert)}
                      >
                        <Download size={20} color="#3b82f6" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={styles.certTitle}>{cert.title}</Text>

                  <View style={styles.certType}>
                    <View style={[styles.typeIcon, { backgroundColor: cert.type === 'certificate' ? '#3b82f620' : '#10b98120' }]}>
                      {cert.type === 'certificate' ? (
                        <Award size={16} color="#3b82f6" />
                      ) : (
                        <FileText size={16} color="#10b981" />
                      )}
                    </View>
                    <Text style={styles.typeText}>
                      {cert.type === 'certificate' ? 'Certificate' : 'License'}
                    </Text>
                  </View>

                  {cert.expiryDate && (
                    <View style={styles.expiryInfo}>
                      <Calendar size={16} color={statusInfo.color} />
                      <Text style={[styles.expiryText, { color: statusInfo.color }]}>
                        Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}

                  {cert.notes && (
                    <Text style={styles.certNotes} numberOfLines={2}>{cert.notes}</Text>
                  )}

                  <Text style={styles.addedDate}>
                    Added {new Date(cert.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              );
            })}
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
    marginBottom: 20,
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
  certificationsList: {
    gap: 16,
  },
  certCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  certHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  downloadButton: {
    padding: 4,
  },
  certTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 12,
  },
  certType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500' as const,
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  expiryText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  certNotes: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 18,
  },
  addedDate: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
  },
});
