import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { VEHICLE_INSPECTION_ITEMS, CHECK_STATUS_OPTIONS } from '@/constants/inspections';
import { VehicleInspectionCheck, CheckStatus } from '@/types';
import { useRouter, Stack } from 'expo-router';
import { CheckCircle2, ChevronDown, ChevronUp, FileText, Camera, ArrowLeft } from 'lucide-react-native';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export default function VehicleInspectionScreen() {
  const { user, company, submitVehicleInspection } = useApp();
  const { colors } = useTheme();
  const router = useRouter();
  const [vehicleType, setVehicleType] = useState('');
  const [mileage, setMileage] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [customVehicle, setCustomVehicle] = useState('');
  const [checks, setChecks] = useState<VehicleInspectionCheck[]>([]);
  const [additionalComments, setAdditionalComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const vehicleEquipment = company?.equipment?.filter(e => e.type === 'vehicle') || [];

  const groupedItems = VEHICLE_INSPECTION_ITEMS.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof VEHICLE_INSPECTION_ITEMS>);

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

  const handleSubmit = async () => {
    const finalVehicleReg = selectedEquipment === 'other'
      ? customVehicle.trim()
      : selectedEquipment
        ? vehicleEquipment.find(e => e.id === selectedEquipment)?.registration || ''
        : '';

    const finalVehicleType = selectedEquipment && selectedEquipment !== 'other'
      ? vehicleEquipment.find(e => e.id === selectedEquipment)?.name || vehicleType.trim()
      : vehicleType.trim();

    if (!finalVehicleReg || !finalVehicleType || !mileage.trim()) {
      Alert.alert('Error', 'Please fill in Vehicle Registration, Type, and Mileage fields');
      return;
    }

    if (checks.length === 0) {
      Alert.alert('Error', 'Please complete at least one check');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitVehicleInspection({
        companyId: company!.id,
        employeeId: user!.id,
        employeeName: user!.name || 'Unknown',
        equipmentId: selectedEquipment !== 'other' ? selectedEquipment || undefined : undefined,
        vehicleRegistration: finalVehicleReg,
        vehicleType: finalVehicleType,
        mileage: mileage.trim(),
        date: new Date().toISOString().split('T')[0],
        checks,
        additionalComments: additionalComments.trim(),
      });

      Alert.alert('Success', 'Vehicle inspection submitted successfully', [
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
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Vehicle Inspection',
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
          <Text style={[styles.title, { color: colors.text }]}>Vehicle Daily Check</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Complete all required checks</Text>
        </View>

        <View style={[styles.formSection, { backgroundColor: colors.card }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Vehicle</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={[styles.picker, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => {
                  const options = [
                    ...vehicleEquipment.map(equipment => ({
                      text: `${equipment.name} - ${equipment.registration || 'No Reg'}`,
                      onPress: () => {
                        setSelectedEquipment(equipment.id);
                        setCustomVehicle('');
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
                  Alert.alert('Select Vehicle', 'Choose from company vehicles', options);
                }}
              >
                <Text style={selectedEquipment ? [styles.pickerText, { color: colors.text }] : [styles.pickerPlaceholder, { color: colors.textSecondary }]}>
                  {selectedEquipment === 'other'
                    ? 'Other (Manual Entry)'
                    : selectedEquipment
                    ? vehicleEquipment.find(e => e.id === selectedEquipment)?.name
                    : 'Select vehicle'}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {selectedEquipment === 'other' && (
              <>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. AB12 CDE"
                  placeholderTextColor={colors.textSecondary}
                  value={customVehicle}
                  onChangeText={setCustomVehicle}
                  autoCapitalize="characters"
                />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. Van, Car, Pickup"
                  placeholderTextColor={colors.textSecondary}
                  value={vehicleType}
                  onChangeText={setVehicleType}
                />
              </>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Current Mileage</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter mileage"
              placeholderTextColor={colors.textSecondary}
              value={mileage}
              onChangeText={setMileage}
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
                            
                            <View style={styles.dropdownOption}>
                              <View style={styles.dropdownOptionHeader}>
                                <Camera size={16} color="#1e40af" />
                                <Text style={[styles.dropdownOptionLabel, { color: colors.text }]}>Pictures</Text>
                              </View>
                              <TouchableOpacity style={styles.addPictureButton}>
                                <Camera size={18} color="#1e40af" />
                                <Text style={styles.addPictureText}>Add Picture</Text>
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
          </View>
        ))}

        <View style={[styles.notesSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Additional Comments</Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            placeholder="Enter any additional comments or observations..."
            placeholderTextColor={colors.textSecondary}
            value={additionalComments}
            onChangeText={setAdditionalComments}
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
