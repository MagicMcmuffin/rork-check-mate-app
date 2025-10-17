import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform, Image } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, FileText, Calendar, Download, Trash2, ImageIcon, CalendarDays } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { Ticket } from '@/types';

export default function MyTicketsScreen() {
  const { user, company, tickets, addTicket, deleteTicket } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const userTickets = tickets.filter((t: Ticket) => t.employeeId === user?.id);

  const filteredTickets = userTickets.filter((ticket: Ticket) => {
    const matchesType = filterType === 'all' || ticket.type === filterType;
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ticket.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleAddTicket = () => {
    setShowAddModal(true);
  };

  const handleDownload = async (ticket: Ticket) => {
    if (!ticket.fileUri) {
      Alert.alert('No File', 'This ticket has no attached file.');
      return;
    }

    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = ticket.fileUri;
        link.download = ticket.fileName || 'ticket-file';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(ticket.fileUri, {
            mimeType: ticket.mimeType,
            dialogTitle: `Download ${ticket.fileName}`,
          });
        } else {
          Alert.alert('Sharing Unavailable', 'File sharing is not available on this device.');
        }
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', 'Failed to download file.');
    }
  };

  const handleDelete = (ticketId: string) => {
    Alert.alert(
      'Delete Ticket',
      'Are you sure you want to delete this ticket?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTicket(ticketId),
        },
      ]
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'certificate': return '#3b82f6';
      case 'license': return '#10b981';
      case 'training': return '#8b5cf6';
      case 'card': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'certificate': return 'Certificate';
      case 'license': return 'License';
      case 'training': return 'Training';
      case 'card': return 'Card';
      default: return 'Other';
    }
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#1e293b' },
          headerTintColor: '#fff',
          title: 'My Tickets',
          headerRight: () => (
            <TouchableOpacity onPress={handleAddTicket} style={styles.headerButton}>
              <Plus size={24} color="#3b82f6" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tickets..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['all', 'certificate', 'license', 'training', 'card', 'other'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                filterType === type && styles.filterChipActive,
              ]}
              onPress={() => setFilterType(type)}
            >
              <Text style={[
                styles.filterChipText,
                filterType === type && styles.filterChipTextActive,
              ]}>
                {type === 'all' ? 'All' : getTypeLabel(type)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {filteredTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={64} color="#475569" />
            <Text style={styles.emptyStateTitle}>No tickets yet</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery || filterType !== 'all'
                ? 'No tickets match your search criteria'
                : 'Add your certificates, licenses and training records'}
            </Text>
            {!searchQuery && filterType === 'all' && (
              <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddTicket}>
                <Plus size={20} color="#fff" />
                <Text style={styles.emptyStateButtonText}>Add Your First Ticket</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.ticketsList}>
            {filteredTickets.map((ticket: Ticket) => (
              <View key={ticket.id} style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <View style={[styles.typeBadge, { backgroundColor: getTypeColor(ticket.type) }]}>
                    <Text style={styles.typeBadgeText}>{getTypeLabel(ticket.type)}</Text>
                  </View>
                  <View style={styles.ticketActions}>
                    {ticket.fileUri && (
                      <TouchableOpacity
                        onPress={() => handleDownload(ticket)}
                        style={styles.iconButton}
                      >
                        <Download size={20} color="#3b82f6" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => handleDelete(ticket.id)}
                      style={styles.iconButton}
                    >
                      <Trash2 size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.ticketTitle}>{ticket.title}</Text>

                {ticket.fileName && (
                  <View style={styles.fileInfo}>
                    <FileText size={16} color="#64748b" />
                    <Text style={styles.fileName}>{ticket.fileName}</Text>
                  </View>
                )}

                {ticket.expiryDate && (
                  <View style={styles.expiryInfo}>
                    <Calendar size={16} color={isExpired(ticket.expiryDate) ? '#ef4444' : isExpiringSoon(ticket.expiryDate) ? '#f59e0b' : '#64748b'} />
                    <Text style={[
                      styles.expiryText,
                      isExpired(ticket.expiryDate) && styles.expiredText,
                      isExpiringSoon(ticket.expiryDate) && styles.expiryingSoonText,
                    ]}>
                      {isExpired(ticket.expiryDate) ? 'Expired: ' : 'Expires: '}
                      {new Date(ticket.expiryDate).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                {ticket.notes && (
                  <Text style={styles.ticketNotes}>{ticket.notes}</Text>
                )}

                <Text style={styles.ticketDate}>
                  Added {new Date(ticket.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {showAddModal && (
        <AddTicketModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={addTicket}
          user={user}
          company={company}
        />
      )}
    </SafeAreaView>
  );
}

interface AddTicketModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Ticket>;
  user: any;
  company: any;
}

function AddTicketModal({ visible, onClose, onAdd, user, company }: AddTicketModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'certificate' | 'license' | 'training' | 'card' | 'other'>('certificate');
  const [notes, setNotes] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; mimeType: string; isImage: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const isImage = file.mimeType?.startsWith('image/') || false;
        setSelectedFile({
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType || 'application/octet-stream',
          isImage,
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handlePickPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const image = result.assets[0];
        const fileName = image.uri.split('/').pop() || 'photo.jpg';
        setSelectedFile({
          uri: image.uri,
          name: fileName,
          mimeType: 'image/jpeg',
          isImage: true,
        });
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to pick photo');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const image = result.assets[0];
        const fileName = `photo_${Date.now()}.jpg`;
        setSelectedFile({
          uri: image.uri,
          name: fileName,
          mimeType: 'image/jpeg',
          isImage: true,
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const showAttachmentOptions = () => {
    Alert.alert(
      'Add Attachment',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose Photo', onPress: handlePickPhoto },
        { text: 'Choose File', onPress: handlePickDocument },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title');
      return;
    }

    setIsSubmitting(true);

    try {
      await onAdd({
        companyId: company?.id || '',
        employeeId: user?.id || '',
        employeeName: user?.name || '',
        title: title.trim(),
        type,
        fileUri: selectedFile?.uri,
        fileName: selectedFile?.name,
        mimeType: selectedFile?.mimeType,
        expiryDate: expiryDate || undefined,
        notes: notes.trim() || undefined,
        reminderEnabled,
        reminderDate: reminderEnabled && expiryDate ? new Date(new Date(expiryDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      });

      Alert.alert('Success', 'Ticket added successfully');
      onClose();
    } catch (error) {
      console.error('Error adding ticket:', error);
      Alert.alert('Error', 'Failed to add ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add New Ticket</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalScroll}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., CSCS Card"
            placeholderTextColor="#64748b"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Type</Text>
          <View style={styles.typeSelector}>
            {(['certificate', 'license', 'training', 'card', 'other'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeOption, type === t && styles.typeOptionActive]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.typeOptionText, type === t && styles.typeOptionTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Expiry Date (Optional)</Text>
          <TouchableOpacity 
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(!showDatePicker)}
          >
            <CalendarDays size={20} color="#3b82f6" />
            <Text style={styles.datePickerButtonText}>
              {expiryDate ? new Date(expiryDate).toLocaleDateString() : 'Select Date'}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <View style={styles.calendarContainer}>
              <CalendarPicker
                selectedDate={expiryDate}
                onSelectDate={(date) => {
                  setExpiryDate(date);
                  setShowDatePicker(false);
                }}
              />
            </View>
          )}

          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add any additional information..."
            placeholderTextColor="#64748b"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          {selectedFile ? (
            <View style={styles.attachmentPreview}>
              {selectedFile.isImage ? (
                <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} />
              ) : (
                <View style={styles.previewFileIcon}>
                  <FileText size={40} color="#64748b" />
                </View>
              )}
              <View style={styles.attachmentInfo}>
                <Text style={styles.attachmentName} numberOfLines={2}>{selectedFile.name}</Text>
                <TouchableOpacity style={styles.removeButton} onPress={handleRemoveFile}>
                  <Trash2 size={16} color="#ef4444" />
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.fileButton} onPress={showAttachmentOptions}>
              <ImageIcon size={20} color="#3b82f6" />
              <Text style={styles.fileButtonText}>Add Photo or File</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.reminderToggle}
            onPress={() => setReminderEnabled(!reminderEnabled)}
          >
            <View style={[styles.checkbox, reminderEnabled && styles.checkboxActive]}>
              {reminderEnabled && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.reminderText}>Set reminder 30 days before expiry</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Adding...' : 'Add Ticket'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  headerButton: {
    marginRight: 16,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterChipText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  ticketsList: {
    gap: 16,
  },
  ticketCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  ticketActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  fileName: {
    fontSize: 14,
    color: '#94a3b8',
    flex: 1,
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  expiryText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  expiredText: {
    color: '#ef4444',
    fontWeight: '600' as const,
  },
  expiryingSoonText: {
    color: '#f59e0b',
    fontWeight: '600' as const,
  },
  ticketNotes: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 20,
  },
  ticketDate: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  modalClose: {
    fontSize: 24,
    color: '#94a3b8',
    fontWeight: 'bold' as const,
  },
  modalScroll: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#94a3b8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  typeOptionActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  typeOptionText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  typeOptionTextActive: {
    color: '#fff',
    fontWeight: '600' as const,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  fileButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    flex: 1,
  },
  reminderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  reminderText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  datePickerButtonText: {
    color: '#94a3b8',
    fontSize: 16,
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  attachmentPreview: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
    gap: 12,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  previewFileIcon: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  attachmentName: {
    color: '#94a3b8',
    fontSize: 14,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removeButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600' as const,
  },
});

interface CalendarPickerProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

function CalendarPicker({ selectedDate, onSelectDate }: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentMonth);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const selected = new Date(year, month, day);
    onSelectDate(selected.toISOString().split('T')[0]);
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate);
    return selected.getDate() === day && 
           selected.getMonth() === month && 
           selected.getFullYear() === year;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={calendarStyles.dayCell} />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const selected = isSelected(day);
      days.push(
        <TouchableOpacity
          key={day}
          style={[calendarStyles.dayCell, selected && calendarStyles.selectedDay]}
          onPress={() => handleDateSelect(day)}
        >
          <Text style={[calendarStyles.dayText, selected && calendarStyles.selectedDayText]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    return days;
  };

  return (
    <View style={calendarStyles.container}>
      <View style={calendarStyles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={calendarStyles.navButton}>
          <Text style={calendarStyles.navButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={calendarStyles.monthText}>
          {monthNames[month]} {year}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} style={calendarStyles.navButton}>
          <Text style={calendarStyles.navButtonText}>→</Text>
        </TouchableOpacity>
      </View>
      
      <View style={calendarStyles.weekDays}>
        {dayNames.map((day, i) => (
          <View key={i} style={calendarStyles.weekDayCell}>
            <Text style={calendarStyles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>
      
      <View style={calendarStyles.daysGrid}>
        {renderDays()}
      </View>
    </View>
  );
}

const calendarStyles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  navButtonText: {
    color: '#3b82f6',
    fontSize: 24,
    fontWeight: 'bold' as const,
  },
  monthText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  selectedDay: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  dayText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold' as const,
  },
});
