/* eslint-disable @rork/linters/expo-router-enforce-safe-area-usage */
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack, router } from 'expo-router';
import { BookOpen, Plus, X, Calendar, CheckCircle2 } from 'lucide-react-native';
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

type DayOfWeek = 'M' | 'T' | 'W' | 'Th' | 'F' | 'S' | 'Su';

const DAYS_OF_WEEK: { day: DayOfWeek; label: string }[] = [
  { day: 'M', label: 'Mon' },
  { day: 'T', label: 'Tue' },
  { day: 'W', label: 'Wed' },
  { day: 'Th', label: 'Thu' },
  { day: 'F', label: 'Fri' },
  { day: 'S', label: 'Sat' },
  { day: 'Su', label: 'Sun' },
];

type DayData = {
  day: DayOfWeek;
  date: string;
  projectId: string;
  weather: string;
  temperature: string;
  workDescription: string;
  progress: string;
  delays: string;
  safetyIssues: string;
  visitors: string;
  workersOnSite: string;
  notes: string;
  equipmentList: { name: string; hours?: number }[];
  materialsList: { name: string; quantity?: string; unit?: string }[];
  completed: boolean;
};

export default function SiteDiaryCreateScreen() {
  const { company } = useApp();
  const { colors } = useTheme();

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('M');
  
  const getDateForDay = (dayIndex: number): string => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + dayIndex);
    return targetDate.toISOString().split('T')[0];
  };

  const [weeklyData, setWeeklyData] = useState<DayData[]>(
    DAYS_OF_WEEK.map((d, index) => ({
      day: d.day,
      date: getDateForDay(index),
      projectId: '',
      weather: '',
      temperature: '',
      workDescription: '',
      progress: '',
      delays: '',
      safetyIssues: '',
      visitors: '',
      workersOnSite: '',
      notes: '',
      equipmentList: [],
      materialsList: [],
      completed: false,
    }))
  );

  const currentDayData = weeklyData.find(d => d.day === selectedDay)!;

  const [date, setDate] = useState(currentDayData.date);
  const [projectId, setProjectId] = useState(currentDayData.projectId);
  const [weather, setWeather] = useState(currentDayData.weather);
  const [temperature, setTemperature] = useState(currentDayData.temperature);
  const [workDescription, setWorkDescription] = useState(currentDayData.workDescription);
  const [progress, setProgress] = useState(currentDayData.progress);
  const [delays, setDelays] = useState(currentDayData.delays);
  const [safetyIssues, setSafetyIssues] = useState(currentDayData.safetyIssues);
  const [visitors, setVisitors] = useState(currentDayData.visitors);
  const [workersOnSite, setWorkersOnSite] = useState(currentDayData.workersOnSite);
  const [notes, setNotes] = useState(currentDayData.notes);

  const [equipmentList, setEquipmentList] = useState<{ name: string; hours?: number }[]>(currentDayData.equipmentList);
  const [materialsList, setMaterialsList] = useState<{ name: string; quantity?: string; unit?: string }[]>(currentDayData.materialsList);
  
  const [newEquipmentName, setNewEquipmentName] = useState('');
  const [newEquipmentHours, setNewEquipmentHours] = useState('');
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialQuantity, setNewMaterialQuantity] = useState('');
  const [newMaterialUnit, setNewMaterialUnit] = useState('');

  const utils = trpc.useUtils();
  const createMutation = trpc.siteDiaries.create.useMutation({
    onSuccess: () => {
      utils.siteDiaries.list.invalidate();
    },
  });
  const projects = company?.projects || [];

  const updateCurrentDayData = () => {
    setWeeklyData(prev => prev.map(d => {
      if (d.day === selectedDay) {
        return {
          ...d,
          date,
          projectId,
          weather,
          temperature,
          workDescription,
          progress,
          delays,
          safetyIssues,
          visitors,
          workersOnSite,
          notes,
          equipmentList,
          materialsList,
          completed: workDescription.trim().length > 0 && projectId.length > 0,
        };
      }
      return d;
    }));
  };

  const loadDayData = (day: DayOfWeek) => {
    const dayData = weeklyData.find(d => d.day === day)!;
    setDate(dayData.date);
    setProjectId(dayData.projectId);
    setWeather(dayData.weather);
    setTemperature(dayData.temperature);
    setWorkDescription(dayData.workDescription);
    setProgress(dayData.progress);
    setDelays(dayData.delays);
    setSafetyIssues(dayData.safetyIssues);
    setVisitors(dayData.visitors);
    setWorkersOnSite(dayData.workersOnSite);
    setNotes(dayData.notes);
    setEquipmentList(dayData.equipmentList);
    setMaterialsList(dayData.materialsList);
  };

  const handleDayChange = (day: DayOfWeek) => {
    updateCurrentDayData();
    setSelectedDay(day);
    loadDayData(day);
  };

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

  const handleSaveDay = () => {
    if (!projectId) {
      Alert.alert('Error', 'Please select a project');
      return;
    }

    if (!workDescription.trim()) {
      Alert.alert('Error', 'Please enter work description');
      return;
    }

    updateCurrentDayData();
    Alert.alert('Success', `${DAYS_OF_WEEK.find(d => d.day === selectedDay)?.label} saved successfully!`);
  };

  const handleSubmit = async (submitStatus: 'draft' | 'completed') => {
    updateCurrentDayData();
    
    const updatedWeeklyData = weeklyData.map(d => {
      if (d.day === selectedDay) {
        return {
          ...d,
          date,
          projectId,
          weather,
          temperature,
          workDescription,
          progress,
          delays,
          safetyIssues,
          visitors,
          workersOnSite,
          notes,
          equipmentList,
          materialsList,
          completed: workDescription.trim().length > 0 && projectId.length > 0,
        };
      }
      return d;
    });
    
    const completedDays = updatedWeeklyData.filter(d => d.completed && d.workDescription.trim() && d.projectId);
    
    if (completedDays.length === 0) {
      Alert.alert('Error', 'Please complete at least one day before submitting');
      return;
    }

    try {
      for (const dayData of completedDays) {
        const project = projects.find(p => p.id === dayData.projectId);
        if (!project) continue;

        await createMutation.mutateAsync({
          date: dayData.date,
          projectId: dayData.projectId,
          projectName: project.name,
          weather: dayData.weather || undefined,
          temperature: dayData.temperature || undefined,
          workDescription: dayData.workDescription,
          progress: dayData.progress || undefined,
          delays: dayData.delays || undefined,
          safetyIssues: dayData.safetyIssues || undefined,
          visitors: dayData.visitors || undefined,
          workersOnSite: dayData.workersOnSite ? Number(dayData.workersOnSite) : undefined,
          equipmentUsed: dayData.equipmentList.length > 0 ? dayData.equipmentList : undefined,
          materials: dayData.materialsList.length > 0 ? dayData.materialsList : undefined,
          notes: dayData.notes || undefined,
          status: submitStatus,
        });
      }

      Alert.alert(
        'Success',
        `${completedDays.length} site ${completedDays.length === 1 ? 'diary' : 'diaries'} created successfully`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Create site diary error:', error);
      Alert.alert('Error', 'Failed to create site diary. Please try again.');
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Weekly Site Diary</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Document daily site activities for each day
          </Text>
        </View>

        <View style={[styles.daySelector, { backgroundColor: colors.card }]}>
          <View style={styles.daySelectorHeader}>
            <Calendar size={18} color={colors.primary} />
            <Text style={[styles.daySelectorTitle, { color: colors.text }]}>Select Day</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayButtons}>
            {DAYS_OF_WEEK.map(({ day, label }) => {
              const dayData = weeklyData.find(d => d.day === day)!;
              const isCompleted = dayData.completed;
              const isSelected = selectedDay === day;
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    isSelected && [styles.dayButtonActive, { backgroundColor: colors.primary }],
                    isCompleted && !isSelected && [styles.dayButtonCompleted, { backgroundColor: '#10b981', borderColor: '#10b981' }],
                  ]}
                  onPress={() => handleDayChange(day)}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      { color: colors.text },
                      (isSelected || isCompleted) && styles.dayButtonTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                  {isCompleted && !isSelected && (
                    <View style={styles.completedBadge}>
                      <CheckCircle2 size={14} color="#ffffff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.content}>
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Basic Information for {DAYS_OF_WEEK.find(d => d.day === selectedDay)?.label}
            </Text>

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
                { backgroundColor: colors.card, borderColor: colors.primary },
              ]}
              onPress={handleSaveDay}
              disabled={createMutation.isPending}
            >
              <Text style={[styles.actionButtonTextSecondary, { color: colors.primary }]}>
                Save {DAYS_OF_WEEK.find(d => d.day === selectedDay)?.label}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => handleSubmit('completed')}
              disabled={createMutation.isPending}
            >
              <Text style={styles.actionButtonText}>
                {createMutation.isPending ? 'Submitting...' : 'Submit Week'}
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
  daySelector: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  daySelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  daySelectorTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  dayButtons: {
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 60,
    alignItems: 'center',
    position: 'relative' as const,
  },
  dayButtonActive: {
    borderWidth: 2,
  },
  dayButtonCompleted: {
    borderWidth: 2,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  dayButtonTextActive: {
    color: '#ffffff',
  },
  completedBadge: {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 2,
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
