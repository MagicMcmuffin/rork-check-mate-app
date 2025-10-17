import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';
import { Building2, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Image } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FeaturedCompany {
  id: string;
  name: string;
  logo?: string;
}

const STORAGE_KEY = '@checkmate_featured_companies';

export default function FeaturedCompaniesScreen() {
  const { user } = useApp();
  const { colors, isDarkMode } = useTheme();
  const [featuredCompanies, setFeaturedCompanies] = useState<FeaturedCompany[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingCompany, setEditingCompany] = useState<FeaturedCompany | null>(null);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [selectedLogo, setSelectedLogo] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const loadFeaturedCompanies = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setFeaturedCompanies(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading featured companies:', error);
    }
  }, []);

  useEffect(() => {
    loadFeaturedCompanies();
  }, [loadFeaturedCompanies]);

  const saveFeaturedCompanies = async (companies: FeaturedCompany[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
      setFeaturedCompanies(companies);
    } catch (error) {
      console.error('Error saving featured companies:', error);
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const handlePickLogo = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedLogo(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) {
      Alert.alert('Error', 'Please enter a company name');
      return;
    }

    setIsLoading(true);
    try {
      const newCompany: FeaturedCompany = {
        id: Date.now().toString(),
        name: newCompanyName.trim(),
        logo: selectedLogo,
      };

      const updated = [...featuredCompanies, newCompany].sort((a, b) => 
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );
      
      await saveFeaturedCompanies(updated);
      setIsAddModalVisible(false);
      setNewCompanyName('');
      setSelectedLogo(undefined);
      Alert.alert('Success', 'Company added successfully');
    } catch {
      Alert.alert('Error', 'Failed to add company');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCompany = async () => {
    if (!editingCompany || !newCompanyName.trim()) {
      Alert.alert('Error', 'Please enter a company name');
      return;
    }

    setIsLoading(true);
    try {
      const updated = featuredCompanies.map(c => 
        c.id === editingCompany.id 
          ? { ...c, name: newCompanyName.trim(), logo: selectedLogo }
          : c
      ).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      
      await saveFeaturedCompanies(updated);
      setIsEditModalVisible(false);
      setEditingCompany(null);
      setNewCompanyName('');
      setSelectedLogo(undefined);
      Alert.alert('Success', 'Company updated successfully');
    } catch {
      Alert.alert('Error', 'Failed to update company');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCompany = (company: FeaturedCompany) => {
    Alert.alert(
      'Delete Company',
      `Are you sure you want to remove ${company.name} from featured companies?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = featuredCompanies.filter(c => c.id !== company.id);
            await saveFeaturedCompanies(updated);
            Alert.alert('Success', 'Company removed');
          },
        },
      ]
    );
  };

  const openEditModal = (company: FeaturedCompany) => {
    setEditingCompany(company);
    setNewCompanyName(company.name);
    setSelectedLogo(company.logo);
    setIsEditModalVisible(true);
  };

  const closeAddModal = () => {
    setIsAddModalVisible(false);
    setNewCompanyName('');
    setSelectedLogo(undefined);
  };

  const closeEditModal = () => {
    setIsEditModalVisible(false);
    setEditingCompany(null);
    setNewCompanyName('');
    setSelectedLogo(undefined);
  };

  const isOwner = user?.role === 'company';

  if (!isOwner) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Featured Companies',
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            You don&apos;t have permission to access this page
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Featured Companies',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity onPress={() => setIsAddModalVisible(true)}>
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            Featured Companies
          </Text>
          <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
            Add companies that use CheckMate to showcase on the welcome page. Upload their logos and names to highlight partnerships.
          </Text>
        </View>

        {featuredCompanies.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
            <Building2 size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Featured Companies
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Add companies to showcase on the welcome page
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => setIsAddModalVisible(true)}
            >
              <Plus size={20} color="#ffffff" />
              <Text style={styles.addButtonText}>Add Company</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.companiesList}>
            {featuredCompanies.map((company) => (
              <View key={company.id} style={[styles.companyCard, { backgroundColor: colors.card }]}>
                <TouchableOpacity
                  style={styles.companyContent}
                  onPress={() => openEditModal(company)}
                  activeOpacity={0.7}
                >
                  <View style={styles.companyLeft}>
                    {company.logo ? (
                      <Image source={{ uri: company.logo }} style={styles.companyLogo} />
                    ) : (
                      <View style={[styles.companyLogoPlaceholder, { backgroundColor: colors.background }]}>
                        <Building2 size={24} color={colors.textSecondary} />
                      </View>
                    )}
                    <Text style={[styles.companyName, { color: colors.text }]}>
                      {company.name}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: isDarkMode ? '#5f1e1e' : '#fee2e2' }]}
                  onPress={() => handleDeleteCompany(company)}
                >
                  <Trash2 size={18} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeAddModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Company</Text>
              <TouchableOpacity onPress={closeAddModal}>
                <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Company Name</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                placeholder="Enter company name"
                placeholderTextColor={colors.textSecondary}
                value={newCompanyName}
                onChangeText={setNewCompanyName}
              />

              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 16 }]}>
                Company Logo (Optional)
              </Text>
              
              {selectedLogo ? (
                <View style={styles.logoPreviewContainer}>
                  <Image source={{ uri: selectedLogo }} style={styles.logoPreview} />
                  <TouchableOpacity
                    style={[styles.changeLogoButton, { backgroundColor: colors.primary }]}
                    onPress={handlePickLogo}
                  >
                    <Upload size={16} color="#ffffff" />
                    <Text style={styles.changeLogoText}>Change Logo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.uploadButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={handlePickLogo}
                >
                  <ImageIcon size={24} color={colors.textSecondary} />
                  <Text style={[styles.uploadText, { color: colors.textSecondary }]}>
                    Upload Logo
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary, { backgroundColor: colors.background }]}
                onPress={closeAddModal}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
                onPress={handleAddCompany}
                disabled={isLoading}
              >
                <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>
                  {isLoading ? 'Adding...' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Company</Text>
              <TouchableOpacity onPress={closeEditModal}>
                <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Company Name</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                placeholder="Enter company name"
                placeholderTextColor={colors.textSecondary}
                value={newCompanyName}
                onChangeText={setNewCompanyName}
              />

              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 16 }]}>
                Company Logo (Optional)
              </Text>
              
              {selectedLogo ? (
                <View style={styles.logoPreviewContainer}>
                  <Image source={{ uri: selectedLogo }} style={styles.logoPreview} />
                  <TouchableOpacity
                    style={[styles.changeLogoButton, { backgroundColor: colors.primary }]}
                    onPress={handlePickLogo}
                  >
                    <Upload size={16} color="#ffffff" />
                    <Text style={styles.changeLogoText}>Change Logo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.uploadButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={handlePickLogo}
                >
                  <ImageIcon size={24} color={colors.textSecondary} />
                  <Text style={[styles.uploadText, { color: colors.textSecondary }]}>
                    Upload Logo
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary, { backgroundColor: colors.background }]}
                onPress={closeEditModal}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
                onPress={handleEditCompany}
                disabled={isLoading}
              >
                <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>
                  {isLoading ? 'Saving...' : 'Save'}
                </Text>
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
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center' as const,
  },
  emptyContainer: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  companiesList: {
    gap: 12,
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  companyContent: {
    flex: 1,
  },
  companyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  companyLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  companyLogoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600' as const,
    flex: 1,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  logoPreviewContainer: {
    alignItems: 'center',
    gap: 16,
  },
  logoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  changeLogoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeLogoText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonSecondary: {},
  modalButtonPrimary: {},
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
