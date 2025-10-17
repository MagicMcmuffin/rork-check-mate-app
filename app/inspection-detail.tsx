import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, Calendar, User, FileText, CheckCircle2, XCircle, AlertCircle, Image as ImageIcon, CheckCheck, Download } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckStatus } from '@/types';
import { PLANT_INSPECTION_ITEMS, PLANT_INSPECTION_SECONDARY_ITEMS, QUICK_HITCH_ITEMS, VEHICLE_INSPECTION_ITEMS, BUCKET_CHANGE_ITEMS } from '@/constants/inspections';
import { useState } from 'react';
import { generatePlantInspectionPDF, generateQuickHitchInspectionPDF, generateVehicleInspectionPDF, generateBucketChangeInspectionPDF } from '@/lib/pdf-generator';

export default function InspectionDetailScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: 'plant' | 'quickhitch' | 'vehicle' | 'bucketchange' }>();
  const { plantInspections, quickHitchInspections, vehicleInspections, bucketChangeInspections, company, user } = useApp();
  const { colors } = useTheme();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fixedChecks, setFixedChecks] = useState<Set<string>>(new Set());
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [showFilenameModal, setShowFilenameModal] = useState<boolean>(false);
  const [customFilename, setCustomFilename] = useState<string>('');

  let inspection: any = null;
  let isWeeklyReport = false;

  if (type === 'plant') {
    inspection = plantInspections.find(i => i.id === id);
  } else if (type === 'quickhitch') {
    inspection = quickHitchInspections.find(i => i.id === id);
  } else if (type === 'vehicle') {
    inspection = vehicleInspections.find(i => i.id === id);
  } else if (type === 'bucketchange') {
    inspection = bucketChangeInspections.find(i => i.id === id);
  }

  if (inspection && 'days' in inspection && Array.isArray(inspection.days)) {
    isWeeklyReport = true;
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

  const getDefaultFilename = () => {
    if (type === 'plant') {
      return `plant-inspection-${inspection.plantNumber}-${inspection.date}`;
    } else if (type === 'quickhitch') {
      return `quickhitch-inspection-${inspection.quickHitchModel}-${inspection.date}`;
    } else if (type === 'vehicle') {
      return `vehicle-inspection-${inspection.vehicleRegistration}-${inspection.date}`;
    } else if (type === 'bucketchange') {
      return `bucket-change-${inspection.bucketType}-${inspection.date}`;
    }
    return `inspection-${inspection.date}`;
  };

  const handleDownloadButtonPress = () => {
    setCustomFilename(getDefaultFilename());
    setShowFilenameModal(true);
  };

  const handleDownloadPDF = async () => {
    if (!inspection || !company) return;

    setShowFilenameModal(false);
    setIsGeneratingPDF(true);
    try {
      const projectName = inspection.projectId 
        ? company.projects.find(p => p.id === inspection.projectId)?.name 
        : undefined;

      const filename = customFilename.trim() || getDefaultFilename();

      if (type === 'plant') {
        await generatePlantInspectionPDF(inspection, company.name, projectName, filename);
      } else if (type === 'quickhitch') {
        await generateQuickHitchInspectionPDF(inspection, company.name, projectName, filename);
      } else if (type === 'vehicle') {
        await generateVehicleInspectionPDF(inspection, company.name, projectName, filename);
      } else if (type === 'bucketchange') {
        await generateBucketChangeInspectionPDF(inspection, company.name, projectName, filename);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
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

  const getItemName = (itemId: string) => {
    if (type === 'plant') return getPlantItemName(itemId);
    if (type === 'quickhitch') return getQuickHitchItemName(itemId);
    if (type === 'vehicle') return getVehicleItemName(itemId);
    if (type === 'bucketchange') return getBucketChangeItemName(itemId);
    return itemId;
  };

  const getDayName = (day: string) => {
    const names: Record<string, string> = {
      'M': 'Mon',
      'T': 'Tue',
      'W': 'Wed',
      'Th': 'Thu',
      'F': 'Fri',
      'S': 'Sat',
      'Su': 'Sun',
    };
    return names[day] || day;
  };

  const renderWeeklyReport = () => {
    const completedDays = inspection.days.filter((d: any) => d.completed);
    
    const allCheckItems: Set<string> = new Set();
    completedDays.forEach((day: any) => {
      day.checks.forEach((check: any) => {
        allCheckItems.add(check.itemId);
      });
    });

    const checkItemsArray = Array.from(allCheckItems);

    return (
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Inspection Summary</Text>
        <View style={styles.weeklyTableContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              <View style={styles.tableHeader}>
                <View style={[styles.tableHeaderCell, styles.itemNameColumn, { backgroundColor: colors.primary }]}>
                  <Text style={styles.tableHeaderText}>Inspection Item</Text>
                </View>
                {completedDays.map((day: any, index: number) => (
                  <View key={index} style={[styles.tableHeaderCell, styles.dayColumn, { backgroundColor: colors.primary }]}>
                    <Text style={styles.tableHeaderText}>{getDayName(day.day)}</Text>
                    <Text style={styles.tableHeaderDateText}>{day.date}</Text>
                  </View>
                ))}
              </View>
              {checkItemsArray.map((itemId, rowIndex) => (
                <View key={rowIndex} style={[styles.tableRow, rowIndex % 2 === 0 && { backgroundColor: colors.background }]}>
                  <View style={[styles.tableCell, styles.itemNameColumn, { backgroundColor: rowIndex % 2 === 0 ? colors.card : '#f8fafc' }]}>
                    <Text style={[styles.tableCellText, { color: colors.text }]}>{getItemName(itemId)}</Text>
                  </View>
                  {completedDays.map((day: any, dayIndex: number) => {
                    const check = day.checks.find((c: any) => c.itemId === itemId);
                    const hasCheck = !!check;
                    const statusColor = hasCheck ? (
                      check.status === 'A' || check.status === '✓' || check.status === true ? '#10b981' :
                      check.status === 'B' ? '#f59e0b' :
                      check.status === 'C' || check.status === '✗' || check.status === false ? '#ef4444' : '#94a3b8'
                    ) : '#e2e8f0';
                    const statusBg = hasCheck ? (
                      check.status === 'A' || check.status === '✓' || check.status === true ? '#d1fae5' :
                      check.status === 'B' ? '#fef3c7' :
                      check.status === 'C' || check.status === '✗' || check.status === false ? '#fee2e2' : '#f1f5f9'
                    ) : '#f8fafc';

                    return (
                      <View key={dayIndex} style={[styles.tableCell, styles.dayColumn]}>
                        {hasCheck ? (
                          <View style={styles.statusContainer}>
                            <View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: statusColor }]}>
                              <Text style={[styles.statusBadgeText, { color: statusColor }]}>{getStatusText(check.status)}</Text>
                            </View>
                            {check.notes && (
                              <Text style={[styles.checkNotesSmall, { color: colors.textSecondary }]} numberOfLines={2}>📝 {check.notes}</Text>
                            )}
                          </View>
                        ) : (
                          <Text style={[styles.emptyCell, { color: colors.textSecondary }]}>—</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    );
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
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleDownloadButtonPress} 
              style={styles.downloadButton}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Download size={24} color={colors.primary} />
              )}
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

          {isWeeklyReport ? (
            <>
              <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Week Period:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{inspection.weekStartDate}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Days Completed:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{inspection.days.filter((d: any) => d.completed).length} / {inspection.days.length}</Text>
                </View>
                {inspection.projectId && company && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Project:</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {company.projects.find(p => p.id === inspection.projectId)?.name || 'Unknown'}
                    </Text>
                  </View>
                )}
              </View>
              {renderWeeklyReport()}
            </>
          ) : (
            <>
              {type === 'plant' && renderPlantInspection()}
              {type === 'quickhitch' && renderQuickHitchInspection()}
              {type === 'vehicle' && renderVehicleInspection()}
              {type === 'bucketchange' && renderBucketChangeInspection()}
            </>
          )}
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

        <Modal
          visible={showFilenameModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFilenameModal(false)}
        >
          <View style={styles.filenameModalContainer}>
            <TouchableOpacity
              style={styles.filenameModalOverlay}
              activeOpacity={1}
              onPress={() => setShowFilenameModal(false)}
            />
            <View style={[styles.filenameModalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.filenameModalTitle, { color: colors.text }]}>Download PDF</Text>
              <Text style={[styles.filenameModalLabel, { color: colors.textSecondary }]}>Filename:</Text>
              <TextInput
                style={[styles.filenameInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={customFilename}
                onChangeText={setCustomFilename}
                placeholder="Enter filename"
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
              <Text style={[styles.filenameModalNote, { color: colors.textSecondary }]}>.pdf will be added automatically</Text>
              <View style={styles.filenameModalActions}>
                <TouchableOpacity
                  onPress={() => setShowFilenameModal(false)}
                  style={[styles.filenameModalButton, styles.cancelButton, { borderColor: colors.border }]}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDownloadPDF}
                  style={[styles.filenameModalButton, styles.downloadModalButton, { backgroundColor: colors.primary }]}
                >
                  <Download size={16} color="#fff" />
                  <Text style={styles.downloadModalButtonText}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  downloadButton: {
    marginRight: 16,
    padding: 8,
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
  weeklyTableContainer: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tableHeader: {
    flexDirection: 'row',
  },
  tableHeaderCell: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.2)',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#ffffff',
    textAlign: 'center' as const,
  },
  tableHeaderDateText: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableCell: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    minHeight: 50,
  },
  itemNameColumn: {
    width: 180,
    alignItems: 'flex-start',
    paddingLeft: 12,
  },
  dayColumn: {
    width: 120,
  },
  tableCellText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  statusContainer: {
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  checkNotesSmall: {
    fontSize: 9,
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
  },
  emptyCell: {
    fontSize: 14,
    fontStyle: 'italic' as const,
  },
  filenameModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  filenameModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filenameModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  filenameModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 20,
  },
  filenameModalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 8,
  },
  filenameInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  filenameModalNote: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  filenameModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  filenameModalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  downloadModalButton: {
    backgroundColor: '#1e40af',
  },
  downloadModalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
});
