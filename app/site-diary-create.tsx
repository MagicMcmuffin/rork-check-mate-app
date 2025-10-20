/* eslint-disable @rork/linters/expo-router-enforce-safe-area-usage */
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack, router } from 'expo-router';
import { BookOpen, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { trpc } from '@/lib/trpc';

export default function SiteDiaryCreateScreen() {
  const { company } = useApp();
  const { colors } = useTheme();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectId, setProjectId] = useState('');
  const [weather, setWeather] = useState('');
  const [temperature, setTemperature] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [progress, setProgress] = useState('');
  const [delays, setDelays] = useState('');
  const [safetyIssues, setSafetyIssues] = useState('');
  const [visitors, setVisitors] = useState('');
  const [workersOnSite, setWorkersOnSite] = useState('');
  const [notes, setNotes] = useState('');

  const [equipmentList, setEquipmentList] = useState<{ name: string; hours?: number }[]>([]);
  const [materialsList, setMaterialsList] = useState<{ name: string; quantity?: string; unit?: string }[]>([]);
  
  const [newEquipmentName, setNewEquipmentName] = useState('');
  const [newEquipmentHours, setNewEquipmentHours] = useState('');
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialQuantity, setNewMaterialQuantity] = useState('');
  const [newMaterialUnit, setNewMaterialUnit] = useState('');

  const createMutation = trpc.siteDiaries.create.useMutation();
  const projects = company?.projects || [];

  const handleAddEquipment = () => {
    if (!newEquipmentName.trim()) {
      Alert.alert('Error', 'Please enter equipment name');
      return;
    }

    setEquipmentList([
      ...equipmentList,
      {
        name: newEquipmentName.trim(),
        hours: newEquipmentHours ? Number(newEquipmentHours) : undefined,
      },
    ]);
    setNewEquipmentName('');
    setNewEquipmentHours('');
  };

  const handleRemoveEquipment = (index: number) => {
    setEquipmentList(equipmentList.filter((_, i) => i !== index));
  };

  const handleAddMaterial = () => {
    if (!newMaterialName.trim()) {
      Alert.alert('Error', 'Please enter material name');
      return;
    }

    setMaterialsList([
      ...materialsList,
      {
        name: newMaterialName.trim(),
        quantity: newMaterialQuantity.trim() || undefined,
        unit: newMaterialUnit.trim() || undefined,
      },
    ]);
    setNewMaterialName('');
    setNewMaterialQuantity('');
    setNewMaterialUnit('');
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterialsList(materialsList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (submitStatus: 'draft' | 'completed') => {
    if (!projectId) {
      Alert.alert('Error', 'Please select a project');
      return;
    }

    if (!workDescription.trim()) {
      Alert.alert('Error', 'Please enter work description');
      return;
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      Alert.alert('Error', 'Invalid project selected');
      return;
    }

    try {
      await createMutation.mutateAsync({
        date,
        projectId,
        projectName: project.name,
        weather: weather || undefined,
        temperature: temperature || undefined,
        workDescription,
        progress: progress || undefined,
        delays: delays || undefined,
        safetyIssues: safetyIssues || undefined,
        visitors: visitors || undefined,
        workersOnSite: workersOnSite ? Number(workersOnSite) : undefined,
        equipmentUsed: equipmentList.length > 0 ? equipmentList : undefined,
        materials: materialsList.length > 0 ? materialsList : undefined,
        notes: notes || undefined,
        status: submitStatus,
      });

      Alert.alert(
        'Success',
        `Site diary ${submitStatus === 'draft' ? 'saved as draft' : 'created'} successfully`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Create site diary error:', error);
      Alert.alert('Error', 'Failed to create site diary');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Create Site Diary',
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>New Site Diary</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Document daily site activities
          </Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Date</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Project *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.projectButtons}>
                  {projects.map((project) => (
                    <TouchableOpacity
                      key={project.id}
                      style={[
                        styles.projectButton,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        projectId === project.id && {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => setProjectId(project.id)}
                    >
                      <Text
                        style={[
                          styles.projectButtonText,
                          { color: colors.text },
                          projectId === project.id && { color: '#ffffff' },
                        ]}
                      >
                        {project.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={[styles.label, { color: colors.text }]}>Weather</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={weather}
                  onChangeText={setWeather}
                  placeholder="e.g., Sunny"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={[styles.label, { color: colors.text }]}>Temperature</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={temperature}
                  onChangeText={setTemperature}
                  placeholder="e.g., 22°C"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Workers On Site</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={workersOnSite}
                onChangeText={setWorkersOnSite}
                placeholder="Number of workers"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Work Details</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Work Description *</Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={workDescription}
                onChangeText={setWorkDescription}
                placeholder="Describe the work performed today"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Progress</Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={progress}
                onChangeText={setProgress}
                placeholder="Progress made today"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Delays</Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={delays}
                onChangeText={setDelays}
                placeholder="Any delays encountered"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Safety & Visitors</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Safety Issues</Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={safetyIssues}
                onChangeText={setSafetyIssues}
                placeholder="Any safety concerns or incidents"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Visitors</Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={visitors}
                onChangeText={setVisitors}
                placeholder="Site visitors today"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Equipment Used</Text>

            {equipmentList.map((equipment, index) => (
              <View
                key={index}
                style={[
                  styles.listItem,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <View style={styles.listItemInfo}>
                  <Text style={[styles.listItemName, { color: colors.text }]}>
                    {equipment.name}
                  </Text>
                  {equipment.hours !== undefined && (
                    <Text style={[styles.listItemDetail, { color: colors.textSecondary }]}>
                      {equipment.hours} hours
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => handleRemoveEquipment(index)}>
                  <X size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addItemForm}>
              <View style={styles.addItemRow}>
                <TextInput
                  style={[
                    styles.addItemInput,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={newEquipmentName}
                  onChangeText={setNewEquipmentName}
                  placeholder="Equipment name"
                  placeholderTextColor={colors.textSecondary}
                />
                <TextInput
                  style={[
                    styles.addItemInputSmall,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={newEquipmentHours}
                  onChangeText={setNewEquipmentHours}
                  placeholder="Hours"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={handleAddEquipment}
              >
                <Plus size={16} color="#ffffff" />
                <Text style={styles.addButtonText}>Add Equipment</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Materials Used</Text>

            {materialsList.map((material, index) => (
              <View
                key={index}
                style={[
                  styles.listItem,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <View style={styles.listItemInfo}>
                  <Text style={[styles.listItemName, { color: colors.text }]}>
                    {material.name}
                  </Text>
                  {(material.quantity || material.unit) && (
                    <Text style={[styles.listItemDetail, { color: colors.textSecondary }]}>
                      {material.quantity} {material.unit}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => handleRemoveMaterial(index)}>
                  <X size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addItemForm}>
              <View style={styles.addItemRow}>
                <TextInput
                  style={[
                    styles.addItemInput,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={newMaterialName}
                  onChangeText={setNewMaterialName}
                  placeholder="Material name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.addItemRow}>
                <TextInput
                  style={[
                    styles.addItemInputSmall,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={newMaterialQuantity}
                  onChangeText={setNewMaterialQuantity}
                  placeholder="Quantity"
                  placeholderTextColor={colors.textSecondary}
                />
                <TextInput
                  style={[
                    styles.addItemInputSmall,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={newMaterialUnit}
                  onChangeText={setNewMaterialUnit}
                  placeholder="Unit"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={handleAddMaterial}
              >
                <Plus size={16} color="#ffffff" />
                <Text style={styles.addButtonText}>Add Material</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Notes</Text>

            <View style={styles.formGroup}>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any additional notes or observations"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => handleSubmit('draft')}
              disabled={createMutation.isPending}
            >
              <Text style={[styles.actionButtonTextSecondary, { color: colors.text }]}>
                Save as Draft
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => handleSubmit('completed')}
              disabled={createMutation.isPending}
            >
              <Text style={styles.actionButtonText}>
                {createMutation.isPending ? 'Creating...' : 'Create Diary'}
              </Text>
            </TouchableOpacity>
          </View>
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
  section: {
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  formGroup: {
    gap: 8,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  projectButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  projectButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  projectButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  listItemInfo: {
    flex: 1,
    gap: 4,
  },
  listItemName: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  listItemDetail: {
    fontSize: 13,
  },
  addItemForm: {
    gap: 8,
  },
  addItemRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addItemInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  addItemInputSmall: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  actionButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
