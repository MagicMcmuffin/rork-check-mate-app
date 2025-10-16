import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';
import { Users, Shield, User, Crown, Copy, Trash2, Wrench, Briefcase, GraduationCap, Trophy, RotateCcw } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import { UserRole } from '@/types';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useMemo } from 'react';

export default function TeamScreen() {
  const { user, company, getCompanyUsers, changeUserRole, removeEmployee, getCompanyPositiveInterventions, positiveInterventions } = useApp();
  const { colors, isDarkMode } = useTheme();
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; currentRole: UserRole } | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'team' | 'leaderboard'>('team');

  const companyUsers = getCompanyUsers();
  const isAdmin = user?.role === 'company' || user?.role === 'administrator';

  const leaderboardData = useMemo(() => {
    const interventions = getCompanyPositiveInterventions();
    const userCounts: Record<string, { name: string; count: number; projectCounts: Record<string, number> }> = {};

    interventions.forEach(intervention => {
      if (!userCounts[intervention.employeeId]) {
        userCounts[intervention.employeeId] = {
          name: intervention.employeeName,
          count: 0,
          projectCounts: {},
        };
      }
      userCounts[intervention.employeeId].count++;

      if (intervention.projectId) {
        if (!userCounts[intervention.employeeId].projectCounts[intervention.projectId]) {
          userCounts[intervention.employeeId].projectCounts[intervention.projectId] = 0;
        }
        userCounts[intervention.employeeId].projectCounts[intervention.projectId]++;
      }
    });

    return Object.entries(userCounts)
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [positiveInterventions, company]);

  const handleResetLeaderboard = () => {
    Alert.alert(
      'Reset Leaderboard',
      'Are you sure you want to reset the overall positive intervention leaderboard? This will set all counts to 0 and delete all positive intervention records.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('@checkmate_positive_interventions', JSON.stringify([]));
              window.location.reload();
            } catch (error) {
              Alert.alert('Error', 'Failed to reset leaderboard');
              console.error('Reset error:', error);
            }
          },
        },
      ]
    );
  };

  const handleResetProjectLeaderboard = (projectId: string, projectName: string) => {
    Alert.alert(
      'Reset Project Leaderboard',
      `Are you sure you want to reset the positive intervention leaderboard for ${projectName}? This will set all counts to 0 and delete all positive interventions for this project.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const allInterventions = getCompanyPositiveInterventions();
              const filtered = allInterventions.filter(i => i.projectId !== projectId);
              await AsyncStorage.setItem('@checkmate_positive_interventions', JSON.stringify(filtered));
              window.location.reload();
            } catch (error) {
              Alert.alert('Error', 'Failed to reset project leaderboard');
              console.error('Reset error:', error);
            }
          },
        },
      ]
    );
  };

  const admins = companyUsers.filter(u => u.role === 'company' || u.role === 'administrator');
  const management = companyUsers.filter(u => u.role === 'management');
  const mechanics = companyUsers.filter(u => u.role === 'mechanic');
  const apprentices = companyUsers.filter(u => u.role === 'apprentice');
  const employees = companyUsers.filter(u => u.role === 'employee');

  const handleChangeRole = (userId: string, userName: string, currentRole: UserRole) => {
    setSelectedUser({ id: userId, name: userName, currentRole });
    setShowRoleModal(true);
  };

  const applyRoleChange = async (newRole: 'administrator' | 'management' | 'mechanic' | 'apprentice' | 'employee') => {
    if (!selectedUser) return;

    try {
      await changeUserRole(selectedUser.id, newRole);
      Alert.alert('Success', `${selectedUser.name}'s role has been updated to ${getRoleDisplayName(newRole)}`);
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update user role');
      console.error('Role change error:', error);
    }
  };

  const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
      case 'company': return 'Owner';
      case 'administrator': return 'Administrator';
      case 'management': return 'Management';
      case 'mechanic': return 'Mechanic';
      case 'apprentice': return 'Apprentice';
      case 'employee': return 'Employee';
      default: return role;
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'company': return <Crown size={20} color="#1e40af" />;
      case 'administrator': return <Shield size={20} color="#1e40af" />;
      case 'management': return <Briefcase size={20} color="#7c3aed" />;
      case 'mechanic': return <Wrench size={20} color="#ea580c" />;
      case 'apprentice': return <GraduationCap size={20} color="#0891b2" />;
      case 'employee': return <User size={20} color="#64748b" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'company': return { bg: '#fef3c7', text: '#92400e' };
      case 'administrator': return { bg: '#dbeafe', text: '#1e40af' };
      case 'management': return { bg: '#ede9fe', text: '#6b21a8' };
      case 'mechanic': return { bg: '#fed7aa', text: '#9a3412' };
      case 'apprentice': return { bg: '#cffafe', text: '#155e75' };
      case 'employee': return { bg: '#f1f5f9', text: '#475569' };
    }
  };





  const handleRemoveEmployee = (userId: string, userName: string) => {
    Alert.alert(
      'Remove Employee',
      `Are you sure you want to remove ${userName} from the company? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeEmployee(userId);
              Alert.alert('Success', `${userName} has been removed from the company`);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove employee');
              console.error('Remove error:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Team',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'team' && [styles.activeTab, { borderBottomColor: '#1e40af' }]]}
          onPress={() => setActiveTab('team')}
        >
          <Users size={18} color={activeTab === 'team' ? '#1e40af' : colors.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'team' ? '#1e40af' : colors.textSecondary }]}>Team</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaderboard' && [styles.activeTab, { borderBottomColor: '#1e40af' }]]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Trophy size={18} color={activeTab === 'leaderboard' ? '#1e40af' : colors.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'leaderboard' ? '#1e40af' : colors.textSecondary }]}>Leaderboard</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'team' ? (
        <>
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: isDarkMode ? '#1e3a5f' : '#dbeafe' }]}>
            <Users size={28} color="#1e40af" />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{company?.name}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {companyUsers.length} {companyUsers.length === 1 ? 'member' : 'members'}
          </Text>
        </View>

        <View style={[styles.codeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>Company Code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeValue}>{company?.code}</Text>
            <TouchableOpacity
              style={[styles.copyCodeButton, { backgroundColor: isDarkMode ? '#1e3a5f' : '#eff6ff' }]}
              onPress={async () => {
                if (company?.code) {
                  await Clipboard.setStringAsync(company.code);
                  Alert.alert('Copied!', 'Company code copied to clipboard');
                }
              }}
            >
              <Copy size={20} color="#1e40af" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.codeDescription, { color: colors.textSecondary }]}>
            Share this code with employees to join your company
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color="#1e40af" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Administrators</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{admins.length}</Text>
            </View>
          </View>
          <Text style={[styles.roleDescription, { color: colors.textSecondary }]}>Full access to all features, projects, and reports</Text>

          {admins.map((admin) => (
            <View key={admin.id} style={[styles.userCard, { backgroundColor: colors.card }]}>
              <View style={styles.userInfo}>
                {admin.profilePicture ? (
                  <Image source={{ uri: admin.profilePicture }} style={styles.userAvatar} />
                ) : (
                  <View style={[styles.userAvatar, { backgroundColor: isDarkMode ? '#1e3a5f' : '#dbeafe' }]}>
                    {admin.role === 'company' ? (
                      <Crown size={20} color="#1e40af" />
                    ) : (
                      <Shield size={20} color="#1e40af" />
                    )}
                  </View>
                )}
                <View style={styles.userDetails}>
                  <View style={styles.userNameRow}>
                    <Text style={[styles.userName, { color: colors.text }]}>{admin.name}</Text>
                    {admin.role === 'company' && (
                      <View style={styles.ownerBadge}>
                        <Text style={styles.ownerBadgeText}>Owner</Text>
                      </View>
                    )}
                    {admin.id === user?.id && (
                      <View style={[styles.ownerBadge, { backgroundColor: '#f0fdf4' }]}>
                        <Text style={[styles.ownerBadgeText, { color: '#15803d' }]}>You</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              {isAdmin && admin.role !== 'company' && admin.id !== user?.id && (
                <TouchableOpacity
                  style={[styles.changeRoleButton, { backgroundColor: isDarkMode ? '#1e3a5f' : '#eff6ff' }]}
                  onPress={() => handleChangeRole(admin.id, admin.name, admin.role)}
                >
                  <Text style={styles.changeRoleButtonText}>Change Role</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Briefcase size={20} color="#7c3aed" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Management</Text>
            <View style={[styles.badge, { backgroundColor: isDarkMode ? '#3b2a5f' : '#ede9fe' }]}>
              <Text style={[styles.badgeText, { color: '#6b21a8' }]}>{management.length}</Text>
            </View>
          </View>
          <Text style={[styles.roleDescription, { color: colors.textSecondary }]}>Can view reports and manage projects</Text>

          {management.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>No management members yet</Text>
            </View>
          ) : (
            management.map((member) => (
              <View key={member.id} style={[styles.userCard, { backgroundColor: colors.card }]}>
                <View style={styles.userInfo}>
                  {member.profilePicture ? (
                    <Image source={{ uri: member.profilePicture }} style={styles.userAvatar} />
                  ) : (
                    <View style={[styles.userAvatar, { backgroundColor: isDarkMode ? '#3b2a5f' : '#ede9fe' }]}>
                      <Briefcase size={20} color="#7c3aed" />
                    </View>
                  )}
                  <View style={styles.userDetails}>
                    <View style={styles.userNameRow}>
                      <Text style={[styles.userName, { color: colors.text }]}>{member.name}</Text>
                      {member.id === user?.id && (
                        <View style={[styles.ownerBadge, { backgroundColor: '#f0fdf4' }]}>
                          <Text style={[styles.ownerBadgeText, { color: '#15803d' }]}>You</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                {isAdmin && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.changeRoleButton, { backgroundColor: isDarkMode ? '#1e3a5f' : '#eff6ff' }]}
                      onPress={() => handleChangeRole(member.id, member.name, member.role)}
                    >
                      <Text style={styles.changeRoleButtonText}>Change Role</Text>
                    </TouchableOpacity>
                    {user?.role === 'company' && (
                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: '#fee2e2' }]}
                        onPress={() => handleRemoveEmployee(member.id, member.name)}
                      >
                        <Trash2 size={16} color="#dc2626" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Wrench size={20} color="#ea580c" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mechanics</Text>
            <View style={[styles.badge, { backgroundColor: isDarkMode ? '#5f3a1e' : '#fed7aa' }]}>
              <Text style={[styles.badgeText, { color: '#9a3412' }]}>{mechanics.length}</Text>
            </View>
          </View>
          <Text style={[styles.roleDescription, { color: colors.textSecondary }]}>Can view reports and inspection history</Text>

          {mechanics.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>No mechanics yet</Text>
            </View>
          ) : (
            mechanics.map((mechanic) => (
              <View key={mechanic.id} style={[styles.userCard, { backgroundColor: colors.card }]}>
                <View style={styles.userInfo}>
                  {mechanic.profilePicture ? (
                    <Image source={{ uri: mechanic.profilePicture }} style={styles.userAvatar} />
                  ) : (
                    <View style={[styles.userAvatar, { backgroundColor: isDarkMode ? '#5f3a1e' : '#fed7aa' }]}>
                      <Wrench size={20} color="#ea580c" />
                    </View>
                  )}
                  <View style={styles.userDetails}>
                    <View style={styles.userNameRow}>
                      <Text style={[styles.userName, { color: colors.text }]}>{mechanic.name}</Text>
                      {mechanic.id === user?.id && (
                        <View style={[styles.ownerBadge, { backgroundColor: '#f0fdf4' }]}>
                          <Text style={[styles.ownerBadgeText, { color: '#15803d' }]}>You</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                {isAdmin && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.changeRoleButton, { backgroundColor: isDarkMode ? '#1e3a5f' : '#eff6ff' }]}
                      onPress={() => handleChangeRole(mechanic.id, mechanic.name, mechanic.role)}
                    >
                      <Text style={styles.changeRoleButtonText}>Change Role</Text>
                    </TouchableOpacity>
                    {user?.role === 'company' && (
                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: '#fee2e2' }]}
                        onPress={() => handleRemoveEmployee(mechanic.id, mechanic.name)}
                      >
                        <Trash2 size={16} color="#dc2626" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <GraduationCap size={20} color="#0891b2" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Apprentices</Text>
            <View style={[styles.badge, { backgroundColor: isDarkMode ? '#164e63' : '#cffafe' }]}>
              <Text style={[styles.badgeText, { color: '#155e75' }]}>{apprentices.length}</Text>
            </View>
          </View>
          <Text style={[styles.roleDescription, { color: colors.textSecondary }]}>Can view reports and inspection history</Text>

          {apprentices.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>No apprentices yet</Text>
            </View>
          ) : (
            apprentices.map((apprentice) => (
              <View key={apprentice.id} style={[styles.userCard, { backgroundColor: colors.card }]}>
                <View style={styles.userInfo}>
                  {apprentice.profilePicture ? (
                    <Image source={{ uri: apprentice.profilePicture }} style={styles.userAvatar} />
                  ) : (
                    <View style={[styles.userAvatar, { backgroundColor: isDarkMode ? '#164e63' : '#cffafe' }]}>
                      <GraduationCap size={20} color="#0891b2" />
                    </View>
                  )}
                  <View style={styles.userDetails}>
                    <View style={styles.userNameRow}>
                      <Text style={[styles.userName, { color: colors.text }]}>{apprentice.name}</Text>
                      {apprentice.id === user?.id && (
                        <View style={[styles.ownerBadge, { backgroundColor: '#f0fdf4' }]}>
                          <Text style={[styles.ownerBadgeText, { color: '#15803d' }]}>You</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                {isAdmin && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.changeRoleButton, { backgroundColor: isDarkMode ? '#1e3a5f' : '#eff6ff' }]}
                      onPress={() => handleChangeRole(apprentice.id, apprentice.name, apprentice.role)}
                    >
                      <Text style={styles.changeRoleButtonText}>Change Role</Text>
                    </TouchableOpacity>
                    {user?.role === 'company' && (
                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: '#fee2e2' }]}
                        onPress={() => handleRemoveEmployee(apprentice.id, apprentice.name)}
                      >
                        <Trash2 size={16} color="#dc2626" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color="#64748b" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Employees</Text>
            <View style={[styles.badge, { backgroundColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
              <Text style={[styles.badgeText, { color: '#64748b' }]}>{employees.length}</Text>
            </View>
          </View>
          <Text style={[styles.roleDescription, { color: colors.textSecondary }]}>Can submit inspections and view their own history</Text>

          {employees.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>No employees yet</Text>
            </View>
          ) : (
            employees.map((employee) => (
              <View key={employee.id} style={[styles.userCard, { backgroundColor: colors.card }]}>
                <View style={styles.userInfo}>
                  {employee.profilePicture ? (
                    <Image source={{ uri: employee.profilePicture }} style={styles.userAvatar} />
                  ) : (
                    <View style={[styles.userAvatar, { backgroundColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
                      <User size={20} color="#64748b" />
                    </View>
                  )}
                  <View style={styles.userDetails}>
                    <View style={styles.userNameRow}>
                      <Text style={[styles.userName, { color: colors.text }]}>{employee.name}</Text>
                      {employee.id === user?.id && (
                        <View style={[styles.ownerBadge, { backgroundColor: '#f0fdf4' }]}>
                          <Text style={[styles.ownerBadgeText, { color: '#15803d' }]}>You</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                {isAdmin && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.changeRoleButton, { backgroundColor: isDarkMode ? '#1e3a5f' : '#eff6ff' }]}
                      onPress={() => handleChangeRole(employee.id, employee.name, employee.role)}
                    >
                      <Text style={styles.changeRoleButtonText}>Change Role</Text>
                    </TouchableOpacity>
                    {user?.role === 'company' && (
                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: '#fee2e2' }]}
                        onPress={() => handleRemoveEmployee(employee.id, employee.name)}
                      >
                        <Trash2 size={16} color="#dc2626" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ))
          )}
        </View>
        </>
        ) : (
          <View>
            <View style={styles.header}>
              <View style={[styles.headerIcon, { backgroundColor: isDarkMode ? '#5f3a1e' : '#fef3c7' }]}>
                <Trophy size={28} color="#eab308" />
              </View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Positive Intervention Leaderboard</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Top contributors to safety</Text>
            </View>

            {isAdmin && (
              <TouchableOpacity
                style={[styles.resetButton, { backgroundColor: isDarkMode ? '#5f1e1e' : '#fee2e2' }]}
                onPress={handleResetLeaderboard}
              >
                <RotateCcw size={18} color="#dc2626" />
                <Text style={[styles.resetButtonText, { color: '#dc2626' }]}>Reset Overall Leaderboard</Text>
              </TouchableOpacity>
            )}

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>Overall Rankings</Text>
              {leaderboardData.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                  <Trophy size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary, marginTop: 12 }]}>No positive interventions yet</Text>
                </View>
              ) : (
                leaderboardData.map((entry, index) => (
                  <View key={entry.userId} style={[styles.leaderboardCard, { backgroundColor: colors.card }]}>
                    <View style={styles.leaderboardRank}>
                      {index === 0 ? (
                        <View style={styles.goldMedal}>
                          <Text style={styles.medalText}>🥇</Text>
                        </View>
                      ) : index === 1 ? (
                        <View style={styles.silverMedal}>
                          <Text style={styles.medalText}>🥈</Text>
                        </View>
                      ) : index === 2 ? (
                        <View style={styles.bronzeMedal}>
                          <Text style={styles.medalText}>🥉</Text>
                        </View>
                      ) : (
                        <View style={[styles.rankNumber, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
                          <Text style={[styles.rankNumberText, { color: colors.textSecondary }]}>#{index + 1}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.leaderboardInfo}>
                      <Text style={[styles.leaderboardName, { color: colors.text }]}>{entry.name}</Text>
                      <Text style={[styles.leaderboardCount, { color: colors.textSecondary }]}>
                        {entry.count} {entry.count === 1 ? 'intervention' : 'interventions'}
                      </Text>
                    </View>
                    <View style={[styles.leaderboardScore, { backgroundColor: isDarkMode ? '#1e3a5f' : '#dbeafe' }]}>
                      <Text style={styles.leaderboardScoreText}>{entry.count}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {company?.projects && company.projects.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>Project Rankings</Text>
                {company.projects.map((project) => {
                  const projectLeaderboard = leaderboardData
                    .map(entry => ({
                      ...entry,
                      projectCount: entry.projectCounts[project.id] || 0,
                    }))
                    .filter(entry => entry.projectCount > 0)
                    .sort((a, b) => b.projectCount - a.projectCount);

                  if (projectLeaderboard.length === 0) return null;

                  return (
                    <View key={project.id} style={styles.projectLeaderboardSection}>
                      <View style={styles.projectHeader}>
                        <View style={styles.projectHeaderLeft}>
                          <Text style={[styles.projectName, { color: colors.text }]}>{project.name}</Text>
                          <Text style={[styles.projectNumber, { color: colors.textSecondary }]}>#{project.projectNumber}</Text>
                        </View>
                        {isAdmin && (
                          <TouchableOpacity
                            style={[styles.resetProjectButton, { backgroundColor: isDarkMode ? '#5f1e1e' : '#fee2e2' }]}
                            onPress={() => handleResetProjectLeaderboard(project.id, project.name)}
                          >
                            <RotateCcw size={14} color="#dc2626" />
                          </TouchableOpacity>
                        )}
                      </View>
                      {projectLeaderboard.map((entry, index) => (
                        <View key={entry.userId} style={[styles.projectLeaderboardCard, { backgroundColor: colors.card }]}>
                          <View style={styles.projectLeaderboardRank}>
                            <Text style={[styles.projectRankText, { color: colors.textSecondary }]}>#{index + 1}</Text>
                          </View>
                          <View style={styles.projectLeaderboardInfo}>
                            <Text style={[styles.projectLeaderboardName, { color: colors.text }]}>{entry.name}</Text>
                          </View>
                          <View style={[styles.projectLeaderboardScore, { backgroundColor: isDarkMode ? '#1e3a5f' : '#dbeafe' }]}>
                            <Text style={styles.projectLeaderboardScoreText}>{entry.projectCount}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showRoleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRoleModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Change Role</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Select a new role for {selectedUser?.name}
            </Text>

            <View style={styles.roleOptions}>
              <TouchableOpacity
                style={[styles.roleOption, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}
                onPress={() => applyRoleChange('administrator')}
              >
                <View style={[styles.roleOptionIcon, { backgroundColor: isDarkMode ? '#1e3a5f' : '#dbeafe' }]}>
                  <Shield size={24} color="#1e40af" />
                </View>
                <View style={styles.roleOptionContent}>
                  <Text style={[styles.roleOptionTitle, { color: colors.text }]}>Administrator</Text>
                  <Text style={[styles.roleOptionDescription, { color: colors.textSecondary }]}>
                    Full access to all features, projects, and reports
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleOption, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}
                onPress={() => applyRoleChange('management')}
              >
                <View style={[styles.roleOptionIcon, { backgroundColor: isDarkMode ? '#3b2a5f' : '#ede9fe' }]}>
                  <Briefcase size={24} color="#7c3aed" />
                </View>
                <View style={styles.roleOptionContent}>
                  <Text style={[styles.roleOptionTitle, { color: colors.text }]}>Management</Text>
                  <Text style={[styles.roleOptionDescription, { color: colors.textSecondary }]}>
                    Can view reports and manage projects
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleOption, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}
                onPress={() => applyRoleChange('mechanic')}
              >
                <View style={[styles.roleOptionIcon, { backgroundColor: isDarkMode ? '#5f3a1e' : '#fed7aa' }]}>
                  <Wrench size={24} color="#ea580c" />
                </View>
                <View style={styles.roleOptionContent}>
                  <Text style={[styles.roleOptionTitle, { color: colors.text }]}>Mechanic</Text>
                  <Text style={[styles.roleOptionDescription, { color: colors.textSecondary }]}>
                    Can view reports and inspection history
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleOption, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}
                onPress={() => applyRoleChange('apprentice')}
              >
                <View style={[styles.roleOptionIcon, { backgroundColor: isDarkMode ? '#164e63' : '#cffafe' }]}>
                  <GraduationCap size={24} color="#0891b2" />
                </View>
                <View style={styles.roleOptionContent}>
                  <Text style={[styles.roleOptionTitle, { color: colors.text }]}>Apprentice</Text>
                  <Text style={[styles.roleOptionDescription, { color: colors.textSecondary }]}>
                    Can view reports and inspection history
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleOption, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}
                onPress={() => applyRoleChange('employee')}
              >
                <View style={[styles.roleOptionIcon, { backgroundColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
                  <User size={24} color="#64748b" />
                </View>
                <View style={styles.roleOptionContent}>
                  <Text style={[styles.roleOptionTitle, { color: colors.text }]}>Employee</Text>
                  <Text style={[styles.roleOptionDescription, { color: colors.textSecondary }]}>
                    Can submit inspections and view their own history
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.modalCancelButton, { backgroundColor: colors.background }]}
              onPress={() => setShowRoleModal(false)}
            >
              <Text style={[styles.modalCancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  },
  codeCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1e40af',
    letterSpacing: 4,
  },
  copyCodeButton: {
    padding: 8,
    borderRadius: 8,
  },
  codeDescription: {
    fontSize: 13,
    textAlign: 'center' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    flex: 1,
  },
  badge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#1e40af',
  },
  userCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  ownerBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ownerBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#92400e',
  },

  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#dc2626',
  },
  emptyState: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
  },
  roleDescription: {
    fontSize: 13,
    marginBottom: 12,
    marginLeft: 4,
  },
  changeRoleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeRoleButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1e40af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalOverlayInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  roleOptions: {
    gap: 12,
    marginBottom: 24,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  roleOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleOptionContent: {
    flex: 1,
  },
  roleOptionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  roleOptionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalCancelButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  leaderboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  leaderboardRank: {
    marginRight: 16,
  },
  goldMedal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  silverMedal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bronzeMedal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fed7aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medalText: {
    fontSize: 24,
  },
  rankNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumberText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  leaderboardCount: {
    fontSize: 13,
  },
  leaderboardScore: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  leaderboardScoreText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e40af',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  projectLeaderboardSection: {
    marginBottom: 24,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  projectHeaderLeft: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  projectNumber: {
    fontSize: 13,
  },
  resetProjectButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectLeaderboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  projectLeaderboardRank: {
    marginRight: 12,
    width: 32,
  },
  projectRankText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  projectLeaderboardInfo: {
    flex: 1,
  },
  projectLeaderboardName: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  projectLeaderboardScore: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  projectLeaderboardScoreText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1e40af',
  },

});
