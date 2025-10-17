import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { PLANT_INSPECTION_ITEMS, PLANT_INSPECTION_SECONDARY_ITEMS, CHECK_STATUS_OPTIONS } from '@/constants/inspections';
import { PlantInspectionCheck, DayOfWeek, CheckStatus, WeeklyDraftData } from '@/types';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, ChevronDown, ChevronUp, FileText, Camera, X, Save, Send, Calendar, ArrowLeft } from 'lucide-react-native';
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
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const DAYS_OF_WEEK_DATA: { day: DayOfWeek; label: string }[] = [
  { day: 'M', label: 'Mon' },
  { day: 'T', label: 'Tue' },
  { day: 'W', label: 'Wed' },
  { day: 'Th', label: 'Thu' },
  { day: 'F', label: 'Fri' },
  { day: 'S', label: 'Sat' },
  { day: 'Su', label: 'Sun' },
];

export default function PlantInspectionScreen() {
  const { user, company, submitPlantInspection, saveDraft, getDrafts, deleteDraft } = useApp();
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const draftId = params.draftId as string | undefined;
  
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('M');
  const [plantNumber, setPlantNumber] = useState('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [carriedOutBy, setCarriedOutBy] = useState(user?.name || '');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [weeklyData, setWeeklyData] = useState<WeeklyDraftData>({
    equipmentId: '',
    plantNumber: '',
    days: DAYS_OF_WEEK_DATA.map(d => ({
      day: d.day,
      date: '',
      completed: false,
      checks: [],
      additionalData: { notesOnDefects: '', carriedOutBy: '' },
    })),
    weekStartDate: new Date().toISOString().split('T')[0],
  });
  const [checks, setChecks] = useState<PlantInspectionCheck[]>([]);
  const [notesOnDefects, setNotesOnDefects] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(draftId);

  const allItems = [...PLANT_INSPECTION_ITEMS, ...PLANT_INSPECTION_SECONDARY_ITEMS];

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (draftId && user) {
      const drafts = getDrafts(user.id);
      const draft = drafts.find(d => d.id === draftId);
      if (draft && draft.type === 'plant' && draft.isWeeklyReport) {
        const data = draft.data as WeeklyDraftData;
        setWeeklyData(data);
        setSelectedEquipmentId(data.equipmentId || '');
        setPlantNumber(data.plantNumber || '');
        setSelectedProject(data.projectId || '');
        
        const currentDayData = data.days.find(d => d.day === selectedDay);
        if (currentDayData) {
          setChecks(currentDayData.checks as PlantInspectionCheck[]);
          setNotesOnDefects(currentDayData.additionalData?.notesOnDefects || '');
          setCarriedOutBy(currentDayData.additionalData?.carriedOutBy || user.name || '');
        }
      }
    }
  }, [draftId, user, getDrafts, selectedDay]);

  useEffect(() => {
    const currentDayData = weeklyData.days.find(d => d.day === selectedDay);
    if (currentDayData) {
      setChecks(currentDayData.checks as PlantInspectionCheck[]);
      setNotesOnDefects(currentDayData.additionalData?.notesOnDefects || '');
      setCarriedOutBy(currentDayData.additionalData?.carriedOutBy || user?.name || '');
    }
  }, [selectedDay, weeklyData.days]);

  const handleCheckChange = (itemId: string, status: CheckStatus) => {
    setChecks(prev => {
      const existing = prev.find(c => c.itemId === itemId);
      if (existing) {
        return prev.map(c =>
          c.itemId === itemId ? { ...c, status } : c
        );
      }
      return [...prev, { itemId, day: selectedDay, status }];
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

  const handleAddPicture = async (itemId: string) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const imageUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setChecks(prev => {
          return prev.map(c => {
            if (c.itemId === itemId) {
              return { ...c, pictures: [...(c.pictures || []), imageUri] };
            }
            return c;
          });
        });
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handleRemovePicture = (itemId: string, pictureIndex: number) => {
    setChecks(prev => {
      return prev.map(c => {
        if (c.itemId === itemId) {
          const pictures = c.pictures || [];
          return { ...c, pictures: pictures.filter((_, i) => i !== pictureIndex) };
        }
        return c;
      });
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

  const getCheckPictures = (itemId: string): string[] => {
    const check = checks.find(c => c.itemId === itemId);
    return check?.pictures || [];
  };

  const isExpanded = (itemId: string): boolean => {
    return expandedItems.has(itemId);
  };

  const handleSaveDay = async () => {
    if (!plantNumber.trim()) {
      Alert.alert('Error', 'Please enter plant name');
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
            notesOnDefects: notesOnDefects.trim(),
            carriedOutBy: carriedOutBy.trim(),
          },
        };
      }
      return d;
    });

    const updatedWeeklyData: WeeklyDraftData = {
      ...weeklyData,
      equipmentId: selectedEquipmentId || undefined,
      plantNumber: plantNumber.trim(),
      projectId: selectedProject || undefined,
      days: updatedDays,
    };

    setWeeklyData(updatedWeeklyData);

    setIsSavingDraft(true);
    try {
      const savedDraft = await saveDraft('plant', updatedWeeklyData, currentDraftId, true);
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

    if (!plantNumber.trim()) {
      Alert.alert('Error', 'Please enter plant name');
      return;
    }

    if (!user || !company) {
      Alert.alert('Error', 'User or company information not found');
      return;
    }

    Alert.alert(
      'Submit Weekly Plant Inspection',
      `Submit inspection for ${completedDays.length} day(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              for (const dayData of completedDays) {
                await submitPlantInspection({
                  companyId: company.id,
                  projectId: selectedProject || undefined,
                  employeeId: user.id,
                  employeeName: user.name || 'Unknown',
                  plantNumber: plantNumber.trim(),
                  equipmentId: selectedEquipmentId || undefined,
                  carriedOutBy: dayData.additionalData?.carriedOutBy || user.name || '',
                  date: dayData.date || new Date().toISOString().split('T')[0],
                  checks: dayData.checks as PlantInspectionCheck[],
                  notesOnDefects: dayData.additionalData?.notesOnDefects || '',
                });
              }

              if (currentDraftId && deleteDraft) {
                await deleteDraft(currentDraftId);
              }

              Alert.alert('Success', 'Weekly plant inspection submitted successfully', [
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
          title: 'Plant Inspection',
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
          <Text style={[styles.title, { color: colors.text }]}>Weekly Plant Inspection</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Complete checks for each day</Text>
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
          {company && company.projects.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Project (Optional)</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => {
                    Alert.alert(
                      'Select Project',
                      'Choose a project for this inspection',
                      [
                        { text: 'None', onPress: () => setSelectedProject('') },
                        ...company.projects.map(project => ({
                          text: project.name,
                          onPress: () => setSelectedProject(project.id),
                        })),
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    );
                  }}
                >
                  <Text style={selectedProject ? [styles.pickerText, { color: colors.text }] : [styles.pickerPlaceholder, { color: colors.textSecondary }]}>
                    {selectedProject
                      ? company.projects.find(p => p.id === selectedProject)?.name
                      : 'Select project'}
                  </Text>
                  <ChevronDown size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Plant Name</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => {
                  const equipmentList = company?.equipment?.filter(e => e.type === 'plant') || [];
                  const options = [
                    { text: 'Other (Manual Entry)', onPress: () => { setSelectedEquipmentId(''); setPlantNumber(''); } },
                    ...equipmentList.map(eq => ({
                      text: `${eq.name} - ${eq.make} ${eq.model}`,
                      onPress: () => { setSelectedEquipmentId(eq.id); setPlantNumber(eq.name); },
                    })),
                    { text: 'Cancel', style: 'cancel' as const },
                  ];
                  Alert.alert('Select Plant', 'Choose from your equipment list', options);
                }}
              >
                <Text style={selectedEquipmentId || plantNumber ? [styles.pickerText, { color: colors.text }] : [styles.pickerPlaceholder, { color: colors.textSecondary }]}>
                  {selectedEquipmentId
                    ? (() => {
                        const eq = company?.equipment?.find(e => e.id === selectedEquipmentId);
                        return eq ? `${eq.name} - ${eq.make} ${eq.model}` : 'Select plant';
                      })()
                    : plantNumber || 'Select plant'}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {!selectedEquipmentId && (
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Or enter plant name manually"
                placeholderTextColor={colors.textSecondary}
                value={plantNumber}
                onChangeText={setPlantNumber}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Carried Out By for {DAYS_OF_WEEK_DATA.find(d => d.day === selectedDay)?.label}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter name"
              placeholderTextColor={colors.textSecondary}
              value={carriedOutBy}
              onChangeText={setCarriedOutBy}
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

        <View style={styles.checklistSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Inspection Items</Text>
          {allItems.map(item => {
            const status = getCheckStatus(item.id);
            const notes = getCheckNotes(item.id);
            const pictures = getCheckPictures(item.id);
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
                          { backgroundColor: colors.background, borderColor: colors.border },
                          status === option.value && { backgroundColor: option.color },
                        ]}
                        onPress={() => handleCheckChange(item.id, option.value as CheckStatus)}
                      >
                        <Text
                          style={[
                            styles.statusButtonText,
                            { color: colors.textSecondary },
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
                  <View style={[styles.dropdownSection, { borderTopColor: colors.border }]}>
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
                            <FileText size={16} color={colors.primary} />
                            <Text style={[styles.dropdownOptionLabel, { color: colors.text }]}>Notes</Text>
                          </View>
                          <TextInput
                            style={[styles.dropdownInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="Add notes about the issue..."
                            placeholderTextColor={colors.textSecondary}
                            value={notes}
                            onChangeText={(text) => handleNotesChange(item.id, text)}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                          />
                        </View>
                        
                        <View style={styles.dropdownOption}>
                          <View style={styles.dropdownOptionHeader}>
                            <Camera size={16} color={colors.primary} />
                            <Text style={[styles.dropdownOptionLabel, { color: colors.text }]}>Pictures</Text>
                          </View>
                          
                          {pictures.length > 0 && (
                            <View style={styles.picturesContainer}>
                              {pictures.map((picture, index) => (
                                <View key={index} style={styles.pictureWrapper}>
                                  <Image source={{ uri: picture }} style={styles.picture} />
                                  <TouchableOpacity
                                    style={styles.removePictureButton}
                                    onPress={() => handleRemovePicture(item.id, index)}
                                  >
                                    <X size={16} color="#ffffff" />
                                  </TouchableOpacity>
                                </View>
                              ))}
                            </View>
                          )}
                          
                          <TouchableOpacity 
                            style={[styles.addPictureButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                            onPress={() => handleAddPicture(item.id)}
                          >
                            <Camera size={18} color={colors.primary} />
                            <Text style={[styles.addPictureText, { color: colors.primary }]}>Take Photo</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={[styles.notesSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Notes on Defects for {DAYS_OF_WEEK_DATA.find(d => d.day === selectedDay)?.label}</Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="Enter any defects or issues found..."
            placeholderTextColor={colors.textSecondary}
            value={notesOnDefects}
            onChangeText={setNotesOnDefects}
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
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
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
  checklistSection: {
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 4,
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
  picturesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  pictureWrapper: {
    position: 'relative' as const,
  },
  picture: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePictureButton: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPictureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderStyle: 'dashed' as const,
  },
  addPictureText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1e40af',
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
