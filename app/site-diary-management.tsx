/* eslint-disable @rork/linters/expo-router-enforce-safe-area-usage */
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack, router } from 'expo-router';
import { BookOpen, Plus, Eye, Trash2, Send } from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { trpc } from '@/lib/trpc';
import { SiteDiary } from '@/types';

export default function SiteDiaryManagementScreen() {
  const { company } = useApp();
  const { colors } = useTheme();
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const siteDiariesQuery = trpc.siteDiaries.list.useQuery();
  const deleteDiaryMutation = trpc.siteDiaries.delete.useMutation();
  const sendWeeklyMutation = trpc.siteDiaries.sendWeekly.useMutation();

  const siteDiaries = siteDiariesQuery.data || [];
  const projects = company?.projects || [];

  const filteredDiaries = selectedProject === 'all' 
    ? siteDiaries 
    : siteDiaries.filter((diary: SiteDiary) => diary.projectId === selectedProject);

  const handleDelete = (diaryId: string) => {
    Alert.alert(
      'Delete Site Diary',
      'Are you sure you want to delete this site diary?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDiaryMutation.mutateAsync({ id: diaryId });
              siteDiariesQuery.refetch();
              Alert.alert('Success', 'Site diary deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete site diary');
              console.error('Delete site diary error:', error);
            }
          },
        },
      ]
    );
  };

  const handleSendWeekly = (projectId: string) => {
    const projectDiaries = siteDiaries.filter((diary: SiteDiary) => diary.projectId === projectId);
    const diaryIds = projectDiaries.map((d: SiteDiary) => d.id);
    
    if (diaryIds.length === 0) {
      Alert.alert('Error', 'No diaries found for this project');
      return;
    }

    Alert.alert(
      'Send Weekly Report',
      `Send ${diaryIds.length} site ${diaryIds.length === 1 ? 'diary' : 'diaries'} for this project?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              await sendWeeklyMutation.mutateAsync({ diaryIds });
              await siteDiariesQuery.refetch();
              Alert.alert('Success', 'Weekly report sent successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to send weekly report');
              console.error('Send weekly report error:', error);
            }
          },
        },
      ]
    );
  };

  const handleCreateNew = () => {
    router.push('/site-diary-create');
  };

  const handleView = (diaryId: string) => {
    router.push(`/site-diary-detail?id=${diaryId}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Site Diaries',
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
          <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
            <BookOpen size={28} color={colors.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Site Diary Management</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {filteredDiaries.length} {filteredDiaries.length === 1 ? 'diary' : 'diaries'}
          </Text>
        </View>

        <View style={styles.content}>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={handleCreateNew}
          >
            <Plus size={20} color="#ffffff" />
            <Text style={styles.createButtonText}>Create Site Diary</Text>
          </TouchableOpacity>

          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>Filter by Project</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    selectedProject === 'all' && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setSelectedProject('all')}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      { color: colors.textSecondary },
                      selectedProject === 'all' && { color: '#ffffff' },
                    ]}
                  >
                    All Projects
                  </Text>
                </TouchableOpacity>
                {projects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={[
                      styles.filterButton,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      selectedProject === project.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setSelectedProject(project.id)}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        { color: colors.textSecondary },
                        selectedProject === project.id && { color: '#ffffff' },
                      ]}
                    >
                      {project.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {filteredDiaries.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <BookOpen size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Site Diaries Yet</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Create your first site diary to track daily site activities
              </Text>
            </View>
          ) : (
            <View style={styles.diariesList}>
              {filteredDiaries.map((diary: SiteDiary) => {
                const project = projects.find(p => p.id === diary.projectId);
                return (
                  <View
                    key={diary.id}
                    style={[styles.diaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={styles.diaryHeader}>
                      <View style={[styles.diaryIcon, { backgroundColor: colors.primary + '20' }]}>
                        <BookOpen size={24} color={colors.primary} />
                      </View>
                      <View style={styles.diaryInfo}>
                        <Text style={[styles.diaryProject, { color: colors.text }]}>
                          {project?.name || 'Unknown Project'}
                        </Text>
                        <Text style={[styles.diaryDate, { color: colors.textSecondary }]}>
                          {new Date(diary.date).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.diaryActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                        onPress={() => handleView(diary.id)}
                      >
                        <Eye size={18} color="#ffffff" />
                        <Text style={styles.actionButtonText}>View</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                        onPress={() => handleDelete(diary.id)}
                      >
                        <Trash2 size={18} color="#ffffff" />
                        <Text style={styles.actionButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {selectedProject !== 'all' && filteredDiaries.length > 0 && (
            <TouchableOpacity
              style={[styles.sendWeeklyButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleSendWeekly(selectedProject)}
            >
              <Send size={20} color={colors.primary} />
              <Text style={[styles.sendWeeklyButtonText, { color: colors.primary }]}>
                Send Weekly Report
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  filterSection: {
    gap: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
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
  diariesList: {
    gap: 12,
  },
  diaryCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  diaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  diaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diaryInfo: {
    flex: 1,
  },
  diaryProject: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  diaryDate: {
    fontSize: 14,
  },
  diaryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  sendWeeklyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 8,
  },
  sendWeeklyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});