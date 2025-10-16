import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';
import { Wrench, Plus, Trash2, Calendar, AlertCircle, FileText } from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Platform } from 'react-native';
import { Equipment } from '@/types';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function EquipmentScreen() {
  const { user, company, addEquipment, deleteEquipment } = useApp();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [type, setType] = useState<'plant' | 'vehicles' | 'lifting' | 'electrical' | 'cat-genny' | 'other'>('plant');
  const [hitchType, setHitchType] = useState('');
  const [hitchSerial, setHitchSerial] = useState('');
  const [registration, setRegistration] = useState('');
  const [thoroughExaminationDate, setThoroughExaminationDate] = useState('');
  const [thoroughExaminationCertificate, setThoroughExaminationCertificate] = useState('');

  const isAdmin = user?.role === 'company' || user?.role === 'administrator' || user?.role === 'management';
  const equipment = company?.equipment || [];

  const handleAddEquipment = async () => {
    if (!name.trim() || !make.trim() || !model.trim() || !serialNumber.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await addEquipment({
        name: name.trim(),
        make: make.trim(),
        model: model.trim(),
        serialNumber: serialNumber.trim(),
        type,
        hitchType: hitchType.trim() || undefined,
        hitchSerial: hitchSerial.trim() || undefined,
        registration: registration.trim() || undefined,
        thoroughExaminationDate: type === 'plant' && thoroughExaminationDate ? thoroughExaminationDate : undefined,
        thoroughExaminationCertificate: type === 'plant' && thoroughExaminationCertificate ? thoroughExaminationCertificate : undefined,
      });

      setName('');
      setMake('');
      setModel('');
      setSerialNumber('');
      setType('plant');
      setHitchType('');
      setHitchSerial('');
      setRegistration('');
      setThoroughExaminationDate('');
      setThoroughExaminationCertificate('');
      setModalVisible(false);
      Alert.alert('Success', 'Equipment added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add equipment');
      console.error('Add equipment error:', error);
    }
  };

  const handleDeleteEquipment = (equipmentId: string, equipmentName: string) => {
    Alert.alert(
      'Delete Equipment',
      `Are you sure you want to delete ${equipmentName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEquipment(equipmentId);
              Alert.alert('Success', 'Equipment deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete equipment');
              console.error('Delete equipment error:', error);
            }
          },
        },
      ]
    );
  };

  const groupedEquipment = equipment.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, Equipment[]>);

  const getExpiryStatus = (examinationDate?: string) => {
    if (!examinationDate) return null;
    
    const examDate = new Date(examinationDate);
    const today = new Date();
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    const expiryDate = new Date(examDate.getTime() + oneYear);
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', days: Math.abs(daysUntilExpiry), color: '#dc2626' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring-soon', days: daysUntilExpiry, color: '#f59e0b' };
    } else {
      return { status: 'valid', days: daysUntilExpiry, color: '#10b981' };
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (Platform.OS === 'web') {
          setThoroughExaminationCertificate(asset.uri);
        } else {
          const fileInfo = await FileSystem.getInfoAsync(asset.uri);
          if (fileInfo.exists && fileInfo.size && fileInfo.size < 10 * 1024 * 1024) {
            const base64 = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            setThoroughExaminationCertificate(`data:${asset.mimeType || 'application/pdf'};base64,${base64}`);
          } else {
            Alert.alert('Error', 'File is too large. Maximum size is 10MB.');
          }
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Equipment',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
            <Wrench size={28} color={colors.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Company Equipment</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {equipment.length} {equipment.length === 1 ? 'item' : 'items'}
          </Text>
        </View>

        {isAdmin && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(true)}
          >
            <Plus size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>Add Equipment</Text>
          </TouchableOpacity>
        )}

        {equipment.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Wrench size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Equipment Yet</Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              {isAdmin
                ? 'Add your company equipment to make it available for inspections'
                : 'No equipment has been added yet'}
            </Text>
          </View>
        ) : (
          Object.entries(groupedEquipment).map(([equipmentType, items]) => (
            <View key={equipmentType} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {equipmentType.charAt(0).toUpperCase() + equipmentType.slice(1)}
              </Text>
              {items.map((item) => (
                <View key={item.id} style={[styles.equipmentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.equipmentInfo}>
                    <Text style={[styles.equipmentName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.equipmentDetail, { color: colors.textSecondary }]}>
                      {item.make} {item.model}
                    </Text>
                    <Text style={[styles.equipmentSerial, { color: colors.textSecondary }]}>S/N: {item.serialNumber}</Text>
                    {item.hitchType && (
                      <Text style={[styles.equipmentSerial, { color: colors.textSecondary }]}>Hitch: {item.hitchType}</Text>
                    )}
                    {item.hitchSerial && (
                      <Text style={[styles.equipmentSerial, { color: colors.textSecondary }]}>Hitch S/N: {item.hitchSerial}</Text>
                    )}
                    {item.registration && (
                      <Text style={[styles.equipmentSerial, { color: colors.textSecondary }]}>Reg: {item.registration}</Text>
                    )}
                    {item.type === 'plant' && item.thoroughExaminationDate && (
                      <View style={styles.examinationInfo}>
                        <View style={styles.examinationRow}>
                          <Calendar size={14} color={getExpiryStatus(item.thoroughExaminationDate)?.color || colors.textSecondary} />
                          <Text style={[styles.equipmentSerial, { color: colors.textSecondary, marginLeft: 4 }]}>
                            Examination: {new Date(item.thoroughExaminationDate).toLocaleDateString()}
                          </Text>
                        </View>
                        {getExpiryStatus(item.thoroughExaminationDate) && (
                          <View style={[styles.expiryBadge, { backgroundColor: getExpiryStatus(item.thoroughExaminationDate)!.color + '20' }]}>
                            <AlertCircle size={12} color={getExpiryStatus(item.thoroughExaminationDate)!.color} />
                            <Text style={[styles.expiryText, { color: getExpiryStatus(item.thoroughExaminationDate)!.color }]}>
                              {getExpiryStatus(item.thoroughExaminationDate)!.status === 'expired' 
                                ? `Expired ${getExpiryStatus(item.thoroughExaminationDate)!.days} days ago`
                                : getExpiryStatus(item.thoroughExaminationDate)!.status === 'expiring-soon'
                                ? `Expires in ${getExpiryStatus(item.thoroughExaminationDate)!.days} days`
                                : `Valid for ${getExpiryStatus(item.thoroughExaminationDate)!.days} days`
                              }
                            </Text>
                          </View>
                        )}
                        {item.thoroughExaminationCertificate && (
                          <View style={styles.certificateInfo}>
                            <FileText size={12} color={colors.primary} />
                            <Text style={[styles.certificateText, { color: colors.primary }]}>Certificate attached</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                  {isAdmin && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteEquipment(item.id, item.name)}
                    >
                      <Trash2 size={18} color="#dc2626" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView 
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Equipment</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Equipment Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g., Excavator 1"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Make</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g., Caterpillar"
                placeholderTextColor={colors.textSecondary}
                value={make}
                onChangeText={setMake}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Model</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g., 320D"
                placeholderTextColor={colors.textSecondary}
                value={model}
                onChangeText={setModel}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Serial Number</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter serial number"
                placeholderTextColor={colors.textSecondary}
                value={serialNumber}
                onChangeText={setSerialNumber}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[styles.typeButton, { backgroundColor: colors.background, borderColor: colors.border }, type === 'plant' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setType('plant')}
                >
                  <Text style={[styles.typeButtonText, { color: colors.textSecondary }, type === 'plant' && styles.typeButtonTextActive]}>
                    Plant
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, { backgroundColor: colors.background, borderColor: colors.border }, type === 'vehicles' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setType('vehicles')}
                >
                  <Text style={[styles.typeButtonText, { color: colors.textSecondary }, type === 'vehicles' && styles.typeButtonTextActive]}>
                    Vehicles
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, { backgroundColor: colors.background, borderColor: colors.border }, type === 'lifting' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setType('lifting')}
                >
                  <Text style={[styles.typeButtonText, { color: colors.textSecondary }, type === 'lifting' && styles.typeButtonTextActive]}>
                    Lifting
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.typeButtons, { marginTop: 8 }]}>
                <TouchableOpacity
                  style={[styles.typeButton, { backgroundColor: colors.background, borderColor: colors.border }, type === 'electrical' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setType('electrical')}
                >
                  <Text style={[styles.typeButtonText, { color: colors.textSecondary }, type === 'electrical' && styles.typeButtonTextActive]}>
                    Electrical
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, { backgroundColor: colors.background, borderColor: colors.border }, type === 'cat-genny' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setType('cat-genny')}
                >
                  <Text style={[styles.typeButtonText, { color: colors.textSecondary }, type === 'cat-genny' && styles.typeButtonTextActive]}>
                    Cat&Genny
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, { backgroundColor: colors.background, borderColor: colors.border }, type === 'other' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setType('other')}
                >
                  <Text style={[styles.typeButtonText, { color: colors.textSecondary }, type === 'other' && styles.typeButtonTextActive]}>
                    Other
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {type === 'plant' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Hitch Type (Optional)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="e.g., Quick Hitch, Manual Hitch"
                    placeholderTextColor={colors.textSecondary}
                    value={hitchType}
                    onChangeText={setHitchType}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Hitch Serial (Optional)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="Enter hitch serial number"
                    placeholderTextColor={colors.textSecondary}
                    value={hitchSerial}
                    onChangeText={setHitchSerial}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Registration (Optional)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="e.g., AB12 CDE"
                    placeholderTextColor={colors.textSecondary}
                    value={registration}
                    onChangeText={setRegistration}
                    autoCapitalize="characters"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Date of Thorough Examination (Optional)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textSecondary}
                    value={thoroughExaminationDate}
                    onChangeText={setThoroughExaminationDate}
                  />
                  <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                    Valid for 12 months. You&apos;ll be notified when nearly expired.
                  </Text>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Upload Certificate (Optional)</Text>
                  <TouchableOpacity
                    style={[styles.uploadButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={handlePickDocument}
                  >
                    <FileText size={20} color={colors.primary} />
                    <Text style={[styles.uploadButtonText, { color: colors.text }]}>
                      {thoroughExaminationCertificate ? 'Certificate Selected' : 'Choose PDF or Image'}
                    </Text>
                  </TouchableOpacity>
                  {thoroughExaminationCertificate && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => setThoroughExaminationCertificate('')}
                    >
                      <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {type === 'vehicles' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Registration (Optional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g., AB12 CDE"
                  placeholderTextColor={colors.textSecondary}
                  value={registration}
                  onChangeText={setRegistration}
                  autoCapitalize="characters"
                />
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleAddEquipment}
              >
                <Text style={styles.saveButtonText}>Add Equipment</Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  addButton: {
    backgroundColor: '#1e40af',
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 12,
  },
  equipmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1e293b',
    marginBottom: 4,
  },
  equipmentDetail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  equipmentSerial: {
    fontSize: 13,
    color: '#94a3b8',
  },
  examinationInfo: {
    marginTop: 8,
    gap: 6,
  },
  examinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  expiryText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  certificateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  certificateText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed' as const,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  clearButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    fontSize: 14,
    textDecorationLine: 'underline' as const,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalScrollView: {
    maxHeight: '90%',
  },
  modalScrollContent: {
    flexGrow: 1,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  saveButton: {
    backgroundColor: '#1e40af',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
});
