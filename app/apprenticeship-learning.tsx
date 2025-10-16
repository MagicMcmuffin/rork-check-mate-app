import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter, Stack } from 'expo-router';
import { BookOpen, Camera, X } from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

export default function ApprenticeshipLearningScreen() {
  const { user, company, submitApprenticeshipEntry } = useApp();
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();

  const [learningDescription, setLearningDescription] = useState('');
  const [pictures, setPictures] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTakePicture = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPictures([...pictures, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
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
    if (!learningDescription.trim()) {
      Alert.alert('Required Field', 'Please describe what you learned today');
      return;
    }

    if (!user || !company) {
      Alert.alert('Error', 'User or company not found');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitApprenticeshipEntry({
        companyId: company.id,
        apprenticeId: user.id,
        apprenticeName: user.name,
        date: new Date().toISOString(),
        learningDescription: learningDescription.trim(),
        pictures: pictures.length > 0 ? pictures : undefined,
      });

      Alert.alert('Success', 'Learning entry submitted successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit entry');
      setIsSubmitting(false);
    }
  };

  const backgroundColor = isDarkMode ? '#0f172a' : '#f8fafc';

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Apprenticeship Learning',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.header, { backgroundColor: colors.card }]}>
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#1e3a5f' : '#fef3c7' }]}>
              <BookOpen size={32} color="#f59e0b" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Apprenticeship Learning</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Record what you learned today. This helps track your progress and development.
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              What did you learn today? <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Describe what you learned, skills practiced, or tasks completed..."
              placeholderTextColor={colors.textSecondary}
              value={learningDescription}
              onChangeText={setLearningDescription}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>

          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Pictures (Optional)</Text>
            <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
              Add photos of your work or learning environment
            </Text>

            <View style={styles.pictureButtons}>
              <TouchableOpacity
                style={[styles.pictureButton, { backgroundColor: isDarkMode ? '#1e3a5f' : '#dbeafe' }]}
                onPress={handleTakePicture}
              >
                <Camera size={20} color="#1e40af" />
                <Text style={[styles.pictureButtonText, { color: '#1e40af' }]}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pictureButton, { backgroundColor: isDarkMode ? '#1e3a5f' : '#dbeafe' }]}
                onPress={handlePickImage}
              >
                <BookOpen size={20} color="#1e40af" />
                <Text style={[styles.pictureButtonText, { color: '#1e40af' }]}>Choose from Library</Text>
              </TouchableOpacity>
            </View>

            {pictures.length > 0 && (
              <View style={styles.picturesGrid}>
                {pictures.map((picture, index) => (
                  <View key={index} style={styles.pictureContainer}>
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
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: '#10b981' },
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Learning Entry'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 14,
    marginBottom: 16,
  },
  required: {
    color: '#ef4444',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 160,
  },
  pictureButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pictureButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  pictureButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  picturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pictureContainer: {
    position: 'relative' as const,
    width: 100,
    height: 100,
  },
  picture: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removePictureButton: {
    position: 'absolute' as const,
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    padding: 18,
    borderRadius: 12,
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
