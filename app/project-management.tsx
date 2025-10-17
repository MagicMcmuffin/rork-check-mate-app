import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack, router } from 'expo-router';
import { Briefcase, Plus, Trash2, Edit2, Mail, X } from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Platform, KeyboardAvoidingView } from 'react-native';

export default function ProjectManagementScreen() {
  const { user, company, addProject, updateProject, deleteProject } = useApp();
  const { colors } = useTheme();

  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectNumber, setProjectNumber] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);

  const isAdmin = user?.role === 'company';
  const projects = company?.projects || [];

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
        Alert.alert('Success', 'Project updated successfully');
      } else {
        await addProject(projectName, projectNumber, emails);
        Alert.alert('Success', 'Project created successfully');
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

  const handleDeleteProject = (projectId: string, projectName: string) => {
    Alert.alert('Delete Project', `Are you sure you want to delete "${projectName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProject(projectId);
            Alert.alert('Success', 'Project deleted successfully');
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Project Management',
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
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
            <Briefcase size={28} color={colors.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Project Management</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </Text>
        </View>

        {isAdmin && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setProjectModalVisible(true)}
          >
            <Plus size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>Create Project</Text>
          </TouchableOpacity>
        )}

        {projects.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Briefcase size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Projects Yet</Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              {isAdmin
                ? 'Create your first project to organize inspections and manage email recipients'
                : 'No projects have been created yet'}
            </Text>
          </View>
        ) : (
          projects.map((project) => (
            <View key={project.id} style={[styles.projectCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.projectHeader}>
                <View style={[styles.projectIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Briefcase size={24} color={colors.primary} />
                </View>
                <View style={styles.projectInfo}>
                  <Text style={[styles.projectName, { color: colors.text }]}>{project.name}</Text>
                  <Text style={[styles.projectNumber, { color: colors.textSecondary }]}>Project #{project.projectNumber}</Text>
                  <Text style={[styles.projectEmails, { color: colors.textSecondary }]}>
                    {project.emails.length} email{project.emails.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                {isAdmin && (
                  <View style={styles.projectActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.background }]}
                      onPress={() => handleEditProject(project.id)}
                    >
                      <Edit2 size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteProject(project.id, project.name)}
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                )}
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
      </ScrollView>

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
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <View style={styles.modalContentInner}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Project Name *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    value={projectName}
                    onChangeText={setProjectName}
                    placeholder="Enter project name"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Project Number *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    value={projectNumber}
                    onChangeText={setProjectNumber}
                    placeholder="Enter project number"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Email Recipients *</Text>
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
                </View>

                {emails.length > 0 && (
                  <View style={styles.emailsPreview}>
                    {emails.map((email, index) => (
                      <View key={index} style={[styles.emailPreviewChip, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.emailPreviewText, { color: colors.primary }]}>{email}</Text>
                        <TouchableOpacity onPress={() => handleRemoveEmail(index)}>
                          <X size={16} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background }]}
                onPress={resetProjectModal}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
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
  projectCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginBottom: 4,
  },
  projectNumber: {
    fontSize: 14,
    marginBottom: 2,
  },
  projectEmails: {
    fontSize: 13,
  },
  projectActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  emailText: {
    fontSize: 12,
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
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
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
  modalBody: {
    maxHeight: '70%',
  },
  modalContentInner: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
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
  emailInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  emailInput: {
    flex: 1,
  },
  addEmailButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emailPreviewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  emailPreviewText: {
    fontSize: 13,
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
});
