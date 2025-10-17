import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Package, Plus, Trash2, Edit2, FolderPlus, FileText, Calendar, X, Check, Upload, Download, Eye, File, Image as ImageIcon } from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Platform, KeyboardAvoidingView, Linking } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type FileType = 'pdf' | 'image' | 'all';

export default function EquipmentCategoryDetailScreen() {
  const { categoryId, categoryName } = useLocalSearchParams<{ categoryId: string; categoryName: string }>();
  const { 
    user,
    getCompanyEquipmentCategories,
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

  const [subcategoryModalVisible, setSubcategoryModalVisible] = useState(false);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [subcategoryName, setSubcategoryName] = useState('');

  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [plantNumber, setPlantNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [notes, setNotes] = useState('');

  const [certificateModalVisible, setCertificateModalVisible] = useState(false);
  const [viewCertificateModal, setViewCertificateModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [certificateName, setCertificateName] = useState('');
  const [certificateFile, setCertificateFile] = useState<{ uri: string; mimeType: string; name: string } | null>(null);
  const [viewingCertificate, setViewingCertificate] = useState<{ uri: string; mimeType: string; name: string } | null>(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [has30DayReminder, setHas30DayReminder] = useState(false);
  const [has7DayReminder, setHas7DayReminder] = useState(false);
  const [fileType, setFileType] = useState<FileType>('all');

  const isAdmin = user?.role === 'company' || user?.role === 'administrator' || user?.role === 'management';
  const categories = getCompanyEquipmentCategories();
  const subcategories = categories.filter(c => c.parentCategoryId === categoryId);
  const directItems = getCategoryEquipmentItems(categoryId);

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

  const handleSaveSubcategory = async () => {
    if (!subcategoryName.trim()) {
      Alert.alert('Error', 'Please enter a subcategory name');
      return;
    }

    try {
      if (editingSubcategoryId) {
        await updateEquipmentCategory(editingSubcategoryId, subcategoryName);
        Alert.alert('Success', 'Subcategory updated successfully');
      } else {
        await addEquipmentCategory(subcategoryName, categoryId);
        Alert.alert('Success', 'Subcategory created successfully');
      }
      resetSubcategoryModal();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save subcategory');
      console.error('Save subcategory error:', error);
    }
  };

  const handleEditSubcategory = (subcategoryId: string, name: string) => {
    setEditingSubcategoryId(subcategoryId);
    setSubcategoryName(name);
    setSubcategoryModalVisible(true);
  };

  const handleDeleteSubcategory = (subcategoryId: string, subcategoryName: string) => {
    Alert.alert(
      'Delete Subcategory',
      `Are you sure you want to delete "${subcategoryName}"? All items must be deleted first.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEquipmentCategory(subcategoryId);
              Alert.alert('Success', 'Subcategory deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete subcategory');
              console.error('Delete subcategory error:', error);
            }
          },
        },
      ]
    );
  };

  const resetSubcategoryModal = () => {
    setSubcategoryModalVisible(false);
    setEditingSubcategoryId(null);
    setSubcategoryName('');
  };

  const handleOpenItemModal = (subcategoryId?: string) => {
    setSelectedSubcategoryId(subcategoryId || categoryId);
    setItemModalVisible(true);
  };

  const handleEditItem = (item: any) => {
    setEditingItemId(item.id);
    setSelectedSubcategoryId(item.categoryId);
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

    if (!selectedSubcategoryId) {
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
          categoryId: selectedSubcategoryId,
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
    setSelectedSubcategoryId(null);
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

  const handleViewCertificate = (uri: string, mimeType: string, name: string) => {
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
      setViewingCertificate({ uri, mimeType, name });
      setViewCertificateModal(true);
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

  const renderItem = (item: any) => {
    const expiringCerts = item.certificates.filter((cert: any) => {
      const status = getExpiryStatus(cert.expiryDate);
      return status && (status.status === 'expired' || status.status === 'expiring-soon');
    });

    return (
      <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.itemHeader}>
          <View style={styles.itemHeaderLeft}>
            <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
            {expiringCerts.length > 0 && (
              <View style={styles.itemWarningBadge}>
                <Text style={styles.itemWarningText}>⚠️ {expiringCerts.length}</Text>
              </View>
            )}
          </View>
          {isAdmin && (
            <View style={styles.itemActions}>
              <TouchableOpacity
                style={[styles.itemActionButton, { backgroundColor: colors.primary + '15' }]}
                onPress={() => handleOpenCertificateModal(item.id)}
              >
                <Upload size={14} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.itemActionButton, { backgroundColor: colors.card }]}
                onPress={() => handleEditItem(item)}
              >
                <Edit2 size={14} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.itemActionButton, { backgroundColor: '#fee2e2' }]}
                onPress={() => handleDeleteItem(item.id, item.name)}
              >
                <Trash2 size={14} color="#dc2626" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {(item.serialNumber || item.plantNumber || item.make || item.model) && (
          <View style={styles.itemDetails}>
            {item.serialNumber && (
              <View style={styles.detailBadge}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>S/N:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{item.serialNumber}</Text>
              </View>
            )}
            {item.plantNumber && (
              <View style={styles.detailBadge}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Plant #:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{item.plantNumber}</Text>
              </View>
            )}
            {item.make && (
              <View style={styles.detailBadge}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Make:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{item.make}</Text>
              </View>
            )}
            {item.model && (
              <View style={styles.detailBadge}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Model:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{item.model}</Text>
              </View>
            )}
          </View>
        )}

        {item.notes && (
          <Text style={[styles.itemNotes, { color: colors.textSecondary }]}>{item.notes}</Text>
        )}

        {item.certificates.length > 0 && (
          <View style={[styles.certificatesSection, { borderTopColor: colors.border }]}>
            <View style={styles.certificatesHeader}>
              <FileText size={14} color={colors.primary} />
              <Text style={[styles.certificatesTitle, { color: colors.text }]}>
                Certificates ({item.certificates.length})
              </Text>
            </View>
            <View style={styles.certificatesList}>
              {item.certificates.map((cert: any) => {
                const expiryStatus = getExpiryStatus(cert.expiryDate);
                const isPdf = cert.mimeType.includes('pdf');
                return (
                  <View key={cert.id} style={[styles.certificateItem, { backgroundColor: colors.card }]}>
                    <View style={styles.certificateIcon}>
                      {isPdf ? (
                        <File size={16} color={colors.primary} />
                      ) : (
                        <ImageIcon size={16} color={colors.primary} />
                      )}
                    </View>
                    <View style={styles.certificateInfo}>
                      <Text style={[styles.certificateName, { color: colors.text }]}>{cert.name}</Text>
                      <View style={styles.certificateMeta}>
                        {cert.expiryDate && (
                          <View style={styles.certificateExpiry}>
                            <Calendar size={11} color={expiryStatus?.color || colors.textSecondary} />
                            <Text style={[styles.certificateExpiryText, { color: colors.textSecondary }]}>
                              {new Date(cert.expiryDate).toLocaleDateString('en-GB')}
                            </Text>
                          </View>
                        )}
                        {expiryStatus && (
                          <View style={[styles.expiryBadge, { backgroundColor: expiryStatus.color + '20' }]}>
                            <Text style={[styles.expiryBadgeText, { color: expiryStatus.color }]}>
                              {expiryStatus.status === 'expired' 
                                ? `${expiryStatus.days}d overdue`
                                : expiryStatus.status === 'expiring-soon'
                                ? `${expiryStatus.days}d left`
                                : `${expiryStatus.days}d valid`
                              }
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.certificateActions}>
                      <TouchableOpacity
                        style={[styles.certActionButton, { backgroundColor: colors.primary + '15' }]}
                        onPress={() => handleViewCertificate(cert.fileUri, cert.mimeType, cert.name)}
                      >
                        <Eye size={14} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.certActionButton, { backgroundColor: colors.primary + '15' }]}
                        onPress={() => handleDownloadCertificate(cert.fileUri, cert.name, cert.mimeType)}
                      >
                        <Download size={14} color={colors.primary} />
                      </TouchableOpacity>
                      {isAdmin && (
                        <TouchableOpacity
                          style={[styles.certActionButton, { backgroundColor: '#fee2e2' }]}
                          onPress={() => handleDeleteCertificate(item.id, cert.id, cert.name)}
                        >
                          <Trash2 size={14} color="#dc2626" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: categoryName || 'Category',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Back</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {isAdmin && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => setSubcategoryModalVisible(true)}
            >
              <FolderPlus size={18} color="#ffffff" />
              <Text style={styles.actionButtonText}>Add Subcategory</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => handleOpenItemModal()}
            >
              <Plus size={18} color="#ffffff" />
              <Text style={styles.actionButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        )}

        {subcategories.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Subcategories</Text>
            {subcategories.map(sub => {
              const items = getCategoryEquipmentItems(sub.id);
              return (
                <View key={sub.id} style={[styles.subcategoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.subcategoryHeader}>
                    <View style={styles.subcategoryHeaderLeft}>
                      <View style={[styles.subcategoryIcon, { backgroundColor: colors.primary + '15' }]}>
                        <Package size={16} color={colors.primary} />
                      </View>
                      <View style={styles.subcategoryInfo}>
                        <Text style={[styles.subcategoryName, { color: colors.text }]}>{sub.name}</Text>
                        <Text style={[styles.subcategoryCount, { color: colors.textSecondary }]}>
                          {items.length} {items.length === 1 ? 'item' : 'items'}
                        </Text>
                      </View>
                    </View>
                    {isAdmin && (
                      <View style={styles.subcategoryActions}>
                        <TouchableOpacity
                          style={[styles.iconButton, { backgroundColor: colors.background }]}
                          onPress={() => handleOpenItemModal(sub.id)}
                        >
                          <Plus size={14} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.iconButton, { backgroundColor: colors.background }]}
                          onPress={() => handleEditSubcategory(sub.id, sub.name)}
                        >
                          <Edit2 size={14} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.iconButton, { backgroundColor: '#fee2e2' }]}
                          onPress={() => handleDeleteSubcategory(sub.id, sub.name)}
                        >
                          <Trash2 size={14} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  {items.length > 0 && (
                    <View style={styles.subcategoryItems}>
                      {items.map(item => renderItem(item))}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        {directItems.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {subcategories.length > 0 ? 'Direct Items' : 'Items'}
            </Text>
            {directItems.map(item => renderItem(item))}
          </>
        )}

        {subcategories.length === 0 && directItems.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Package size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Items Yet</Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              {isAdmin ? 'Add your first item or subcategory' : 'No items in this category'}
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={subcategoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={resetSubcategoryModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingSubcategoryId ? 'Edit Subcategory' : 'Add Subcategory'}
              </Text>
              <TouchableOpacity onPress={resetSubcategoryModal}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={[styles.label, { color: colors.text }]}>Subcategory Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g., Chains, Hooks, Slings"
                placeholderTextColor={colors.textSecondary}
                value={subcategoryName}
                onChangeText={setSubcategoryName}
              />
            </View>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background }]}
                onPress={resetSubcategoryModal}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveSubcategory}
              >
                <Text style={styles.saveButtonText}>{editingSubcategoryId ? 'Update' : 'Create'}</Text>
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

      <Modal
        visible={viewCertificateModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setViewCertificateModal(false)}
      >
        <View style={styles.viewCertificateOverlay}>
          <View style={[styles.viewCertificateContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {viewingCertificate?.name || 'Certificate'}
              </Text>
              <TouchableOpacity onPress={() => setViewCertificateModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.viewCertificateContent}>
              <Text style={[styles.viewCertificateNote, { color: colors.textSecondary }]}>
                Certificate viewing on mobile requires downloading. Use the download button to save and view.
              </Text>
              <TouchableOpacity
                style={[styles.downloadButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  if (viewingCertificate) {
                    handleDownloadCertificate(viewingCertificate.uri, viewingCertificate.name, viewingCertificate.mimeType);
                    setViewCertificateModal(false);
                  }
                }}
              >
                <Download size={20} color="#ffffff" />
                <Text style={styles.downloadButtonText}>Download Certificate</Text>
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 14,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
    marginTop: 8,
  },
  subcategoryCard: {
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  subcategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  subcategoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subcategoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subcategoryInfo: {
    marginLeft: 10,
    flex: 1,
  },
  subcategoryName: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  subcategoryCount: {
    fontSize: 12,
  },
  subcategoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subcategoryItems: {
    padding: 14,
    paddingTop: 0,
    gap: 12,
  },
  itemCard: {
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600' as const,
    flex: 1,
  },
  itemWarningBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemWarningText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 6,
  },
  itemActionButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  itemNotes: {
    fontSize: 12,
    fontStyle: 'italic' as const,
    marginBottom: 10,
  },
  certificatesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  certificatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  certificatesTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  certificatesList: {
    gap: 8,
  },
  certificateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 8,
  },
  certificateIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  certificateInfo: {
    flex: 1,
  },
  certificateName: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  certificateMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  certificateExpiry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  certificateExpiryText: {
    fontSize: 11,
  },
  expiryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expiryBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  certificateActions: {
    flexDirection: 'row',
    gap: 6,
  },
  certActionButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
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
  viewCertificateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  viewCertificateContainer: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    overflow: 'hidden',
  },
  viewCertificateContent: {
    padding: 24,
    alignItems: 'center',
  },
  viewCertificateNote: {
    fontSize: 14,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 24,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
});
