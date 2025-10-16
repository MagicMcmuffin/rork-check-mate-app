import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'expo-router';
import { ArrowLeft, Building2, Mail, CheckCircle2, Camera } from 'lucide-react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CompanyRegisterScreen() {
  const { registerCompany } = useApp();
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registeredCode, setRegisteredCode] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!companyName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const company = await registerCompany(companyName.trim(), email.trim(), password.trim(), profilePicture || undefined, companyLogo || undefined);
      setRegisteredCode(company.code);
    } catch (error) {
      Alert.alert('Error', 'Failed to register company. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  if (registeredCode) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={64} color="#10b981" />
          </View>
          <Text style={styles.successTitle}>Registration Complete!</Text>
          <Text style={styles.successSubtitle}>Your company has been registered</Text>

          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Company Code</Text>
            <Text style={styles.codeValue}>{registeredCode}</Text>
            <Text style={styles.codeDescription}>
              Share this code with your employees so they can join your company
            </Text>
          </View>

          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Building2 size={32} color="#1e40af" />
            </View>
            <Text style={styles.title}>Company Registration</Text>
            <Text style={styles.subtitle}>Create your company account</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.imagesRow}>
              <View style={styles.imageColumn}>
                <Text style={styles.imageLabel}>Profile Photo</Text>
                <TouchableOpacity style={styles.profilePictureContainer} onPress={async () => {
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.5,
                    base64: true,
                  });

                  if (!result.canceled && result.assets[0].base64) {
                    setProfilePicture(`data:image/jpeg;base64,${result.assets[0].base64}`);
                  }
                }}>
                  {profilePicture ? (
                    <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
                  ) : (
                    <View style={styles.profilePicturePlaceholder}>
                      <Camera size={32} color="#94a3b8" />
                      <Text style={styles.profilePictureText}>Add Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.imageColumn}>
                <Text style={styles.imageLabel}>Company Logo (Optional)</Text>
                <TouchableOpacity style={styles.profilePictureContainer} onPress={async () => {
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.5,
                    base64: true,
                  });

                  if (!result.canceled && result.assets[0].base64) {
                    setCompanyLogo(`data:image/jpeg;base64,${result.assets[0].base64}`);
                  }
                }}>
                  {companyLogo ? (
                    <Image source={{ uri: companyLogo }} style={styles.profilePicture} />
                  ) : (
                    <View style={styles.profilePicturePlaceholder}>
                      <Building2 size={32} color="#94a3b8" />
                      <Text style={styles.profilePictureText}>Add Logo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter company name"
                placeholderTextColor="#94a3b8"
                value={companyName}
                onChangeText={setCompanyName}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWithIcon}>
                <Mail size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithPadding]}
                  placeholder="company@example.com"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
              <Text style={styles.helperText}>
                Inspection reports will be sent to this email
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password (min 6 characters)"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter password"
                placeholderTextColor="#94a3b8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>What happens next?</Text>
              <Text style={styles.infoText}>
                • You&apos;ll receive a unique company code{'\n'}
                • Share the code with your employees{'\n'}
                • Employees can join and submit inspections{'\n'}
                • Reports are sent to your email
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.registerButtonText}>Register Company</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1e293b',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputWithIcon: {
    position: 'relative' as const,
  },
  inputIcon: {
    position: 'absolute' as const,
    left: 16,
    top: 18,
    zIndex: 1,
  },
  inputWithPadding: {
    paddingLeft: 48,
  },
  helperText: {
    fontSize: 13,
    color: '#64748b',
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1e40af',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 22,
  },
  registerButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 40,
  },
  codeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 32,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 12,
  },
  codeValue: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#1e40af',
    letterSpacing: 4,
    marginBottom: 16,
  },
  codeDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 18,
    width: '100%',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  profilePictureContainer: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed' as const,
  },
  profilePictureText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
  },
  imagesRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  imageColumn: {
    flex: 1,
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'center' as const,
  },
});
