import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack, router } from 'expo-router';
import { Shield, LogOut, Moon, Sun, ChevronRight, Mail, User, Bell, Image as ImageIcon, Upload, Trash2, Building2, Star, Database } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Linking, Modal, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { user, company, logout, updateUserProfile, updateCompanyLogo } = useApp();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [profilePictureModalVisible, setProfilePictureModalVisible] = useState(false);
  const [companyLogoModalVisible, setCompanyLogoModalVisible] = useState(false);

  const isOwner = user?.role === 'company';

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

  const handleContactSupport = () => {
    const email = 'checkmatesafty@gmail.com';
    const subject = 'CheckMate Support Request';
    const body = `Hello CheckMate Support,\n\nI need help with:\n\n\n\nUser: ${user?.name || 'Unknown'}\nCompany: ${company?.name || 'N/A'}`;
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert('Error', 'Unable to open email app. Please email us at checkmatesafty@gmail.com');
    });
  };

  const handleUploadProfilePicture = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await updateUserProfile({ profilePicture: imageUri });
        setProfilePictureModalVisible(false);
        Alert.alert('Success', 'Profile picture updated successfully');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to upload profile picture');
    }
  };

  const handleRemoveProfilePicture = async () => {
    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateUserProfile({ profilePicture: undefined });
              setProfilePictureModalVisible(false);
              Alert.alert('Success', 'Profile picture removed successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove profile picture');
            }
          },
        },
      ]
    );
  };

  const handleUploadCompanyLogo = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload a logo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await updateCompanyLogo(imageUri);
        setCompanyLogoModalVisible(false);
        Alert.alert('Success', 'Company logo updated successfully');
      }
    } catch (error) {
      console.error('Error uploading company logo:', error);
      Alert.alert('Error', 'Failed to upload company logo');
    }
  };

  const handleRemoveCompanyLogo = async () => {
    Alert.alert(
      'Remove Company Logo',
      'Are you sure you want to remove the company logo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateCompanyLogo(undefined);
              setCompanyLogoModalVisible(false);
              Alert.alert('Success', 'Company logo removed successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove company logo');
            }
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear All Cache',
      'This will clear all data including your login session, inspections, and settings. You will be logged out and will need to log in again. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert(
                'Cache Cleared',
                'All cache has been cleared successfully. The app will now reload.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      router.replace('/');
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Settings',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#5f3a1e' : '#fef3c7' }]}>
                {isDarkMode ? <Moon size={20} color="#f59e0b" /> : <Sun size={20} color="#f59e0b" />}
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {isDarkMode ? 'Dark theme enabled' : 'Light theme enabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
              thumbColor={isDarkMode ? '#ffffff' : '#f1f5f9'}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setProfilePictureModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#1e3a5f' : '#dbeafe' }]}>
                <User size={20} color="#3b82f6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Profile Picture</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {user?.profilePicture ? 'Update or remove your picture' : 'Add a profile picture'}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push('/notification-centre' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#1e3a5f' : '#dbeafe' }]}>
                <Bell size={20} color="#3b82f6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Notification Centre</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  View plant and equipment reminders
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {isOwner && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Administration</Text>
            
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setCompanyLogoModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#1e3a5f' : '#dbeafe' }]}>
                  <Building2 size={20} color="#3b82f6" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Company Logo</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    {company?.logo ? 'Update or remove company logo' : 'Add a company logo'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => router.push('/settings-roles' as any)}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#1e3a5f' : '#dbeafe' }]}>
                  <Shield size={20} color="#1e40af" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Roles & Permissions</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Manage user roles and access levels
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => router.push('/settings-featured-companies' as any)}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#5f4a1e' : '#fef3c7' }]}>
                  <Star size={20} color="#f59e0b" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Featured Companies</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Manage companies using CheckMate
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
          
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleContactSupport}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#1e3a5f' : '#dbeafe' }]}>
                <Mail size={20} color="#3b82f6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Contact Support</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Get help from our team
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>
          
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleClearCache}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#5f3a1e' : '#fef3c7' }]}>
                <Database size={20} color="#f59e0b" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Clear All Cache</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Clear all stored data and reset app
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#5f1e1e' : '#fee2e2' }]}>
                <LogOut size={20} color="#dc2626" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: '#dc2626' }]}>Logout</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Sign out of your account
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.footer, { backgroundColor: colors.card }]}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            CheckMate v1.0.0
          </Text>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            © 2025 All rights reserved
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={profilePictureModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setProfilePictureModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Profile Picture</Text>
              <TouchableOpacity onPress={() => setProfilePictureModalVisible(false)}>
                <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {user?.profilePicture && (
                <View style={styles.imagePreviewContainer}>
                  <Text style={[styles.previewLabel, { color: colors.text }]}>Current Picture</Text>
                  <Image source={{ uri: user.profilePicture }} style={styles.imagePreview} />
                </View>
              )}

              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: colors.primary }]}
                onPress={handleUploadProfilePicture}
              >
                <Upload size={20} color="#ffffff" />
                <Text style={styles.uploadButtonText}>
                  {user?.profilePicture ? 'Change Picture' : 'Upload Picture'}
                </Text>
              </TouchableOpacity>

              {user?.profilePicture && (
                <TouchableOpacity
                  style={[styles.removeButton, { backgroundColor: isDarkMode ? '#5f1e1e' : '#fee2e2' }]}
                  onPress={handleRemoveProfilePicture}
                >
                  <Trash2 size={20} color="#dc2626" />
                  <Text style={[styles.removeButtonText, { color: '#dc2626' }]}>Remove Picture</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background }]}
                onPress={() => setProfilePictureModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={companyLogoModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCompanyLogoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Company Logo</Text>
              <TouchableOpacity onPress={() => setCompanyLogoModalVisible(false)}>
                <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {company?.logo && (
                <View style={styles.imagePreviewContainer}>
                  <Text style={[styles.previewLabel, { color: colors.text }]}>Current Logo</Text>
                  <Image source={{ uri: company.logo }} style={styles.imagePreview} />
                </View>
              )}

              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: colors.primary }]}
                onPress={handleUploadCompanyLogo}
              >
                <Upload size={20} color="#ffffff" />
                <Text style={styles.uploadButtonText}>
                  {company?.logo ? 'Change Logo' : 'Upload Logo'}
                </Text>
              </TouchableOpacity>

              {company?.logo && (
                <TouchableOpacity
                  style={[styles.removeButton, { backgroundColor: isDarkMode ? '#5f1e1e' : '#fee2e2' }]}
                  onPress={handleRemoveCompanyLogo}
                >
                  <Trash2 size={20} color="#dc2626" />
                  <Text style={[styles.removeButtonText, { color: '#dc2626' }]}>Remove Logo</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background }]}
                onPress={() => setCompanyLogoModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Close</Text>
              </TouchableOpacity>
            </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    marginBottom: 12,
    opacity: 0.6,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  footer: {
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center' as const,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  modalClose: {
    fontSize: 24,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  imagePreview: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
