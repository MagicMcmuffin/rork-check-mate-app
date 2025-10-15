import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'expo-router';
import { Building2, Users, LogIn } from 'lucide-react-native';
import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
  const { user, isLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/(tabs)/home');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/4w9q508wwrcszbw36y6h0' }}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Check Mate</Text>
          <Text style={styles.subtitle}>Machine Inspection Checklists</Text>
        </View>

        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/company-register')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
              <Building2 size={40} color="#1e40af" />
            </View>
            <Text style={styles.cardTitle}>Company</Text>
            <Text style={styles.cardDescription}>
              Register your company and manage inspection reports
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Paid</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/employee-join')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#ccfbf1' }]}>
              <Users size={40} color="#0d9488" />
            </View>
            <Text style={styles.cardTitle}>Employee</Text>
            <Text style={styles.cardDescription}>
              Join your company and submit daily inspections
            </Text>
            <View style={[styles.badge, { backgroundColor: '#d1fae5' }]}>
              <Text style={[styles.badgeText, { color: '#065f46' }]}>Free</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Already have an account?</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.loginCard}
          onPress={() => router.push('/login')}
          activeOpacity={0.7}
        >
          <LogIn size={24} color="#8b5cf6" />
          <Text style={styles.loginText}>Sign In</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 42,
    fontWeight: '700' as const,
    color: '#f1f5f9',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '500' as const,
  },
  cardContainer: {
    gap: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 3,
    position: 'relative' as const,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#f1f5f9',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  badge: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#1e40af',
  },
  divider: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500' as const,
  },
  loginCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  loginText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#8b5cf6',
  },
});
