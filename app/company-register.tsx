import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { ArrowLeft, Building2, CheckCircle2, User } from 'lucide-react-native';
import { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CompanyRegisterScreen() {
  const { registerCompany } = useApp();
  const { colors } = useTheme();
  const router = useRouter();
  const [ownerName, setOwnerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registeredCode, setRegisteredCode] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!ownerName.trim() || !companyName.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
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
      const company = await registerCompany(ownerName.trim(), companyName.trim(), password.trim());
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={64} color="#10b981" />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Registration Complete!</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>Your company has been registered</Text>

          <View style={[styles.codeCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>Company Code</Text>
            <Text style={[styles.codeValue, { color: colors.primary }]}>{registeredCode}</Text>
            <Text style={[styles.codeDescription, { color: colors.textSecondary }]}>
              Share this code with your employees so they can join your company
            </Text>
          </View>

          <TouchableOpacity style={[styles.continueButton, { backgroundColor: colors.primary }]} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.card }]} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Building2 size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Company Registration</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Create your company account</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Your Name</Text>
              <View style={styles.inputWithIcon}>
                <User size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithPadding, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textSecondary}
                  value={ownerName}
                  onChangeText={setOwnerName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Company Name</Text>
              <View style={styles.inputWithIcon}>
                <Building2 size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithPadding, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter company name"
                  placeholderTextColor={colors.textSecondary}
                  value={companyName}
                  onChangeText={setCompanyName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter password (min 6 characters)"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Re-enter password"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={[styles.infoCard, { backgroundColor: colors.primary + '15', borderLeftColor: colors.primary }]}>
              <Text style={[styles.infoTitle, { color: colors.primary }]}>What happens next?</Text>
              <Text style={[styles.infoText, { color: colors.primary }]}>
                • You&apos;ll receive a unique company code{'\n'}
                • Share the code with your employees{'\n'}
                • Employees can join and submit inspections{'\n'}
                • Track all inspections and reports
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, { backgroundColor: colors.primary }, isLoading && styles.registerButtonDisabled]}
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
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
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
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
  infoCard: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
  registerButton: {
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
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    marginBottom: 40,
  },
  codeCard: {
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
    marginBottom: 12,
  },
  codeValue: {
    fontSize: 36,
    fontWeight: '700' as const,
    letterSpacing: 4,
    marginBottom: 16,
  },
  codeDescription: {
    fontSize: 14,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  continueButton: {
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
});
