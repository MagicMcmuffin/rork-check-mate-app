import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { AlertCircle, Camera, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

export default function EquipmentReportScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const appContext = useApp();
  const { user, company, submitEquipmentReport } = appContext || {};
  
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [issueTitle, setIssueTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTakePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleChoosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSubmit = async () => {
    if (!user || !company) {
      Alert.alert('Error', 'User or company not found');
      return;
    }

    if (!submitEquipmentReport) {
      Alert.alert('Error', 'Unable to submit report');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitEquipmentReport({
        companyId: company.id,
        equipmentName: equipmentName.trim() || undefined,
        equipmentId: equipmentId.trim() || undefined,
        issueTitle: issueTitle.trim() || undefined,
        description: description.trim() || undefined,
        photo,
        reportedBy: user.name,
        reportedAt: new Date().toISOString(),
      });

      Alert.alert('Success', 'Equipment report submitted successfully', [
        {
          text: 'OK',
          onPress: () => router.push('/(tabs)/reports'),
        },
      ]);
    } catch (error) {
      console.error('Error submitting equipment report:', error);
      Alert.alert('Error', 'Failed to submit equipment report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Report Equipment Issue</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <AlertCircle size={20} color="#3b82f6" />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Report any equipment issues here. All fields are optional. Fill in as much detail as you can.
          </Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Equipment Details</Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Equipment Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={equipmentName}
              onChangeText={setEquipmentName}
              placeholder="Enter equipment name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Equipment ID</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={equipmentId}
              onChangeText={setEquipmentId}
              placeholder="Enter equipment ID or number"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Issue</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={issueTitle}
              onChangeText={setIssueTitle}
              placeholder="Brief description of the issue"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.textarea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Detailed description of the issue"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Photo (Optional)</Text>
            {photo ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={[styles.removePhotoButton, { backgroundColor: colors.background }]}
                  onPress={() => setPhoto(undefined)}
                >
                  <X size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoButtons}>
                <TouchableOpacity
                  style={[styles.photoButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={handleTakePhoto}
                >
                  <Camera size={20} color={colors.primary} />
                  <Text style={[styles.photoButtonText, { color: colors.text }]}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.photoButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={handleChoosePhoto}
                >
                  <Camera size={20} color={colors.primary} />
                  <Text style={[styles.photoButtonText, { color: colors.text }]}>Choose Photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.reportedByCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.reportedByLabel, { color: colors.textSecondary }]}>Reported by:</Text>
          <Text style={[styles.reportedByName, { color: colors.text }]}>{user?.name}</Text>
          <Text style={[styles.reportedByDate, { color: colors.textSecondary }]}>
            {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  formCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  photoContainer: {
    position: 'relative' as const,
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  reportedByCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reportedByLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  reportedByName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  reportedByDate: {
    fontSize: 13,
  },
  submitButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
