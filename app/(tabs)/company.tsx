import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';
import { Building2, Wrench, Briefcase, Plus, Trash2, Edit2, Mail, Megaphone, Calendar, Bell, Package } from 'lucide-react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, Image } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Equipment } from '@/types';

type Section = 'plant' | 'projects' | 'announcements' | 'equipment' | 'holidays';

export default function CompanyScreen() {
  const { user, company, addEquipment, deleteEquipment, addProject, updateProject, deleteProject, createAnnouncement, getCompanyAnnouncements, deleteAnnouncement } = useApp();
  const { colors } = useTheme();
  const [activeSection, setActiveSection] = useState<Section>('plant');
  const isCompanyOrManagement = user?.role === 'company' || user?.role === 'administrator' || user?.role === 'management';
  
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [equipmentName, setEquipmentName] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [type, setType] = useState<'plant' | 'vehicles'>('plant');
  const [hitchType, setHitchType] = useState('');
  const [hitchSerial, setHitchSerial] = useState('');
  const [registration, setRegistration] = useState('');
  const [thoroughExaminationDate, setThoroughExaminationDate] = useState('');
  const [showExaminationDatePicker, setShowExaminationDatePicker] = useState(false);
  const [has30DayReminder, setHas30DayReminder] = useState(false);
  const [has7DayReminder, setHas7DayReminder] = useState(false);
  const [notes, setNotes] = useState('');

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
  const [announcementType, setAnnouncementType] = useState<'general' | 'well-done' | 'warning' | 'achievement' | 'reminder'>('general');
  const [autoDeleteDays, setAutoDeleteDays] = useState<string>('');

  const isAdmin = user?.role === 'company' || user?.role === 'administrator' || user?.role === 'management';
  const equipment = company?.equipment || [];
  const projects = company?.projects || [];
  const announcements = getCompanyAnnouncements();

  const handleAddEquipment = async () => {
    if (!equipmentName.trim() || !make.trim() || !model.trim() || !serialNumber.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
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
        hitchSerial: hitchSerial.trim() || undefined,
        registration: registration.trim() || undefined,
        thoroughExaminationDate: thoroughExaminationDate.trim() || undefined,
        has30DayReminder: type === 'plant' ? has30DayReminder : undefined,
        has7DayReminder: type === 'plant' ? has7DayReminder : undefined,
        hasMot30DayReminder: type === 'vehicles' ? has30DayReminder : undefined,
        hasMot7DayReminder: type === 'vehicles' ? has7DayReminder : undefined,
        notes: notes.trim() || undefined,
      });

      setEquipmentName('');
      setMake('');
      setModel('');
      setSerialNumber('');
      setType('plant');
      setHitchType('');
      setHitchSerial('');
      setRegistration('');
      setThoroughExaminationDate('');
      setHas30DayReminder(false);
      setHas7DayReminder(false);
      setNotes('');
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

  const getAnnouncementEmoji = (type: 'general' | 'well-done' | 'warning' | 'achievement' | 'reminder') => {
    switch (type) {
      case 'general': return '📢';
      case 'well-done': return '👏';
      case 'warning': return '⚠️';
      case 'achievement': return '🏆';
      case 'reminder': return '🔔';
      default: return '📢';
    }
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

    const deleteInDays = autoDeleteDays.trim() ? parseInt(autoDeleteDays.trim(), 10) : undefined;
    if (deleteInDays !== undefined && (isNaN(deleteInDays) || deleteInDays < 1)) {
      Alert.alert('Error', 'Auto-delete days must be a positive number');
      return;
    }

    try {
      const emoji = getAnnouncementEmoji(announcementType);
      await createAnnouncement(`${emoji} ${announcementTitle.trim()}`, announcementMessage.trim(), announcementPriority, deleteInDays);
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      setAnnouncementPriority('normal');
      setAnnouncementType('general');
      setAutoDeleteDays('');
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

  const handleDeleteAllAnnouncements = () => {
    if (announcements.length === 0) {
      Alert.alert('No Announcements', 'There are no announcements to delete');
      return;
    }

    Alert.alert(
      'Delete All Announcements',
      `Are you sure you want to delete all ${announcements.length} announcements? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const announcement of announcements) {
                await deleteAnnouncement(announcement.id);
              }
              Alert.alert('Success', 'All announcements deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete all announcements');
              console.error('Delete all announcements error:', error);
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
                  {item.hitchSerial && (
                    <Text style={[styles.cardSerial, { color: colors.textSecondary }]}>Hitch S/N: {item.hitchSerial}</Text>
                  )}
                  {item.registration && (
                    <Text style={[styles.cardSerial, { color: colors.textSecondary }]}>Reg: {item.registration}</Text>
                  )}
                  {item.type === 'plant' && item.thoroughExaminationDate && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={[styles.cardSerial, { color: colors.textSecondary }]}>
                        Examination: {new Date(item.thoroughExaminationDate).toLocaleDateString()}
                      </Text>
                      {item.thoroughExaminationCertificate && (
                        <Text style={[styles.cardSerial, { color: colors.primary, marginTop: 2 }]}>✓ Certificate uploaded</Text>
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

  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const [announcementExpandModalVisible, setAnnouncementExpandModalVisible] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<typeof announcements[0] | null>(null);
  const [announcementViewModalVisible, setAnnouncementViewModalVisible] = useState(false);

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

    const displayedAnnouncements = showAllAnnouncements ? announcements : announcements.slice(0, 3);

    return (
      <>
        <View style={{ gap: 12 }}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setAnnouncementModalVisible(true)}
          >
            <Plus size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>Create Announcement</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}
              onPress={() => setAnnouncementExpandModalVisible(true)}
            >
              <Megaphone size={18} color={colors.primary} />
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>View All ({announcements.length})</Text>
            </TouchableOpacity>

            {announcements.length > 0 && (
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: '#fee2e2', borderColor: '#dc2626', flex: 1 }]}
                onPress={handleDeleteAllAnnouncements}
              >
                <Trash2 size={18} color="#dc2626" />
                <Text style={[styles.secondaryButtonText, { color: '#dc2626' }]}>Delete All</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {announcements.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Megaphone size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Announcements Yet</Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Create your first announcement to notify your team
            </Text>
          </View>
        ) : (
          <>
            {displayedAnnouncements.map((announcement) => {
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
          })}
          {announcements.length > 3 && !showAllAnnouncements && (
            <TouchableOpacity
              style={[styles.showMoreButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setAnnouncementExpandModalVisible(true)}
            >
              <Text style={[styles.showMoreText, { color: colors.primary }]}>
                Show All ({announcements.length})
              </Text>
            </TouchableOpacity>
          )}
          </>
        )}
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
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

        <View style={styles.sectionsContainer}>
          <TouchableOpacity
            style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/notification-centre')}
          >
            <View style={[styles.sectionCardIcon, { backgroundColor: colors.primary + '20' }]}>  
              <Bell size={24} color={colors.primary} />
            </View>
            <View style={styles.sectionCardContent}>
              <Text style={[styles.sectionCardTitle, { color: colors.text }]}>Notifications</Text>
              <Text style={[styles.sectionCardSubtitle, { color: colors.textSecondary }]}>View all system notifications</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              if (isCompanyOrManagement) {
                setAnnouncementModalVisible(true);
              }
            }}
          >
            <View style={[styles.sectionCardIcon, { backgroundColor: colors.primary + '20' }]}>  
              <Megaphone size={24} color={colors.primary} />
            </View>
            <View style={styles.sectionCardContent}>
              <Text style={[styles.sectionCardTitle, { color: colors.text }]}>Announcements</Text>
              <Text style={[styles.sectionCardSubtitle, { color: colors.textSecondary }]}>Company-wide announcements</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.gridContainer}>
            <TouchableOpacity
              style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/plant-management')}
            >
              <View style={[styles.sectionCardIcon, { backgroundColor: colors.primary + '20' }]}>
                <Wrench size={24} color={colors.primary} />
              </View>
              <View style={styles.sectionCardContent}>
                <Text style={[styles.sectionCardTitle, { color: colors.text }]}>Plant & Vehicles</Text>
                <Text style={[styles.sectionCardSubtitle, { color: colors.textSecondary }]}>Manage plant & vehicle items</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/equipment-management')}
            >
              <View style={[styles.sectionCardIcon, { backgroundColor: colors.primary + '20' }]}>
                <Package size={24} color={colors.primary} />
              </View>
              <View style={styles.sectionCardContent}>
                <Text style={[styles.sectionCardTitle, { color: colors.text }]}>Equipment</Text>
                <Text style={[styles.sectionCardSubtitle, { color: colors.textSecondary }]}>Manage equipment</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/project-management')}
            >
              <View style={[styles.sectionCardIcon, { backgroundColor: colors.primary + '20' }]}>
                <Briefcase size={24} color={colors.primary} />
              </View>
              <View style={styles.sectionCardContent}>
                <Text style={[styles.sectionCardTitle, { color: colors.text }]}>Projects</Text>
                <Text style={[styles.sectionCardSubtitle, { color: colors.textSecondary }]}>Manage projects</Text>
              </View>
            </TouchableOpacity>

            {isCompanyOrManagement && (
              <TouchableOpacity
                style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push('/holiday-management')}
              >
                <View style={[styles.sectionCardIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Calendar size={24} color={colors.primary} />
                </View>
                <View style={styles.sectionCardContent}>
                  <Text style={[styles.sectionCardTitle, { color: colors.text }]}>Holidays</Text>
                  <Text style={[styles.sectionCardSubtitle, { color: colors.textSecondary }]}>Manage holidays</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>



      <Modal
        visible={equipmentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEquipmentModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.equipmentModalContainer}>
            <View style={[styles.equipmentModalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.modalIconCircle, { backgroundColor: colors.primary + '20' }]}>
                  <Wrench size={24} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Add Equipment</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Fill in all required fields</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setEquipmentModalVisible(false)} style={styles.modalCloseButton}>
                <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.equipmentModalBodyBackground, { backgroundColor: colors.background }]}>
              <ScrollView 
                style={styles.equipmentModalBody}
                contentContainerStyle={styles.equipmentModalContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
              >
                <View style={[styles.formSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>BASIC INFORMATION</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Equipment Name *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="e.g., Excavator 1"
                    placeholderTextColor={colors.textSecondary}
                    value={equipmentName}
                    onChangeText={setEquipmentName}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Make *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      placeholder="e.g., Caterpillar"
                      placeholderTextColor={colors.textSecondary}
                      value={make}
                      onChangeText={setMake}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Model *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
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
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="Enter serial number"
                    placeholderTextColor={colors.textSecondary}
                    value={serialNumber}
                    onChangeText={setSerialNumber}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Type *</Text>
                  <View style={styles.typeButtons}>
                    <TouchableOpacity
                      style={[styles.typeButton, { backgroundColor: colors.card, borderColor: colors.border }, type === 'plant' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => setType('plant')}
                    >
                      <Text style={[styles.typeButtonText, { color: colors.textSecondary }, type === 'plant' && styles.typeButtonTextActive]}>
                        Plant
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeButton, { backgroundColor: colors.card, borderColor: colors.border }, type === 'vehicles' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => setType('vehicles')}
                    >
                      <Text style={[styles.typeButtonText, { color: colors.textSecondary }, type === 'vehicles' && styles.typeButtonTextActive]}>
                        Vehicles
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Registration</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="e.g., AB12 CDE"
                    placeholderTextColor={colors.textSecondary}
                    value={registration}
                    onChangeText={setRegistration}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {type === 'plant' && (
                <View style={[styles.formSection, { backgroundColor: colors.card }]}>
                  <Text style={[styles.sectionLabel, { color: colors.text }]}>HITCH DETAILS (OPTIONAL)</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Hitch Type</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      placeholder="e.g., Quick Hitch, Manual Hitch"
                      placeholderTextColor={colors.textSecondary}
                      value={hitchType}
                      onChangeText={setHitchType}
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Hitch Serial Number</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      placeholder="Enter hitch serial number"
                      placeholderTextColor={colors.textSecondary}
                      value={hitchSerial}
                      onChangeText={setHitchSerial}
                    />
                  </View>
                </View>
              )}

              <View style={[styles.formSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>DATES & CERTIFICATION (OPTIONAL)</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>{type === 'vehicles' ? 'MOT' : 'Date of Thorough Examination'}</Text>
                  <TouchableOpacity
                    style={[styles.datePickerButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => setShowExaminationDatePicker(true)}
                  >
                    <Calendar size={18} color={colors.textSecondary} />
                    <Text style={[thoroughExaminationDate ? styles.datePickerText : styles.datePickerPlaceholder, { color: thoroughExaminationDate ? colors.text : colors.textSecondary }]}>
                      {thoroughExaminationDate || 'Select date'}
                    </Text>
                  </TouchableOpacity>
                  {showExaminationDatePicker && (
                    <DateTimePicker
                      value={thoroughExaminationDate ? new Date(thoroughExaminationDate) : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, selectedDate) => {
                        setShowExaminationDatePicker(Platform.OS === 'ios');
                        if (selectedDate) {
                          const formattedDate = selectedDate.toISOString().split('T')[0];
                          setThoroughExaminationDate(formattedDate);
                        }
                      }}
                    />
                  )}
                </View>

                {thoroughExaminationDate && (
                  <View style={{ gap: 12 }}>
                    <TouchableOpacity
                      style={styles.reminderCheckbox}
                      onPress={() => setHas30DayReminder(!has30DayReminder)}
                    >
                      <View style={[styles.checkbox, { borderColor: colors.border, backgroundColor: colors.background }, has30DayReminder && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                        {has30DayReminder && <Text style={styles.checkboxText}>✓</Text>}
                      </View>
                      <Text style={[styles.checkboxLabel, { color: colors.text }]}>30-day reminder</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.reminderCheckbox}
                      onPress={() => setHas7DayReminder(!has7DayReminder)}
                    >
                      <View style={[styles.checkbox, { borderColor: colors.border, backgroundColor: colors.background }, has7DayReminder && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                        {has7DayReminder && <Text style={styles.checkboxText}>✓</Text>}
                      </View>
                      <Text style={[styles.checkboxLabel, { color: colors.text }]}>7-day reminder</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={[styles.formSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>ADDITIONAL INFORMATION</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="Add any additional notes or information"
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
          </View>

            <View style={[styles.equipmentModalFooter, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
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
        </KeyboardAvoidingView>
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
                <Text style={[styles.label, { color: colors.text }]}>Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                  <View style={styles.typeButtonsScroll}>
                    <TouchableOpacity
                      style={[
                        styles.typeChip,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        announcementType === 'general' && { backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}
                      onPress={() => setAnnouncementType('general')}
                    >
                      <Text style={[
                        styles.typeChipText,
                        { color: colors.textSecondary },
                        announcementType === 'general' && { color: '#ffffff' }
                      ]}>
                        📢 General
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeChip,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        announcementType === 'well-done' && { backgroundColor: '#10b981', borderColor: '#10b981' }
                      ]}
                      onPress={() => setAnnouncementType('well-done')}
                    >
                      <Text style={[
                        styles.typeChipText,
                        { color: colors.textSecondary },
                        announcementType === 'well-done' && { color: '#ffffff' }
                      ]}>
                        👏 Well Done
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeChip,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        announcementType === 'warning' && { backgroundColor: '#f59e0b', borderColor: '#f59e0b' }
                      ]}
                      onPress={() => setAnnouncementType('warning')}
                    >
                      <Text style={[
                        styles.typeChipText,
                        { color: colors.textSecondary },
                        announcementType === 'warning' && { color: '#ffffff' }
                      ]}>
                        ⚠️ Warning
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeChip,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        announcementType === 'achievement' && { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }
                      ]}
                      onPress={() => setAnnouncementType('achievement')}
                    >
                      <Text style={[
                        styles.typeChipText,
                        { color: colors.textSecondary },
                        announcementType === 'achievement' && { color: '#ffffff' }
                      ]}>
                        🏆 Achievement
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeChip,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        announcementType === 'reminder' && { backgroundColor: '#3b82f6', borderColor: '#3b82f6' }
                      ]}
                      onPress={() => setAnnouncementType('reminder')}
                    >
                      <Text style={[
                        styles.typeChipText,
                        { color: colors.textSecondary },
                        announcementType === 'reminder' && { color: '#ffffff' }
                      ]}>
                        🔔 Reminder
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>

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

                <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Auto-Delete After (Days)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={autoDeleteDays}
                  onChangeText={setAutoDeleteDays}
                  placeholder="Optional: e.g., 7, 30"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                />
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
        visible={announcementExpandModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAnnouncementExpandModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.expandedAnnouncementsContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>  
              <Text style={[styles.modalTitle, { color: colors.text }]}>All Announcements ({announcements.length})</Text>
              <TouchableOpacity onPress={() => setAnnouncementExpandModalVisible(false)}>
                <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.expandedAnnouncementsScroll} contentContainerStyle={{ padding: 20 }}>
              {announcements.map((announcement) => {
                const priorityColor = announcement.priority === 'high' ? '#ef4444' : announcement.priority === 'normal' ? '#3b82f6' : '#6b7280';
                return (
                  <TouchableOpacity 
                    key={announcement.id} 
                    style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: priorityColor }]}
                    onPress={() => {
                      setSelectedAnnouncement(announcement);
                      setAnnouncementViewModalVisible(true);
                    }}
                  >
                    <View style={styles.announcementHeader}>
                      <View style={[styles.announcementIcon, { backgroundColor: priorityColor + '20' }]}>
                        <Megaphone size={24} color={priorityColor} />
                      </View>
                      <View style={styles.cardInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>{announcement.title}</Text>
                          <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
                            <Text style={[styles.priorityBadgeText, { color: priorityColor }]}>
                              {announcement.priority.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.announcementText, { color: colors.textSecondary }]} numberOfLines={2}>{announcement.message}</Text>
                        <Text style={[styles.cardSerial, { color: colors.textSecondary, marginTop: 8 }]}>By {announcement.authorName}</Text>
                        <Text style={[styles.cardSerial, { color: colors.textSecondary }]}>
                          {new Date(announcement.createdAt).toLocaleDateString()}
                        </Text>
                        {announcement.autoDeleteDate && (
                          <Text style={[styles.cardSerial, { color: '#f59e0b', marginTop: 4 }]}>
                            🕒 Auto-deletes: {new Date(announcement.autoDeleteDate).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteAnnouncement(announcement.id);
                        }}
                      >
                        <Trash2 size={18} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={announcementViewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAnnouncementViewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.announcementViewContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>  
              <Text style={[styles.modalTitle, { color: colors.text }]}>Announcement Details</Text>
              <TouchableOpacity onPress={() => setAnnouncementViewModalVisible(false)}>
                <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedAnnouncement && (
              <ScrollView style={styles.announcementViewScroll} contentContainerStyle={{ padding: 20 }}>
                <View style={[styles.announcementViewCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <View style={[styles.announcementIcon, { backgroundColor: (selectedAnnouncement.priority === 'high' ? '#ef4444' : selectedAnnouncement.priority === 'normal' ? '#3b82f6' : '#6b7280') + '20' }]}>
                      <Megaphone size={24} color={selectedAnnouncement.priority === 'high' ? '#ef4444' : selectedAnnouncement.priority === 'normal' ? '#3b82f6' : '#6b7280'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.announcementViewTitle, { color: colors.text }]}>{selectedAnnouncement.title}</Text>
                      <View style={[styles.priorityBadge, { backgroundColor: (selectedAnnouncement.priority === 'high' ? '#ef4444' : selectedAnnouncement.priority === 'normal' ? '#3b82f6' : '#6b7280') + '20', marginTop: 4 }]}>
                        <Text style={[styles.priorityBadgeText, { color: selectedAnnouncement.priority === 'high' ? '#ef4444' : selectedAnnouncement.priority === 'normal' ? '#3b82f6' : '#6b7280' }]}>
                          {selectedAnnouncement.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.announcementViewSection, { borderTopColor: colors.border }]}>
                    <Text style={[styles.announcementViewLabel, { color: colors.textSecondary }]}>Message</Text>
                    <Text style={[styles.announcementViewMessage, { color: colors.text }]}>{selectedAnnouncement.message}</Text>
                  </View>

                  <View style={[styles.announcementViewSection, { borderTopColor: colors.border }]}>
                    <Text style={[styles.announcementViewLabel, { color: colors.textSecondary }]}>Posted By</Text>
                    <Text style={[styles.announcementViewText, { color: colors.text }]}>{selectedAnnouncement.authorName}</Text>
                  </View>

                  <View style={[styles.announcementViewSection, { borderTopColor: colors.border }]}>
                    <Text style={[styles.announcementViewLabel, { color: colors.textSecondary }]}>Date & Time</Text>
                    <Text style={[styles.announcementViewText, { color: colors.text }]}>
                      {new Date(selectedAnnouncement.createdAt).toLocaleDateString()} at {new Date(selectedAnnouncement.createdAt).toLocaleTimeString()}
                    </Text>
                  </View>

                  {selectedAnnouncement.autoDeleteDate && (
                    <View style={[styles.announcementViewSection, { borderTopColor: colors.border }]}>
                      <Text style={[styles.announcementViewLabel, { color: colors.textSecondary }]}>Auto-Delete Date</Text>
                      <Text style={[styles.announcementViewText, { color: '#f59e0b' }]}>
                        {new Date(selectedAnnouncement.autoDeleteDate).toLocaleDateString()} at {new Date(selectedAnnouncement.autoDeleteDate).toLocaleTimeString()}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.deleteFullButton, { backgroundColor: '#fee2e2', borderColor: '#dc2626' }]}
                  onPress={() => {
                    handleDeleteAnnouncement(selectedAnnouncement.id);
                    setAnnouncementViewModalVisible(false);
                  }}
                >
                  <Trash2 size={20} color="#dc2626" />
                  <Text style={[styles.deleteFullButtonText, { color: '#dc2626' }]}>Delete Announcement</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
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
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
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
  sectionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionCardContent: {
    flex: 1,
  },
  sectionCardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  sectionCardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  gridContainer: {
    gap: 12,
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
  equipmentModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    height: '92%',
  },
  equipmentModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  modalCloseButton: {
    padding: 8,
  },
  equipmentModalBodyBackground: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  equipmentModalBody: {
    flex: 1,
  },
  equipmentModalContent: {
    paddingBottom: 24,
    gap: 20,
  },
  equipmentModalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  formSection: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
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
    marginBottom: 0,
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
  typeScroll: {
    marginBottom: 16,
  },
  typeButtonsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  typeChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  datePickerText: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  datePickerPlaceholder: {
    fontSize: 15,
  },
  reminderCheckbox: {
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
  checkboxText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  showMoreButton: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  expandedAnnouncementsContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    height: '90%',
  },
  expandedAnnouncementsScroll: {
    flex: 1,
  },
  announcementViewContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    height: '85%',
  },
  announcementViewScroll: {
    flex: 1,
  },
  announcementViewCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  announcementViewTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  announcementViewSection: {
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
  },
  announcementViewLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  announcementViewMessage: {
    fontSize: 16,
    lineHeight: 24,
  },
  announcementViewText: {
    fontSize: 15,
    lineHeight: 22,
  },
  deleteFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  deleteFullButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
