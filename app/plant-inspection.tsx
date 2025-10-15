import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { PLANT_INSPECTION_ITEMS, PLANT_INSPECTION_SECONDARY_ITEMS, DAYS_OF_WEEK, CHECK_STATUS_OPTIONS } from '@/constants/inspections';
import { PlantInspectionCheck, DayOfWeek, CheckStatus } from '@/types';
import { useRouter } from 'expo-router';
import { CheckCircle2, ChevronDown, ChevronUp, FileText, Camera, X } from 'lucide-react-native';
import { useState } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function PlantInspectionScreen() {
  const { user, company, submitPlantInspection } = useApp();
  const { colors } = useTheme();
  const router = useRouter();
  const [plantNumber, setPlantNumber] = useState('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [carriedOutBy, setCarriedOutBy] = useState(user?.name || '');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('M');
  const [checks, setChecks] = useState<PlantInspectionCheck[]>([]);
  const [notesOnDefects, setNotesOnDefects] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allItems = [...PLANT_INSPECTION_ITEMS, ...PLANT_INSPECTION_SECONDARY_ITEMS];

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleCheckChange = (itemId: string, status: CheckStatus) => {
    setChecks(prev => {
      const existing = prev.find(c => c.itemId === itemId && c.day === selectedDay);
      if (existing) {
        return prev.map(c =>
          c.itemId === itemId && c.day === selectedDay ? { ...c, status } : c
        );
      }
      return [...prev, { itemId, day: selectedDay, status }];
    });

    if (status === 'B' || status === 'C') {
      setExpandedItems(prev => new Set(prev).add(`${itemId}-${selectedDay}`));
    } else {
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${itemId}-${selectedDay}`);
        return newSet;
      });
    }
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    setChecks(prev => {
      return prev.map(c =>
        c.itemId === itemId && c.day === selectedDay ? { ...c, notes } : c
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
            if (c.itemId === itemId && c.day === selectedDay) {
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
        if (c.itemId === itemId && c.day === selectedDay) {
          const pictures = c.pictures || [];
          return { ...c, pictures: pictures.filter((_, i) => i !== pictureIndex) };
        }
        return c;
      });
    });
  };

  const toggleExpanded = (itemId: string) => {
    const key = `${itemId}-${selectedDay}`;
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const getCheckStatus = (itemId: string): CheckStatus => {
    const check = checks.find(c => c.itemId === itemId && c.day === selectedDay);
    return check?.status || null;
  };

  const getCheckNotes = (itemId: string): string => {
    const check = checks.find(c => c.itemId === itemId && c.day === selectedDay);
    return check?.notes || '';
  };

  const getCheckPictures = (itemId: string): string[] => {
    const check = checks.find(c => c.itemId === itemId && c.day === selectedDay);
    return check?.pictures || [];
  };

  const isExpanded = (itemId: string): boolean => {
    return expandedItems.has(`${itemId}-${selectedDay}`);
  };

  const handleSubmit = async () => {
    if (!plantNumber.trim() || !carriedOutBy.trim()) {
      Alert.alert('Error', 'Please fill in Plant Number and Carried Out By fields');
      return;
    }

    if (checks.length === 0) {
      Alert.alert('Error', 'Please complete at least one check');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPlantInspection({
        companyId: company!.id,
        projectId: selectedProject || undefined,
        employeeId: user!.id,
        employeeName: user!.name || 'Unknown',
        plantNumber: plantNumber.trim(),
        equipmentId: selectedEquipmentId || undefined,
        carriedOutBy: carriedOutBy.trim(),
        date: new Date().toISOString().split('T')[0],
        checks,
        notesOnDefects: notesOnDefects.trim(),
      });

      Alert.alert('Success', 'Inspection submitted successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit inspection. Please try again.');
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Plant Daily Inspection</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Complete all required checks</Text>
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
            <Text style={[styles.label, { color: colors.text }]}>Carried Out By</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter name"
              placeholderTextColor={colors.textSecondary}
              value={carriedOutBy}
              onChangeText={setCarriedOutBy}
            />
          </View>
        </View>

        <View style={styles.daySelector}>
          <Text style={[styles.daySelectorLabel, { color: colors.text }]}>Select Day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayButtons}>
            {DAYS_OF_WEEK.map(day => (
              <TouchableOpacity
                key={day}
                style={[styles.dayButton, { backgroundColor: colors.card, borderColor: colors.border }, selectedDay === day && styles.dayButtonActive]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayButtonText, { color: colors.textSecondary }, selectedDay === day && styles.dayButtonTextActive]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
          <Text style={[styles.label, { color: colors.text }]}>Notes on Defects</Text>
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

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <CheckCircle2 size={20} color="#ffffff" />
              <Text style={styles.submitButtonText}>Submit Inspection</Text>
            </>
          )}
        </TouchableOpacity>
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
    marginBottom: 16,
  },
  daySelectorLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1e293b',
    marginBottom: 12,
  },
  dayButtons: {
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dayButtonActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  dayButtonTextActive: {
    color: '#ffffff',
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
  submitButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
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
