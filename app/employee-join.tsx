import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, KeyRound, CheckCircle2, Camera } from 'lucide-react-native';
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

export default function EmployeeJoinScreen() {
  const { joinCompany } = useApp();
  const router = useRouter();
  const [employeeName, setEmployeeName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [joinedCompany, setJoinedCompany] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!employeeName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !companyCode.trim()) {
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
      const company = await joinCompany(companyCode.trim().toUpperCase(), employeeName.trim(), email.trim(), password.trim(), profilePicture || undefined);
      setJoinedCompany(company.name);
    } catch (error) {
      Alert.alert('Error', 'Invalid company code. Please check and try again.');
      console.error('Join error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  if (joinedCompany) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={64} color="#10b981" />
          </View>
          <Text style={styles.successTitle}>Welcome Aboard!</Text>
          <Text style={styles.successSubtitle}>You&apos;ve joined {joinedCompany}</Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              You can now start submitting daily inspection checklists. All reports will be sent to
              your company.
            </Text>
          </View>

          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Start Inspecting</Text>
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
              <Users size={32} color="#0d9488" />
            </View>
            <Text style={styles.title}>Join Company</Text>
            <Text style={styles.subtitle}>Enter your details to get started</Text>
          </View>

          <View style={styles.form}>
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#94a3b8"
                value={employeeName}
                onChangeText={setEmployeeName}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Code</Text>
              <View style={styles.inputWithIcon}>
                <KeyRound size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithPadding, styles.codeInput]}
                  placeholder="XXXXXX"
                  placeholderTextColor="#94a3b8"
                  value={companyCode}
                  onChangeText={(text) => setCompanyCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={6}
                  editable={!isLoading}
                />
              </View>
              <Text style={styles.helperText}>
                Ask your company administrator for the 6-character code
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureTitle}>As an employee, you can:</Text>
              <Text style={styles.featureText}>
                • Fill out daily inspection checklists{'\n'}
                • Submit reports to your company{'\n'}
                • Track your inspection history{'\n'}
                • Access checklists anytime, anywhere
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.joinButton, isLoading && styles.joinButtonDisabled]}
              onPress={handleJoin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.joinButtonText}>Join Company</Text>
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
    backgroundColor: '#ccfbf1',
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
  codeInput: {
    letterSpacing: 4,
    fontWeight: '600' as const,
  },
  helperText: {
    fontSize: 13,
    color: '#64748b',
  },
  featureCard: {
    backgroundColor: '#f0fdfa',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0d9488',
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0d9488',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#0d9488',
    lineHeight: 22,
  },
  joinButton: {
    backgroundColor: '#0d9488',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
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
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 32,
  },
  infoText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  continueButton: {
    backgroundColor: '#0d9488',
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
});
