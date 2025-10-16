import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Calendar, FileText, User, Clock, ChevronRight, FolderOpen, Layers, Trash2, CheckCircle, AlertTriangle, Wrench, Filter, TrendingUp, History, BookOpen, Download, Search, X } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { generatePlantInspectionPDF, generateQuickHitchInspectionPDF, generateVehicleInspectionPDF, generateBucketChangeInspectionPDF, generatePositiveInterventionPDF, generateApprenticeshipLearningPDF } from '@/lib/pdf-generator';

export default function ReportsScreen() {
  const { 
    user, 
    company, 
    getCompanyInspections, 
    deleteInspection, 
    markInspectionFixed, 
    getCompanyPositiveInterventions, 
    getFixLogs, 
    getEmployeeInspections, 
    getEmployeePositiveInterventions, 
    getCompanyApprenticeshipEntries 
  } = useApp();
  const { colors } = useTheme();
  const router = useRouter();
  const inspections = getCompanyInspections();
  const positiveInterventions = getCompanyPositiveInterventions();
  const fixLogs = getFixLogs();
  const [selectedProject, setSelectedProject] = useState<string | 'all'>('all');
  const [mainTab, setMainTab] = useState<'reports' | 'mychecks'>('reports');
  const [selectedTab, setSelectedTab] = useState<'inspections' | 'interventions' | 'fixes' | 'apprenticeship'>('inspections');
  const [selectedType, setSelectedType] = useState<'all' | 'plant' | 'quickhitch' | 'vehicle' | 'bucketchange'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'fixed' | 'pending'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [dateSearchVisible, setDateSearchVisible] = useState(false);
  const [searchStartDate, setSearchStartDate] = useState('');
  const [searchEndDate, setSearchEndDate] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const canViewReports = user?.role === 'company' || user?.role === 'administrator' || user?.role === 'management' || user?.role === 'mechanic' || user?.role === 'apprentice';

  const myInspections = user ? getEmployeeInspections(user.id) : { plant: [], quickHitch: [], vehicle: [], bucketChange: [] };
  const myPositiveInterventions = user ? getEmployeePositiveInterventions(user.id) : [];

  const myAllInspections = [
    ...myInspections.plant.map(i => ({ ...i, type: 'plant' as const })),
    ...myInspections.quickHitch.map(i => ({ ...i, type: 'quickhitch' as const })),
    ...myInspections.vehicle.map(i => ({ ...i, type: 'vehicle' as const })),
    ...myInspections.bucketChange.map(i => ({ ...i, type: 'bucketchange' as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const myAllItems = [
    ...myAllInspections.map(i => ({ ...i, itemType: 'inspection' as const })),
    ...myPositiveInterventions.map(i => ({ ...i, itemType: 'intervention' as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const allInspections = [
    ...inspections.plant.map(i => ({ ...i, type: 'plant' as const })),
    ...inspections.quickHitch.map(i => ({ ...i, type: 'quickhitch' as const })),
    ...inspections.vehicle.map(i => ({ ...i, type: 'vehicle' as const })),
    ...inspections.bucketChange.map(i => ({ ...i, type: 'bucketchange' as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  let filteredInspections = selectedProject === 'all'
    ? allInspections
    : allInspections.filter(i => i.projectId === selectedProject);

  filteredInspections = filteredInspections.filter(i => isDateInRange(i.createdAt));

  if (selectedType !== 'all') {
    filteredInspections = filteredInspections.filter(i => i.type === selectedType);
  }

  if (selectedStatus !== 'all') {
    if (selectedStatus === 'fixed') {
      filteredInspections = filteredInspections.filter(i => 'isFixed' in i && i.isFixed);
    } else {
      filteredInspections = filteredInspections.filter(i => !('isFixed' in i && i.isFixed));
    }
  }

  let filteredInterventions = selectedSeverity === 'all'
    ? positiveInterventions
    : positiveInterventions.filter(i => i.severity === selectedSeverity);

  filteredInterventions = filteredInterventions.filter(i => isDateInRange(i.createdAt));

  const projectStats = company?.projects.map(project => {
    const count = positiveInterventions.filter(i => i.projectId === project.id).length;
    return { project, count };
  }).sort((a, b) => b.count - a.count) || [];

  const maxCount = Math.max(...projectStats.map(s => s.count), 1);

  const getProjectName = (projectId?: string) => {
    if (!projectId || !company) return 'No Project';
    return company.projects.find(p => p.id === projectId)?.name || 'Unknown Project';
  };

  const getInspectedItemName = (inspection: typeof allInspections[0]) => {
    if (inspection.type === 'plant' && 'plantNumber' in inspection) {
      return `Plant #${inspection.plantNumber}`;
    }
    if (inspection.type === 'quickhitch' && 'quickHitchModel' in inspection) {
      return inspection.quickHitchModel;
    }
    if (inspection.type === 'vehicle' && 'vehicleRegistration' in inspection) {
      return inspection.vehicleRegistration;
    }
    if (inspection.type === 'bucketchange' && 'bucketType' in inspection) {
      return inspection.bucketType;
    }
    return 'Unknown';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const isDateInRange = (dateString: string) => {
    if (!searchStartDate && !searchEndDate) return true;
    const date = new Date(dateString);
    const start = searchStartDate ? new Date(searchStartDate) : null;
    const end = searchEndDate ? new Date(searchEndDate) : null;
    
    if (start && end) {
      return date >= start && date <= end;
    } else if (start) {
      return date >= start;
    } else if (end) {
      return date <= end;
    }
    return true;
  };

  const clearDateSearch = () => {
    setSearchStartDate('');
    setSearchEndDate('');
  };

  const handleDownloadAllReports = async () => {
    if (!company) return;
    
    setIsDownloading(true);
    try {
      const projectName = selectedProject !== 'all' 
        ? company.projects.find(p => p.id === selectedProject)?.name 
        : undefined;

      let itemsToDownload: any[] = [];

      if (selectedTab === 'inspections') {
        itemsToDownload = filteredInspections.filter(i => isDateInRange(i.createdAt));
      } else if (selectedTab === 'interventions') {
        itemsToDownload = filteredInterventions.filter(i => isDateInRange(i.createdAt));
      } else if (selectedTab === 'apprenticeship') {
        const apprenticeshipEntries = getCompanyApprenticeshipEntries ? getCompanyApprenticeshipEntries() : [];
        itemsToDownload = apprenticeshipEntries.filter(e => isDateInRange(e.createdAt));
      }

      if (itemsToDownload.length === 0) {
        Alert.alert('No Reports', 'No reports found for the selected filters and date range.');
        return;
      }

      for (const item of itemsToDownload) {
        if (selectedTab === 'inspections') {
          const type = item.type;
          if (type === 'plant') {
            await generatePlantInspectionPDF(item, company.name, projectName);
          } else if (type === 'quickhitch') {
            await generateQuickHitchInspectionPDF(item, company.name, projectName);
          } else if (type === 'vehicle') {
            await generateVehicleInspectionPDF(item, company.name, projectName);
          } else if (type === 'bucketchange') {
            await generateBucketChangeInspectionPDF(item, company.name, projectName);
          }
        } else if (selectedTab === 'interventions') {
          await generatePositiveInterventionPDF(item, company.name, projectName);
        } else if (selectedTab === 'apprenticeship') {
          await generateApprenticeshipLearningPDF(item, company.name);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      Alert.alert('Success', `${itemsToDownload.length} report(s) downloaded successfully!`);
    } catch (error) {
      console.error('Error downloading reports:', error);
      Alert.alert('Error', 'Failed to download some reports. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteInspection = (inspectionId: string, type: string) => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this inspection report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInspection(inspectionId, type);
              console.log('Inspection deleted successfully');
            } catch (error) {
              console.error('Error deleting inspection:', error);
              Alert.alert('Error', 'Failed to delete inspection');
            }
          },
        },
      ]
    );
  };

  const handleMarkFixed = (inspectionId: string, type: string) => {
    Alert.alert(
      'Mark as Fixed',
      'Mark this issue as resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Fixed',
          onPress: async () => {
            try {
              await markInspectionFixed(inspectionId, type);
              console.log('Inspection marked as fixed');
            } catch (error) {
              console.error('Error marking inspection as fixed:', error);
              Alert.alert('Error', 'Failed to mark inspection as fixed');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: colors.text }]}>Reports & Checks</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>View reports and your inspection history</Text>
          </View>
          {canViewReports && mainTab === 'reports' && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.card }]}
                onPress={() => setDateSearchVisible(!dateSearchVisible)}
              >
                <Search size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.primary }]}
                onPress={handleDownloadAllReports}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Download size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {dateSearchVisible && mainTab === 'reports' && canViewReports && (
          <View style={[styles.dateSearchCard, { backgroundColor: colors.card }]}>
            <View style={styles.dateSearchHeader}>
              <View style={styles.dateSearchTitle}>
                <Calendar size={18} color={colors.primary} />
                <Text style={[styles.dateSearchTitleText, { color: colors.text }]}>Search by Date Range</Text>
              </View>
              <TouchableOpacity onPress={() => setDateSearchVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.dateInputsContainer}>
              <View style={styles.dateInputWrapper}>
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Start Date</Text>
                <TextInput
                  style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={searchStartDate}
                  onChangeText={setSearchStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.dateInputWrapper}>
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>End Date</Text>
                <TextInput
                  style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={searchEndDate}
                  onChangeText={setSearchEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
            {(searchStartDate || searchEndDate) && (
              <TouchableOpacity
                style={[styles.clearButton, { backgroundColor: colors.background }]}
                onPress={clearDateSearch}
              >
                <X size={16} color={colors.textSecondary} />
                <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={[styles.mainTabsContainer, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.mainTab, mainTab === 'reports' && styles.mainTabActive]}
            onPress={() => setMainTab('reports')}
          >
            <FileText size={18} color={mainTab === 'reports' ? '#1e40af' : colors.textSecondary} />
            <Text style={[styles.mainTabText, { color: colors.textSecondary }, mainTab === 'reports' && styles.mainTabTextActive]}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mainTab, mainTab === 'mychecks' && styles.mainTabActive]}
            onPress={() => setMainTab('mychecks')}
          >
            <History size={18} color={mainTab === 'mychecks' ? '#1e40af' : colors.textSecondary} />
            <Text style={[styles.mainTabText, { color: colors.textSecondary }, mainTab === 'mychecks' && styles.mainTabTextActive]}>My Checks</Text>
          </TouchableOpacity>
        </View>

        {mainTab === 'reports' ? (
          !canViewReports ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <FileText size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Reports Not Available</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                You don&apos;t have permission to view inspection reports
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <Text style={styles.statValue}>{filteredInspections.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Inspections</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <Text style={styles.statValue}>{positiveInterventions.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Interventions</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <Text style={styles.statValue}>{fixLogs.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Fixes</Text>
                </View>
              </View>

              <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
                <TouchableOpacity
                  style={[styles.tab, selectedTab === 'inspections' && styles.tabActive]}
                  onPress={() => setSelectedTab('inspections')}
                >
                  <FileText size={18} color={selectedTab === 'inspections' ? '#1e40af' : colors.textSecondary} />
                  <Text style={[styles.tabText, { color: colors.textSecondary }, selectedTab === 'inspections' && styles.tabTextActive]}>Inspections</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, selectedTab === 'interventions' && styles.tabActive]}
                  onPress={() => setSelectedTab('interventions')}
                >
                  <AlertTriangle size={18} color={selectedTab === 'interventions' ? '#10b981' : colors.textSecondary} />
                  <Text style={[styles.tabText, { color: colors.textSecondary }, selectedTab === 'interventions' && styles.tabTextActive]}>PIs</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, selectedTab === 'fixes' && styles.tabActive]}
                  onPress={() => setSelectedTab('fixes')}
                >
                  <Wrench size={18} color={selectedTab === 'fixes' ? '#f59e0b' : colors.textSecondary} />
                  <Text style={[styles.tabText, { color: colors.textSecondary }, selectedTab === 'fixes' && styles.tabTextActive]}>Fixes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, selectedTab === 'apprenticeship' && styles.tabActive]}
                  onPress={() => setSelectedTab('apprenticeship')}
                >
                  <BookOpen size={18} color={selectedTab === 'apprenticeship' ? '#8b5cf6' : colors.textSecondary} />
                  <Text style={[styles.tabText, { color: colors.textSecondary }, selectedTab === 'apprenticeship' && styles.tabTextActive]}>Learning</Text>
                </TouchableOpacity>
              </View>

              {company && company.projects.length > 0 && selectedTab === 'inspections' && (
                <View style={[styles.filterSection, { backgroundColor: colors.card }]}>
                  <View style={styles.filterHeader}>
                    <FolderOpen size={18} color="#1e40af" />
                    <Text style={[styles.filterTitle, { color: colors.text }]}>Filter by Project</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterButtons}>
                    <TouchableOpacity
                      style={[styles.filterButton, { backgroundColor: colors.background, borderColor: colors.border }, selectedProject === 'all' && styles.filterButtonActive]}
                      onPress={() => setSelectedProject('all')}
                    >
                      <Layers size={16} color={selectedProject === 'all' ? '#ffffff' : colors.textSecondary} />
                      <Text style={[styles.filterButtonText, { color: colors.textSecondary }, selectedProject === 'all' && styles.filterButtonTextActive]}>
                        All Projects
                      </Text>
                    </TouchableOpacity>
                    {company.projects.map(project => (
                      <TouchableOpacity
                        key={project.id}
                        style={[styles.filterButton, { backgroundColor: colors.background, borderColor: colors.border }, selectedProject === project.id && styles.filterButtonActive]}
                        onPress={() => setSelectedProject(project.id)}
                      >
                        <Text style={[styles.filterButtonText, { color: colors.textSecondary }, selectedProject === project.id && styles.filterButtonTextActive]}>
                          {project.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {selectedTab === 'inspections' && (
                <View style={[styles.filterSection, { backgroundColor: colors.card }]}>
                  <View style={styles.filterHeader}>
                    <Filter size={18} color="#1e40af" />
                    <Text style={[styles.filterTitle, { color: colors.text }]}>Filter by Type</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterButtons}>
                    <TouchableOpacity
                      style={[styles.filterButton, { backgroundColor: colors.background, borderColor: colors.border }, selectedType === 'all' && styles.filterButtonActive]}
                      onPress={() => setSelectedType('all')}
                    >
                      <Text style={[styles.filterButtonText, { color: colors.textSecondary }, selectedType === 'all' && styles.filterButtonTextActive]}>All Types</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterButton, { backgroundColor: colors.background, borderColor: colors.border }, selectedType === 'plant' && styles.filterButtonActive]}
                      onPress={() => setSelectedType('plant')}
                    >
                      <Text style={[styles.filterButtonText, { color: colors.textSecondary }, selectedType === 'plant' && styles.filterButtonTextActive]}>Plant</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterButton, { backgroundColor: colors.background, borderColor: colors.border }, selectedType === 'quickhitch' && styles.filterButtonActive]}
                      onPress={() => setSelectedType('quickhitch')}
                    >
                      <Text style={[styles.filterButtonText, { color: colors.textSecondary }, selectedType === 'quickhitch' && styles.filterButtonTextActive]}>Quick Hitch</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterButton, { backgroundColor: colors.background, borderColor: colors.border }, selectedType === 'vehicle' && styles.filterButtonActive]}
                      onPress={() => setSelectedType('vehicle')}
                    >
                      <Text style={[styles.filterButtonText, { color: colors.textSecondary }, selectedType === 'vehicle' && styles.filterButtonTextActive]}>Vehicle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterButton, { backgroundColor: colors.background, borderColor: colors.border }, selectedType === 'bucketchange' && styles.filterButtonActive]}
                      onPress={() => setSelectedType('bucketchange')}
                    >
                      <Text style={[styles.filterButtonText, { color: colors.textSecondary }, selectedType === 'bucketchange' && styles.filterButtonTextActive]}>Bucket</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              )}

              {selectedTab === 'inspections' && (
                <View style={[styles.filterSection, { backgroundColor: colors.card }]}>
                  <View style={styles.filterHeader}>
                    <CheckCircle size={18} color="#1e40af" />
                    <Text style={[styles.filterTitle, { color: colors.text }]}>Filter by Status</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterButtons}>
                    <TouchableOpacity
                      style={[styles.filterButton, { backgroundColor: colors.background, borderColor: colors.border }, selectedStatus === 'all' && styles.filterButtonActive]}
                      onPress={() => setSelectedStatus('all')}
                    >
                      <Text style={[styles.filterButtonText, { color: colors.textSecondary }, selectedStatus === 'all' && styles.filterButtonTextActive]}>All Status</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterButton, { backgroundColor: colors.background, borderColor: colors.border }, selectedStatus === 'pending' && styles.filterButtonActive]}
                      onPress={() => setSelectedStatus('pending')}
                    >
                      <Text style={[styles.filterButtonText, { color: colors.textSecondary }, selectedStatus === 'pending' && styles.filterButtonTextActive]}>Pending</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterButton, { backgroundColor: colors.background, borderColor: colors.border }, selectedStatus === 'fixed' && styles.filterButtonActive]}
                      onPress={() => setSelectedStatus('fixed')}
                    >
                      <Text style={[styles.filterButtonText, { color: colors.textSecondary }, selectedStatus === 'fixed' && styles.filterButtonTextActive]}>Fixed</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              )}

              {selectedTab === 'interventions' && (
                <View style={[styles.filterSection, { backgroundColor: colors.card }]}>
                  <View style={styles.filterHeader}>
                    <AlertTriangle size={18} color="#1e40af" />
                    <Text style={[styles.filterTitle, { color: colors.text }]}>Filter by Severity</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterButtons}>
                    <TouchableOpacity
                      style={[styles.filterButton, { backgroundColor: colors.background, borderColor: colors.border }, selectedSeverity === 'all' && styles.filterButtonActive]}
                      onPress={() => setSelectedSeverity('all')}
                    >
                      <Text style={[styles.filterButtonText, { color: colors.textSecondary }, selectedSeverity === 'all' && styles.filterButtonTextActive]}>All Severity</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterButton, { backgroundColor: colors.background, borderColor: colors.border }, selectedSeverity === 'low' && styles.filterButtonActive]}
                      onPress={() => setSelectedSeverity('low')}
                    >
                      <Text style={[styles.filterButtonText, { color: colors.textSecondary }, selectedSeverity === 'low' && styles.filterButtonTextActive]}>Low</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterButton, { backgroundColor: colors.background, borderColor: colors.border }, selectedSeverity === 'medium' && styles.filterButtonActive]}
                      onPress={() => setSelectedSeverity('medium')}
                    >
                      <Text style={[styles.filterButtonText, { color: colors.textSecondary }, selectedSeverity === 'medium' && styles.filterButtonTextActive]}>Medium</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterButton, { backgroundColor: colors.background, borderColor: colors.border }, selectedSeverity === 'high' && styles.filterButtonActive]}
                      onPress={() => setSelectedSeverity('high')}
                    >
                      <Text style={[styles.filterButtonText, { color: colors.textSecondary }, selectedSeverity === 'high' && styles.filterButtonTextActive]}>High</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              )}

              {selectedTab === 'interventions' && company && company.projects.length > 0 && positiveInterventions.length > 0 && (
                <View style={[styles.chartSection, { backgroundColor: colors.card }]}>
                  <View style={styles.chartHeader}>
                    <TrendingUp size={20} color="#10b981" />
                    <Text style={[styles.chartTitle, { color: colors.text }]}>Leading Projects</Text>
                  </View>
                  <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>Projects by positive interventions</Text>
                  <View style={styles.chartContainer}>
                    {projectStats.slice(0, 5).map((stat, index) => (
                      <View key={stat.project.id} style={styles.chartRow}>
                        <View style={styles.chartLabelContainer}>
                          <Text style={[styles.chartRank, { color: colors.textSecondary }]}>#{index + 1}</Text>
                          <Text style={[styles.chartLabel, { color: colors.text }]} numberOfLines={1}>{stat.project.name}</Text>
                        </View>
                        <View style={styles.chartBarContainer}>
                          <View
                            style={[
                              styles.chartBar,
                              {
                                width: `${(stat.count / maxCount) * 100}%`,
                                backgroundColor: index === 0 ? '#10b981' : index === 1 ? '#3b82f6' : index === 2 ? '#f59e0b' : colors.border,
                              },
                            ]}
                          />
                          <Text style={[styles.chartValue, { color: colors.text }]}>{stat.count}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {selectedTab === 'apprenticeship' ? (
                (() => {
                  const allApprenticeshipEntries = getCompanyApprenticeshipEntries ? getCompanyApprenticeshipEntries() : [];
                  const apprenticeshipEntries = allApprenticeshipEntries.filter(e => isDateInRange(e.createdAt));
                  return apprenticeshipEntries.length === 0 ? (
                    <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                      <BookOpen size={48} color={colors.textSecondary} />
                      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Learning Entries Yet</Text>
                      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                        Apprenticeship learning entries will appear here
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.reportsList}>
                      {apprenticeshipEntries.map((entry) => (
                        <View key={entry.id} style={[styles.reportCard, { backgroundColor: colors.card }]}>
                          <View style={styles.reportCardContent}>
                            <View style={styles.reportHeader}>
                              <View style={[styles.reportIcon, { backgroundColor: '#f3e8ff' }]}>
                                <BookOpen size={20} color="#8b5cf6" />
                              </View>
                              <View style={styles.reportInfo}>
                                <Text style={[styles.reportTitle, { color: colors.text }]}>Apprenticeship Learning</Text>
                                <View style={styles.reportMeta}>
                                  <User size={14} color={colors.textSecondary} />
                                  <Text style={[styles.reportMetaText, { color: colors.textSecondary }]}>
                                    {entry.apprenticeName}
                                  </Text>
                                </View>
                              </View>
                            </View>

                            <View style={styles.reportDetails}>
                              <View style={styles.reportDetail}>
                                <Calendar size={16} color={colors.textSecondary} />
                                <Text style={[styles.reportDetailText, { color: colors.textSecondary }]}>
                                  {formatDate(entry.createdAt)}
                                </Text>
                              </View>
                              <View style={styles.reportDetail}>
                                <Clock size={16} color={colors.textSecondary} />
                                <Text style={[styles.reportDetailText, { color: colors.textSecondary }]}>
                                  {formatTime(entry.createdAt)}
                                </Text>
                              </View>
                            </View>

                            <View style={[styles.reportExtra, { borderTopColor: colors.border }]}>
                              <Text style={[styles.reportExtraLabel, { color: colors.textSecondary }]}>Learning:</Text>
                              <Text style={[styles.reportExtraValue, { color: colors.text }]} numberOfLines={3}>
                                {entry.learningDescription}
                              </Text>
                            </View>

                            {entry.pictures && entry.pictures.length > 0 && (
                              <View style={[styles.reportExtra, { borderTopColor: colors.border }]}>
                                <Text style={[styles.reportExtraLabel, { color: colors.textSecondary }]}>Photos:</Text>
                                <Text style={[styles.reportExtraValue, { color: colors.text }]}>
                                  {entry.pictures.length} image{entry.pictures.length !== 1 ? 's' : ''}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  );
                })()
              ) : selectedTab === 'inspections' && filteredInspections.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                  <FileText size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Reports Yet</Text>
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                    {selectedProject === 'all'
                      ? 'Inspection reports will appear here once employees submit them'
                      : 'No inspections found for this project'}
                  </Text>
                </View>
              ) : selectedTab === 'inspections' ? (
                <View style={styles.reportsList}>
                  {filteredInspections.map((inspection) => {
                    const checks = 'checks' in inspection ? inspection.checks : [];
                    const hasRedIssues = checks.some((c: any) => 
                      c.status === 'C' || c.status === '✗' || c.status === false
                    );
                    const hasYellowIssues = !hasRedIssues && checks.some((c: any) => c.status === 'B');
                    const isAllGreen = !hasRedIssues && !hasYellowIssues;
                    const isFixed = 'isFixed' in inspection && inspection.isFixed;

                    const borderColor = hasRedIssues ? '#ef4444' : hasYellowIssues ? '#f59e0b' : isAllGreen ? '#10b981' : colors.border;

                    return (
                    <View key={inspection.id} style={[styles.reportCard, { backgroundColor: colors.card, borderLeftWidth: 3, borderLeftColor: borderColor }]}>
                      <TouchableOpacity
                        style={styles.reportCardContent}
                        activeOpacity={0.7}
                        onPress={() => router.push({
                          pathname: '/inspection-detail',
                          params: { id: inspection.id, type: inspection.type },
                        })}
                      >
                        <View style={styles.reportHeader}>
                          <View
                            style={[
                              styles.reportIcon,
                              {
                                backgroundColor:
                                  inspection.type === 'plant'
                                    ? '#dbeafe'
                                    : inspection.type === 'quickhitch'
                                    ? '#ccfbf1'
                                    : inspection.type === 'vehicle'
                                    ? '#fef3c7'
                                    : '#fce7f3',
                              },
                            ]}
                          >
                            <FileText
                              size={20}
                              color={
                                inspection.type === 'plant'
                                  ? '#1e40af'
                                  : inspection.type === 'quickhitch'
                                  ? '#0d9488'
                                  : inspection.type === 'vehicle'
                                  ? '#f59e0b'
                                  : '#ec4899'
                              }
                            />
                          </View>
                          <View style={styles.reportInfo}>
                            <Text style={[styles.reportTitle, { color: colors.text }]}>
                              {inspection.type === 'plant'
                                ? 'Plant Daily Inspection'
                                : inspection.type === 'quickhitch'
                                ? 'Quick Hitch Inspection'
                                : inspection.type === 'vehicle'
                                ? 'Vehicle Inspection'
                                : 'Bucket Change Check'}
                            </Text>
                            <View style={styles.reportMeta}>
                              <User size={14} color={colors.textSecondary} />
                              <Text style={[styles.reportMetaText, { color: colors.textSecondary }]}>
                                {'employeeName' in inspection
                                  ? inspection.employeeName
                                  : inspection.operatorName}
                              </Text>
                            </View>
                          </View>
                          <ChevronRight size={20} color={colors.textSecondary} />
                        </View>

                      <View style={styles.reportDetails}>
                        <View style={styles.reportDetail}>
                          <Calendar size={16} color={colors.textSecondary} />
                          <Text style={[styles.reportDetailText, { color: colors.textSecondary }]}>
                            {formatDate(inspection.createdAt)}
                          </Text>
                        </View>
                        <View style={styles.reportDetail}>
                          <Clock size={16} color={colors.textSecondary} />
                          <Text style={[styles.reportDetailText, { color: colors.textSecondary }]}>
                            {formatTime(inspection.createdAt)}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.reportExtra, { borderTopColor: colors.border }]}>
                        <Text style={[styles.reportExtraLabel, { color: colors.textSecondary }]}>Inspected Item:</Text>
                        <Text style={[styles.reportExtraValue, { color: colors.text }]}>{getInspectedItemName(inspection)}</Text>
                      </View>

                      {inspection.projectId && (
                        <View style={[styles.reportExtra, { borderTopColor: colors.border }]}>
                          <Text style={[styles.reportExtraLabel, { color: colors.textSecondary }]}>Project:</Text>
                          <Text style={[styles.reportExtraValue, { color: colors.text }]}>{getProjectName(inspection.projectId)}</Text>
                        </View>
                      )}

                      {isFixed && (
                        <View style={[styles.fixedBadge, { backgroundColor: '#dcfce7', borderColor: '#86efac' }]}>
                          <CheckCircle size={14} color="#16a34a" />
                          <Text style={styles.fixedBadgeText}>Fixed by {'fixedBy' in inspection ? inspection.fixedBy : 'Unknown'}</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <View style={styles.reportActions}>
                      {(hasRedIssues || hasYellowIssues) && !isFixed && (user?.role === 'mechanic' || user?.role === 'administrator' || user?.role === 'management') && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.fixButton]}
                          onPress={() => handleMarkFixed(inspection.id, inspection.type)}
                        >
                          <CheckCircle size={16} color="#16a34a" />
                          <Text style={styles.fixButtonText}>Mark Fixed</Text>
                        </TouchableOpacity>
                      )}
                      {(user?.role === 'company' || user?.role === 'administrator') && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => handleDeleteInspection(inspection.id, inspection.type)}
                        >
                          <Trash2 size={16} color="#dc2626" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                    );
                  })}
                </View>
              ) : selectedTab === 'interventions' ? (
                positiveInterventions.length === 0 ? (
                  <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                    <AlertTriangle size={48} color={colors.textSecondary} />
                    <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Interventions Yet</Text>
                    <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                      Positive interventions will appear here once employees submit them
                    </Text>
                  </View>
                ) : (
                  <View style={styles.reportsList}>
                    {filteredInterventions.map((intervention) => (
                      <TouchableOpacity
                        key={intervention.id}
                        style={[styles.reportCard, { backgroundColor: colors.card }]}
                        activeOpacity={0.7}
                        onPress={() => router.push({
                          pathname: '/intervention-detail',
                          params: { id: intervention.id },
                        })}
                      >
                        <View style={styles.reportCardContent}>
                          <View style={styles.reportHeader}>
                            <View style={[styles.reportIcon, { backgroundColor: '#dcfce7' }]}>
                              <AlertTriangle size={20} color="#10b981" />
                            </View>
                            <View style={styles.reportInfo}>
                              <Text style={[styles.reportTitle, { color: colors.text }]}>Positive Intervention</Text>
                              <View style={styles.reportMeta}>
                                <User size={14} color={colors.textSecondary} />
                                <Text style={[styles.reportMetaText, { color: colors.textSecondary }]}>
                                  {intervention.employeeName}
                                </Text>
                              </View>
                            </View>
                            <ChevronRight size={20} color={colors.textSecondary} />
                          </View>

                          <View style={styles.reportDetails}>
                            <View style={styles.reportDetail}>
                              <Calendar size={16} color={colors.textSecondary} />
                              <Text style={[styles.reportDetailText, { color: colors.textSecondary }]}>
                                {formatDate(intervention.createdAt)}
                              </Text>
                            </View>
                            <View style={styles.reportDetail}>
                              <Clock size={16} color={colors.textSecondary} />
                              <Text style={[styles.reportDetailText, { color: colors.textSecondary }]}>
                                {formatTime(intervention.createdAt)}
                              </Text>
                            </View>
                          </View>

                          <View style={[styles.reportExtra, { borderTopColor: colors.border }]}>
                            <Text style={[styles.reportExtraLabel, { color: colors.textSecondary }]}>Hazard:</Text>
                            <Text style={[styles.reportExtraValue, { color: colors.text }]} numberOfLines={2}>
                              {intervention.hazardDescription}
                            </Text>
                          </View>

                          <View style={[styles.reportExtra, { borderTopColor: colors.border }]}>
                            <View
                              style={[
                                styles.severityBadge,
                                {
                                  backgroundColor:
                                    intervention.severity === 'high'
                                      ? '#fee2e2'
                                      : intervention.severity === 'medium'
                                      ? '#fef3c7'
                                      : '#dcfce7',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.severityBadgeText,
                                  {
                                    color:
                                      intervention.severity === 'high'
                                        ? '#dc2626'
                                        : intervention.severity === 'medium'
                                        ? '#f59e0b'
                                        : '#16a34a',
                                  },
                                ]}
                              >
                                {intervention.severity.toUpperCase()} SEVERITY
                              </Text>
                            </View>
                          </View>

                          {intervention.pictures && intervention.pictures.length > 0 && (
                            <View style={[styles.reportExtra, { borderTopColor: colors.border }]}>
                              <Text style={[styles.reportExtraLabel, { color: colors.textSecondary }]}>Photos:</Text>
                              <Text style={[styles.reportExtraValue, { color: colors.text }]}>
                                {intervention.pictures.length} image{intervention.pictures.length !== 1 ? 's' : ''}
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )
              ) : (
                fixLogs.length === 0 ? (
                  <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                    <Wrench size={48} color={colors.textSecondary} />
                    <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Fixes Yet</Text>
                    <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                      Fixed inspection logs will appear here
                    </Text>
                  </View>
                ) : (
                  <View style={styles.reportsList}>
                    {fixLogs.map((log) => (
                      <View key={log.id} style={[styles.reportCard, { backgroundColor: colors.card }]}>
                        <View style={styles.reportCardContent}>
                          <View style={styles.reportHeader}>
                            <View style={[styles.reportIcon, { backgroundColor: '#fef3c7' }]}>
                              <Wrench size={20} color="#f59e0b" />
                            </View>
                            <View style={styles.reportInfo}>
                              <Text style={[styles.reportTitle, { color: colors.text }]}>Issue Fixed</Text>
                              <View style={styles.reportMeta}>
                                <User size={14} color={colors.textSecondary} />
                                <Text style={[styles.reportMetaText, { color: colors.textSecondary }]}>
                                  {log.fixedBy}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View style={styles.reportDetails}>
                            <View style={styles.reportDetail}>
                              <Calendar size={16} color={colors.textSecondary} />
                              <Text style={[styles.reportDetailText, { color: colors.textSecondary }]}>
                                {formatDate(log.fixedAt)}
                              </Text>
                            </View>
                            <View style={styles.reportDetail}>
                              <Clock size={16} color={colors.textSecondary} />
                              <Text style={[styles.reportDetailText, { color: colors.textSecondary }]}>
                                {formatTime(log.fixedAt)}
                              </Text>
                            </View>
                          </View>

                          {log.notes && (
                            <View style={[styles.reportExtra, { borderTopColor: colors.border }]}>
                              <Text style={[styles.reportExtraLabel, { color: colors.textSecondary }]}>Notes:</Text>
                              <Text style={[styles.reportExtraValue, { color: colors.text }]}>{log.notes}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )
              )}
            </>
          )
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{myAllInspections.length}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Inspections</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{myPositiveInterventions.length}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Interventions</Text>
              </View>
            </View>

            {myAllItems.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <History size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Checks Yet</Text>
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  Your completed inspections will appear here
                </Text>
              </View>
            ) : (
              <View style={styles.reportsList}>
                {myAllItems.map((item) => {
                  if (item.itemType === 'intervention') {
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.reportCard, { backgroundColor: colors.card }]}
                        activeOpacity={0.7}
                        onPress={() => router.push({
                          pathname: '/intervention-detail',
                          params: { id: item.id },
                        })}
                      >
                        <View style={styles.reportCardContent}>
                          <View style={styles.reportHeader}>
                            <View style={[styles.reportIcon, { backgroundColor: '#dcfce7' }]}>
                              <AlertTriangle size={20} color="#10b981" />
                            </View>
                            <View style={styles.reportInfo}>
                              <Text style={[styles.reportTitle, { color: colors.text }]}>Positive Intervention</Text>
                              <Text style={[styles.reportMetaText, { color: colors.textSecondary }]} numberOfLines={1}>
                                {item.hazardDescription}
                              </Text>
                            </View>
                            <ChevronRight size={20} color={colors.textSecondary} />
                          </View>

                          <View style={styles.reportDetails}>
                            <View style={styles.reportDetail}>
                              <Calendar size={14} color={colors.textSecondary} />
                              <Text style={[styles.reportDetailText, { color: colors.textSecondary }]}>
                                {formatDate(item.createdAt)}
                              </Text>
                            </View>
                            <View style={styles.reportDetail}>
                              <Clock size={14} color={colors.textSecondary} />
                              <Text style={[styles.reportDetailText, { color: colors.textSecondary }]}>
                                {formatTime(item.createdAt)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  }

                  const inspection = item;
                  return (
                    <TouchableOpacity
                      key={inspection.id}
                      style={[styles.reportCard, { backgroundColor: colors.card }]}
                      activeOpacity={0.7}
                      onPress={() => router.push({
                        pathname: '/inspection-detail',
                        params: { id: inspection.id, type: inspection.type },
                      })}
                    >
                      <View style={styles.reportCardContent}>
                        <View style={styles.reportHeader}>
                          <View
                            style={[
                              styles.reportIcon,
                              {
                                backgroundColor:
                                  inspection.type === 'plant'
                                    ? '#dbeafe'
                                    : inspection.type === 'quickhitch'
                                    ? '#ccfbf1'
                                    : inspection.type === 'vehicle'
                                    ? '#fef3c7'
                                    : '#fce7f3',
                              },
                            ]}
                          >
                            <FileText
                              size={20}
                              color={
                                inspection.type === 'plant'
                                  ? '#1e40af'
                                  : inspection.type === 'quickhitch'
                                  ? '#0d9488'
                                  : inspection.type === 'vehicle'
                                  ? '#f59e0b'
                                  : '#ec4899'
                              }
                            />
                          </View>
                          <View style={styles.reportInfo}>
                            <Text style={[styles.reportTitle, { color: colors.text }]}>{
                              inspection.type === 'plant'
                                ? 'Plant Daily Inspection'
                                : inspection.type === 'quickhitch'
                                ? 'Quick Hitch Inspection'
                                : inspection.type === 'vehicle'
                                ? 'Vehicle Inspection'
                                : 'Bucket Change Check'
                            }</Text>
                            <Text style={[styles.reportMetaText, { color: colors.textSecondary }]}>{
                              inspection.type === 'plant' && 'plantNumber' in inspection
                                ? `Plant #${inspection.plantNumber}`
                                : inspection.type === 'quickhitch' && 'quickHitchModel' in inspection
                                ? inspection.quickHitchModel
                                : inspection.type === 'vehicle' && 'vehicleRegistration' in inspection
                                ? inspection.vehicleRegistration
                                : inspection.type === 'bucketchange' && 'bucketType' in inspection
                                ? inspection.bucketType
                                : ''
                            }</Text>
                          </View>
                          <ChevronRight size={20} color={colors.textSecondary} />
                        </View>

                        <View style={styles.reportDetails}>
                          <View style={styles.reportDetail}>
                            <Calendar size={14} color={colors.textSecondary} />
                            <Text style={[styles.reportDetailText, { color: colors.textSecondary }]}>
                              {formatDate(inspection.createdAt)}
                            </Text>
                          </View>
                          <View style={styles.reportDetail}>
                            <Clock size={14} color={colors.textSecondary} />
                            <Text style={[styles.reportDetailText, { color: colors.textSecondary }]}>
                              {formatTime(inspection.createdAt)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 80,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1e40af',
    marginBottom: 4,
    lineHeight: 32,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center' as const,
    lineHeight: 14,
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
  reportsList: {
    gap: 12,
  },
  reportCard: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  reportCardContent: {
    padding: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1e293b',
    marginBottom: 4,
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportMetaText: {
    fontSize: 13,
    color: '#64748b',
  },
  reportDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  reportDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportDetailText: {
    fontSize: 13,
    color: '#64748b',
  },
  reportExtra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  reportExtraLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  reportExtraValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1e293b',
  },
  filterSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  filterButtons: {
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterButtonActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  fixButton: {
    backgroundColor: '#dcfce7',
    flex: 1,
  },
  fixButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#16a34a',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
  },
  fixedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8,
  },
  fixedBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#16a34a',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  tabTextActive: {
    color: '#1e40af',
  },
  mainTabsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  mainTabActive: {
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
  },
  mainTabText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  mainTabTextActive: {
    color: '#1e40af',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  severityBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  chartSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  chartSubtitle: {
    fontSize: 13,
    marginBottom: 20,
  },
  chartContainer: {
    gap: 16,
  },
  chartRow: {
    gap: 8,
  },
  chartLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  chartRank: {
    fontSize: 14,
    fontWeight: '700' as const,
    width: 28,
  },
  chartLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    flex: 1,
  },
  chartBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chartBar: {
    height: 32,
    borderRadius: 6,
    minWidth: 40,
  },
  chartValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    minWidth: 32,
  },
  dateSearchCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dateSearchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateSearchTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateSearchTitleText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  dateInputsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
});
