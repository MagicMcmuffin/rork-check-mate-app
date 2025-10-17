import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';
import { Wrench, Plus, Trash2, Calendar, AlertCircle, FileText, X, Check, Upload, Droplet, Clock } from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Platform, KeyboardAvoidingView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Equipment } from '@/types';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function EquipmentScreen() {
  const { user, company, addEquipment, deleteEquipment, addGreasingRecord, getEquipmentGreasingRecords, deleteGreasingRecord } = useApp();
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
  const [set30DayReminder, setSet30DayReminder] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [thoroughExaminationCertificate, setThoroughExaminationCertificate] = useState('');
  const [greasingModalVisible, setGreasingModalVisible] = useState(false);
  const [selectedEquipmentForGreasing, setSelectedEquipmentForGreasing] = useState<Equipment | null>(null);
  const [greasingNotes, setGreasingNotes] = useState('');
  const [greasingDate, setGreasingDate] = useState('');
  const [greasingTime, setGreasingTime] = useState('');
  const [showGreasingDatePicker, setShowGreasingDatePicker] = useState(false);
  const [viewGreasingHistoryVisible, setViewGreasingHistoryVisible] = useState(false);

  const isAdmin = user?.role === 'company' || user?.role === 'administrator' || user?.role === 'management';
  const equipment = company?.equipment || [];

  const handleAddEquipment = async () => {
    if (!name.trim() || !make.trim() || !model.trim() || !serialNumber.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
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
        has30DayReminder: type === 'plant' && thoroughExaminationDate ? set30DayReminder : undefined,
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
      setSet30DayReminder(false);
      setModalVisible(false);
      Alert.alert('Success', 'Equipment added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add equipment');
      console.error('Add equipment error:', error);
    }
  };

  const handleOpenGreasingModal = (equipment: Equipment) => {
    setSelectedEquipmentForGreasing(equipment);
    setGreasingDate(new Date().toISOString().split('T')[0]);
    setGreasingTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
    setGreasingNotes('');
    setGreasingModalVisible(true);
  };

  const handleAddGreasingRecord = async () => {
    if (!selectedEquipmentForGreasing || !greasingDate || !greasingTime) {
      Alert.alert('Error', 'Please fill in date and time');
      return;
    }

    try {
      await addGreasingRecord({
        companyId: company!.id,
        equipmentId: selectedEquipmentForGreasing.id,
        equipmentName: selectedEquipmentForGreasing.name,
        employeeId: user!.id,
        employeeName: user!.name,
        date: greasingDate,
        time: greasingTime,
        notes: greasingNotes.trim() || undefined,
      });

      setGreasingModalVisible(false);
      setSelectedEquipmentForGreasing(null);
      setGreasingNotes('');
      Alert.alert('Success', 'Greasing record added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add greasing record');
      console.error('Add greasing record error:', error);
    }
  };

  const handleViewGreasingHistory = (equipment: Equipment) => {
    setSelectedEquipmentForGreasing(equipment);
    setViewGreasingHistoryVisible(true);
  };

  const handleDeleteGreasingRecord = (recordId: string) => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this greasing record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGreasingRecord(recordId);
              Alert.alert('Success', 'Greasing record deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete greasing record');
              console.error('Delete greasing record error:', error);
            }
          },
        },
      ]
    );
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
            <Text style={styles.addButtonText}>+ Add New</Text>
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
              {items.map((item) => {
                const greasingRecords = getEquipmentGreasingRecords(item.id);
                const lastGreasing = greasingRecords[0];
                
                return (
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
                    {(item.type === 'plant' || item.type === 'vehicles') && (
                      <View style={styles.greasingSection}>
                        <View style={styles.greasingSectionHeader}>
                          <Droplet size={14} color={colors.primary} />
                          <Text style={[styles.greasingSectionTitle, { color: colors.text }]}>Greasing</Text>
                        </View>
                        {lastGreasing ? (
                          <Text style={[styles.greasingLastRecord, { color: colors.textSecondary }]}>Last: {new Date(lastGreasing.date).toLocaleDateString()} at {lastGreasing.time}</Text>
                        ) : (
                          <Text style={[styles.greasingLastRecord, { color: colors.textSecondary }]}>No records yet</Text>
                        )}
                        <View style={styles.greasingButtons}>
                          <TouchableOpacity
                            style={[styles.greasingButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                            onPress={() => handleOpenGreasingModal(item)}
                          >
                            <Plus size={14} color={colors.primary} />
                            <Text style={[styles.greasingButtonText, { color: colors.primary }]}>Log Greasing</Text>
                          </TouchableOpacity>
                          {greasingRecords.length > 0 && (
                            <TouchableOpacity
                              style={[styles.greasingButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                              onPress={() => handleViewGreasingHistory(item)}
                            >
                              <Clock size={14} color={colors.textSecondary} />
                              <Text style={[styles.greasingButtonText, { color: colors.textSecondary }]}>History ({greasingRecords.length})</Text>
                            </TouchableOpacity>
                          )}
                        </View>
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
              );})}
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
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <View style={styles.modalHeaderContent}>
                <View style={[styles.modalIconContainer, { backgroundColor: colors.primary + '15' }]}>
                  <Wrench size={24} color={colors.primary} />
                </View>
                <View style={styles.modalHeaderText}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Add Equipment</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Fill in the details below</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.modalCloseButton, { backgroundColor: colors.background }]}
                onPress={() => setModalVisible(false)}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                <View style={[styles.formSection, { backgroundColor: colors.background }]}>
                  <Text style={[styles.sectionLabel, { color: colors.text }]}>Basic Information</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Equipment Name *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                      placeholder="e.g., Excavator 1"
                      placeholderTextColor={colors.textSecondary}
                      value={name}
                      onChangeText={setName}
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={[styles.label, { color: colors.text }]}>Make *</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                        placeholder="e.g., Caterpillar"
                        placeholderTextColor={colors.textSecondary}
                        value={make}
                        onChangeText={setMake}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={[styles.label, { color: colors.text }]}>Model *</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                        placeholder="e.g., 320D"
                        placeholderTextColor={colors.textSecondary}
                        value={model}
                        onChangeText={setModel}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Serial Number *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                      placeholder="Enter serial number"
                      placeholderTextColor={colors.textSecondary}
                      value={serialNumber}
                      onChangeText={setSerialNumber}
                    />
                  </View>
                </View>

                <View style={[styles.formSection, { backgroundColor: colors.background }]}>
                  <Text style={[styles.sectionLabel, { color: colors.text }]}>Equipment Type *</Text>
                  <View style={styles.typeGrid}>
                    <TouchableOpacity
                      style={[
                        styles.typeCard,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        type === 'plant' && { backgroundColor: colors.primary + '20', borderColor: colors.primary, borderWidth: 2 }
                      ]}
                      onPress={() => setType('plant')}
                    >
                      {type === 'plant' && (
                        <View style={[styles.typeCheckmark, { backgroundColor: colors.primary }]}>
                          <Check size={12} color="#ffffff" />
                        </View>
                      )}
                      <Text style={[
                        styles.typeCardText,
                        { color: colors.textSecondary },
                        type === 'plant' && { color: colors.primary, fontWeight: '700' as const }
                      ]}>
                        Plant
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.typeCard,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        type === 'vehicles' && { backgroundColor: colors.primary + '20', borderColor: colors.primary, borderWidth: 2 }
                      ]}
                      onPress={() => setType('vehicles')}
                    >
                      {type === 'vehicles' && (
                        <View style={[styles.typeCheckmark, { backgroundColor: colors.primary }]}>
                          <Check size={12} color="#ffffff" />
                        </View>
                      )}
                      <Text style={[
                        styles.typeCardText,
                        { color: colors.textSecondary },
                        type === 'vehicles' && { color: colors.primary, fontWeight: '700' as const }
                      ]}>
                        Vehicles
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.typeCard,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        type === 'other' && { backgroundColor: colors.primary + '20', borderColor: colors.primary, borderWidth: 2 }
                      ]}
                      onPress={() => setType('other')}
                    >
                      {type === 'other' && (
                        <View style={[styles.typeCheckmark, { backgroundColor: colors.primary }]}>
                          <Check size={12} color="#ffffff" />
                        </View>
                      )}
                      <Text style={[
                        styles.typeCardText,
                        { color: colors.textSecondary },
                        type === 'other' && { color: colors.primary, fontWeight: '700' as const }
                      ]}>
                        Other
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {type === 'plant' && (
                  <View style={[styles.formSection, { backgroundColor: colors.background }]}>
                    <Text style={[styles.sectionLabel, { color: colors.text }]}>Plant Details</Text>
                    
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>Registration Number</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                        placeholder="e.g., AB12 CDE"
                        placeholderTextColor={colors.textSecondary}
                        value={registration}
                        onChangeText={setRegistration}
                        autoCapitalize="characters"
                      />
                    </View>

                    <View style={styles.inputRow}>
                      <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={[styles.label, { color: colors.text }]}>Hitch Type</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                          placeholder="e.g., Quick Hitch"
                          placeholderTextColor={colors.textSecondary}
                          value={hitchType}
                          onChangeText={setHitchType}
                        />
                      </View>
                      <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={[styles.label, { color: colors.text }]}>Hitch Serial</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                          placeholder="Serial number"
                          placeholderTextColor={colors.textSecondary}
                          value={hitchSerial}
                          onChangeText={setHitchSerial}
                        />
                      </View>
                    </View>
                  </View>
                )}

                {type === 'plant' && (
                  <View style={[styles.formSection, { backgroundColor: colors.background }]}>
                    <View style={styles.sectionHeader}>
                      <Calendar size={18} color={colors.primary} />
                      <Text style={[styles.sectionLabel, { color: colors.text, marginBottom: 0, marginLeft: 8 }]}>Thorough Examination (Optional)</Text>
                    </View>
                    <Text style={[styles.sectionHelper, { color: colors.textSecondary }]}>Certificate valid for 12 months. We'll notify you when it's nearly expired.</Text>
                    
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>Examination Date (Optional)</Text>
                      <TouchableOpacity
                        style={[styles.datePickerButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <Calendar size={18} color={colors.textSecondary} />
                        <Text style={[thoroughExaminationDate ? styles.datePickerText : styles.datePickerPlaceholder, { color: thoroughExaminationDate ? colors.text : colors.textSecondary }]}>
                          {thoroughExaminationDate ? new Date(thoroughExaminationDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Select date'}
                        </Text>
                      </TouchableOpacity>
                      {showDatePicker && (
                        <DateTimePicker
                          value={thoroughExaminationDate ? new Date(thoroughExaminationDate) : new Date()}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={(event, selectedDate) => {
                            setShowDatePicker(Platform.OS === 'ios');
                            if (selectedDate) {
                              const formattedDate = selectedDate.toISOString().split('T')[0];
                              setThoroughExaminationDate(formattedDate);
                            }
                          }}
                        />
                      )}
                    </View>
                    
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => setSet30DayReminder(!set30DayReminder)}
                    >
                      <View style={[
                        styles.checkbox,
                        { borderColor: colors.border },
                        set30DayReminder && { backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}>
                        {set30DayReminder && <Check size={16} color="#ffffff" />}
                      </View>
                      <Text style={[styles.checkboxLabel, { color: colors.text }]}>Set 30-day reminder before expiry</Text>
                    </TouchableOpacity>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>Certificate Document (Optional)</Text>
                      <TouchableOpacity
                        style={[
                          styles.uploadArea,
                          { backgroundColor: colors.card, borderColor: colors.border },
                          thoroughExaminationCertificate && { borderColor: colors.primary }
                        ]}
                        onPress={handlePickDocument}
                      >
                        {thoroughExaminationCertificate ? (
                          <>
                            <View style={[styles.uploadIconSuccess, { backgroundColor: colors.primary + '20' }]}>
                              <Check size={24} color={colors.primary} />
                            </View>
                            <Text style={[styles.uploadText, { color: colors.primary }]}>Certificate Uploaded</Text>
                            <Text style={[styles.uploadSubtext, { color: colors.textSecondary }]}>Tap to change</Text>
                          </>
                        ) : (
                          <>
                            <View style={[styles.uploadIcon, { backgroundColor: colors.background }]}>
                              <Upload size={24} color={colors.textSecondary} />
                            </View>
                            <Text style={[styles.uploadText, { color: colors.text }]}>Upload Certificate</Text>
                            <Text style={[styles.uploadSubtext, { color: colors.textSecondary }]}>PDF or Image (Max 10MB)</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {type === 'vehicles' && (
                  <View style={[styles.formSection, { backgroundColor: colors.background }]}>
                    <Text style={[styles.sectionLabel, { color: colors.text }]}>Vehicle Details</Text>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>Registration Number</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                        placeholder="e.g., AB12 CDE"
                        placeholderTextColor={colors.textSecondary}
                        value={registration}
                        onChangeText={setRegistration}
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.footerButton, styles.footerButtonCancel, { backgroundColor: colors.background }]}
                onPress={() => setModalVisible(false)}
              >
                <X size={18} color={colors.textSecondary} />
                <Text style={[styles.footerButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerButton, styles.footerButtonSave, { backgroundColor: colors.primary }]}
                onPress={handleAddEquipment}
              >
                <Check size={18} color="#ffffff" />
                <Text style={[styles.footerButtonTextSave, { color: '#ffffff' }]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={greasingModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setGreasingModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContainer, { maxHeight: '70%' }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <View style={styles.modalHeaderContent}>
                <View style={[styles.modalIconContainer, { backgroundColor: colors.primary + '15' }]}>  
                  <Droplet size={24} color={colors.primary} />
                </View>
                <View style={styles.modalHeaderText}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Log Greasing</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{selectedEquipmentForGreasing?.name}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.modalCloseButton, { backgroundColor: colors.background }]}
                onPress={() => setGreasingModalVisible(false)}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                <View style={[styles.formSection, { backgroundColor: colors.background }]}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Date *</Text>
                    <TouchableOpacity
                      style={[styles.datePickerButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => setShowGreasingDatePicker(true)}
                    >
                      <Calendar size={18} color={colors.textSecondary} />
                      <Text style={[styles.datePickerText, { color: colors.text }]}>
                        {greasingDate ? new Date(greasingDate).toLocaleDateString() : 'Select date'}
                      </Text>
                    </TouchableOpacity>
                    {showGreasingDatePicker && (
                      <DateTimePicker
                        value={greasingDate ? new Date(greasingDate) : new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                          setShowGreasingDatePicker(Platform.OS === 'ios');
                          if (selectedDate) {
                            setGreasingDate(selectedDate.toISOString().split('T')[0]);
                          }
                        }}
                      />
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Time *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                      placeholder="HH:MM"
                      placeholderTextColor={colors.textSecondary}
                      value={greasingTime}
                      onChangeText={setGreasingTime}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                      placeholder="Add any notes about the greasing"
                      placeholderTextColor={colors.textSecondary}
                      value={greasingNotes}
                      onChangeText={setGreasingNotes}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.footerButton, styles.footerButtonCancel, { backgroundColor: colors.background }]}
                onPress={() => setGreasingModalVisible(false)}
              >
                <X size={18} color={colors.textSecondary} />
                <Text style={[styles.footerButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerButton, styles.footerButtonSave, { backgroundColor: colors.primary }]}
                onPress={handleAddGreasingRecord}
              >
                <Check size={18} color="#ffffff" />
                <Text style={[styles.footerButtonTextSave, { color: '#ffffff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={viewGreasingHistoryVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setViewGreasingHistoryVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '80%' }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <View style={styles.modalHeaderContent}>
                <View style={[styles.modalIconContainer, { backgroundColor: colors.primary + '15' }]}>
                  <Clock size={24} color={colors.primary} />
                </View>
                <View style={styles.modalHeaderText}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Greasing History</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{selectedEquipmentForGreasing?.name}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.modalCloseButton, { backgroundColor: colors.background }]}
                onPress={() => setViewGreasingHistoryVisible(false)}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.historyScrollView}>
              {selectedEquipmentForGreasing && getEquipmentGreasingRecords(selectedEquipmentForGreasing.id).map((record) => (
                <View key={record.id} style={[styles.historyCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.historyCardHeader}>
                    <View style={[styles.historyIconContainer, { backgroundColor: colors.primary + '15' }]}>
                      <Droplet size={16} color={colors.primary} />
                    </View>
                    <View style={styles.historyCardInfo}>
                      <Text style={[styles.historyDate, { color: colors.text }]}>
                        {new Date(record.date).toLocaleDateString()}
                      </Text>
                      <Text style={[styles.historyTime, { color: colors.textSecondary }]}>
                        {record.time}
                      </Text>
                    </View>
                    {isAdmin && (
                      <TouchableOpacity
                        style={styles.historyDeleteButton}
                        onPress={() => handleDeleteGreasingRecord(record.id)}
                      >
                        <Trash2 size={16} color="#dc2626" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={[styles.historyEmployee, { color: colors.textSecondary }]}>By {record.employeeName}</Text>
                  {record.notes && (
                    <Text style={[styles.historyNotes, { color: colors.text }]}>{record.notes}</Text>
                  )}
                </View>
              ))}
              {selectedEquipmentForGreasing && getEquipmentGreasingRecords(selectedEquipmentForGreasing.id).length === 0 && (
                <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                  <Droplet size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Greasing Records</Text>
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Start logging greasing records for this equipment</Text>
                </View>
              )}
            </ScrollView>
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    maxHeight: '95%',
    marginTop: 'auto',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 13,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  modalContent: {
    padding: 20,
    gap: 16,
  },
  formSection: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHelper: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  inputGroup: {
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  input: {
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    borderWidth: 1.5,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
  },
  typeCheckmark: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeCardText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  uploadArea: {
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  uploadIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  uploadIconSuccess: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  uploadSubtext: {
    fontSize: 13,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  footerButtonCancel: {
    flex: 0.8,
  },
  footerButtonSave: {
    flex: 1.2,
  },
  footerButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  footerButtonTextSave: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1.5,
  },
  datePickerText: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  datePickerPlaceholder: {
    fontSize: 15,
  },
  greasingSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  greasingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  greasingSectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  greasingLastRecord: {
    fontSize: 12,
    marginBottom: 8,
  },
  greasingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  greasingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  greasingButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  historyScrollView: {
    flex: 1,
    padding: 20,
  },
  historyCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  historyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyCardInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  historyTime: {
    fontSize: 13,
  },
  historyDeleteButton: {
    padding: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
  },
  historyEmployee: {
    fontSize: 13,
    marginBottom: 4,
  },
  historyNotes: {
    fontSize: 14,
    lineHeight: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
});
