import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'expo-router';
import { ArrowLeft, LogIn, Mail, AlertCircle } from 'lucide-react-native';
import { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const { login } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userCount, setUserCount] = useState<number>(0);
  const [debugEmails, setDebugEmails] = useState<string[]>([]);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const usersData = await AsyncStorage.getItem('@checkmate_users');
      if (usersData) {
        const users = JSON.parse(usersData);
        setUserCount(users.length);
        setDebugEmails(users.map((u: any) => u.email));
        console.log('📊 Users found:', users.length);
        console.log('📧 Emails:', users.map((u: any) => u.email));
      } else {
        setUserCount(0);
        setDebugEmails([]);
        console.log('⚠️ No users found in storage');
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will clear all data including users, companies, and inspections. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'All data has been cleared. You can now register a new account.');
              setUserCount(0);
              setDebugEmails([]);
            } catch (error) {
              Alert.alert('Error', 'Failed to reset data');
              console.error('Reset error:', error);
            }
          },
        },
      ]
    );
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password.trim());
      router.replace('/(tabs)');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid email or password. Please try again.';
      Alert.alert('Login Failed', errorMessage);
      console.error('Login error:', error);
      await loadUserInfo();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#f1f5f9" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LogIn size={32} color="#8b5cf6" />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {userCount === 0 && (
            <View style={styles.warningCard}>
              <AlertCircle size={20} color="#f59e0b" />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>No Users Found</Text>
                <Text style={styles.warningText}>
                  There are no registered users. Please register a company or join as an employee first.
                </Text>
              </View>
            </View>
          )}

          {userCount > 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>Users in database: {userCount}</Text>
              {debugEmails.length > 0 && (
                <Text style={styles.infoSubtext}>Registered emails: {debugEmails.join(', ')}</Text>
              )}
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWithIcon}>
                <Mail size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithPadding]}
                  placeholder="your.email@example.com"
                  placeholderTextColor="#64748b"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity onPress={() => Alert.alert('Forgot Password', 'Please contact your company administrator to reset your password.')}>
                  <Text style={styles.forgotPassword}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetData}
          >
            <Text style={styles.resetButtonText}>Reset All Data</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
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
    backgroundColor: '#312e81',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#f1f5f9',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#f1f5f9',
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#8b5cf6',
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#334155',
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
  loginButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  warningCard: {
    backgroundColor: '#451a03',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fbbf24',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#fde68a',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  resetButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600' as const,
  },
});
