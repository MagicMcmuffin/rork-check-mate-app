import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { HAZARD_SEVERITY_OPTIONS } from '@/constants/inspections';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertTriangle, Camera, MapPin, FileText, ChevronDown, X, Building2, ArrowLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function PositiveInterventionScreen() {
  const { user, company, submitPositiveIntervention } = useApp();
  const { colors } = useTheme();
  const router = useRouter();
  const [hazardDescription, setHazardDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [actionTaken, setActionTaken] = useState('');
  const [location, setLocation] = useState('');
  const [site, setSite] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [pictures, setPictures] = useState<string[]>([]);
  const [showSeverityPicker, setShowSeverityPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTakePicture = async () => {
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
        setPictures([...pictures, `data:image/jpeg;base64,${result.assets[0].base64}`]);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handleSelectPicture = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPictures([...pictures, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const handleRemovePicture = (index: number) => {
    setPictures(pictures.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!hazardDescription.trim()) {
      Alert.alert('Error', 'Please describe the hazard');
      return;
    }

    if (!actionTaken.trim()) {
      Alert.alert('Error', 'Please describe the action taken');
      return;
    }

    if (!user || !company) {
      Alert.alert('Error', 'User or company not found');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitPositiveIntervention({
        companyId: company.id,
        employeeId: user.id,
        employeeName: user.name,
        projectId: selectedProject || undefined,
        date: new Date().toISOString(),
        hazardDescription: hazardDescription.trim(),
        severity,
        actionTaken: actionTaken.trim(),
        location: location.trim() || undefined,
        site: site.trim() || undefined,
        pictures: pictures.length > 0 ? pictures : undefined,
      });

      Alert.alert('Success', 'Positive intervention submitted successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error submitting positive intervention:', error);
      Alert.alert('Error', 'Failed to submit positive intervention');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#1a1a1a' }]}>
      <View style={styles.darkHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <AlertTriangle size={28} color="#10b981" />
          <Text style={styles.headerTitle}>Positive Intervention</Text>
        </View>
      </View>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          style={{ backgroundColor: colors.background }}
        >
        <View style={styles.introCard}>
          <Text style={[styles.introText, { color: colors.textSecondary }]}>
            Report a hazard you identified and rectified
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Hazard Description *</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="Describe the hazard you identified..."
            placeholderTextColor={colors.textSecondary}
            value={hazardDescription}
            onChangeText={setHazardDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Severity *</Text>
          <TouchableOpacity
            style={[styles.picker, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setShowSeverityPicker(!showSeverityPicker)}
          >
            <View style={styles.pickerContent}>
              <View
                style={[
                  styles.severityIndicator,
                  {
                    backgroundColor:
                      severity === 'high' ? '#ef4444' : severity === 'medium' ? '#f59e0b' : '#10b981',
                  },
                ]}
              />
              <Text style={[styles.pickerText, { color: colors.text }]}>
                {HAZARD_SEVERITY_OPTIONS.find((s) => s.value === severity)?.label}
              </Text>
            </View>
            <ChevronDown size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {showSeverityPicker && (
            <View style={[styles.pickerOptions, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {HAZARD_SEVERITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.pickerOption, severity === option.value && styles.pickerOptionActive]}
                  onPress={() => {
                    setSeverity(option.value);
                    setShowSeverityPicker(false);
                  }}
                >
                  <View style={[styles.severityIndicator, { backgroundColor: option.color }]} />
                  <View style={styles.pickerOptionContent}>
                    <Text style={[styles.pickerOptionLabel, { color: colors.text }]}>{option.label}</Text>
                    <Text style={[styles.pickerOptionDescription, { color: colors.textSecondary }]}>
                      {option.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Action Taken *</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="Describe what you did to rectify the hazard..."
            placeholderTextColor={colors.textSecondary}
            value={actionTaken}
            onChangeText={setActionTaken}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {company && company.projects.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.labelRow}>
              <Building2 size={18} color={colors.textSecondary} />
              <Text style={[styles.label, { color: colors.text }]}>Project (Optional)</Text>
            </View>
            <TouchableOpacity
              style={[styles.picker, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => {
                Alert.alert(
                  'Select Project',
                  'Choose a project for this intervention',
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
        )}

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.labelRow}>
            <Building2 size={18} color={colors.textSecondary} />
            <Text style={[styles.label, { color: colors.text }]}>Site (Optional)</Text>
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="e.g., Construction Site A, Main Office, etc."
            placeholderTextColor={colors.textSecondary}
            value={site}
            onChangeText={setSite}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.labelRow}>
            <MapPin size={18} color={colors.textSecondary} />
            <Text style={[styles.label, { color: colors.text }]}>Location (Optional)</Text>
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="e.g., Site entrance, Building A, etc."
            placeholderTextColor={colors.textSecondary}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.labelRow}>
            <Camera size={18} color={colors.textSecondary} />
            <Text style={[styles.label, { color: colors.text }]}>Photos (Optional)</Text>
          </View>

          <View style={styles.picturesContainer}>
            {pictures.map((picture, index) => (
              <View key={index} style={styles.pictureWrapper}>
                <Image source={{ uri: picture }} style={styles.picture} />
                <TouchableOpacity
                  style={styles.removePictureButton}
                  onPress={() => handleRemovePicture(index)}
                >
                  <X size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.pictureButtons}>
            <TouchableOpacity
              style={[styles.pictureButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={handleTakePicture}
            >
              <Camera size={20} color={colors.textSecondary} />
              <Text style={[styles.pictureButtonText, { color: colors.text }]}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pictureButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={handleSelectPicture}
            >
              <FileText size={20} color={colors.textSecondary} />
              <Text style={[styles.pictureButtonText, { color: colors.text }]}>Choose Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>{isSubmitting ? 'Submitting...' : 'Submit Intervention'}</Text>
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkHeader: {
    backgroundColor: '#1a1a1a',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700' as const,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  introCard: {
    marginBottom: 24,
  },
  introText: {
    fontSize: 15,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickerText: {
    fontSize: 15,
  },
  severityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pickerOptions: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  pickerOptionActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  pickerOptionContent: {
    flex: 1,
  },
  pickerOptionLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  pickerOptionDescription: {
    fontSize: 13,
  },
  pickerPlaceholder: {
    fontSize: 15,
  },
  picturesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  pictureWrapper: {
    position: 'relative' as const,
  },
  picture: {
    width: 100,
    height: 100,
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
  pictureButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  pictureButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  pictureButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
