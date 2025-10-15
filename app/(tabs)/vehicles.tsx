import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'expo-router';
import { Car, LogOut, Building2, User } from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VehiclesScreen() {
  const { user, company, logout } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Vehicle Checks</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.companyCard}>
          <View style={styles.companyIcon}>
            {user?.role === 'company' ? (
              <Building2 size={24} color="#1e40af" />
            ) : (
              <User size={24} color="#0d9488" />
            )}
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyLabel}>
              {user?.role === 'company' ? 'Your Company' : 'Company'}
            </Text>
            <Text style={styles.companyName}>{company?.name}</Text>
            {user?.role === 'company' && (
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>Code: </Text>
                <Text style={styles.codeValue}>{company?.code}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Inspections</Text>
          <Text style={styles.sectionSubtitle}>Daily checks for vans, cars, and light vehicles</Text>
        </View>

        <View style={styles.checklistContainer}>
          <TouchableOpacity
            style={styles.checklistCard}
            onPress={() => router.push('/(tabs)/vehicle-inspection' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.checklistHeader}>
              <View style={[styles.checklistIcon, { backgroundColor: '#dbeafe' }]}>
                <Car size={28} color="#1e40af" />
              </View>
              <View style={styles.checklistBadge}>
                <Text style={styles.checklistBadgeText}>3.1</Text>
              </View>
            </View>
            <Text style={styles.checklistTitle}>Vehicle Daily Check</Text>
            <Text style={styles.checklistDescription}>
              Complete daily inspection for vans, cars, and light vehicles including lights, tyres, fluids, and safety equipment
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  companyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  companyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  companyInfo: {
    flex: 1,
  },
  companyLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1e293b',
    marginBottom: 4,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  codeValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1e40af',
    letterSpacing: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#64748b',
  },
  checklistContainer: {
    gap: 16,
  },
  checklistCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  checklistIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checklistBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  checklistBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1e40af',
  },
  checklistTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 8,
  },
  checklistDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});
