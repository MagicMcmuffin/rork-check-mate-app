import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack, router } from 'expo-router';
import { Package, Plus, Trash2, Edit2, FolderPlus, FileText, Calendar, AlertCircle, X, Check, Upload, Clock, ChevronRight, ChevronDown, File, Image as ImageIcon, Search, Bell, Download, Eye } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Platform, KeyboardAvoidingView, Linking } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type FileType = 'pdf' | 'image' | 'all';

export default function EquipmentManagementScreen() {
  const { 
    user, 
    getCompanyEquipmentCategories,
    getCompanyEquipmentItems,
    getCategoryEquipmentItems,
    addEquipmentCategory,
    updateEquipmentCategory,
    deleteEquipmentCategory,
    addEquipmentItem,
    updateEquipmentItem,
    deleteEquipmentItem,
    addEquipmentCertificate,
    deleteEquipmentCertificate,
  } = useApp();
  const { colors } = useTheme();

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [parentCategoryId, setParentCategoryId] = useState<string | undefined>(undefined);
  const [categoryName, setCategoryName] = useState('');

  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [plantNumber, setPlantNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [notes, setNotes] = useState('');

  const [certificateModalVisible, setCertificateModalVisible] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [certificateName, setCertificateName] = useState('');
  const [certificateFile, setCertificateFile] = useState<{ uri: string; mimeType: string; name: string } | null>(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [has30DayReminder, setHas30DayReminder] = useState(false);
  const [has7DayReminder, setHas7DayReminder] = useState(false);
  const [fileType, setFileType] = useState<FileType>('all');

  const [searchQuery, setSearchQuery] = useState('');
  const [showReminders, setShowReminders] = useState(false);
  const [viewCertificateUri, setViewCertificateUri] = useState<string | null>(null);

  const isAdmin = user?.role === 'company' || user?.role === 'administrator' || user?.role === 'management';
  const canSeeReminders = user?.role === 'company' || user?.role === 'administrator' || user?.role === 'management' || user?.role === 'mechanic';
  const categories = getCompanyEquipmentCategories();
  const allItems = getCompanyEquipmentItems();

  const rootCategories = categories.filter(c => !c.parentCategoryId);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parentCategoryId === parentId);

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired' as const, days: Math.abs(daysUntilExpiry), color: '#dc2626' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring-soon' as const, days: daysUntilExpiry, color: '#f59e0b' };
    } else {
      return { status: 'valid' as const, days: daysUntilExpiry, color: '#10b981' };
    }
  };

  const allReminders = useMemo(() => {
    const reminders: Array<{
      id: string;
      itemName: string;
      certificateName: string;
      expiryDate: string;
      daysUntilExpiry: number;
      status: 'expired' | 'expiring-soon';
      has7DayReminder: boolean;
      has30DayReminder: boolean;
      itemId: string;
    }> = [];

    allItems.forEach(item => {
      item.certificates.forEach(cert => {
        if (cert.expiryDate && (cert.has7DayReminder || cert.has30DayReminder)) {
          const expiryStatus = getExpiryStatus(cert.expiryDate);
          if (expiryStatus && (expiryStatus.status === 'expired' || expiryStatus.status === 'expiring-soon')) {
            reminders.push({
              id: cert.id,
              itemName: item.name,
              certificateName: cert.name,
              expiryDate: cert.expiryDate,
              daysUntilExpiry: expiryStatus.days,
              status: expiryStatus.status,
              has7DayReminder: cert.has7DayReminder || false,
              has30DayReminder: cert.has30DayReminder || false,
              itemId: item.id,
            });
          }
        }
      });
    });

    return reminders.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }, [allItems]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    const query = searchQuery.toLowerCase();
    return allItems.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.serialNumber?.toLowerCase().includes(query) ||
      item.plantNumber?.toLowerCase().includes(query) ||
      item.make?.toLowerCase().includes(query) ||
      item.model?.toLowerCase().includes(query)
    );
  }, [allItems, searchQuery]);

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      if (editingCategoryId) {
        await updateEquipmentCategory(editingCategoryId, categoryName);
        Alert.alert('Success', 'Category updated successfully');
      } else {
        await addEquipmentCategory(categoryName, parentCategoryId);
        Alert.alert('Success', parentCategoryId ? 'Subcategory created successfully' : 'Category created successfully');
      }
      resetCategoryModal();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save category');
      console.error('Save category error:', error);
    }
  };

  const handleEditCategory = (categoryId: string, name: string) => {
    setEditingCategoryId(categoryId);
    setCategoryName(name);
    setCategoryModalVisible(true);
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${categoryName}"? All items and subcategories must be deleted first.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEquipmentCategory(categoryId);
              Alert.alert('Success', 'Category deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete category');
              console.error('Delete category error:', error);
            }
          },
        },
      ]
    );
  };

  const resetCategoryModal = () => {
    setCategoryModalVisible(false);
    setEditingCategoryId(null);
    setParentCategoryId(undefined);
    setCategoryName('');
  };

  const handleOpenItemModal = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setItemModalVisible(true);
  };

  const handleEditItem = (item: any) => {
    setEditingItemId(item.id);
    setSelectedCategoryId(item.categoryId);
    setItemName(item.name);
    setSerialNumber(item.serialNumber || '');
    setPlantNumber(item.plantNumber || '');
    setMake(item.make || '');
    setModel(item.model || '');
    setNotes(item.notes || '');
    setItemModalVisible(true);
  };

  const handleSaveItem = async () => {
    if (!itemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert('Error', 'No category selected');
      return;
    }

    try {
      if (editingItemId) {
        await updateEquipmentItem(editingItemId, {
          name: itemName.trim(),
          serialNumber: serialNumber.trim() || undefined,
          plantNumber: plantNumber.trim() || undefined,
          make: make.trim() || undefined,
          model: model.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        Alert.alert('Success', 'Item updated successfully');
      } else {
        await addEquipmentItem({
          categoryId: selectedCategoryId,
          name: itemName.trim(),
          serialNumber: serialNumber.trim() || undefined,
          plantNumber: plantNumber.trim() || undefined,
          make: make.trim() || undefined,
          model: model.trim() || undefined,
          notes: notes.trim() || undefined,
          certificates: [],
        });
        Alert.alert('Success', 'Item added successfully');
      }
      resetItemModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to save item');
      console.error('Save item error:', error);
    }
  };

  const handleDeleteItem = (itemId: string, itemName: string) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${itemName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEquipmentItem(itemId);
              Alert.alert('Success', 'Item deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
              console.error('Delete item error:', error);
            }
          },
        },
      ]
    );
  };

  const resetItemModal = () => {
    setItemModalVisible(false);
    setEditingItemId(null);
    setSelectedCategoryId(null);
    setItemName('');
    setSerialNumber('');
    setPlantNumber('');
    setMake('');
    setModel('');
    setNotes('');
  };

  const handlePickCertificate = async () => {
    try {
      const types = fileType === 'pdf' 
        ? ['application/pdf'] 
        : fileType === 'image' 
        ? ['image/*'] 
        : ['application/pdf', 'image/*'];

      const result = await DocumentPicker.getDocumentAsync({
        type: types,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (Platform.OS === 'web') {
          setCertificateFile({
            uri: asset.uri,
            mimeType: asset.mimeType || 'application/pdf',
            name: asset.name,
          });
        } else {
          const fileInfo = await FileSystem.getInfoAsync(asset.uri);
          if (fileInfo.exists && fileInfo.size && fileInfo.size < 10 * 1024 * 1024) {
            const base64 = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            const dataUri = `data:${asset.mimeType || 'application/pdf'};base64,${base64}`;
            setCertificateFile({
              uri: dataUri,
              mimeType: asset.mimeType || 'application/pdf',
              name: asset.name,
            });
          } else {
            Alert.alert('Error', 'File is too large. Maximum size is 10MB.');
          }
        }
      }
    } catch (error) {
      console.error('Error picking certificate:', error);
      Alert.alert('Error', 'Failed to pick certificate');
    }
  };

  const handleSaveCertificate = async () => {
    if (!certificateName.trim()) {
      Alert.alert('Error', 'Please enter a certificate name');
      return;
    }

    if (!certificateFile) {
      Alert.alert('Error', 'Please select a certificate file');
      return;
    }

    if (!selectedItemId) {
      Alert.alert('Error', 'No item selected');
      return;
    }

    try {
      await addEquipmentCertificate(selectedItemId, {
        name: certificateName.trim(),
        fileUri: certificateFile.uri,
        mimeType: certificateFile.mimeType,
        expiryDate: expiryDate || undefined,
        has30DayReminder: has30DayReminder,
        has7DayReminder: has7DayReminder,
      });
      Alert.alert('Success', 'Certificate uploaded successfully');
      resetCertificateModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to upload certificate');
      console.error('Save certificate error:', error);
    }
  };

  const handleDeleteCertificate = (itemId: string, certificateId: string, certificateName: string) => {
    Alert.alert(
      'Delete Certificate',
      `Are you sure you want to delete "${certificateName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEquipmentCertificate(itemId, certificateId);
              Alert.alert('Success', 'Certificate deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete certificate');
              console.error('Delete certificate error:', error);
            }
          },
        },
      ]
    );
  };

  const resetCertificateModal = () => {
    setCertificateModalVisible(false);
    setSelectedItemId(null);
    setCertificateName('');
    setCertificateFile(null);
    setExpiryDate('');
    setHas30DayReminder(false);
    setHas7DayReminder(false);
    setFileType('all');
  };

  const handleOpenCertificateModal = (itemId: string) => {
    setSelectedItemId(itemId);
    setCertificateModalVisible(true);
  };

  const handleAddSubcategory = (parentId: string) => {
    setParentCategoryId(parentId);
    setCategoryModalVisible(true);
  };

  const handleViewCertificate = (uri: string, mimeType: string) => {
    if (Platform.OS === 'web') {
      if (uri.startsWith('data:')) {
        const newWindow = window.open();
        if (newWindow) {
          if (mimeType.includes('pdf')) {
            newWindow.document.write(`<iframe src="${uri}" style="width:100%; height:100%; border:none;"></iframe>`);
          } else {
            newWindow.document.write(`<img src="${uri}" style="max-width:100%; height:auto;" />`);
          }
        }
      } else {
        window.open(uri, '_blank');
      }
    } else {
      setViewCertificateUri(uri);
    }
  };

  const handleDownloadCertificate = async (uri: string, name: string, mimeType: string) => {
    try {
      if (Platform.OS === 'web') {
        if (uri.startsWith('data:')) {
          const link = document.createElement('a');
          link.href = uri;
          link.download = name;
          link.click();
        } else {
          Linking.openURL(uri);
        }
      } else {
        const fileExtension = mimeType.includes('pdf') ? 'pdf' : 'jpg';
        const fileName = `${name}.${fileExtension}`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        
        if (uri.startsWith('data:')) {
          const base64Data = uri.split(',')[1];
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } else {
          await FileSystem.downloadAsync(uri, fileUri);
        }

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Success', `Certificate saved to ${fileUri}`);
        }
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      Alert.alert('Error', 'Failed to download certificate');
    }
  };

  const handleNavigateToCategory = (categoryId: string, categoryName: string) => {
    router.push({
      pathname: '/equipment-category-detail',
      params: { categoryId, categoryName }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Equipment Management',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Back</Text>
            </TouchableOpacity>
          ),
          headerRight: () => canSeeReminders ? (
            <TouchableOpacity 
              onPress={() => setShowReminders(true)}
              style={{ marginRight: 16, position: 'relative' as const }}
            >
              <Bell size={24} color={colors.text} />
              {allReminders.length > 0 && (
                <View style={[styles.reminderBadge, { backgroundColor: '#dc2626' }]}>
                  <Text style={styles.reminderBadgeCount}>{allReminders.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : null,
        }}
      />

      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search equipment by name, serial, plant #..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {searchQuery.trim() ? (
          <>
            <Text style={[styles.resultsTitle, { color: colors.text }]}>
              Search Results ({filteredItems.length})
            </Text>
            {filteredItems.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <Search size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Results Found</Text>
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  Try adjusting your search query
                </Text>
              </View>
            ) : (
              filteredItems.map(item => {
                const category = categories.find(c => c.id === item.categoryId);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.searchResultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => {
                      if (category) {
                        handleNavigateToCategory(category.id, category.name);
                      }
                    }}
                  >
                    <View style={styles.searchResultHeader}>
                      <Text style={[styles.searchResultName, { color: colors.text }]}>{item.name}</Text>
                      <ChevronRight size={20} color={colors.textSecondary} />
                    </View>
                    {category && (
                      <Text style={[styles.searchResultCategory, { color: colors.primary }]}>
                        {category.name}
                      </Text>
                    )}
                    <View style={styles.searchResultDetails}>
                      {item.serialNumber && (
                        <Text style={[styles.searchResultDetail, { color: colors.textSecondary }]}>
                          S/N: {item.serialNumber}
                        </Text>
                      )}
                      {item.plantNumber && (
                        <Text style={[styles.searchResultDetail, { color: colors.textSecondary }]}>
                          Plant #: {item.plantNumber}
                        </Text>
                      )}
                    </View>
                    {item.certificates.length > 0 && (
                      <View style={styles.searchResultCerts}>
                        <FileText size={14} color={colors.primary} />
                        <Text style={[styles.searchResultCertsText, { color: colors.textSecondary }]}>
                          {item.certificates.length} certificate{item.certificates.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </>
        ) : (
          <>
            <View style={styles.header}>
              <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
                <Package size={28} color={colors.primary} />
              </View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Equipment Management</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {rootCategories.length} {rootCategories.length === 1 ? 'category' : 'categories'}, {allItems.length} {allItems.length === 1 ? 'item' : 'items'}
              </Text>
            </View>

            {isAdmin && (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={() => setCategoryModalVisible(true)}
              >
                <FolderPlus size={20} color="#ffffff" />
                <Text style={styles.addButtonText}>Create Category</Text>
              </TouchableOpacity>
            )}

            {rootCategories.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <Package size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Categories Yet</Text>
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  {isAdmin
                    ? 'Create your first category to organize equipment'
                    : 'No equipment categories have been created yet'}
                </Text>
              </View>
            ) : (
              rootCategories.map(category => {
                const subcategories = getSubcategories(category.id);
                const items = getCategoryEquipmentItems(category.id);
                
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => handleNavigateToCategory(category.id, category.name)}
                  >
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryHeaderLeft}>
                        <View style={[styles.categoryIcon, { backgroundColor: colors.primary + '15' }]}>
                          <Package size={18} color={colors.primary} />
                        </View>
                        <View style={styles.categoryInfo}>
                          <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
                          <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                            {subcategories.length > 0 && `${subcategories.length} subcategories • `}
                            {items.length} {items.length === 1 ? 'item' : 'items'}
                          </Text>
                        </View>
                      </View>
                      <ChevronRight size={20} color={colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={showReminders}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReminders(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.remindersContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.modalHeaderLeft}>
                <Bell size={24} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Reminders</Text>
              </View>
              <TouchableOpacity onPress={() => setShowReminders(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.remindersScroll}>
              {allReminders.length === 0 ? (
                <View style={styles.emptyReminders}>
                  <Bell size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Active Reminders</Text>
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                    All certificates are up to date
                  </Text>
                </View>
              ) : (
                allReminders.map(reminder => (
                  <View key={reminder.id} style={[styles.reminderCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={[styles.reminderStatus, { backgroundColor: reminder.status === 'expired' ? '#fee2e2' : '#fef3c7' }]}>
                      <AlertCircle size={16} color={reminder.status === 'expired' ? '#dc2626' : '#f59e0b'} />
                    </View>
                    <View style={styles.reminderContent}>
                      <Text style={[styles.reminderItemName, { color: colors.text }]}>{reminder.itemName}</Text>
                      <Text style={[styles.reminderCertName, { color: colors.textSecondary }]}>{reminder.certificateName}</Text>
                      <View style={styles.reminderMeta}>
                        <Calendar size={12} color={colors.textSecondary} />
                        <Text style={[styles.reminderDate, { color: colors.textSecondary }]}>
                          {reminder.status === 'expired' 
                            ? `Expired ${reminder.daysUntilExpiry} days ago`
                            : `Expires in ${reminder.daysUntilExpiry} days`}
                        </Text>
                      </View>
                      <View style={styles.reminderBadges}>
                        {reminder.has7DayReminder && (
                          <View style={[styles.reminderTypeBadge, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={[styles.reminderTypeBadgeText, { color: colors.primary }]}>7-day</Text>
                          </View>
                        )}
                        {reminder.has30DayReminder && (
                          <View style={[styles.reminderTypeBadge, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={[styles.reminderTypeBadgeText, { color: colors.primary }]}>30-day</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={resetCategoryModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingCategoryId ? 'Edit Category' : parentCategoryId ? 'Create Subcategory' : 'Create Category'}
              </Text>
              <TouchableOpacity onPress={resetCategoryModal}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={[styles.label, { color: colors.text }]}>
                {parentCategoryId ? 'Subcategory' : 'Category'} Name *
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder={parentCategoryId ? "e.g., Chains, Hooks, Slings" : "e.g., Lifting, Tools, Safety"}
                placeholderTextColor={colors.textSecondary}
                value={categoryName}
                onChangeText={setCategoryName}
              />
            </View>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background }]}
                onPress={resetCategoryModal}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveCategory}
              >
                <Text style={styles.saveButtonText}>{editingCategoryId ? 'Update' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={itemModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={resetItemModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContainer, { maxHeight: '90%', backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingItemId ? 'Edit Item' : 'Add Item'}
              </Text>
              <TouchableOpacity onPress={resetItemModal}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} keyboardShouldPersistTaps="handled">
              <View style={styles.modalContent}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Item Name *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="e.g., 2-Leg Chain Sling 3m"
                    placeholderTextColor={colors.textSecondary}
                    value={itemName}
                    onChangeText={setItemName}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Serial Number</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      placeholder="S/N"
                      placeholderTextColor={colors.textSecondary}
                      value={serialNumber}
                      onChangeText={setSerialNumber}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Plant Number</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      placeholder="Plant #"
                      placeholderTextColor={colors.textSecondary}
                      value={plantNumber}
                      onChangeText={setPlantNumber}
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Make</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      placeholder="Manufacturer"
                      placeholderTextColor={colors.textSecondary}
                      value={make}
                      onChangeText={setMake}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Model</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      placeholder="Model"
                      placeholderTextColor={colors.textSecondary}
                      value={model}
                      onChangeText={setModel}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="Additional notes..."
                    placeholderTextColor={colors.textSecondary}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background }]}
                onPress={resetItemModal}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveItem}
              >
                <Text style={styles.saveButtonText}>{editingItemId ? 'Update' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={certificateModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={resetCertificateModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContainer, { maxHeight: '85%', backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Upload Certificate</Text>
              <TouchableOpacity onPress={resetCertificateModal}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} keyboardShouldPersistTaps="handled">
              <View style={styles.modalContent}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Certificate Name *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="e.g., Inspection Certificate 2024"
                    placeholderTextColor={colors.textSecondary}
                    value={certificateName}
                    onChangeText={setCertificateName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>File Type</Text>
                  <View style={styles.fileTypeRow}>
                    <TouchableOpacity
                      style={[
                        styles.fileTypeButton,
                        { borderColor: colors.border },
                        fileType === 'pdf' && { backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}
                      onPress={() => setFileType('pdf')}
                    >
                      <File size={16} color={fileType === 'pdf' ? '#ffffff' : colors.textSecondary} />
                      <Text style={[
                        styles.fileTypeText,
                        { color: fileType === 'pdf' ? '#ffffff' : colors.textSecondary }
                      ]}>PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.fileTypeButton,
                        { borderColor: colors.border },
                        fileType === 'image' && { backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}
                      onPress={() => setFileType('image')}
                    >
                      <ImageIcon size={16} color={fileType === 'image' ? '#ffffff' : colors.textSecondary} />
                      <Text style={[
                        styles.fileTypeText,
                        { color: fileType === 'image' ? '#ffffff' : colors.textSecondary }
                      ]}>Image</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.fileTypeButton,
                        { borderColor: colors.border },
                        fileType === 'all' && { backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}
                      onPress={() => setFileType('all')}
                    >
                      <Text style={[
                        styles.fileTypeText,
                        { color: fileType === 'all' ? '#ffffff' : colors.textSecondary }
                      ]}>All</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Certificate File *</Text>
                  <TouchableOpacity
                    style={[
                      styles.uploadButton,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      certificateFile && { borderColor: colors.primary }
                    ]}
                    onPress={handlePickCertificate}
                  >
                    {certificateFile ? (
                      <>
                        <Check size={20} color={colors.primary} />
                        <Text style={[styles.uploadButtonText, { color: colors.primary }]}>
                          {certificateFile.name}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Upload size={20} color={colors.textSecondary} />
                        <Text style={[styles.uploadButtonText, { color: colors.textSecondary }]}>
                          Select {fileType === 'pdf' ? 'PDF' : fileType === 'image' ? 'Image' : 'PDF or Image'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Expiry Date (Optional)</Text>
                  <TouchableOpacity
                    style={[styles.datePickerButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => setShowExpiryDatePicker(true)}
                  >
                    <Calendar size={18} color={colors.textSecondary} />
                    <Text style={[expiryDate ? styles.datePickerText : styles.datePickerPlaceholder, { color: expiryDate ? colors.text : colors.textSecondary }]}>
                      {expiryDate ? new Date(expiryDate).toLocaleDateString('en-GB') : 'Select date'}
                    </Text>
                  </TouchableOpacity>
                  {showExpiryDatePicker && (
                    <DateTimePicker
                      value={expiryDate ? new Date(expiryDate) : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, selectedDate) => {
                        setShowExpiryDatePicker(Platform.OS === 'ios');
                        if (selectedDate) {
                          setExpiryDate(selectedDate.toISOString().split('T')[0]);
                        }
                      }}
                    />
                  )}
                </View>

                {expiryDate && (
                  <View style={styles.reminderSection}>
                    <TouchableOpacity
                      style={styles.checkboxRow}
                      onPress={() => setHas30DayReminder(!has30DayReminder)}
                    >
                      <View style={[
                        styles.checkbox,
                        { borderColor: colors.border },
                        has30DayReminder && { backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}>
                        {has30DayReminder && <Check size={14} color="#ffffff" />}
                      </View>
                      <Text style={[styles.checkboxLabel, { color: colors.text }]}>30-day reminder</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.checkboxRow}
                      onPress={() => setHas7DayReminder(!has7DayReminder)}
                    >
                      <View style={[
                        styles.checkbox,
                        { borderColor: colors.border },
                        has7DayReminder && { backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}>
                        {has7DayReminder && <Check size={14} color="#ffffff" />}
                      </View>
                      <Text style={[styles.checkboxLabel, { color: colors.text }]}>7-day reminder</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background }]}
                onPress={resetCertificateModal}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveCertificate}
              >
                <Text style={styles.saveButtonText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  searchResultCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600' as const,
    flex: 1,
  },
  searchResultCategory: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  searchResultDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  searchResultDetail: {
    fontSize: 12,
  },
  searchResultCerts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchResultCertsText: {
    fontSize: 12,
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
  addButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  categoryCard: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    marginLeft: 12,
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 13,
  },
  emptyState: {
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  reminderBadge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  reminderBadgeCount: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  remindersContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  remindersScroll: {
    padding: 20,
  },
  emptyReminders: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  reminderStatus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderContent: {
    flex: 1,
  },
  reminderItemName: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  reminderCertName: {
    fontSize: 13,
    marginBottom: 8,
  },
  reminderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  reminderDate: {
    fontSize: 12,
  },
  reminderBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  reminderTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reminderTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  modalScrollView: {
    maxHeight: '70%',
  },
  modalContent: {
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  input: {
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  fileTypeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fileTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  fileTypeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    flex: 0.8,
  },
  saveButton: {
    flex: 1.2,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    padding: 14,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
  },
  datePickerText: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  datePickerPlaceholder: {
    fontSize: 15,
  },
  reminderSection: {
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
  },
});
