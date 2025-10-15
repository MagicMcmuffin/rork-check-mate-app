import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack, router } from 'expo-router';
import { Shield, User, Wrench, Briefcase, GraduationCap, Crown, ChevronRight } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { UserRole } from '@/types';
import { useState } from 'react';

type RolePermissions = {
  canViewAllReports: boolean;
  canManageProjects: boolean;
  canManageEquipment: boolean;
  canDeleteIssues: boolean;
  canChangeRoles: boolean;
  canViewHistory: boolean;
  canSubmitInspections: boolean;
  canViewOwnHistory: boolean;
};

const DEFAULT_PERMISSIONS: Record<Exclude<UserRole, 'company'>, RolePermissions> = {
  administrator: {
    canViewAllReports: true,
    canManageProjects: true,
    canManageEquipment: true,
    canDeleteIssues: true,
    canChangeRoles: true,
    canViewHistory: true,
    canSubmitInspections: true,
    canViewOwnHistory: true,
  },
  management: {
    canViewAllReports: true,
    canManageProjects: true,
    canManageEquipment: false,
    canDeleteIssues: true,
    canChangeRoles: false,
    canViewHistory: true,
    canSubmitInspections: true,
    canViewOwnHistory: true,
  },
  mechanic: {
    canViewAllReports: true,
    canManageProjects: false,
    canManageEquipment: false,
    canDeleteIssues: false,
    canChangeRoles: false,
    canViewHistory: true,
    canSubmitInspections: true,
    canViewOwnHistory: true,
  },
  apprentice: {
    canViewAllReports: true,
    canManageProjects: false,
    canManageEquipment: false,
    canDeleteIssues: false,
    canChangeRoles: false,
    canViewHistory: true,
    canSubmitInspections: true,
    canViewOwnHistory: true,
  },
  employee: {
    canViewAllReports: false,
    canManageProjects: false,
    canManageEquipment: false,
    canDeleteIssues: false,
    canChangeRoles: false,
    canViewHistory: false,
    canSubmitInspections: true,
    canViewOwnHistory: true,
  },
};

export default function SettingsRolesScreen() {
  const { user } = useApp();
  const { colors, isDarkMode } = useTheme();
  const [permissions] = useState<Record<Exclude<UserRole, 'company'>, RolePermissions>>(DEFAULT_PERMISSIONS);

  const isOwner = user?.role === 'company';

  if (!isOwner) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Roles & Permissions',
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <View style={styles.centeredContainer}>
          <View style={[styles.errorIcon, { backgroundColor: isDarkMode ? '#5f1e1e' : '#fee2e2' }]}>
            <Shield size={48} color="#dc2626" />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Access Denied</Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
            Only company owners can access roles settings
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: isDarkMode ? '#1e3a5f' : '#eff6ff' }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getRoleIcon = (role: Exclude<UserRole, 'company'>) => {
    switch (role) {
      case 'administrator': return <Shield size={24} color="#1e40af" />;
      case 'management': return <Briefcase size={24} color="#7c3aed" />;
      case 'mechanic': return <Wrench size={24} color="#ea580c" />;
      case 'apprentice': return <GraduationCap size={24} color="#0891b2" />;
      case 'employee': return <User size={24} color="#64748b" />;
    }
  };

  const getRoleColor = (role: Exclude<UserRole, 'company'>) => {
    switch (role) {
      case 'administrator': return { bg: isDarkMode ? '#1e3a5f' : '#dbeafe', text: '#1e40af' };
      case 'management': return { bg: isDarkMode ? '#3b2a5f' : '#ede9fe', text: '#7c3aed' };
      case 'mechanic': return { bg: isDarkMode ? '#5f3a1e' : '#fed7aa', text: '#ea580c' };
      case 'apprentice': return { bg: isDarkMode ? '#164e63' : '#cffafe', text: '#0891b2' };
      case 'employee': return { bg: isDarkMode ? '#334155' : '#f1f5f9', text: '#64748b' };
    }
  };

  const getRoleDisplayName = (role: Exclude<UserRole, 'company'>): string => {
    switch (role) {
      case 'administrator': return 'Administrator';
      case 'management': return 'Management';
      case 'mechanic': return 'Mechanic';
      case 'apprentice': return 'Apprentice';
      case 'employee': return 'Employee';
    }
  };

  const getPermissionLabel = (key: keyof RolePermissions): string => {
    switch (key) {
      case 'canViewAllReports': return 'View All Reports';
      case 'canManageProjects': return 'Manage Projects';
      case 'canManageEquipment': return 'Manage Equipment';
      case 'canDeleteIssues': return 'Delete Issues';
      case 'canChangeRoles': return 'Change User Roles';
      case 'canViewHistory': return 'View All History';
      case 'canSubmitInspections': return 'Submit Inspections';
      case 'canViewOwnHistory': return 'View Own History';
    }
  };

  const roles: Exclude<UserRole, 'company'>[] = ['administrator', 'management', 'mechanic', 'apprentice', 'employee'];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Roles & Permissions',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: isDarkMode ? '#5f3a1e' : '#fef3c7' }]}>
            <Crown size={28} color="#f59e0b" />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Roles & Permissions</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Manage access levels for different user roles
          </Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: isDarkMode ? '#1e3a5f' : '#eff6ff', borderColor: colors.border }]}>
          <Shield size={20} color="#1e40af" />
          <Text style={[styles.infoText, { color: colors.text }]}>
            These are the default permissions for each role. You can customize them by contacting support.
          </Text>
        </View>

        {roles.map((role) => {
          const roleColor = getRoleColor(role);
          const rolePerms = permissions[role];
          const permissionEntries = Object.entries(rolePerms) as [keyof RolePermissions, boolean][];
          const enabledCount = permissionEntries.filter(([_, value]) => value).length;

          return (
            <View key={role} style={[styles.roleCard, { backgroundColor: colors.card }]}>
              <View style={styles.roleHeader}>
                <View style={[styles.roleIconContainer, { backgroundColor: roleColor.bg }]}>
                  {getRoleIcon(role)}
                </View>
                <View style={styles.roleInfo}>
                  <Text style={[styles.roleTitle, { color: colors.text }]}>{getRoleDisplayName(role)}</Text>
                  <Text style={[styles.roleSubtitle, { color: colors.textSecondary }]}>
                    {enabledCount} of {permissionEntries.length} permissions enabled
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.permissionsList}>
                {permissionEntries.map(([key, value]) => (
                  <View key={key} style={styles.permissionRow}>
                    <View style={[styles.permissionIndicator, { backgroundColor: value ? '#22c55e' : colors.border }]} />
                    <Text style={[styles.permissionText, { color: value ? colors.text : colors.textSecondary }]}>
                      {getPermissionLabel(key)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        <View style={[styles.footer, { backgroundColor: colors.card }]}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Need to customize permissions? Contact our support team for advanced role configuration.
          </Text>
        </View>
      </ScrollView>
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
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center' as const,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  roleCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  roleSubtitle: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  permissionsList: {
    gap: 12,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permissionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  permissionText: {
    fontSize: 14,
    flex: 1,
  },
  footer: {
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center' as const,
    lineHeight: 18,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1e40af',
  },
});
