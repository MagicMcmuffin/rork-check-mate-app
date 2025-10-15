import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { BUCKET_CHANGE_ITEMS, IMPLEMENT_TYPES } from '@/constants/inspections';
import { BucketChangeCheck, CheckStatus } from '@/types';
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

export default function BucketChangeInspectionScreen() {
  const { user, company, submitBucketChangeInspection } = useApp();
  const { colors } = useTheme();
  const router = useRouter();
  const [employeeName, setEmployeeName] = useState(user?.name || '');
  const [bucketType, setBucketType] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [customMachine, setCustomMachine] = useState('');
  const [witnessName, setWitnessName] = useState('');
  const [checks, setChecks] = useState<BucketChangeCheck[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customBucketType, setCustomBucketType] = useState('');

  const plantEquipment = company?.equipment?.filter(e => e.type === 'plant') || [];

  const handleCheckChange = (itemId: string, status: boolean | CheckStatus) => {
    setChecks(prev => {
      const existing = prev.find(c => c.itemId === itemId);
      if (existing) {
        return prev.map(c =>
          c.itemId === itemId ? { ...c, status } : c
        );
      }
      return [...prev, { itemId, status }];
    });
  };

  const getCheckStatus = (itemId: string): boolean | CheckStatus | null => {
    const check = checks.find(c => c.itemId === itemId);
    return check?.status ?? null;
  };

  const handleSubmit = async () => {
    const finalBucketType = bucketType === 'Other' ? customBucketType : bucketType;
    const finalEquipmentId = selectedEquipment === 'other' ? undefined : selectedEquipment || undefined;
    
    if (!employeeName.trim() || !finalBucketType.trim() || !witnessName.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (checks.length === 0) {
      Alert.alert('Error', 'Please complete at least one check');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitBucketChangeInspection({
        companyId: company!.id,
        projectId: selectedProject || undefined,
        employeeId: user!.id,
        equipmentId: finalEquipmentId,
        employeeName: employeeName.trim(),
        bucketType: finalBucketType.trim(),
        date: new Date().toISOString().split('T')[0],
        checks,
        witnessName: witnessName.trim(),
      });

      Alert.alert('Success', 'Bucket change inspection submitted successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit inspection. Please try again.');
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCheckControl = (item: typeof BUCKET_CHANGE_ITEMS[0]) => {
    const status = getCheckStatus(item.id);
    
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
  };

  const groupedItems = BUCKET_CHANGE_ITEMS.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof BUCKET_CHANGE_ITEMS>);

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Bucket/Implement Change</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Shake, Rattle & Roll Checklist</Text>
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
            <Text style={[styles.label, { color: colors.text }]}>Machine/Equipment (Optional)</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => {
                  const options = [
                    { text: 'None', onPress: () => {
                      setSelectedEquipment('');
                      setCustomMachine('');
                    }},
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
                    : 'Select machine (optional)'}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {selectedEquipment === 'other' && (
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter machine details"
                placeholderTextColor={colors.textSecondary}
                value={customMachine}
                onChangeText={setCustomMachine}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Operator Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter operator name"
              placeholderTextColor={colors.textSecondary}
              value={employeeName}
              onChangeText={setEmployeeName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Bucket/Implement Type</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => {
                  Alert.alert(
                    'Select Implement Type',
                    'Choose from the list',
                    [
                      ...IMPLEMENT_TYPES.map(type => ({
                        text: type,
                        onPress: () => {
                          setBucketType(type);
                          if (type !== 'Other') {
                            setCustomBucketType('');
                          }
                        },
                      })),
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
              >
                <Text style={bucketType ? [styles.pickerText, { color: colors.text }] : [styles.pickerPlaceholder, { color: colors.textSecondary }]}>
                  {bucketType || 'Select implement type'}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {bucketType === 'Other' && (
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter custom implement type"
                placeholderTextColor={colors.textSecondary}
                value={customBucketType}
                onChangeText={setCustomBucketType}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Witness Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter witness name"
              placeholderTextColor={colors.textSecondary}
              value={witnessName}
              onChangeText={setWitnessName}
            />
          </View>
        </View>

        <View style={[styles.legendSection, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
          <Text style={[styles.legendTitle, { color: colors.primary }]}>Checklist Instructions</Text>
          <Text style={[styles.legendText, { color: colors.primary }]}>
            Confirm all checks are completed before operating the equipment. Both operator and witness must verify all items.
          </Text>
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

        <View style={[styles.signatureSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.signatureTitle, { color: colors.text }]}>Signatures</Text>
          <Text style={[styles.signatureText, { color: colors.textSecondary }]}>
            By submitting this form, both the operator ({employeeName || 'Not entered'}) and witness ({witnessName || 'Not entered'}) confirm that all checks have been completed satisfactorily.
          </Text>
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
  legendSection: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#6366f1',
    marginBottom: 8,
  },
  legendText: {
    fontSize: 13,
    color: '#6366f1',
    lineHeight: 20,
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
  signatureSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 8,
  },
  signatureTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 4,
  },
  signatureText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#6366f1',
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
