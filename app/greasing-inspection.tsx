import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { GREASING_CHECK_ITEMS, CHECK_STATUS_OPTIONS, DAYS_OF_WEEK } from '@/constants/inspections';
import { GreasingInspectionCheck, CheckStatus, DayOfWeek, WeeklyDraftData } from '@/types';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, ChevronDown, ChevronUp, FileText, ArrowLeft, Save, Send, Calendar, Droplets } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const DAYS_OF_WEEK_DATA: { day: DayOfWeek; label: string }[] = [
  { day: 'M', label: 'Mon' },
  { day: 'T', label: 'Tue' },
  { day: 'W', label: 'Wed' },
  { day: 'Th', label: 'Thu' },
  { day: 'F', label: 'Fri' },
  { day: 'S', label: 'Sat' },
  { day: 'Su', label: 'Sun' },
];

export default function GreasingInspectionScreen() {
  const { user, company, saveDraft, getDrafts, submitGreasingInspection, deleteDraft } = useApp();
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const draftId = params.draftId as string | undefined;
  const equipmentType = (params.equipmentType as 'plant' | 'vehicles') || 'plant';

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('M');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [customEquipmentName, setCustomEquipmentName] = useState('');
  const [greasingDuration, setGreasingDuration] = useState('');
  const [weeklyData, setWeeklyData] = useState<WeeklyDraftData>({
    equipmentId: '',
    days: DAYS_OF_WEEK_DATA.map(d => ({
      day: d.day,
      date: '',
      completed: false,
      checks: [],
      additionalData: { greasingDuration: '', additionalNotes: '' },
    })),
    weekStartDate: new Date().toISOString().split('T')[0],
  });
  const [checks, setChecks] = useState<GreasingInspectionCheck[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(draftId);

  const equipment = company?.equipment?.filter(e => e.type === equipmentType) || [];

  useEffect(() => {
    if (draftId && user) {
      const drafts = getDrafts(user.id);
      const draft = drafts.find(d => d.id === draftId);
      if (draft && draft.type === 'greasing' && draft.isWeeklyReport) {
        const data = draft.data as WeeklyDraftData;
        setWeeklyData(data);
        setSelectedEquipment(data.equipmentId || '');
        setSelectedProject(data.projectId || '');
        setCustomEquipmentName(data.plantNumber || '');
        
        const currentDayData = data.days.find(d => d.day === selectedDay);
        if (currentDayData) {
          setChecks(currentDayData.checks as GreasingInspectionCheck[]);
          setGreasingDuration(currentDayData.additionalData?.greasingDuration || '');
          setAdditionalNotes(currentDayData.additionalData?.additionalNotes || '');
        }
      }
    }
  }, [draftId, user, getDrafts, selectedDay]);

  useEffect(() => {
    const currentDayData = weeklyData.days.find(d => d.day === selectedDay);
    if (currentDayData) {
      setChecks(currentDayData.checks as GreasingInspectionCheck[]);
      setGreasingDuration(currentDayData.additionalData?.greasingDuration || '');
      setAdditionalNotes(currentDayData.additionalData?.additionalNotes || '');
    }
  }, [selectedDay, weeklyData.days]);

  const groupedItems = GREASING_CHECK_ITEMS.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof GREASING_CHECK_ITEMS>);

  const handleCheckChange = (itemId: string, status: CheckStatus) => {
    setChecks(prev => {
      const existing = prev.find(c => c.itemId === itemId);
      if (existing) {
        return prev.map(c =>
          c.itemId === itemId ? { ...c, status } : c
        );
      }
      return [...prev, { itemId, status }];
    });

    if (status === 'B' || status === 'C') {
      setExpandedItems(prev => new Set(prev).add(itemId));
    } else {
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    setChecks(prev => {
      return prev.map(c =>
        c.itemId === itemId ? { ...c, notes } : c
      );
    });
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const getCheckStatus = (itemId: string): CheckStatus => {
    const check = checks.find(c => c.itemId === itemId);
    return check?.status || null;
  };

  const getCheckNotes = (itemId: string): string => {
    const check = checks.find(c => c.itemId === itemId);
    return check?.notes || '';
  };

  const isExpanded = (itemId: string): boolean => {
    return expandedItems.has(itemId);
  };

  const handleSaveDay = async () => {
    const finalEquipmentName = selectedEquipment === 'other'
      ? customEquipmentName.trim()
      : selectedEquipment
        ? equipment.find(e => e.id === selectedEquipment)?.name || ''
        : '';

    if (!finalEquipmentName) {
      Alert.alert('Error', 'Please select or enter equipment name');
      return;
    }

    const updatedDays = weeklyData.days.map(d => {
      if (d.day === selectedDay) {
        return {
          ...d,
          checks,
          completed: checks.length > 0,
          date: new Date().toISOString().split('T')[0],
          additionalData: {
            greasingDuration: greasingDuration.trim(),
            additionalNotes: additionalNotes.trim(),
          },
        };
      }
      return d;
    });

    const updatedWeeklyData: WeeklyDraftData = {
      ...weeklyData,
      equipmentId: selectedEquipment !== 'other' ? selectedEquipment || undefined : undefined,
      plantNumber: finalEquipmentName,
      projectId: selectedProject || undefined,
      days: updatedDays,
    };

    setWeeklyData(updatedWeeklyData);

    setIsSavingDraft(true);
    try {
      const savedDraft = await saveDraft('greasing', updatedWeeklyData, currentDraftId, true);
      setCurrentDraftId(savedDraft.id);
      Alert.alert('Success', `${DAYS_OF_WEEK_DATA.find(d => d.day === selectedDay)?.label} saved successfully!`);
    } catch (error) {
      console.error('Error saving draft:', error);
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmitWeek = async () => {
    const completedDays = weeklyData.days.filter(d => d.completed);
    
    if (completedDays.length === 0) {
      Alert.alert('Error', 'Please complete at least one day before submitting');
      return;
    }

    const finalEquipmentName = selectedEquipment === 'other'
      ? customEquipmentName.trim()
      : selectedEquipment
        ? equipment.find(e => e.id === selectedEquipment)?.name || ''
        : '';

    if (!finalEquipmentName) {
      Alert.alert('Error', 'Please select or enter equipment name');
      return;
    }

    if (!user || !company) {
      Alert.alert('Error', 'User or company information not found');
      return;
    }

    Alert.alert(
      'Submit Weekly Greasing Report',
      `Submit greasing inspection for ${completedDays.length} day(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              if (!submitGreasingInspection) {
                throw new Error('submitGreasingInspection not available');
              }

              for (const dayData of completedDays) {
                const inspection = {
                  companyId: company.id,
                  projectId: selectedProject || undefined,
                  employeeId: user.id,
                  employeeName: user.name,
                  equipmentId: selectedEquipment !== 'other' ? selectedEquipment || undefined : undefined,
                  equipmentName: finalEquipmentName,
                  equipmentType: equipmentType,
                  date: dayData.date || new Date().toISOString().split('T')[0],
                  checks: dayData.checks,
                  greasingDuration: dayData.additionalData?.greasingDuration || '',
                  additionalNotes: dayData.additionalData?.additionalNotes || '',
                };

                await submitGreasingInspection(inspection);
              }

              if (currentDraftId && deleteDraft) {
                await deleteDraft(currentDraftId);
              }

              Alert.alert('Success', 'Weekly greasing inspection submitted successfully', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to submit inspection. Please try again.');
              console.error('Submit error:', error);
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const getDayCompletionStatus = (day: DayOfWeek): boolean => {
    const dayData = weeklyData.days.find(d => d.day === day);
    return dayData?.completed || false;
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `${equipmentType === 'plant' ? 'Plant' : 'Vehicle'} Greasing Inspection`,
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 8 }}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
      >
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Droplets size={28} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>Weekly Greasing Check</Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Complete greasing checks for each day</Text>
        </View>

        <View style={[styles.daySelector, { backgroundColor: colors.card }]}>
          <View style={styles.daySelectorHeader}>
            <Calendar size={18} color={colors.primary} />
            <Text style={[styles.daySelectorTitle, { color: colors.text }]}>Select Day</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayButtons}>
            {DAYS_OF_WEEK_DATA.map(({ day, label }) => {
              const isCompleted = getDayCompletionStatus(day);
              const isSelected = selectedDay === day;
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    isSelected && [styles.dayButtonActive, { backgroundColor: colors.primary }],
                    isCompleted && !isSelected && [styles.dayButtonCompleted, { backgroundColor: '#10b981', borderColor: '#10b981' }],
                  ]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      { color: colors.text },
                      (isSelected || isCompleted) && styles.dayButtonTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                  {isCompleted && !isSelected && (
                    <View style={styles.completedBadge}>
                      <CheckCircle2 size={14} color="#ffffff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={[styles.formSection, { backgroundColor: colors.card }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Project</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={[styles.picker, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => {
                  const options = [
                    ...(company?.projects || []).map(proj => ({
                      text: `${proj.name} - ${proj.projectNumber}`,
                      onPress: () => setSelectedProject(proj.id),
                    })),
                    {
                      text: 'No Project',
                      onPress: () => setSelectedProject(''),
                    },
                    { text: 'Cancel', style: 'cancel' as const },
                  ];
                  Alert.alert('Select Project', 'Choose a project for this inspection', options);
                }}
              >
                <Text style={selectedProject ? [styles.pickerText, { color: colors.text }] : [styles.pickerPlaceholder, { color: colors.textSecondary }]}>
                  {selectedProject
                    ? company?.projects?.find(p => p.id === selectedProject)?.name
                    : 'Select project (optional)'}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{equipmentType === 'plant' ? 'Plant' : 'Vehicle'}</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={[styles.picker, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => {
                  const options = [
                    ...equipment.map(eq => ({
                      text: `${eq.name} - ${eq.make} ${eq.model}`,
                      onPress: () => {
                        setSelectedEquipment(eq.id);
                        setCustomEquipmentName('');
                      },
                    })),
                    {
                      text: 'Other (Manual Entry)',
                      onPress: () => {
                        setSelectedEquipment('other');
                      },
                    },
                    { text: 'Cancel', style: 'cancel' as const },
                  ];
                  Alert.alert(`Select ${equipmentType === 'plant' ? 'Plant' : 'Vehicle'}`, `Choose from company ${equipmentType}`, options);
                }}
              >
                <Text style={selectedEquipment ? [styles.pickerText, { color: colors.text }] : [styles.pickerPlaceholder, { color: colors.textSecondary }]}>
                  {selectedEquipment === 'other'
                    ? 'Other (Manual Entry)'
                    : selectedEquipment
                    ? equipment.find(e => e.id === selectedEquipment)?.name
                    : `Select ${equipmentType}`}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {selectedEquipment === 'other' && (
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder={`Enter ${equipmentType} name`}
                placeholderTextColor={colors.textSecondary}
                value={customEquipmentName}
                onChangeText={setCustomEquipmentName}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Greasing Duration for {DAYS_OF_WEEK_DATA.find(d => d.day === selectedDay)?.label} (minutes)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g. 30"
              placeholderTextColor={colors.textSecondary}
              value={greasingDuration}
              onChangeText={setGreasingDuration}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={[styles.legendSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.legendTitle, { color: colors.text }]}>Status Key</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBadge, { backgroundColor: '#10b981' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>A - Satisfactory</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBadge, { backgroundColor: '#f59e0b' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>B - Requires Action</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBadge, { backgroundColor: '#ef4444' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>C - Immediate Attention</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBadge, { backgroundColor: '#9ca3af' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>N/A - Not Applicable</Text>
            </View>
          </View>
        </View>

        {Object.entries(groupedItems).map(([category, items]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={[styles.categoryTitle, { color: colors.text }]}>{category}</Text>
            <View style={styles.checklistSection}>
              {items.map(item => {
                const status = getCheckStatus(item.id);
                const notes = getCheckNotes(item.id);
                const expanded = isExpanded(item.id);
                const showDropdown = status === 'B' || status === 'C';
                
                return (
                  <View key={item.id} style={[styles.checkItem, { backgroundColor: colors.card }]}>
                    <View style={styles.checkItemHeader}>
                      <Text style={[styles.checkItemName, { color: colors.text }]}>{item.name}</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusButtons}>
                        {CHECK_STATUS_OPTIONS.map(option => (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.statusButton,
                              status === option.value && { backgroundColor: option.color },
                            ]}
                            onPress={() => handleCheckChange(item.id, option.value as CheckStatus)}
                          >
                            <Text
                              style={[
                                styles.statusButtonText,
                                status === option.value && styles.statusButtonTextActive,
                              ]}
                            >
                              {option.value}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                    
                    {showDropdown && (
                      <View style={styles.dropdownSection}>
                        <TouchableOpacity 
                          style={styles.dropdownToggle}
                          onPress={() => toggleExpanded(item.id)}
                        >
                          <Text style={[styles.dropdownToggleText, { color: colors.textSecondary }]}>Add Details</Text>
                          {expanded ? (
                            <ChevronUp size={16} color={colors.textSecondary} />
                          ) : (
                            <ChevronDown size={16} color={colors.textSecondary} />
                          )}
                        </TouchableOpacity>
                        
                        {expanded && (
                          <View style={styles.dropdownContent}>
                            <View style={styles.dropdownOption}>
                              <View style={styles.dropdownOptionHeader}>
                                <FileText size={16} color="#1e40af" />
                                <Text style={[styles.dropdownOptionLabel, { color: colors.text }]}>Notes</Text>
                              </View>
                              <TextInput
                                style={[styles.dropdownInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                placeholder="Add notes about the issue..."
                                placeholderTextColor={colors.textSecondary}
                                value={notes}
                                onChangeText={(text) => handleNotesChange(item.id, text)}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                              />
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        <View style={[styles.notesSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Additional Notes for {DAYS_OF_WEEK_DATA.find(d => d.day === selectedDay)?.label}</Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            placeholder="Enter any additional observations or comments..."
            placeholderTextColor={colors.textSecondary}
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.card, borderColor: colors.primary }, isSavingDraft && styles.buttonDisabled]}
            onPress={handleSaveDay}
            disabled={isSavingDraft}
          >
            {isSavingDraft ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Save size={20} color={colors.primary} />
                <Text style={[styles.saveButtonText, { color: colors.primary }]}>Save {DAYS_OF_WEEK_DATA.find(d => d.day === selectedDay)?.label}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmitWeek}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Send size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>Submit Week</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  daySelector: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  daySelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  daySelectorTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  dayButtons: {
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 60,
    alignItems: 'center',
    position: 'relative' as const,
  },
  dayButtonActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  dayButtonCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  dayButtonTextActive: {
    color: '#ffffff',
  },
  completedBadge: {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 2,
  },
  formSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1e293b',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
  },
  legendSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: '45%',
  },
  legendBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500' as const,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  checklistSection: {
    gap: 12,
  },
  checkItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  checkItemHeader: {
    gap: 12,
  },
  checkItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1e293b',
  },
  statusButtons: {
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  statusButtonTextActive: {
    color: '#ffffff',
  },
  notesSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 8,
  },
  notesInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 100,
  },
  actionButtons: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  submitButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  dropdownSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  dropdownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  dropdownToggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  dropdownContent: {
    marginTop: 12,
    gap: 16,
  },
  dropdownOption: {
    gap: 8,
  },
  dropdownOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dropdownOptionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1e293b',
  },
  dropdownInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 70,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  pickerText: {
    fontSize: 15,
    color: '#1e293b',
  },
  pickerPlaceholder: {
    fontSize: 15,
    color: '#94a3b8',
  },
});
