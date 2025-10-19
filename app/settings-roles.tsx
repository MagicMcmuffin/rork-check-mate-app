import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack, router } from 'expo-router';
import { Shield, User, Wrench, Briefcase, GraduationCap, Crown, ChevronRight, Eye, Users } from 'lucide-react-native';
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
    canManageEquipment: true,
    canDeleteIssues: true,
    canChangeRoles: false,
    canViewHistory: true,
    canSubmitInspections: true,
    canViewOwnHistory: true,
  },
  supervisor: {
    canViewAllReports: true,
    canManageProjects: false,
    canManageEquipment: false,
    canDeleteIssues: true,
    canChangeRoles: false,
    canViewHistory: true,
    canSubmitInspections: true,
    canViewOwnHistory: true,
  },
  mechanic: {
    canViewAllReports: false,
    canManageProjects: false,
    canManageEquipment: true,
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
  apprentice: {
    canViewAllReports: false,
    canManageProjects: false,
    canManageEquipment: false,
    canDeleteIssues: false,
    canChangeRoles: false,
    canViewHistory: false,
    canSubmitInspections: true,
    canViewOwnHistory: true,
  },
  viewer: {
    canViewAllReports: true,
    canManageProjects: false,
    canManageEquipment: false,
    canDeleteIssues: false,
    canChangeRoles: false,
    canViewHistory: true,
    canSubmitInspections: false,
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
      case 'administrator': return <Shield size={26} color="#1e40af" />;
      case 'management': return <Briefcase size={26} color="#7c3aed" />;
      case 'supervisor': return <Users size={26} color="#16a34a" />;
      case 'mechanic': return <Wrench size={26} color="#ea580c" />;
      case 'employee': return <User size={26} color="#0891b2" />;
      case 'apprentice': return <GraduationCap size={26} color="#0ea5e9" />;
      case 'viewer': return <Eye size={26} color="#64748b" />;
    }
  };

  const getRoleColor = (role: Exclude<UserRole, 'company'>) => {
    switch (role) {
      case 'administrator': return { bg: isDarkMode ? '#1e3a5f' : '#dbeafe', text: '#1e40af', border: '#1e40af20' };
      case 'management': return { bg: isDarkMode ? '#3b2a5f' : '#ede9fe', text: '#7c3aed', border: '#7c3aed20' };
      case 'supervisor': return { bg: isDarkMode ? '#14532d' : '#dcfce7', text: '#16a34a', border: '#16a34a20' };
      case 'mechanic': return { bg: isDarkMode ? '#5f3a1e' : '#fed7aa', text: '#ea580c', border: '#ea580c20' };
      case 'employee': return { bg: isDarkMode ? '#164e63' : '#cffafe', text: '#0891b2', border: '#0891b220' };
      case 'apprentice': return { bg: isDarkMode ? '#075985' : '#e0f2fe', text: '#0ea5e9', border: '#0ea5e920' };
      case 'viewer': return { bg: isDarkMode ? '#334155' : '#f1f5f9', text: '#64748b', border: '#64748b20' };
    }
  };

  const getRoleDisplayName = (role: Exclude<UserRole, 'company'>): string => {
    switch (role) {
      case 'administrator': return 'Administrator';
      case 'management': return 'Management';
      case 'supervisor': return 'Site Supervisor';
      case 'mechanic': return 'Mechanic';
      case 'employee': return 'Employee';
      case 'apprentice': return 'Apprentice';
      case 'viewer': return 'Viewer / Auditor';
    }
  };

  const getRoleDescription = (role: Exclude<UserRole, 'company'>): string => {
    switch (role) {
      case 'administrator': return 'Full system access';
      case 'management': return 'Manage projects, equipment, and reports';
      case 'supervisor': return 'Manage daily site inspections';
      case 'mechanic': return 'View and manage assigned equipment';
      case 'employee': return 'Default role - submit inspections';
      case 'apprentice': return 'Limited access for training';
      case 'viewer': return 'Read-only access';
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

  const roles: Exclude<UserRole, 'company'>[] = ['administrator', 'management', 'supervisor', 'mechanic', 'employee', 'apprentice', 'viewer'];

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
          const isDefaultRole = role === 'employee';

          return (
            <View key={role} style={[styles.roleCard, { backgroundColor: colors.card }]}>
              <View style={styles.roleHeader}>
                <View style={[
                  styles.roleIconContainer, 
                  { 
                    backgroundColor: roleColor.bg,
                    shadowColor: roleColor.text,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 6,
                    elevation: 4,
                  }
                ]}>
                  {getRoleIcon(role)}
                </View>
                <View style={styles.roleInfo}>
                  <Text style={[styles.roleTitle, { color: colors.text }]}>{getRoleDisplayName(role)}</Text>
                  <Text style={[styles.roleDescription, { color: colors.textSecondary }]}>
                    {getRoleDescription(role)}
                  </Text>
                  <Text style={[styles.roleSubtitle, { color: roleColor.text }]}>
                    {enabledCount} of {permissionEntries.length} permissions enabled
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </View>

              {isDefaultRole && (
                <View style={[styles.defaultBadge, { backgroundColor: isDarkMode ? '#0891b215' : '#cffafe' }]}>
                  <Text style={[styles.defaultBadgeText, { color: roleColor.text }]}>
                    ✓ Default role automatically assigned to new users
                  </Text>
                </View>
              )}

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.permissionsList}>
                {permissionEntries.map(([key, value]) => (
                  <View key={key} style={styles.permissionRow}>
                    <View style={[
                      styles.permissionIndicator, 
                      { 
                        backgroundColor: value ? '#22c55e' : isDarkMode ? '#374151' : '#e5e7eb',
                        shadowColor: value ? '#22c55e' : 'transparent',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.3,
                        shadowRadius: 2,
                      }
                    ]} />
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
            Need to customize permissions? Contact our support team at{' '}
            <Text style={{ color: '#1e40af', fontWeight: '600' as const }}>checkmatesafety@outlook.com</Text>
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
    marginBottom: 12,
  },
  roleIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  roleDescription: {
    fontSize: 13,
    marginBottom: 4,
  },
  roleSubtitle: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  defaultBadge: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
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
    width: 10,
    height: 10,
    borderRadius: 5,
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
