import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Draft, DraftType, EquipmentReport } from '@/types';
import { Calendar, FileText, User, Clock, ChevronRight, Trash2, CheckCircle, AlertTriangle, Wrench, Filter, Download, Search, X, FilePlus, Send, Edit3, Droplet, Wind, ClipboardList, BarChart3, Activity, Eye, XCircle } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  generatePlantInspectionPDF,
  generateQuickHitchInspectionPDF,
  generateVehicleInspectionPDF,
  generateBucketChangeInspectionPDF,
  generatePositiveInterventionPDF,
  generateWeeklyInspectionPDF,
  generateAirTestingInspectionPDF
} from '@/lib/pdf-generator';

export default function ReportsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [mainTab, setMainTab] = useState<'reports' | 'mychecks' | 'drafts'>('reports');
  const [selectedCategory, setSelectedCategory] = useState<'inspections' | 'interventions' | 'fixes' | 'testing' | 'equipment-reports'>('inspections');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilterVisible, setDateFilterVisible] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedEquipmentReport, setSelectedEquipmentReport] = useState<EquipmentReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'fixed' | 'discarded'>('all');
  const [statusChangeModalVisible, setStatusChangeModalVisible] = useState(false);
  const [statusChangeAction, setStatusChangeAction] = useState<'fixed' | 'discarded' | null>(null);
  const [statusChangeNotes, setStatusChangeNotes] = useState('');

  const appContext = useApp();
  
  if (!appContext) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }
  
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
    getDrafts,
    deleteDraft,
    submitDraft,
    deleteGreasingInspection,
    getCompanyAirTestingInspections,
    deleteAirTestingInspection,
    getCompanyEquipmentReports,
    markEquipmentReportFixed,
    markEquipmentReportDiscarded,
    deleteEquipmentReport,
  } = appContext;
  
  const canViewReports = user?.role === 'company' || user?.role === 'administrator' || user?.role === 'management' || user?.role === 'mechanic' || user?.role === 'apprentice';

  const inspections = getCompanyInspections ? getCompanyInspections() : { plant: [], quickHitch: [], vehicle: [], bucketChange: [] };
  const positiveInterventions = getCompanyPositiveInterventions ? getCompanyPositiveInterventions() : [];
  const fixLogs = getFixLogs ? getFixLogs() : [];
  const airTestingInspections = getCompanyAirTestingInspections ? getCompanyAirTestingInspections() : [];
  const equipmentReports = getCompanyEquipmentReports ? getCompanyEquipmentReports() : [];

  const allInspections = [
    ...inspections.plant.map(i => ({ ...i, type: 'plant' as const })),
    ...inspections.quickHitch.map(i => ({ ...i, type: 'quickhitch' as const })),
    ...inspections.vehicle.map(i => ({ ...i, type: 'vehicle' as const })),
    ...inspections.bucketChange.map(i => ({ ...i, type: 'bucketchange' as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const myInspections = user && getEmployeeInspections ? getEmployeeInspections(user.id) : { plant: [], quickHitch: [], vehicle: [], bucketChange: [] };
  const myPositiveInterventions = user && getEmployeePositiveInterventions ? getEmployeePositiveInterventions(user.id) : [];

  const myAllInspections = [
    ...myInspections.plant.map(i => ({ ...i, type: 'plant' as const })),
    ...myInspections.quickHitch.map(i => ({ ...i, type: 'quickhitch' as const })),
    ...myInspections.vehicle.map(i => ({ ...i, type: 'vehicle' as const })),
    ...myInspections.bucketChange.map(i => ({ ...i, type: 'bucketchange' as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Reports</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Track inspections and activity</Text>
          </View>
          {canViewReports && mainTab === 'reports' && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.card }]}
                onPress={() => setDateFilterVisible(!dateFilterVisible)}
              >
                <Calendar size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.tabBar, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.tabItem, mainTab === 'reports' && [styles.tabItemActive, { backgroundColor: colors.primary }]]}
            onPress={() => setMainTab('reports')}
          >
            <BarChart3 size={18} color={mainTab === 'reports' ? '#fff' : colors.textSecondary} />
            <Text style={[styles.tabText, { color: mainTab === 'reports' ? '#fff' : colors.textSecondary }]}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, mainTab === 'mychecks' && [styles.tabItemActive, { backgroundColor: colors.primary }]]}
            onPress={() => setMainTab('mychecks')}
          >
            <Activity size={18} color={mainTab === 'mychecks' ? '#fff' : colors.textSecondary} />
            <Text style={[styles.tabText, { color: mainTab === 'mychecks' ? '#fff' : colors.textSecondary }]}>My Checks</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, mainTab === 'drafts' && [styles.tabItemActive, { backgroundColor: colors.primary }]]}
            onPress={() => setMainTab('drafts')}
          >
            <FilePlus size={18} color={mainTab === 'drafts' ? '#fff' : colors.textSecondary} />
            <Text style={[styles.tabText, { color: mainTab === 'drafts' ? '#fff' : colors.textSecondary }]}>Drafts</Text>
          </TouchableOpacity>
        </View>
      </View>

      {dateFilterVisible && mainTab === 'reports' && canViewReports && (
        <View style={[styles.dateFilterCard, { backgroundColor: colors.card }]}>
          <View style={styles.dateFilterHeader}>
            <Text style={[styles.dateFilterTitle, { color: colors.text }]}>Date Range</Text>
            <TouchableOpacity onPress={() => setDateFilterVisible(false)}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.dateInputRow}>
            <View style={styles.dateInputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>From</Text>
              <TextInput
                style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.dateInputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>To</Text>
              <TextInput
                style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
          {(startDate || endDate) && (
            <TouchableOpacity
              style={[styles.clearButton, { backgroundColor: colors.background }]}
              onPress={() => { setStartDate(''); setEndDate(''); }}
            >
              <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {mainTab === 'reports' ? (
          !canViewReports ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <FileText size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Access Restricted</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                You don&apos;t have permission to view reports
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#dbeafe' }]}>
                    <FileText size={20} color="#1e40af" />
                  </View>
                  <Text style={[styles.statValue, { color: colors.text }]}>{allInspections.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Inspections</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#dcfce7' }]}>
                    <AlertTriangle size={20} color="#10b981" />
                  </View>
                  <Text style={[styles.statValue, { color: colors.text }]}>{positiveInterventions.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>P I's</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#fef3c7' }]}>
                    <Wrench size={20} color="#f59e0b" />
                  </View>
                  <Text style={[styles.statValue, { color: colors.text }]}>{fixLogs.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Fixes</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#cffafe' }]}>
                    <Wind size={20} color="#06b6d4" />
                  </View>
                  <Text style={[styles.statValue, { color: colors.text }]}>{airTestingInspections.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Air Tests</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#f3e8ff' }]}>
                    <ClipboardList size={20} color="#8b5cf6" />
                  </View>
                  <Text style={[styles.statValue, { color: colors.text }]}>{equipmentReports.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Equipment</Text>
                </View>
              </View>

              <View style={[styles.categoryBar, { backgroundColor: colors.card }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                  <TouchableOpacity
                    style={[styles.categoryChip, selectedCategory === 'inspections' && [styles.categoryChipActive, { backgroundColor: '#1e40af' }]]}
                    onPress={() => setSelectedCategory('inspections')}
                  >
                    <FileText size={16} color={selectedCategory === 'inspections' ? '#fff' : colors.textSecondary} />
                    <Text style={[styles.categoryChipText, { color: selectedCategory === 'inspections' ? '#fff' : colors.textSecondary }]}>
                      Inspections
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.categoryChip, selectedCategory === 'interventions' && [styles.categoryChipActive, { backgroundColor: '#10b981' }]]}
                    onPress={() => setSelectedCategory('interventions')}
                  >
                    <AlertTriangle size={16} color={selectedCategory === 'interventions' ? '#fff' : colors.textSecondary} />
                    <Text style={[styles.categoryChipText, { color: selectedCategory === 'interventions' ? '#fff' : colors.textSecondary }]}>
                      P I's
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.categoryChip, selectedCategory === 'fixes' && [styles.categoryChipActive, { backgroundColor: '#f59e0b' }]]}
                    onPress={() => setSelectedCategory('fixes')}
                  >
                    <Wrench size={16} color={selectedCategory === 'fixes' ? '#fff' : colors.textSecondary} />
                    <Text style={[styles.categoryChipText, { color: selectedCategory === 'fixes' ? '#fff' : colors.textSecondary }]}>
                      Fixes
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.categoryChip, selectedCategory === 'testing' && [styles.categoryChipActive, { backgroundColor: '#06b6d4' }]]}
                    onPress={() => setSelectedCategory('testing')}
                  >
                    <Wind size={16} color={selectedCategory === 'testing' ? '#fff' : colors.textSecondary} />
                    <Text style={[styles.categoryChipText, { color: selectedCategory === 'testing' ? '#fff' : colors.textSecondary }]}>
                      Testing
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.categoryChip, selectedCategory === 'equipment-reports' && [styles.categoryChipActive, { backgroundColor: '#8b5cf6' }]]}
                    onPress={() => setSelectedCategory('equipment-reports')}
                  >
                    <ClipboardList size={16} color={selectedCategory === 'equipment-reports' ? '#fff' : colors.textSecondary} />
                    <Text style={[styles.categoryChipText, { color: selectedCategory === 'equipment-reports' ? '#fff' : colors.textSecondary }]}>
                      Equipment
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              {selectedCategory === 'inspections' && (
                allInspections.length === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                    <FileText size={48} color={colors.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Inspections</Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      Inspection reports will appear here
                    </Text>
                  </View>
                ) : (
                  <View style={styles.listContainer}>
                    {allInspections.map((inspection) => {
                      const checks = 'checks' in inspection ? inspection.checks : [];
                      const hasIssues = checks.some((c: any) => 
                        c.status === 'C' || c.status === '✗' || c.status === false || c.status === 'B'
                      );
                      const isFixed = 'isFixed' in inspection && inspection.isFixed;

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
                          <View style={styles.reportCardHeader}>
                            <View style={styles.reportCardInfo}>
                              <Text style={[styles.reportCardTitle, { color: colors.text }]}>
                                {inspection.type === 'plant' ? 'Plant Inspection' :
                                 inspection.type === 'quickhitch' ? 'Quick Hitch' :
                                 inspection.type === 'vehicle' ? 'Vehicle Inspection' : 'Bucket Change'}
                              </Text>
                              <Text style={[styles.reportCardSubtitle, { color: colors.textSecondary }]}>
                                {getInspectedItemName(inspection)}
                              </Text>
                            </View>
                            {hasIssues && (
                              <View style={[styles.statusBadge, { backgroundColor: isFixed ? '#dcfce7' : '#fee2e2' }]}>
                                <Text style={[styles.statusBadgeText, { color: isFixed ? '#16a34a' : '#dc2626' }]}>
                                  {isFixed ? 'Fixed' : 'Issue'}
                                </Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.reportCardMeta}>
                            <View style={styles.metaItem}>
                              <User size={14} color={colors.textSecondary} />
                              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                {'employeeName' in inspection ? inspection.employeeName : inspection.operatorName}
                              </Text>
                            </View>
                            <View style={styles.metaItem}>
                              <Calendar size={14} color={colors.textSecondary} />
                              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                {formatDate(inspection.createdAt)}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )
              )}

              {selectedCategory === 'interventions' && (
                positiveInterventions.length === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                    <AlertTriangle size={48} color={colors.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No P I's</Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      Positive interventions will appear here
                    </Text>
                  </View>
                ) : (
                  <View style={styles.listContainer}>
                    {positiveInterventions.map((intervention) => (
                      <TouchableOpacity
                        key={intervention.id}
                        style={[styles.reportCard, { backgroundColor: colors.card }]}
                        activeOpacity={0.7}
                        onPress={() => router.push({
                          pathname: '/intervention-detail',
                          params: { id: intervention.id },
                        })}
                      >
                        <View style={styles.reportCardHeader}>
                          <View style={styles.reportCardInfo}>
                            <Text style={[styles.reportCardTitle, { color: colors.text }]}>Positive Intervention</Text>
                            <Text style={[styles.reportCardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                              {intervention.hazardDescription}
                            </Text>
                          </View>
                          <View style={[styles.statusBadge, { 
                            backgroundColor: intervention.severity === 'high' ? '#fee2e2' : 
                                           intervention.severity === 'medium' ? '#fef3c7' : '#dcfce7' 
                          }]}>
                            <Text style={[styles.statusBadgeText, { 
                              color: intervention.severity === 'high' ? '#dc2626' : 
                                     intervention.severity === 'medium' ? '#f59e0b' : '#16a34a' 
                            }]}>
                              {intervention.severity}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.reportCardMeta}>
                          <View style={styles.metaItem}>
                            <User size={14} color={colors.textSecondary} />
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                              {intervention.employeeName}
                            </Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Calendar size={14} color={colors.textSecondary} />
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                              {formatDate(intervention.createdAt)}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )
              )}

              {selectedCategory === 'equipment-reports' && (
                <>
                  <View style={[styles.filterBar, { backgroundColor: colors.card }]}>
                    <TouchableOpacity
                      style={[styles.filterChip, statusFilter === 'all' && [styles.filterChipActive, { backgroundColor: colors.primary }]]}
                      onPress={() => setStatusFilter('all')}
                    >
                      <Text style={[styles.filterChipText, { color: statusFilter === 'all' ? '#fff' : colors.textSecondary }]}>All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterChip, statusFilter === 'open' && [styles.filterChipActive, { backgroundColor: '#ef4444' }]]}
                      onPress={() => setStatusFilter('open')}
                    >
                      <Text style={[styles.filterChipText, { color: statusFilter === 'open' ? '#fff' : colors.textSecondary }]}>Open</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterChip, statusFilter === 'fixed' && [styles.filterChipActive, { backgroundColor: '#10b981' }]]}
                      onPress={() => setStatusFilter('fixed')}
                    >
                      <Text style={[styles.filterChipText, { color: statusFilter === 'fixed' ? '#fff' : colors.textSecondary }]}>Fixed</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterChip, statusFilter === 'discarded' && [styles.filterChipActive, { backgroundColor: '#94a3b8' }]]}
                      onPress={() => setStatusFilter('discarded')}
                    >
                      <Text style={[styles.filterChipText, { color: statusFilter === 'discarded' ? '#fff' : colors.textSecondary }]}>Discarded</Text>
                    </TouchableOpacity>
                  </View>
                  {(() => {
                    const filteredReports = statusFilter === 'all' ? equipmentReports : equipmentReports.filter(r => r.status === statusFilter);
                    return filteredReports.length === 0 ? (
                      <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                        <ClipboardList size={48} color={colors.textSecondary} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Equipment Reports</Text>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                          {statusFilter === 'all' ? 'Equipment reports will appear here' : `No ${statusFilter} reports found`}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.listContainer}>
                        {filteredReports.map((report) => {
                          const statusColor = report.status === 'open' ? '#ef4444' : 
                                            report.status === 'fixed' ? '#10b981' : '#94a3b8';
                          const statusBg = report.status === 'open' ? '#fee2e2' : 
                                          report.status === 'fixed' ? '#dcfce7' : '#f1f5f9';
                          
                          return (
                            <TouchableOpacity
                              key={report.id}
                              style={[styles.reportCard, { backgroundColor: colors.card }]}
                              onPress={() => setSelectedEquipmentReport(report)}
                            >
                              <View style={styles.reportCardHeader}>
                                <View style={styles.reportCardInfo}>
                                  <Text style={[styles.reportCardTitle, { color: colors.text }]}>{report.equipmentName || 'Equipment Report'}</Text>
                                  <Text style={[styles.reportCardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                                    {report.issueTitle || 'No issue title'}
                                  </Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                  <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                                    <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                                      {report.status}
                                    </Text>
                                  </View>
                                  <Eye size={16} color={colors.textSecondary} />
                                </View>
                              </View>
                              <View style={styles.reportCardMeta}>
                                <View style={styles.metaItem}>
                                  <User size={14} color={colors.textSecondary} />
                                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                    {report.reportedBy}
                                  </Text>
                                </View>
                                <View style={styles.metaItem}>
                                  <Calendar size={14} color={colors.textSecondary} />
                                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                    {formatDate(report.createdAt)}
                                  </Text>
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  })()}
                </>
              )}
            </>
          )
        ) : mainTab === 'mychecks' ? (
          <>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#dbeafe' }]}>
                  <FileText size={20} color="#1e40af" />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{myAllInspections.length}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>My Inspections</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#dcfce7' }]}>
                  <AlertTriangle size={20} color="#10b981" />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{myPositiveInterventions.length}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>My P I's</Text>
              </View>
            </View>

            {myAllInspections.length === 0 && myPositiveInterventions.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                <Activity size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Activity</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Your completed checks will appear here
                </Text>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {[...myAllInspections.map(i => ({ ...i, itemType: 'inspection' as const })), ...myPositiveInterventions.map(i => ({ ...i, itemType: 'intervention' as const }))].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((item) => {
                  if (item.itemType === 'intervention') {
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.reportCard, { backgroundColor: colors.card }]}
                        onPress={() => router.push({ pathname: '/intervention-detail', params: { id: item.id } })}
                      >
                        <View style={styles.reportCardHeader}>
                          <View style={styles.reportCardInfo}>
                            <Text style={[styles.reportCardTitle, { color: colors.text }]}>Positive Intervention</Text>
                            <Text style={[styles.reportCardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                              {item.hazardDescription}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.reportCardMeta}>
                          <View style={styles.metaItem}>
                            <Calendar size={14} color={colors.textSecondary} />
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                              {formatDate(item.createdAt)}
                            </Text>
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
                      onPress={() => router.push({
                        pathname: '/inspection-detail',
                        params: { id: inspection.id, type: inspection.type },
                      })}
                    >
                      <View style={styles.reportCardHeader}>
                        <View style={styles.reportCardInfo}>
                          <Text style={[styles.reportCardTitle, { color: colors.text }]}>
                            {inspection.type === 'plant' ? 'Plant Inspection' :
                             inspection.type === 'quickhitch' ? 'Quick Hitch' :
                             inspection.type === 'vehicle' ? 'Vehicle' : 'Bucket Change'}
                          </Text>
                          <Text style={[styles.reportCardSubtitle, { color: colors.textSecondary }]}>
                            {getInspectedItemName(inspection)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.reportCardMeta}>
                        <View style={styles.metaItem}>
                          <Calendar size={14} color={colors.textSecondary} />
                          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {formatDate(inspection.createdAt)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <>
            {(() => {
              const myDrafts = user ? getDrafts(user.id) : [];

              if (myDrafts.length === 0) {
                return (
                  <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                    <FilePlus size={48} color={colors.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Drafts</Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      Saved drafts will appear here
                    </Text>
                  </View>
                );
              }

              return (
                <View style={styles.listContainer}>
                  {myDrafts.map((draft) => (
                    <View key={draft.id} style={[styles.reportCard, { backgroundColor: colors.card }]}>
                      <View style={styles.reportCardHeader}>
                        <View style={styles.reportCardInfo}>
                          <Text style={[styles.reportCardTitle, { color: colors.text }]}>
                            {draft.type === 'plant' ? 'Plant Inspection' :
                             draft.type === 'quickhitch' ? 'Quick Hitch' :
                             draft.type === 'vehicle' ? 'Vehicle' :
                             draft.type === 'bucketchange' ? 'Bucket Change' :
                             draft.type === 'intervention' ? 'Intervention' : 'Draft'}
                          </Text>
                          <Text style={[styles.reportCardSubtitle, { color: colors.textSecondary }]}>
                            Draft saved {formatDate(draft.updatedAt)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.reportCardActions}>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#dbeafe', flex: 1 }]}
                          onPress={() => {
                            if (draft.type === 'plant') router.push({ pathname: '/plant-inspection', params: { draftId: draft.id } });
                            else if (draft.type === 'quickhitch') router.push({ pathname: '/quick-hitch-inspection', params: { draftId: draft.id } });
                            else if (draft.type === 'vehicle') router.push({ pathname: '/(tabs)/vehicle-inspection', params: { draftId: draft.id } });
                            else if (draft.type === 'bucketchange') router.push({ pathname: '/bucket-change-inspection', params: { draftId: draft.id } });
                            else if (draft.type === 'intervention') router.push({ pathname: '/positive-intervention', params: { draftId: draft.id } });
                          }}
                        >
                          <Edit3 size={16} color="#1e40af" />
                          <Text style={[styles.actionBtnText, { color: '#1e40af' }]}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#1e40af', flex: 1 }]}
                          onPress={() => {
                            Alert.alert(
                              'Submit Draft',
                              'Submit this inspection?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Submit',
                                  onPress: async () => {
                                    await submitDraft(draft.id);
                                    Alert.alert('Success', 'Submitted successfully');
                                  },
                                },
                              ]
                            );
                          }}
                        >
                          <Send size={16} color="#fff" />
                          <Text style={[styles.actionBtnText, { color: '#fff' }]}>Submit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]}
                          onPress={() => {
                            Alert.alert(
                              'Delete Draft',
                              'Are you sure?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Delete', style: 'destructive', onPress: () => deleteDraft(draft.id) },
                              ]
                            );
                          }}
                        >
                          <Trash2 size={16} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })()}
          </>
        )}
      </ScrollView>

      {statusChangeModalVisible && selectedEquipmentReport && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, maxWidth: 400 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {statusChangeAction === 'fixed' ? 'Mark as Fixed' : 'Discard Report'}
              </Text>
              <TouchableOpacity onPress={() => setStatusChangeModalVisible(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.label, { color: colors.text, marginBottom: 8 }]}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textarea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={statusChangeNotes}
                onChangeText={setStatusChangeNotes}
                placeholder={statusChangeAction === 'fixed' ? 'Add fix notes...' : 'Add reason for discarding...'}
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: colors.border }]}
                onPress={() => setStatusChangeModalVisible(false)}
              >
                <Text style={[styles.modalActionBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: statusChangeAction === 'fixed' ? '#10b981' : '#94a3b8' }]}
                onPress={async () => {
                  if (statusChangeAction === 'fixed' && markEquipmentReportFixed) {
                    await markEquipmentReportFixed(selectedEquipmentReport.id, statusChangeNotes || undefined);
                  } else if (statusChangeAction === 'discarded' && markEquipmentReportDiscarded) {
                    await markEquipmentReportDiscarded(selectedEquipmentReport.id, statusChangeNotes || undefined);
                  }
                  setStatusChangeModalVisible(false);
                  setSelectedEquipmentReport(null);
                  setStatusChangeNotes('');
                }}
              >
                <Text style={[styles.modalActionBtnText, { color: '#fff' }]}>
                  {statusChangeAction === 'fixed' ? 'Mark as Fixed' : 'Discard'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {selectedEquipmentReport && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Equipment Report</Text>
                <TouchableOpacity onPress={() => setSelectedEquipmentReport(null)}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Equipment</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedEquipmentReport.equipmentName || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Equipment ID</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedEquipmentReport.equipmentId || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Issue</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedEquipmentReport.issueTitle || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Description</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedEquipmentReport.description || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status</Text>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: selectedEquipmentReport.status === 'open' ? '#fee2e2' : 
                                   selectedEquipmentReport.status === 'fixed' ? '#dcfce7' : '#f1f5f9' 
                  }]}>
                    <Text style={[styles.statusBadgeText, { 
                      color: selectedEquipmentReport.status === 'open' ? '#ef4444' : 
                            selectedEquipmentReport.status === 'fixed' ? '#10b981' : '#94a3b8' 
                    }]}>
                      {selectedEquipmentReport.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Reported By</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedEquipmentReport.reportedBy}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Reported At</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(selectedEquipmentReport.reportedAt)}</Text>
                </View>
                {selectedEquipmentReport.fixedBy && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Fixed By</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{selectedEquipmentReport.fixedBy}</Text>
                    </View>
                    {selectedEquipmentReport.fixNotes && (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Fix Notes</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{selectedEquipmentReport.fixNotes}</Text>
                      </View>
                    )}
                  </>
                )}
                {selectedEquipmentReport.discardedBy && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Discarded By</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{selectedEquipmentReport.discardedBy}</Text>
                    </View>
                    {selectedEquipmentReport.discardNotes && (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Discard Reason</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{selectedEquipmentReport.discardNotes}</Text>
                      </View>
                    )}
                  </>
                )}
              </View>

              {selectedEquipmentReport.status === 'open' && (user?.role === 'mechanic' || user?.role === 'administrator' || user?.role === 'management') && (
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: '#10b981' }]}
                    onPress={() => {
                      setStatusChangeAction('fixed');
                      setStatusChangeNotes('');
                      setStatusChangeModalVisible(true);
                    }}
                  >
                    <CheckCircle size={20} color="#fff" />
                    <Text style={[styles.modalActionBtnText, { color: '#fff' }]}>Mark as Fixed</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: '#94a3b8' }]}
                    onPress={() => {
                      setStatusChangeAction('discarded');
                      setStatusChangeNotes('');
                      setStatusChangeModalVisible(true);
                    }}
                  >
                    <XCircle size={20} color="#fff" />
                    <Text style={[styles.modalActionBtnText, { color: '#fff' }]}>Discard</Text>
                  </TouchableOpacity>
                </View>
              )}

              {(selectedEquipmentReport.status === 'fixed' || selectedEquipmentReport.status === 'discarded') && (user?.role === 'administrator' || user?.role === 'management') && (
                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: '#ef4444', marginTop: 12 }]}
                  onPress={() => {
                    Alert.alert(
                      'Delete Report',
                      'Are you sure? This cannot be undone.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: async () => {
                            if (deleteEquipmentReport) {
                              await deleteEquipmentReport(selectedEquipmentReport.id);
                              setSelectedEquipmentReport(null);
                            }
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Trash2 size={20} color="#fff" />
                  <Text style={[styles.modalActionBtnText, { color: '#fff' }]}>Delete Report</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 15,
  },
  headerActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBar: {
    flexDirection: 'row' as const,
    borderRadius: 12,
    padding: 4,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  tabItemActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  dateFilterCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  dateFilterHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  dateFilterTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  dateInputRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  dateInputWrapper: {
    flex: 1,
  },
  inputLabel: {
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
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 12,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  categoryBar: {
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryScroll: {
    gap: 8,
    paddingHorizontal: 4,
  },
  categoryChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  categoryChipActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  listContainer: {
    gap: 12,
  },
  reportCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  reportCardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  reportCardInfo: {
    flex: 1,
    marginRight: 12,
  },
  reportCardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  reportCardSubtitle: {
    fontSize: 14,
  },
  reportCardMeta: {
    flexDirection: 'row' as const,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  metaText: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  reportCardActions: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 48,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  filterBar: {
    flexDirection: 'row' as const,
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterChipActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  detailCard: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    flex: 2,
    textAlign: 'right' as const,
  },
  modalActions: {
    gap: 12,
  },
  modalActionBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalActionBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
  },
});
