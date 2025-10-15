import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';
import { Briefcase, Plus, Mail, Trash2, Edit2 } from 'lucide-react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export default function ProjectsScreen() {
  const { user, company, addProject, updateProject, deleteProject } = useApp();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);

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

    if (emails.length === 0) {
      Alert.alert('Error', 'Please add at least one email address');
      return;
    }

    try {
      if (editingProject) {
        await updateProject(editingProject, projectName, emails);
      } else {
        await addProject(projectName, emails);
      }
      resetModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to save project');
      console.error(error);
    }
  };

  const handleEditProject = (projectId: string) => {
    const project = company?.projects?.find(p => p.id === projectId);
    if (project) {
      setEditingProject(projectId);
      setProjectName(project.name);
      setEmails(project.emails);
      setModalVisible(true);
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

  const resetModal = () => {
    setModalVisible(false);
    setEditingProject(null);
    setProjectName('');
    setEmails([]);
    setEmailInput('');
  };

  if (user?.role !== 'company') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Briefcase size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Projects Not Available</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Only company accounts can manage projects
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
          title: 'Projects',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24 }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Projects</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your company projects</Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <Plus size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {!company?.projects || company.projects.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Briefcase size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Projects Yet</Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Create your first project to organize inspections and manage email recipients
            </Text>
          </View>
        ) : (
          <View style={styles.projectsList}>
            {company?.projects.map((project) => (
              <View key={project.id} style={[styles.projectCard, { backgroundColor: colors.card }]}>
                <View style={styles.projectHeader}>
                  <View style={[styles.projectIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Briefcase size={24} color={colors.primary} />
                  </View>
                  <View style={styles.projectInfo}>
                    <Text style={[styles.projectName, { color: colors.text }]}>{project.name}</Text>
                    <Text style={[styles.projectMeta, { color: colors.textSecondary }]}>
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
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={resetModal}
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
              <TouchableOpacity onPress={resetModal}>
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
                placeholderTextColor="#94a3b8"
              />

              <Text style={[styles.label, { color: colors.text }]}>Email Recipients</Text>
              <View style={styles.emailInputContainer}>
                <TextInput
                  style={[styles.input, styles.emailInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={emailInput}
                  onChangeText={setEmailInput}
                  placeholder="Enter email address"
                  placeholderTextColor="#94a3b8"
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
                style={[styles.button, styles.cancelButton]}
                onPress={resetModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
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
  projectsList: {
    gap: 12,
  },
  projectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1e293b',
    marginBottom: 4,
  },
  projectMeta: {
    fontSize: 13,
    color: '#64748b',
  },
  projectActions: {
    flexDirection: 'row',
    gap: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  modalClose: {
    fontSize: 24,
    color: '#64748b',
  },
  modalBody: {
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1e293b',
    marginBottom: 16,
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
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
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
