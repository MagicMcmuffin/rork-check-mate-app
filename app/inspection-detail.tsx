import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, Calendar, User, FileText, CheckCircle2, XCircle, AlertCircle, Image as ImageIcon, CheckCheck } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckStatus } from '@/types';
import { PLANT_INSPECTION_ITEMS, PLANT_INSPECTION_SECONDARY_ITEMS, QUICK_HITCH_ITEMS, VEHICLE_INSPECTION_ITEMS, BUCKET_CHANGE_ITEMS } from '@/constants/inspections';
import { useState } from 'react';

export default function InspectionDetailScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: 'plant' | 'quickhitch' | 'vehicle' | 'bucketchange' }>();
  const { plantInspections, quickHitchInspections, vehicleInspections, bucketChangeInspections, company, user } = useApp();
  const { colors } = useTheme();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fixedChecks, setFixedChecks] = useState<Set<string>>(new Set());

  let inspection: any = null;

  if (type === 'plant') {
    inspection = plantInspections.find(i => i.id === id);
  } else if (type === 'quickhitch') {
    inspection = quickHitchInspections.find(i => i.id === id);
  } else if (type === 'vehicle') {
    inspection = vehicleInspections.find(i => i.id === id);
  } else if (type === 'bucketchange') {
    inspection = bucketChangeInspections.find(i => i.id === id);
  }

  if (!inspection) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Inspection not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: CheckStatus | boolean) => {
    if (status === 'A' || status === '✓' || status === true) {
      return <CheckCircle2 size={18} color="#10b981" />;
    } else if (status === 'B' || status === 'C' || status === '✗' || status === false) {
      return <XCircle size={18} color="#ef4444" />;
    } else if (status === 'N/A') {
      return <AlertCircle size={18} color="#94a3b8" />;
    }
    return null;
  };

  const getStatusText = (status: CheckStatus | boolean) => {
    if (typeof status === 'boolean') {
      return status ? 'Pass' : 'Fail';
    }
    return status || '-';
  };

  const canMarkAsFixed = () => {
    if (!user) return false;
    return user.role === 'company' || user.role === 'administrator' || user.role === 'management' || user.role === 'mechanic';
  };

  const needsFixing = (status: CheckStatus | boolean) => {
    if (typeof status === 'boolean') {
      return status === false;
    }
    return status === 'B' || status === 'C';
  };

  const markCheckAsFixed = (checkIndex: number) => {
    Alert.alert(
      'Mark as Fixed',
      'Has this issue been resolved?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Mark Fixed',
          onPress: () => {
            setFixedChecks(prev => {
              const newSet = new Set(prev);
              newSet.add(`${id}-${checkIndex}`);
              return newSet;
            });
          },
        },
      ]
    );
  };

  const isCheckFixed = (checkIndex: number) => {
    return fixedChecks.has(`${id}-${checkIndex}`);
  };

  const getPlantItemName = (itemId: string) => {
    const allItems = [...PLANT_INSPECTION_ITEMS, ...PLANT_INSPECTION_SECONDARY_ITEMS];
    const item = allItems.find(i => i.id === itemId);
    return item?.name || itemId;
  };

  const renderPlantInspection = () => {
    return (
      <>
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Inspected Item:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>Plant #{inspection.plantNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Carried Out By:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{inspection.carriedOutBy}</Text>
          </View>
          {inspection.projectId && company && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Project:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {company.projects.find(p => p.id === inspection.projectId)?.name || 'Unknown'}
              </Text>
            </View>
          )}
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Date:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{inspection.date}</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Inspection Results</Text>
          <View style={styles.checksContainer}>
            {inspection.checks.map((check: any, index: number) => (
              <View key={index} style={[styles.checkRow, { borderBottomColor: colors.border }]}>
                <View style={styles.checkInfo}>
                  <Text style={[styles.checkItemName, { color: colors.text }]}>{getPlantItemName(check.itemId)}</Text>
                  <View style={styles.checkStatusRow}>
                    <View style={styles.checkStatusContainer}>
                      {getStatusIcon(check.status)}
                      <Text style={[styles.checkStatus, { color: colors.textSecondary }]}>{getStatusText(check.status)}</Text>
                    </View>
                    {canMarkAsFixed() && needsFixing(check.status) && !isCheckFixed(index) && (
                      <TouchableOpacity
                        onPress={() => markCheckAsFixed(index)}
                        style={[styles.fixButton, { backgroundColor: colors.primary }]}
                      >
                        <CheckCheck size={14} color="#fff" />
                        <Text style={styles.fixButtonText}>Mark Fixed</Text>
                      </TouchableOpacity>
                    )}
                    {isCheckFixed(index) && (
                      <View style={styles.fixedBadge}>
                        <CheckCheck size={14} color="#10b981" />
                        <Text style={styles.fixedBadgeText}>Fixed</Text>
                      </View>
                    )}
                  </View>
                </View>
                {check.notes && (
                  <Text style={[styles.checkNotes, { color: colors.textSecondary }]}>Notes: {check.notes}</Text>
                )}
                {check.pictures && check.pictures.length > 0 && (
                  <View style={styles.picturesSection}>
                    <View style={styles.picturesHeader}>
                      <ImageIcon size={14} color="#64748b" />
                      <Text style={[styles.picturesLabel, { color: colors.textSecondary }]}>{check.pictures.length} photo{check.pictures.length !== 1 ? 's' : ''}</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.picturesScroll}>
                      {check.pictures.map((picture: string, picIndex: number) => (
                        <TouchableOpacity
                          key={picIndex}
                          onPress={() => setSelectedImage(picture)}
                          activeOpacity={0.8}
                        >
                          <Image source={{ uri: picture }} style={styles.thumbnail} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {inspection.notesOnDefects && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes on Defects</Text>
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>{inspection.notesOnDefects}</Text>
          </View>
        )}
      </>
    );
  };

  const getQuickHitchItemName = (itemId: string) => {
    const item = QUICK_HITCH_ITEMS.find(i => i.id === itemId);
    return item?.name || itemId;
  };

  const renderQuickHitchInspection = () => {
    return (
      <>
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Inspected Item:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{inspection.quickHitchModel}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Operator:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{inspection.operatorName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Excavator:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{inspection.excavatorDetails}</Text>
          </View>
          {inspection.projectId && company && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Project:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {company.projects.find(p => p.id === inspection.projectId)?.name || 'Unknown'}
              </Text>
            </View>
          )}
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Date:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{inspection.date}</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Inspection Results</Text>
          <View style={styles.checksContainer}>
            {inspection.checks.map((check: any, index: number) => (
              <View key={index} style={[styles.checkRow, { borderBottomColor: colors.border }]}>
                <View style={styles.checkInfo}>
                  <Text style={[styles.checkItemName, { color: colors.text }]}>{getQuickHitchItemName(check.itemId)}</Text>
                  <View style={styles.checkStatusRow}>
                    <View style={styles.checkStatusContainer}>
                      {getStatusIcon(check.status)}
                      <Text style={[styles.checkStatus, { color: colors.textSecondary }]}>{getStatusText(check.status)}</Text>
                    </View>
                    {canMarkAsFixed() && needsFixing(check.status) && !isCheckFixed(index) && (
                      <TouchableOpacity
                        onPress={() => markCheckAsFixed(index)}
                        style={[styles.fixButton, { backgroundColor: colors.primary }]}
                      >
                        <CheckCheck size={14} color="#fff" />
                        <Text style={styles.fixButtonText}>Mark Fixed</Text>
                      </TouchableOpacity>
                    )}
                    {isCheckFixed(index) && (
                      <View style={styles.fixedBadge}>
                        <CheckCheck size={14} color="#10b981" />
                        <Text style={styles.fixedBadgeText}>Fixed</Text>
                      </View>
                    )}
                  </View>
                </View>
                {check.notes && (
                  <Text style={[styles.checkNotes, { color: colors.textSecondary }]}>Notes: {check.notes}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {inspection.remarks && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Remarks</Text>
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>{inspection.remarks}</Text>
          </View>
        )}
      </>
    );
  };

  const getVehicleItemName = (itemId: string) => {
    const item = VEHICLE_INSPECTION_ITEMS.find(i => i.id === itemId);
    return item?.name || itemId;
  };

  const getBucketChangeItemName = (itemId: string) => {
    const item = BUCKET_CHANGE_ITEMS.find(i => i.id === itemId);
    return item?.name || itemId;
  };

  const renderBucketChangeInspection = () => {
    return (
      <>
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Bucket/Implement Type:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{inspection.bucketType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Operator:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{inspection.employeeName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Witness:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{inspection.witnessName}</Text>
          </View>
          {inspection.projectId && company && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Project:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {company.projects.find(p => p.id === inspection.projectId)?.name || 'Unknown'}
              </Text>
            </View>
          )}
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Date:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{inspection.date}</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Inspection Results</Text>
          <View style={styles.checksContainer}>
            {inspection.checks.map((check: any, index: number) => (
              <View key={index} style={[styles.checkRow, { borderBottomColor: colors.border }]}>
                <View style={styles.checkInfo}>
                  <Text style={[styles.checkItemName, { color: colors.text }]}>{getBucketChangeItemName(check.itemId)}</Text>
                  <View style={styles.checkStatusRow}>
                    <View style={styles.checkStatusContainer}>
                      {getStatusIcon(check.status)}
                      <Text style={[styles.checkStatus, { color: colors.textSecondary }]}>{getStatusText(check.status)}</Text>
                    </View>
                    {canMarkAsFixed() && needsFixing(check.status) && !isCheckFixed(index) && (
                      <TouchableOpacity
                        onPress={() => markCheckAsFixed(index)}
                        style={[styles.fixButton, { backgroundColor: colors.primary }]}
                      >
                        <CheckCheck size={14} color="#fff" />
                        <Text style={styles.fixButtonText}>Mark Fixed</Text>
                      </TouchableOpacity>
                    )}
                    {isCheckFixed(index) && (
                      <View style={styles.fixedBadge}>
                        <CheckCheck size={14} color="#10b981" />
                        <Text style={styles.fixedBadgeText}>Fixed</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </>
    );
  };

  const renderVehicleInspection = () => {
    return (
      <>
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Inspected Item:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{inspection.vehicleRegistration}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Vehicle Type:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{inspection.vehicleType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Mileage:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{inspection.mileage}</Text>
          </View>
          {inspection.projectId && company && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Project:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {company.projects.find(p => p.id === inspection.projectId)?.name || 'Unknown'}
              </Text>
            </View>
          )}
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Date:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{inspection.date}</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Inspection Results</Text>
          <View style={styles.checksContainer}>
            {inspection.checks.map((check: any, index: number) => (
              <View key={index} style={[styles.checkRow, { borderBottomColor: colors.border }]}>
                <View style={styles.checkInfo}>
                  <Text style={[styles.checkItemName, { color: colors.text }]}>{getVehicleItemName(check.itemId)}</Text>
                  <View style={styles.checkStatusRow}>
                    <View style={styles.checkStatusContainer}>
                      {getStatusIcon(check.status)}
                      <Text style={[styles.checkStatus, { color: colors.textSecondary }]}>{getStatusText(check.status)}</Text>
                    </View>
                    {canMarkAsFixed() && needsFixing(check.status) && !isCheckFixed(index) && (
                      <TouchableOpacity
                        onPress={() => markCheckAsFixed(index)}
                        style={[styles.fixButton, { backgroundColor: colors.primary }]}
                      >
                        <CheckCheck size={14} color="#fff" />
                        <Text style={styles.fixButtonText}>Mark Fixed</Text>
                      </TouchableOpacity>
                    )}
                    {isCheckFixed(index) && (
                      <View style={styles.fixedBadge}>
                        <CheckCheck size={14} color="#10b981" />
                        <Text style={styles.fixedBadgeText}>Fixed</Text>
                      </View>
                    )}
                  </View>
                </View>
                {check.notes && (
                  <Text style={[styles.checkNotes, { color: colors.textSecondary }]}>Notes: {check.notes}</Text>
                )}
                {check.pictures && check.pictures.length > 0 && (
                  <View style={styles.picturesSection}>
                    <View style={styles.picturesHeader}>
                      <ImageIcon size={14} color="#64748b" />
                      <Text style={[styles.picturesLabel, { color: colors.textSecondary }]}>{check.pictures.length} photo{check.pictures.length !== 1 ? 's' : ''}</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.picturesScroll}>
                      {check.pictures.map((picture: string, picIndex: number) => (
                        <TouchableOpacity
                          key={picIndex}
                          onPress={() => setSelectedImage(picture)}
                          activeOpacity={0.8}
                        >
                          <Image source={{ uri: picture }} style={styles.thumbnail} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {inspection.additionalComments && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Comments</Text>
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>{inspection.additionalComments}</Text>
          </View>
        )}
      </>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Inspection Details',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.header, { backgroundColor: colors.card }]}>
            <View style={styles.headerIcon}>
              <FileText size={32} color="#1e40af" />
            </View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {type === 'plant' && 'Plant Daily Inspection'}
              {type === 'quickhitch' && 'Quick Hitch Inspection'}
              {type === 'vehicle' && 'Vehicle Inspection'}
              {type === 'bucketchange' && 'Bucket Change Check'}
            </Text>
            <View style={styles.headerMeta}>
              <Calendar size={16} color="#64748b" />
              <Text style={[styles.headerMetaText, { color: colors.textSecondary }]}>{formatDate(inspection.createdAt)}</Text>
            </View>
            <View style={styles.headerMeta}>
              <User size={16} color="#64748b" />
              <Text style={[styles.headerMetaText, { color: colors.textSecondary }]}>
                {'employeeName' in inspection ? inspection.employeeName : inspection.operatorName}
              </Text>
            </View>
          </View>

          {type === 'plant' && renderPlantInspection()}
          {type === 'quickhitch' && renderQuickHitchInspection()}
          {type === 'vehicle' && renderVehicleInspection()}
          {type === 'bucketchange' && renderBucketChangeInspection()}
        </ScrollView>

        <Modal
          visible={selectedImage !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedImage(null)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setSelectedImage(null)}
            >
              <View style={styles.modalContent}>
                {selectedImage && (
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.fullImage}
                    resizeMode="contain"
                  />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </Modal>
      </SafeAreaView>
    </>
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
  backButton: {
    marginLeft: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 16,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  headerMetaText: {
    fontSize: 14,
    color: '#64748b',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1e293b',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 12,
  },
  checksContainer: {
    gap: 12,
  },
  checkRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  checkInfo: {
    flexDirection: 'column',
    gap: 8,
  },
  checkItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1e293b',
  },
  checkStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  checkStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fixButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1e40af',
  },
  fixButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  fixedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#d1fae5',
  },
  fixedBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#10b981',
  },
  checkDay: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1e293b',
    minWidth: 30,
  },
  checkStatus: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  checkNotes: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  notesText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  picturesSection: {
    marginTop: 8,
    gap: 8,
  },
  picturesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  picturesLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  picturesScroll: {
    gap: 8,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
