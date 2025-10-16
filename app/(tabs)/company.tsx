import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';
import { Building2, Wrench, Briefcase, Plus, Trash2, Edit2, Mail, Megaphone, Upload, Image as ImageIcon } from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Equipment } from '@/types';

type Section = 'equipment' | 'projects' | 'announcements' | 'settings';

export default function CompanyScreen() {
  const { user, company, addEquipment, deleteEquipment, addProject, updateProject, deleteProject, createAnnouncement, getCompanyAnnouncements, deleteAnnouncement, updateCompanyLogo } = useApp();
  const { colors } = useTheme();
  const [activeSection, setActiveSection] = useState<Section>('equipment');
  
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [equipmentName, setEquipmentName] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [type, setType] = useState<'plant' | 'vehicle' | 'other'>('plant');
  const [hitchType, setHitchType] = useState('');
  const [registration, setRegistration] = useState('');

  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectNumber, setProjectNumber] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);

  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState<'low' | 'normal' | 'high'>('normal');

  const [logoModalVisible, setLogoModalVisible] = useState(false);

  const isAdmin = user?.role === 'company' || user?.role === 'administrator' || user?.role === 'management';
  const equipment = company?.equipment || [];
  const projects = company?.projects || [];
  const announcements = getCompanyAnnouncements();

  const handleAddEquipment = async () => {
    if (!equipmentName.trim() || !make.trim() || !model.trim() || !serialNumber.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await addEquipment({
        name: equipmentName.trim(),
        make: make.trim(),
        model: model.trim(),
        serialNumber: serialNumber.trim(),
        type,
        hitchType: hitchType.trim() || undefined,
        registration: registration.trim() || undefined,
      });

      setEquipmentName('');
      setMake('');
      setModel('');
      setSerialNumber('');
      setType('plant');
      setHitchType('');
      setRegistration('');
      setEquipmentModalVisible(false);
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

  const handleAddEmail = () => {
    const trimmedEmail = emailInput.trim();
    if (trimmedEmail && trimmedEmail.includes('@')) {
      setEmails([...emails, trimmedEmail]);
      setEmailInput('');
    } else {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
    }
  };

  const handleRemoveEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      Alert.alert('Error', 'Please enter a project name');
      return;
    }

    if (!projectNumber.trim()) {
      Alert.alert('Error', 'Please enter a project number');
      return;
    }

    if (emails.length === 0) {
      Alert.alert('Error', 'Please add at least one email address');
      return;
    }

    try {
      if (editingProject) {
        await updateProject(editingProject, projectName, projectNumber, emails);
      } else {
        await addProject(projectName, projectNumber, emails);
      }
      resetProjectModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to save project');
      console.error(error);
    }
  };

  const handleEditProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setEditingProject(projectId);
      setProjectName(project.name);
      setProjectNumber(project.projectNumber || '');
      setEmails(project.emails);
      setProjectModalVisible(true);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    Alert.alert('Delete Project', 'Are you sure you want to delete this project?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProject(projectId);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete project');
            console.error(error);
          }
        },
      },
    ]);
  };

  const resetProjectModal = () => {
    setProjectModalVisible(false);
    setEditingProject(null);
    setProjectName('');
    setProjectNumber('');
    setEmails([]);
    setEmailInput('');
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementTitle.trim()) {
      Alert.alert('Error', 'Please enter an announcement title');
      return;
    }
    if (!announcementMessage.trim()) {
      Alert.alert('Error', 'Please enter an announcement message');
      return;
    }

    try {
      await createAnnouncement(announcementTitle.trim(), announcementMessage.trim(), announcementPriority);
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      setAnnouncementPriority('normal');
      setAnnouncementModalVisible(false);
      Alert.alert('Success', 'Announcement created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create announcement');
      console.error('Create announcement error:', error);
    }
  };

  const handleDeleteAnnouncement = (announcementId: string) => {
    Alert.alert(
      'Delete Announcement',
      'Are you sure you want to delete this announcement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAnnouncement(announcementId);
              Alert.alert('Success', 'Announcement deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete announcement');
              console.error('Delete announcement error:', error);
            }
          },
        },
      ]
    );
  };

  const handleUploadLogo = async () => {
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
        setLogoModalVisible(false);
        Alert.alert('Success', 'Company logo updated successfully');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      Alert.alert('Error', 'Failed to upload logo');
    }
  };

  const handleRemoveLogo = async () => {
    Alert.alert(
      'Remove Logo',
      'Are you sure you want to remove the company logo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateCompanyLogo(undefined);
              setLogoModalVisible(false);
              Alert.alert('Success', 'Company logo removed successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove logo');
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

  const renderEquipmentSection = () => (
    <>
      {isAdmin && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setEquipmentModalVisible(true)}
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
              <View key={item.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.cardDetail, { color: colors.textSecondary }]}>
                    {item.make} {item.model}
                  </Text>
                  <Text style={[styles.cardSerial, { color: colors.textSecondary }]}>S/N: {item.serialNumber}</Text>
                  {item.hitchType && (
                    <Text style={[styles.cardSerial, { color: colors.textSecondary }]}>Hitch: {item.hitchType}</Text>
                  )}
                  {item.registration && (
                    <Text style={[styles.cardSerial, { color: colors.textSecondary }]}>Reg: {item.registration}</Text>
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
    </>
  );

  const renderProjectsSection = () => {
    if (user?.role !== 'company') {
      return (
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Briefcase size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Projects Not Available</Text>
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            Only company accounts can manage projects
          </Text>
        </View>
      );
    }

    return (
      <>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setProjectModalVisible(true)}
        >
          <Plus size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Add Project</Text>
        </TouchableOpacity>

        {projects.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Briefcase size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Projects Yet</Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Create your first project to organize inspections and manage email recipients
            </Text>
          </View>
        ) : (
          projects.map((project) => (
            <View key={project.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.projectHeader}>
                <View style={[styles.projectIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Briefcase size={24} color={colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: colors.text }]}>{project.name}</Text>
                  <Text style={[styles.cardDetail, { color: colors.textSecondary }]}>Project #{project.projectNumber}</Text>
                  <Text style={[styles.cardDetail, { color: colors.textSecondary }]}>
                    {project.emails.length} email{project.emails.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.projectActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.background }]}
                    onPress={() => handleEditProject(project.id)}
                  >
                    <Edit2 size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteProject(project.id)}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.emailsList}>
                {project.emails.map((email, index) => (
                  <View key={index} style={[styles.emailChip, { backgroundColor: colors.background }]}>
                    <Mail size={12} color={colors.textSecondary} />
                    <Text style={[styles.emailText, { color: colors.textSecondary }]}>{email}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </>
    );
  };

  const renderAnnouncementsSection = () => {
    if (user?.role !== 'company') {
      return (
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Megaphone size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Announcements Not Available</Text>
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            Only company accounts can manage announcements
          </Text>
        </View>
      );
    }

    return (
      <>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setAnnouncementModalVisible(true)}
        >
          <Plus size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Create Announcement</Text>
        </TouchableOpacity>

        {announcements.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Megaphone size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Announcements Yet</Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Create your first announcement to notify your team
            </Text>
          </View>
        ) : (
          announcements.map((announcement) => {
            const priorityColor = announcement.priority === 'high' ? '#ef4444' : announcement.priority === 'normal' ? '#3b82f6' : '#6b7280';
            return (
              <View key={announcement.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: priorityColor }]}>
                <View style={styles.announcementHeader}>
                  <View style={[styles.announcementIcon, { backgroundColor: priorityColor + '20' }]}>
                    <Megaphone size={24} color={priorityColor} />
                  </View>
                  <View style={styles.cardInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text style={[styles.cardName, { color: colors.text }]}>{announcement.title}</Text>
                      <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
                        <Text style={[styles.priorityBadgeText, { color: priorityColor }]}>
                          {announcement.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.announcementText, { color: colors.textSecondary }]}>{announcement.message}</Text>
                    <Text style={[styles.cardSerial, { color: colors.textSecondary, marginTop: 8 }]}>By {announcement.authorName}</Text>
                    <Text style={[styles.cardSerial, { color: colors.textSecondary }]}>
                      {new Date(announcement.createdAt).toLocaleDateString()} at {new Date(announcement.createdAt).toLocaleTimeString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteAnnouncement(announcement.id)}
                  >
                    <Trash2 size={18} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </>
    );
  };

  const renderSettingsSection = () => {
    if (user?.role !== 'company') {
      return (
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Building2 size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Settings Not Available</Text>
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            Only company accounts can manage settings
          </Text>
        </View>
      );
    }

    return (
      <>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingHeader}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
              <ImageIcon size={24} color={colors.primary} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardName, { color: colors.text }]}>Company Logo</Text>
              <Text style={[styles.cardDetail, { color: colors.textSecondary }]}>
                {company?.logo ? 'Logo uploaded' : 'No logo set'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => setLogoModalVisible(true)}
            >
              <Edit2 size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
          {company?.logo && (
            <View style={styles.logoPreview}>
              <Image source={{ uri: company.logo }} style={styles.logoImage} />
            </View>
          )}
        </View>
      </>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Company',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      
      <View style={styles.header}>
        {company?.logo ? (
          <Image source={{ uri: company.logo }} style={styles.headerLogo} />
        ) : (
          <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
            <Building2 size={28} color={colors.primary} />
          </View>
        )}
        <Text style={[styles.headerTitle, { color: colors.text }]}>Company Management</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {equipment.length} equipment, {projects.length} projects, {announcements.length} announcements
        </Text>
      </View>

      <View style={[styles.segmentedControl, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            activeSection === 'equipment' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveSection('equipment')}
        >
          <Wrench size={18} color={activeSection === 'equipment' ? '#ffffff' : colors.textSecondary} />
          <Text
            style={[
              styles.segmentText,
              { color: activeSection === 'equipment' ? '#ffffff' : colors.textSecondary },
            ]}
          >
            Equipment
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            activeSection === 'projects' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveSection('projects')}
        >
          <Briefcase size={18} color={activeSection === 'projects' ? '#ffffff' : colors.textSecondary} />
          <Text
            style={[
              styles.segmentText,
              { color: activeSection === 'projects' ? '#ffffff' : colors.textSecondary },
            ]}
          >
            Projects
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            activeSection === 'announcements' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveSection('announcements')}
        >
          <Megaphone size={18} color={activeSection === 'announcements' ? '#ffffff' : colors.textSecondary} />
          <Text
            style={[
              styles.segmentText,
              { color: activeSection === 'announcements' ? '#ffffff' : colors.textSecondary },
            ]}
          >
            Announce
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            activeSection === 'settings' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveSection('settings')}
        >
          <Building2 size={18} color={activeSection === 'settings' ? '#ffffff' : colors.textSecondary} />
          <Text
            style={[
              styles.segmentText,
              { color: activeSection === 'settings' ? '#ffffff' : colors.textSecondary },
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {activeSection === 'equipment' ? renderEquipmentSection() : activeSection === 'projects' ? renderProjectsSection() : activeSection === 'announcements' ? renderAnnouncementsSection() : renderSettingsSection()}
      </ScrollView>

      <Modal
        visible={equipmentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEquipmentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView 
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Equipment</Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Equipment Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g., Excavator 1"
                  placeholderTextColor={colors.textSecondary}
                  value={equipmentName}
                  onChangeText={setEquipmentName}
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
                    style={[styles.typeButton, { backgroundColor: colors.background, borderColor: colors.border }, type === 'vehicle' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => setType('vehicle')}
                  >
                    <Text style={[styles.typeButtonText, { color: colors.textSecondary }, type === 'vehicle' && styles.typeButtonTextActive]}>
                      Vehicle
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
              )}

              {(type === 'vehicle' || type === 'plant') && (
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
                  onPress={() => setEquipmentModalVisible(false)}
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

      <Modal
        visible={projectModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={resetProjectModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingProject ? 'Edit Project' : 'New Project'}
              </Text>
              <TouchableOpacity onPress={resetProjectModal}>
                <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={[styles.label, { color: colors.text }]}>Project Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={projectName}
                onChangeText={setProjectName}
                placeholder="Enter project name"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.label, { color: colors.text }]}>Project Number</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={projectNumber}
                onChangeText={setProjectNumber}
                placeholder="Enter project number"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.label, { color: colors.text }]}>Email Recipients</Text>
              <View style={styles.emailInputContainer}>
                <TextInput
                  style={[styles.input, styles.emailInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={emailInput}
                  onChangeText={setEmailInput}
                  placeholder="Enter email address"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onSubmitEditing={handleAddEmail}
                />
                <TouchableOpacity style={[styles.addEmailButton, { backgroundColor: colors.primary }]} onPress={handleAddEmail}>
                  <Plus size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {emails.length > 0 && (
                <View style={styles.emailsPreview}>
                  {emails.map((email, index) => (
                    <View key={index} style={[styles.emailPreviewChip, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.emailPreviewText, { color: colors.primary }]}>{email}</Text>
                      <TouchableOpacity onPress={() => handleRemoveEmail(index)}>
                        <Text style={[styles.removeEmail, { color: colors.textSecondary }]}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={resetProjectModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveProject}
              >
                <Text style={styles.saveButtonText}>
                  {editingProject ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={announcementModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAnnouncementModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.announcementModalContent, { backgroundColor: colors.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Create Announcement</Text>
                <TouchableOpacity onPress={() => setAnnouncementModalVisible(false)}>
                  <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.announcementModalBody}>
                <Text style={[styles.label, { color: colors.text }]}>Title</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={announcementTitle}
                  onChangeText={setAnnouncementTitle}
                  placeholder="Enter announcement title"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={[styles.label, { color: colors.text }]}>Message</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={announcementMessage}
                  onChangeText={setAnnouncementMessage}
                  placeholder="Enter announcement message"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
                <View style={styles.priorityButtons}>
                  <TouchableOpacity
                    style={[
                      styles.priorityButton,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      announcementPriority === 'low' && { backgroundColor: '#6b7280', borderColor: '#6b7280' }
                    ]}
                    onPress={() => setAnnouncementPriority('low')}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      { color: colors.textSecondary },
                      announcementPriority === 'low' && { color: '#ffffff' }
                    ]}>
                      Low
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.priorityButton,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      announcementPriority === 'normal' && { backgroundColor: '#3b82f6', borderColor: '#3b82f6' }
                    ]}
                    onPress={() => setAnnouncementPriority('normal')}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      { color: colors.textSecondary },
                      announcementPriority === 'normal' && { color: '#ffffff' }
                    ]}>
                      Normal
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.priorityButton,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      announcementPriority === 'high' && { backgroundColor: '#ef4444', borderColor: '#ef4444' }
                    ]}
                    onPress={() => setAnnouncementPriority('high')}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      { color: colors.textSecondary },
                      announcementPriority === 'high' && { color: '#ffffff' }
                    ]}>
                      High
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setAnnouncementModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                  onPress={handleCreateAnnouncement}
                >
                  <Text style={styles.saveButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={logoModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLogoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Company Logo</Text>
              <TouchableOpacity onPress={() => setLogoModalVisible(false)}>
                <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.logoModalBody}>
              {company?.logo && (
                <View style={styles.currentLogo}>
                  <Text style={[styles.label, { color: colors.text }]}>Current Logo</Text>
                  <Image source={{ uri: company.logo }} style={styles.logoPreviewLarge} />
                </View>
              )}

              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: colors.primary }]}
                onPress={handleUploadLogo}
              >
                <Upload size={20} color="#ffffff" />
                <Text style={styles.uploadButtonText}>
                  {company?.logo ? 'Change Logo' : 'Upload Logo'}
                </Text>
              </TouchableOpacity>

              {company?.logo && (
                <TouchableOpacity
                  style={[styles.removeButton, { backgroundColor: '#fee2e2' }]}
                  onPress={handleRemoveLogo}
                >
                  <Trash2 size={20} color="#dc2626" />
                  <Text style={[styles.removeButtonText, { color: '#dc2626' }]}>Remove Logo</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setLogoModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
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
    paddingVertical: 24,
    paddingHorizontal: 16,
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
  headerLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600' as const,
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1e293b',
    marginBottom: 4,
  },
  cardDetail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  cardSerial: {
    fontSize: 13,
    color: '#94a3b8',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    position: 'absolute' as const,
    right: 16,
    top: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  projectActions: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute' as const,
    right: 0,
    top: 0,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  emailText: {
    fontSize: 12,
    color: '#64748b',
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  modalClose: {
    fontSize: 24,
    color: '#64748b',
  },
  modalBody: {
    maxHeight: '60%',
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
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  emailInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  emailInput: {
    flex: 1,
    marginBottom: 0,
  },
  addEmailButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  emailPreviewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  emailPreviewText: {
    fontSize: 13,
    color: '#1e40af',
  },
  removeEmail: {
    fontSize: 16,
    color: '#64748b',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    paddingHorizontal: 24,
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
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  announcementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  announcementText: {
    fontSize: 14,
    lineHeight: 20,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  announcementModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  announcementModalBody: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoPreview: {
    marginTop: 16,
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  logoModalBody: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  currentLogo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoPreviewLarge: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginTop: 12,
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
});
