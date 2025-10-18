import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack, router } from 'expo-router';
import { Users, Briefcase, Plus, X, Check, Search } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Project } from '@/types';

export default function PeoplePlannerScreen() {
  const { user, company, getCompanyUsers, updateProject } = useApp();
  const { colors } = useTheme();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = user?.role === 'company' || user?.role === 'administrator' || user?.role === 'management';
  const projects = company?.projects || [];
  const employees = getCompanyUsers();

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const query = searchQuery.toLowerCase();
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(query) || 
      emp.email.toLowerCase().includes(query)
    );
  }, [employees, searchQuery]);

  const getProjectAssignments = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    const assignedIds = project?.assignedEmployeeIds || [];
    return employees.filter(emp => assignedIds.includes(emp.id));
  };

  const getEmployeeProjects = (employeeId: string) => {
    return projects.filter(p => p.assignedEmployeeIds?.includes(employeeId));
  };

  const handleAssignEmployee = async (employeeId: string, projectId: string) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const currentAssignments = project.assignedEmployeeIds || [];
      const isAssigned = currentAssignments.includes(employeeId);

      const updatedAssignments = isAssigned
        ? currentAssignments.filter(id => id !== employeeId)
        : [...currentAssignments, employeeId];

      await updateProject(
        projectId,
        project.name,
        project.projectNumber,
        project.emails,
        updatedAssignments
      );

      const employee = employees.find(e => e.id === employeeId);
      Alert.alert(
        'Success',
        isAssigned
          ? `${employee?.name} removed from ${project.name}`
          : `${employee?.name} assigned to ${project.name}`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update assignment');
      console.error('Assignment error:', error);
    }
  };

  const openAssignModal = (project: Project) => {
    setSelectedProject(project);
    setSearchQuery('');
    setAssignModalVisible(true);
  };

  const closeAssignModal = () => {
    setAssignModalVisible(false);
    setSelectedProject(null);
    setSearchQuery('');
  };

  if (!isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'People Planner',
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
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Users size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Access Denied</Text>
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            Only administrators can manage people assignments
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
          title: 'People Planner',
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
            <Users size={28} color={colors.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>People Planner</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Assign employees to projects
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Briefcase size={20} color={colors.primary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{projects.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Projects</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Users size={20} color={colors.primary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{employees.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Employees</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Projects</Text>
          {projects.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Briefcase size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Projects Yet</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Create projects first to assign employees
              </Text>
            </View>
          ) : (
            projects.map((project) => {
              const assignedEmployees = getProjectAssignments(project.id);
              return (
                <View
                  key={project.id}
                  style={[styles.projectCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.projectHeader}>
                    <View style={[styles.projectIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Briefcase size={20} color={colors.primary} />
                    </View>
                    <View style={styles.projectInfo}>
                      <Text style={[styles.projectName, { color: colors.text }]}>{project.name}</Text>
                      <Text style={[styles.projectNumber, { color: colors.textSecondary }]}>
                        #{project.projectNumber}
                      </Text>
                      <Text style={[styles.projectAssigned, { color: colors.textSecondary }]}>
                        {assignedEmployees.length} {assignedEmployees.length === 1 ? 'person' : 'people'} assigned
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.assignButton, { backgroundColor: colors.primary }]}
                      onPress={() => openAssignModal(project)}
                    >
                      <Plus size={18} color="#ffffff" />
                      <Text style={styles.assignButtonText}>Assign</Text>
                    </TouchableOpacity>
                  </View>

                  {assignedEmployees.length > 0 && (
                    <View style={styles.assignedList}>
                      {assignedEmployees.map((employee) => (
                        <View
                          key={employee.id}
                          style={[styles.assignedChip, { backgroundColor: colors.background }]}
                        >
                          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={[styles.avatarText, { color: colors.primary }]}>
                              {employee.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.assignedInfo}>
                            <Text style={[styles.assignedName, { color: colors.text }]}>{employee.name}</Text>
                            <Text style={[styles.assignedRole, { color: colors.textSecondary }]}>
                              {employee.role}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleAssignEmployee(employee.id, project.id)}
                            style={[styles.removeButton, { backgroundColor: colors.card }]}
                          >
                            <X size={14} color={colors.textSecondary} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>All Employees</Text>
          {employees.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Users size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Employees Yet</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Employees will appear here once they join
              </Text>
            </View>
          ) : (
            employees.map((employee) => {
              const employeeProjects = getEmployeeProjects(employee.id);
              return (
                <View
                  key={employee.id}
                  style={[styles.employeeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.employeeHeader}>
                    <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.avatarText, { color: colors.primary }]}>
                        {employee.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.employeeInfo}>
                      <Text style={[styles.employeeName, { color: colors.text }]}>{employee.name}</Text>
                      <Text style={[styles.employeeRole, { color: colors.textSecondary }]}>{employee.role}</Text>
                      <Text style={[styles.employeeProjects, { color: colors.textSecondary }]}>
                        {employeeProjects.length} {employeeProjects.length === 1 ? 'project' : 'projects'}
                      </Text>
                    </View>
                  </View>

                  {employeeProjects.length > 0 && (
                    <View style={styles.projectsList}>
                      {employeeProjects.map((project) => (
                        <View
                          key={project.id}
                          style={[styles.projectChip, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
                        >
                          <Briefcase size={12} color={colors.primary} />
                          <Text style={[styles.projectChipText, { color: colors.primary }]}>
                            {project.name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal
        visible={assignModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeAssignModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Assign People</Text>
                {selectedProject && (
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                    {selectedProject.name}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={closeAssignModal}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Search size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search employees..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
              {filteredEmployees.length === 0 ? (
                <View style={styles.noResults}>
                  <Users size={40} color={colors.textSecondary} />
                  <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
                    No employees found
                  </Text>
                </View>
              ) : (
                filteredEmployees.map((employee) => {
                  const isAssigned = selectedProject?.assignedEmployeeIds?.includes(employee.id);
                  return (
                    <TouchableOpacity
                      key={employee.id}
                      style={[
                        styles.employeeOption,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        isAssigned && { backgroundColor: colors.primary + '10', borderColor: colors.primary }
                      ]}
                      onPress={() => {
                        if (selectedProject) {
                          handleAssignEmployee(employee.id, selectedProject.id);
                        }
                      }}
                    >
                      <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.avatarText, { color: colors.primary }]}>
                          {employee.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.employeeOptionInfo}>
                        <Text style={[styles.employeeOptionName, { color: colors.text }]}>
                          {employee.name}
                        </Text>
                        <Text style={[styles.employeeOptionRole, { color: colors.textSecondary }]}>
                          {employee.role}
                        </Text>
                      </View>
                      {isAssigned && (
                        <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                          <Check size={16} color="#ffffff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: colors.primary }]}
                onPress={closeAssignModal}
              >
                <Text style={styles.doneButtonText}>Done</Text>
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
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 13,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  projectCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  projectIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginBottom: 2,
  },
  projectNumber: {
    fontSize: 13,
    marginBottom: 2,
  },
  projectAssigned: {
    fontSize: 12,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  assignButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  assignedList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  assignedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  assignedInfo: {
    flex: 1,
  },
  assignedName: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  assignedRole: {
    fontSize: 12,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  employeeRole: {
    fontSize: 13,
    marginBottom: 2,
  },
  employeeProjects: {
    fontSize: 12,
  },
  projectsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  projectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  projectChipText: {
    fontSize: 12,
    fontWeight: '500' as const,
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
    maxHeight: '85%',
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
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  modalBody: {
    maxHeight: '60%',
  },
  modalBodyContent: {
    padding: 20,
    gap: 10,
  },
  employeeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  employeeOptionInfo: {
    flex: 1,
  },
  employeeOptionName: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  employeeOptionRole: {
    fontSize: 13,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  noResultsText: {
    fontSize: 15,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
  doneButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
});
