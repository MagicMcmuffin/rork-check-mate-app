import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { QUICK_HITCH_ITEMS, DAYS_OF_WEEK } from '@/constants/inspections';
import { QuickHitchCheck, DayOfWeek, CheckStatus } from '@/types';
import { useRouter } from 'expo-router';
import { CheckCircle2, X, Check, ChevronDown } from 'lucide-react-native';
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

export default function QuickHitchInspectionScreen() {
  const { user, company, submitQuickHitchInspection } = useApp();
  const { colors } = useTheme();
  const router = useRouter();
  const [operatorName, setOperatorName] = useState(user?.name || '');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('M');
  const [checks, setChecks] = useState<QuickHitchCheck[]>([]);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customMachine, setCustomMachine] = useState('');

  const plantEquipment = company?.equipment?.filter(e => e.type === 'plant') || [];

  const handleCheckChange = (itemId: string, status: boolean | CheckStatus) => {
    setChecks(prev => {
      const existing = prev.find(c => c.itemId === itemId && c.day === selectedDay);
      if (existing) {
        return prev.map(c =>
          c.itemId === itemId && c.day === selectedDay ? { ...c, status } : c
        );
      }
      return [...prev, { itemId, day: selectedDay, status }];
    });
  };

  const getCheckStatus = (itemId: string): boolean | CheckStatus | null => {
    const check = checks.find(c => c.itemId === itemId && c.day === selectedDay);
    return check?.status ?? null;
  };

  const handleSubmit = async () => {
    const finalExcavatorDetails = selectedEquipment === 'other' 
      ? customMachine.trim() 
      : selectedEquipment 
        ? plantEquipment.find(e => e.id === selectedEquipment)?.name || ''
        : '';

    if (!operatorName.trim() || !finalExcavatorDetails) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (checks.length === 0) {
      Alert.alert('Error', 'Please complete at least one check');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitQuickHitchInspection({
        companyId: company!.id,
        projectId: selectedProject || undefined,
        employeeId: user!.id,
        equipmentId: selectedEquipment !== 'other' ? selectedEquipment || undefined : undefined,
        operatorName: operatorName.trim(),
        quickHitchModel: '',
        excavatorDetails: finalExcavatorDetails,
        date: new Date().toISOString().split('T')[0],
        checks,
        remarks: remarks.trim(),
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

  const renderCheckControl = (item: typeof QUICK_HITCH_ITEMS[0]) => {
    const status = getCheckStatus(item.id);
    
    if (item.id === 'qh_safe' || item.id === 'qh_understood' || item.id === 'bc_area') {
      return (
        <View style={styles.yesNoButtons}>
          <TouchableOpacity
            style={[styles.yesNoButton, status === true && styles.yesButton]}
            onPress={() => handleCheckChange(item.id, true)}
          >
            <Check size={16} color={status === true ? '#ffffff' : '#10b981'} />
            <Text style={[styles.yesNoText, status === true && styles.yesNoTextActive]}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.yesNoButton, status === false && styles.noButton]}
            onPress={() => handleCheckChange(item.id, false)}
          >
            <X size={16} color={status === false ? '#ffffff' : '#ef4444'} />
            <Text style={[styles.yesNoText, status === false && styles.yesNoTextActive]}>No</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.checkButtons}>
        <TouchableOpacity
          style={[styles.checkButton, status === '✓' && styles.checkButtonActive]}
          onPress={() => handleCheckChange(item.id, '✓')}
        >
          <Text style={[styles.checkButtonText, status === '✓' && styles.checkButtonTextActive]}>
            ✓
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.checkButton, status === '✗' && styles.checkButtonDanger]}
          onPress={() => handleCheckChange(item.id, '✗')}
        >
          <Text style={[styles.checkButtonText, status === '✗' && styles.checkButtonTextActive]}>
            ✗
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const groupedItems = QUICK_HITCH_ITEMS.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof QUICK_HITCH_ITEMS>);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Quick Hitch Inspection</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Daily inspection record</Text>
        </View>

        <View style={[styles.formSection, { backgroundColor: colors.card }]}>
          {company && company.projects.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Project (Optional)</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={[styles.picker, { backgroundColor: colors.background, borderColor: colors.border }]}
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
            <Text style={[styles.label, { color: colors.text }]}>Operator Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter operator name"
              placeholderTextColor={colors.textSecondary}
              value={operatorName}
              onChangeText={setOperatorName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Machine/Excavator</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={[styles.picker, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => {
                  const options = [
                    ...plantEquipment.map(equipment => ({
                      text: `${equipment.name} (${equipment.make} ${equipment.model})`,
                      onPress: () => {
                        setSelectedEquipment(equipment.id);
                        setCustomMachine('');
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
                  Alert.alert('Select Machine', 'Choose from company equipment', options);
                }}
              >
                <Text style={selectedEquipment ? [styles.pickerText, { color: colors.text }] : [styles.pickerPlaceholder, { color: colors.textSecondary }]}>
                  {selectedEquipment === 'other'
                    ? 'Other (Manual Entry)'
                    : selectedEquipment
                    ? plantEquipment.find(e => e.id === selectedEquipment)?.name
                    : 'Select machine'}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {selectedEquipment === 'other' && (
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter machine details"
                placeholderTextColor={colors.textSecondary}
                value={customMachine}
                onChangeText={setCustomMachine}
              />
            )}
          </View>
        </View>

        <View style={styles.daySelector}>
          <Text style={[styles.daySelectorLabel, { color: colors.text }]}>Select Day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayButtons}>
            {DAYS_OF_WEEK.map(day => (
              <TouchableOpacity
                key={day}
                style={[styles.dayButton, selectedDay === day && styles.dayButtonActive]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayButtonText, selectedDay === day && styles.dayButtonTextActive]}>
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
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>✓ - Satisfactory</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBadge, { backgroundColor: '#ef4444' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>✗ - Requires Attention</Text>
            </View>
          </View>
        </View>

        {Object.entries(groupedItems).map(([category, items]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={[styles.categoryTitle, { color: colors.text }]}>{category}</Text>
            {items.map(item => (
              <View key={item.id} style={[styles.checkItem, { backgroundColor: colors.card }]}>
                <Text style={[styles.checkItemName, { color: colors.text }]}>{item.name}</Text>
                {renderCheckControl(item)}
              </View>
            ))}
          </View>
        ))}

        <View style={[styles.notesSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Remarks (Defects etc.)</Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            placeholder="Enter any remarks or defects..."
            placeholderTextColor={colors.textSecondary}
            value={remarks}
            onChangeText={setRemarks}
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
    backgroundColor: '#0d9488',
    borderColor: '#0d9488',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  dayButtonTextActive: {
    color: '#ffffff',
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
  checkItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkItemName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
  },
  checkButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkButtonDanger: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  checkButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  checkButtonTextActive: {
    color: '#ffffff',
  },
  yesNoButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  yesNoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  yesButton: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  noButton: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  yesNoText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  yesNoTextActive: {
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
    backgroundColor: '#0d9488',
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
