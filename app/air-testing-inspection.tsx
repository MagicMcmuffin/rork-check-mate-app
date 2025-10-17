import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { PIPE_SIZE_OPTIONS } from '@/constants/inspections';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Send, Image as ImageIcon, Camera, X, FileText } from 'lucide-react-native';
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
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function AirTestingInspectionScreen() {
  const { user, company, submitAirTestingInspection } = useApp();
  const { colors } = useTheme();
  const router = useRouter();

  const [selectedProject, setSelectedProject] = useState<string>('');
  const [section, setSection] = useState('');
  const [pipeRun, setPipeRun] = useState('');
  const [pipeJoint, setPipeJoint] = useState('');
  const [pipeSize, setPipeSize] = useState('');
  const [customPipeSize, setCustomPipeSize] = useState('');
  const [testPressure, setTestPressure] = useState('');
  const [testDuration, setTestDuration] = useState('');
  const [testResult, setTestResult] = useState<'pass' | 'fail' | undefined>();
  const [startImage, setStartImage] = useState<string | undefined>();
  const [finishImage, setFinishImage] = useState<string | undefined>();
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickImage = async (type: 'start' | 'finish' | 'additional') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      
      if (type === 'start') {
        setStartImage(imageUri);
      } else if (type === 'finish') {
        setFinishImage(imageUri);
      } else {
        setAdditionalImages(prev => [...prev, imageUri]);
      }
    }
  };

  const handleTakePhoto = async (type: 'start' | 'finish' | 'additional') => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      
      if (type === 'start') {
        setStartImage(imageUri);
      } else if (type === 'finish') {
        setFinishImage(imageUri);
      } else {
        setAdditionalImages(prev => [...prev, imageUri]);
      }
    }
  };

  const handleRemoveImage = (type: 'start' | 'finish' | 'additional', index?: number) => {
    if (type === 'start') {
      setStartImage(undefined);
    } else if (type === 'finish') {
      setFinishImage(undefined);
    } else if (type === 'additional' && index !== undefined) {
      setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!section.trim()) {
      Alert.alert('Error', 'Please enter section');
      return;
    }

    if (!pipeRun.trim()) {
      Alert.alert('Error', 'Please enter pipe run');
      return;
    }

    if (!pipeJoint.trim()) {
      Alert.alert('Error', 'Please enter pipe joint');
      return;
    }

    const finalPipeSize = pipeSize === 'Other' ? customPipeSize.trim() : pipeSize;
    if (!finalPipeSize) {
      Alert.alert('Error', 'Please select or enter pipe size');
      return;
    }

    if (!startImage) {
      Alert.alert('Error', 'Please add a start image to prove the test');
      return;
    }

    if (!finishImage) {
      Alert.alert('Error', 'Please add a finish image to prove the test');
      return;
    }

    if (!user || !company) {
      Alert.alert('Error', 'User or company information not found');
      return;
    }

    Alert.alert(
      'Submit Air Testing Record',
      'Submit this air testing inspection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await submitAirTestingInspection({
                companyId: company.id,
                projectId: selectedProject || undefined,
                employeeId: user.id,
                employeeName: user.name,
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                section: section.trim(),
                pipeRun: pipeRun.trim(),
                pipeJoint: pipeJoint.trim(),
                pipeSize: finalPipeSize,
                testPressure: testPressure.trim() || undefined,
                testDuration: testDuration.trim() || undefined,
                testResult,
                startImage,
                finishImage,
                additionalImages: additionalImages.length > 0 ? additionalImages : undefined,
                notes: notes.trim() || undefined,
              });

              Alert.alert('Success', 'Air testing inspection submitted successfully', [
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

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Air Testing',
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
              <Text style={[styles.title, { color: colors.text }]}>Air Testing Record</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Record pipework air test details and evidence
              </Text>
            </View>

            <View style={[styles.formSection, { backgroundColor: colors.card }]}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Project *</Text>
                <TouchableOpacity
                  style={[styles.picker, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => {
                    const options = [
                      ...(company?.projects || []).map(proj => ({
                        text: `${proj.name} - ${proj.projectNumber}`,
                        onPress: () => setSelectedProject(proj.id),
                      })),
                      { text: 'Cancel', style: 'cancel' as const },
                    ];
                    Alert.alert('Select Project', 'Choose a project for this inspection', options);
                  }}
                >
                  <Text style={selectedProject ? [styles.pickerText, { color: colors.text }] : [styles.pickerPlaceholder, { color: colors.textSecondary }]}>
                    {selectedProject
                      ? company?.projects?.find(p => p.id === selectedProject)?.name
                      : 'Select project'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Section *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. North Wing, Block A"
                  placeholderTextColor={colors.textSecondary}
                  value={section}
                  onChangeText={setSection}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Pipe Run *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. PR-01, Main Supply Line"
                  placeholderTextColor={colors.textSecondary}
                  value={pipeRun}
                  onChangeText={setPipeRun}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Pipe Joint *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. J-42, Joint 15"
                  placeholderTextColor={colors.textSecondary}
                  value={pipeJoint}
                  onChangeText={setPipeJoint}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Pipe Size *</Text>
                <TouchableOpacity
                  style={[styles.picker, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => {
                    const options = [
                      ...PIPE_SIZE_OPTIONS.map(size => ({
                        text: size,
                        onPress: () => {
                          setPipeSize(size);
                          if (size !== 'Other') {
                            setCustomPipeSize('');
                          }
                        },
                      })),
                      { text: 'Cancel', style: 'cancel' as const },
                    ];
                    Alert.alert('Select Pipe Size', 'Choose the pipe size', options);
                  }}
                >
                  <Text style={pipeSize ? [styles.pickerText, { color: colors.text }] : [styles.pickerPlaceholder, { color: colors.textSecondary }]}>
                    {pipeSize || 'Select pipe size'}
                  </Text>
                </TouchableOpacity>
                {pipeSize === 'Other' && (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, marginTop: 8 }]}
                    placeholder="Enter custom pipe size"
                    placeholderTextColor={colors.textSecondary}
                    value={customPipeSize}
                    onChangeText={setCustomPipeSize}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Test Pressure (bar)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. 1.5"
                  placeholderTextColor={colors.textSecondary}
                  value={testPressure}
                  onChangeText={setTestPressure}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Test Duration (minutes)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. 30"
                  placeholderTextColor={colors.textSecondary}
                  value={testDuration}
                  onChangeText={setTestDuration}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Test Result</Text>
                <View style={styles.resultButtons}>
                  <TouchableOpacity
                    style={[
                      styles.resultButton,
                      { borderColor: colors.border },
                      testResult === 'pass' && styles.resultButtonPass,
                    ]}
                    onPress={() => setTestResult('pass')}
                  >
                    <Text style={[
                      styles.resultButtonText,
                      { color: colors.text },
                      testResult === 'pass' && styles.resultButtonTextActive,
                    ]}>
                      Pass
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.resultButton,
                      { borderColor: colors.border },
                      testResult === 'fail' && styles.resultButtonFail,
                    ]}
                    onPress={() => setTestResult('fail')}
                  >
                    <Text style={[
                      styles.resultButtonText,
                      { color: colors.text },
                      testResult === 'fail' && styles.resultButtonTextActive,
                    ]}>
                      Fail
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={[styles.imageSection, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Evidence *</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Photos are required to prove the test was conducted
              </Text>

              <View style={styles.imageGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Start Image *</Text>
                {startImage ? (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: startImage }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveImage('start')}
                    >
                      <X size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imageButtons}>
                    <TouchableOpacity
                      style={[styles.imageButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => handleTakePhoto('start')}
                    >
                      <Camera size={20} color={colors.primary} />
                      <Text style={[styles.imageButtonText, { color: colors.text }]}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.imageButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => handlePickImage('start')}
                    >
                      <ImageIcon size={20} color={colors.primary} />
                      <Text style={[styles.imageButtonText, { color: colors.text }]}>Choose Photo</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.imageGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Finish Image *</Text>
                {finishImage ? (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: finishImage }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveImage('finish')}
                    >
                      <X size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imageButtons}>
                    <TouchableOpacity
                      style={[styles.imageButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => handleTakePhoto('finish')}
                    >
                      <Camera size={20} color={colors.primary} />
                      <Text style={[styles.imageButtonText, { color: colors.text }]}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.imageButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => handlePickImage('finish')}
                    >
                      <ImageIcon size={20} color={colors.primary} />
                      <Text style={[styles.imageButtonText, { color: colors.text }]}>Choose Photo</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.imageGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Additional Images (Optional)</Text>
                {additionalImages.length > 0 && (
                  <View style={styles.additionalImagesGrid}>
                    {additionalImages.map((uri, index) => (
                      <View key={index} style={styles.imagePreview}>
                        <Image source={{ uri }} style={styles.previewImage} />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => handleRemoveImage('additional', index)}
                        >
                          <X size={16} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.imageButtons}>
                  <TouchableOpacity
                    style={[styles.imageButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => handleTakePhoto('additional')}
                  >
                    <Camera size={20} color={colors.primary} />
                    <Text style={[styles.imageButtonText, { color: colors.text }]}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.imageButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => handlePickImage('additional')}
                  >
                    <ImageIcon size={20} color={colors.primary} />
                    <Text style={[styles.imageButtonText, { color: colors.text }]}>Choose Photo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={[styles.notesSection, { backgroundColor: colors.card }]}>
              <View style={styles.notesHeader}>
                <FileText size={18} color={colors.primary} />
                <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
              </View>
              <TextInput
                style={[styles.notesInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter any additional observations or comments..."
                placeholderTextColor={colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }, isSubmitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Send size={20} color="#ffffff" />
                  <Text style={styles.submitButtonText}>Submit Air Test</Text>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  formSection: {
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
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  pickerText: {
    fontSize: 15,
  },
  pickerPlaceholder: {
    fontSize: 15,
  },
  resultButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  resultButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  resultButtonPass: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  resultButtonFail: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  resultButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  resultButtonTextActive: {
    color: '#ffffff',
  },
  imageSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: -8,
  },
  imageGroup: {
    gap: 8,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  imagePreview: {
    position: 'relative' as const,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: 6,
  },
  additionalImagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  notesSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 8,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notesInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    minHeight: 100,
  },
  submitButton: {
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
});
