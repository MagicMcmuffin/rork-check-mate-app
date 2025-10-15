import { useApp } from '@/contexts/AppContext';
import { useRouter, Stack } from 'expo-router';
import { ClipboardList, Building2, User, Copy, Building, Bell, CheckCircle, AlertTriangle, Trash2, Settings as SettingsIcon } from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function InspectionsScreen() {
  const { user, company, logout, switchCompany, getUserCompanies, updateUserProfile, getCompanyNotifications, markNotificationComplete, deleteNotification } = useApp();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const router = useRouter();
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userCompanies = getUserCompanies();
  const notifications = getCompanyNotifications();
  const unreadNotifications = notifications.filter(n => !n.isCompleted);

  const handleUpdateProfilePicture = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      try {
        await updateUserProfile({ profilePicture: `data:image/jpeg;base64,${result.assets[0].base64}` });
        Alert.alert('Success', 'Profile picture updated');
      } catch (error) {
        Alert.alert('Error', 'Failed to update profile picture');
      }
    }
  };



  const handleSwitchCompany = async (companyId: string) => {
    try {
      await switchCompany(companyId);
      setShowCompanyModal(false);
      Alert.alert('Success', 'Company switched successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to switch company');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Inspections',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={{ marginRight: 8 }}
            >
              <SettingsIcon size={22} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleUpdateProfilePicture}>
              {user?.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={styles.profilePicture} />
              ) : (
                <View style={[styles.profilePicturePlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <User size={24} color={colors.textSecondary} />
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome back!</Text>
              <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'User'}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {(user?.role === 'company' || user?.role === 'administrator' || user?.role === 'management' || user?.role === 'mechanic') && (
              <TouchableOpacity
                style={[styles.notificationButton, { backgroundColor: colors.card }]}
                onPress={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} color={colors.textSecondary} />
                {unreadNotifications.length > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{unreadNotifications.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={[styles.companyCard, { backgroundColor: colors.card }]}>
          <View style={[styles.companyIcon, { backgroundColor: colors.background }]}>
            {user?.role === 'company' ? (
              <Building2 size={24} color="#1e40af" />
            ) : (
              <User size={24} color="#0d9488" />
            )}
          </View>
          <View style={styles.companyInfo}>
            <Text style={[styles.companyLabel, { color: colors.textSecondary }]}>
              {user?.role === 'company' ? 'Your Company' : 'Company'}
            </Text>
            <Text style={[styles.companyName, { color: colors.text }]}>{company?.name}</Text>
            {user?.role === 'company' && (
              <View style={styles.codeContainer}>
                <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>Code: </Text>
                <Text style={styles.codeValue}>{company?.code}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={async () => {
                    if (company?.code) {
                      await Clipboard.setStringAsync(company.code);
                      Alert.alert('Copied!', 'Company code copied to clipboard');
                    }
                  }}
                >
                  <Copy size={14} color="#1e40af" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          {user?.role !== 'company' && (
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setShowCompanyModal(true)}
            >
              <Building size={20} color="#0d9488" />
            </TouchableOpacity>
          )}
        </View>

        {showNotifications && notifications.length > 0 && (
          <View style={[styles.notificationsPanel, { backgroundColor: colors.card }]}>
            <Text style={[styles.notificationsPanelTitle, { color: colors.text }]}>Equipment Issues</Text>
            {notifications.map((notification) => (
              <View
                key={notification.id}
                style={[
                  styles.notificationItem,
                  { backgroundColor: colors.background, borderLeftColor: notification.severity === 'high' ? '#ef4444' : notification.severity === 'medium' ? '#f59e0b' : '#10b981' },
                  notification.isCompleted && styles.notificationCompleted,
                ]}
              >
                <View style={styles.notificationContent}>
                  <Text style={[styles.notificationEquipment, { color: colors.text }]}>{notification.equipmentName}</Text>
                  <Text style={[styles.notificationIssue, { color: colors.textSecondary }]}>{notification.issue}</Text>
                  <Text style={[styles.notificationReporter, { color: colors.textSecondary }]}>Reported by {notification.reportedBy}</Text>
                  {notification.isCompleted && (
                    <Text style={styles.notificationCompletedText}>✓ Completed by {notification.completedBy}</Text>
                  )}
                </View>
                <View style={styles.notificationActions}>
                  {!notification.isCompleted && (
                    <TouchableOpacity
                      style={styles.markCompleteButton}
                      onPress={() => markNotificationComplete(notification.id)}
                    >
                      <CheckCircle size={20} color="#10b981" />
                    </TouchableOpacity>
                  )}
                  {(user?.role === 'company' || user?.role === 'administrator' || user?.role === 'management') && notification.isCompleted && (
                    <TouchableOpacity
                      style={styles.deleteNotificationButton}
                      onPress={() => {
                        Alert.alert(
                          'Delete Issue',
                          'Are you sure you want to delete this equipment issue?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: () => deleteNotification(notification.id),
                            },
                          ]
                        );
                      }}
                    >
                      <Trash2 size={18} color="#dc2626" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Inspections</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Select a checklist to begin</Text>
        </View>

        <View style={styles.checklistContainer}>
          <TouchableOpacity
            style={[styles.checklistCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/plant-inspection')}
            activeOpacity={0.7}
          >
            <View style={styles.checklistHeader}>
              <View style={[styles.checklistIcon, { backgroundColor: '#dbeafe' }]}>
                <ClipboardList size={28} color="#1e40af" />
              </View>
              <View style={styles.checklistBadge}>
                <Text style={styles.checklistBadgeText}>1.1</Text>
              </View>
            </View>
            <Text style={[styles.checklistTitle, { color: colors.text }]}>Plant Daily Inspection</Text>
            <Text style={[styles.checklistDescription, { color: colors.textSecondary }]}>
              Complete daily checks for plant machinery including steering, brakes, hydraulics, and
              more
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checklistCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/quick-hitch-inspection')}
            activeOpacity={0.7}
          >
            <View style={styles.checklistHeader}>
              <View style={[styles.checklistIcon, { backgroundColor: '#ccfbf1' }]}>
                <ClipboardList size={28} color="#0d9488" />
              </View>
              <View style={[styles.checklistBadge, { backgroundColor: '#ccfbf1' }]}>
                <Text style={[styles.checklistBadgeText, { color: '#0d9488' }]}>1.2</Text>
              </View>
            </View>
            <Text style={[styles.checklistTitle, { color: colors.text }]}>Quick Hitch Inspection</Text>
            <Text style={[styles.checklistDescription, { color: colors.textSecondary }]}>
              Daily inspection record for quick hitch systems including hydraulics, safety devices,
              and greasing
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checklistCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/(tabs)/vehicle-inspection' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.checklistHeader}>
              <View style={[styles.checklistIcon, { backgroundColor: '#fef3c7' }]}>
                <ClipboardList size={28} color="#f59e0b" />
              </View>
              <View style={[styles.checklistBadge, { backgroundColor: '#fef3c7' }]}>
                <Text style={[styles.checklistBadgeText, { color: '#f59e0b' }]}>1.3</Text>
              </View>
            </View>
            <Text style={[styles.checklistTitle, { color: colors.text }]}>Vehicle Daily Check</Text>
            <Text style={[styles.checklistDescription, { color: colors.textSecondary }]}>
              Complete daily inspection for vans, cars, and light vehicles including lights, tyres, fluids, and safety equipment
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checklistCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/bucket-change-inspection')}
            activeOpacity={0.7}
          >
            <View style={styles.checklistHeader}>
              <View style={[styles.checklistIcon, { backgroundColor: '#e0e7ff' }]}>
                <ClipboardList size={28} color="#6366f1" />
              </View>
              <View style={[styles.checklistBadge, { backgroundColor: '#e0e7ff' }]}>
                <Text style={[styles.checklistBadgeText, { color: '#6366f1' }]}>1.4</Text>
              </View>
            </View>
            <Text style={[styles.checklistTitle, { color: colors.text }]}>Bucket/Implement Change</Text>
            <Text style={[styles.checklistDescription, { color: colors.textSecondary }]}>
              Confirm bucket is on correct, shake rattle and roll tests completed, and signed by operator and witness
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checklistCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/positive-intervention')}
            activeOpacity={0.7}
          >
            <View style={styles.checklistHeader}>
              <View style={[styles.checklistIcon, { backgroundColor: '#dcfce7' }]}>
                <AlertTriangle size={28} color="#10b981" />
              </View>
              <View style={[styles.checklistBadge, { backgroundColor: '#dcfce7' }]}>
                <Text style={[styles.checklistBadgeText, { color: '#10b981' }]}>1.5</Text>
              </View>
            </View>
            <Text style={[styles.checklistTitle, { color: colors.text }]}>Positive Intervention</Text>
            <Text style={[styles.checklistDescription, { color: colors.textSecondary }]}>
              Report a hazard you identified and rectified to promote workplace safety
            </Text>
          </TouchableOpacity>

          {user?.role === 'apprentice' && (
            <TouchableOpacity
              style={[styles.checklistCard, { backgroundColor: colors.card }]}
              onPress={() => router.push('/apprenticeship-learning')}
              activeOpacity={0.7}
            >
              <View style={styles.checklistHeader}>
                <View style={[styles.checklistIcon, { backgroundColor: '#fef3c7' }]}>
                  <ClipboardList size={28} color="#f59e0b" />
                </View>
                <View style={[styles.checklistBadge, { backgroundColor: '#fef3c7' }]}>
                  <Text style={[styles.checklistBadgeText, { color: '#f59e0b' }]}>1.6</Text>
                </View>
              </View>
              <Text style={[styles.checklistTitle, { color: colors.text }]}>Apprenticeship Learning</Text>
              <Text style={[styles.checklistDescription, { color: colors.textSecondary }]}>
                Record what you learned today and track your development progress
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showCompanyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompanyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Switch Company</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Select a company to switch to</Text>

            <ScrollView style={styles.companyList}>
              {userCompanies.map((comp) => (
                <TouchableOpacity
                  key={comp.id}
                  style={[
                    styles.companyItem,
                    { backgroundColor: colors.background },
                    comp.id === company?.id && styles.companyItemActive,
                  ]}
                  onPress={() => handleSwitchCompany(comp.id)}
                  disabled={comp.id === company?.id}
                >
                  <View style={[styles.companyItemIcon, { backgroundColor: colors.card }]}>
                    <Building2 size={20} color={comp.id === company?.id ? '#0d9488' : colors.textSecondary} />
                  </View>
                  <View style={styles.companyItemInfo}>
                    <Text style={[
                      styles.companyItemName,
                      { color: colors.text },
                      comp.id === company?.id && styles.companyItemNameActive,
                    ]}>
                      {comp.name}
                    </Text>
                    {comp.id === company?.id && (
                      <Text style={styles.currentLabel}>Current</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                style={[styles.addCompanyButton, { backgroundColor: isDarkMode ? '#1e3a5f' : '#dbeafe' }]}
                onPress={() => {
                  setShowCompanyModal(false);
                  router.push('/employee-join');
                }}
              >
                <View style={[styles.addCompanyIcon, { backgroundColor: colors.card }]}>
                  <Building2 size={20} color="#1e40af" />
                </View>
                <Text style={styles.addCompanyText}>Join Another Company</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.background }]}
              onPress={() => setShowCompanyModal(false)}
            >
              <Text style={[styles.modalCloseButtonText, { color: colors.textSecondary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  profilePicture: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  profilePicturePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  greeting: {
    fontSize: 16,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative' as const,
  },
  notificationBadge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700' as const,
  },
  notificationsPanel: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  notificationsPanelTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  notificationItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  notificationCompleted: {
    opacity: 0.6,
  },
  notificationContent: {
    flex: 1,
  },
  notificationEquipment: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  notificationIssue: {
    fontSize: 14,
    marginBottom: 4,
  },
  notificationReporter: {
    fontSize: 12,
  },
  notificationCompletedText: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 4,
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  markCompleteButton: {
    padding: 8,
  },
  deleteNotificationButton: {
    padding: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  companyCard: {
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  companyInfo: {
    flex: 1,
  },
  companyLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 13,
  },
  codeValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1e40af',
    letterSpacing: 1,
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
  },
  switchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccfbf1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  companyList: {
    maxHeight: 400,
  },
  companyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  companyItemActive: {
    backgroundColor: '#ccfbf1',
    borderWidth: 2,
    borderColor: '#0d9488',
  },
  companyItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyItemInfo: {
    flex: 1,
  },
  companyItemName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  companyItemNameActive: {
    color: '#0d9488',
  },
  currentLabel: {
    fontSize: 13,
    color: '#0d9488',
    marginTop: 2,
  },
  addCompanyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#1e40af',
    borderStyle: 'dashed' as const,
  },
  addCompanyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addCompanyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1e40af',
  },
  modalCloseButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 15,
  },
  checklistContainer: {
    gap: 16,
  },
  checklistCard: {
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
    marginBottom: 8,
  },
  checklistDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
