import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';
import { ClipboardList, Search, FileText, Download, Filter, Trash2, X } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { trpc } from '@/lib/trpc';
import { InspectionTestForm, ITFStatus } from '@/types';

type TradeCategory = 'All' | 'Site Preparation & Earthworks' | 'Concrete & Structural Works' | 'Drainage & Utility Works' | 'Roadworks & External' | 'Reinforcement & Steelwork' | 'Waterproofing & Finishes' | 'QA/QC Closeout';

export default function ITFManagementScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<TradeCategory>('All');
  const [selectedStatus, setSelectedStatus] = useState<ITFStatus | 'All'>('All');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedITF, setSelectedITF] = useState<InspectionTestForm | null>(null);

  const itfsQuery = trpc.itf.list.useQuery();
  const seedTemplatesMutation = trpc.itf.seedTemplates.useMutation();
  const deleteITFMutation = trpc.itf.delete.useMutation();

  const itfs = itfsQuery.data || [];

  const tradeCategories: TradeCategory[] = [
    'All',
    'Site Preparation & Earthworks',
    'Concrete & Structural Works',
    'Drainage & Utility Works',
    'Roadworks & External',
    'Reinforcement & Steelwork',
    'Waterproofing & Finishes',
    'QA/QC Closeout',
  ];

  const filteredITFs = useMemo(() => {
    return itfs.filter((itf: InspectionTestForm) => {
      const matchesSearch = 
        itf.itfCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        itf.itfTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        itf.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTrade = selectedTrade === 'All' || itf.trade === selectedTrade;
      const matchesStatus = selectedStatus === 'All' || itf.status === selectedStatus;
      
      return matchesSearch && matchesTrade && matchesStatus;
    });
  }, [itfs, searchQuery, selectedTrade, selectedStatus]);

  const groupedITFs = useMemo(() => {
    const grouped: Record<string, InspectionTestForm[]> = {};
    filteredITFs.forEach((itf: InspectionTestForm) => {
      if (!grouped[itf.trade]) {
        grouped[itf.trade] = [];
      }
      grouped[itf.trade].push(itf);
    });
    return grouped;
  }, [filteredITFs]);

  const handleSeedTemplates = async () => {
    Alert.alert(
      'Load ITF Templates',
      'This will create all 26 standard ITF templates. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load Templates',
          onPress: async () => {
            try {
              const result = await seedTemplatesMutation.mutateAsync();
              Alert.alert('Success', result.message);
              itfsQuery.refetch();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to load templates');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const handleDeleteITF = (itf: InspectionTestForm) => {
    Alert.alert(
      'Delete ITF',
      `Are you sure you want to delete ${itf.itfCode} - ${itf.itfTitle}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteITFMutation.mutateAsync({ id: itf.id });
              Alert.alert('Success', 'ITF deleted successfully');
              itfsQuery.refetch();
              setDetailModalVisible(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete ITF');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: ITFStatus) => {
    switch (status) {
      case 'planned':
        return '#6b7280';
      case 'in-progress':
        return '#3b82f6';
      case 'approved':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: ITFStatus) => {
    switch (status) {
      case 'planned':
        return 'Planned';
      case 'in-progress':
        return 'In Progress';
      case 'approved':
        return 'Approved';
      default:
        return status;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Inspection Test Forms',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
          <ClipboardList size={28} color={colors.primary} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>ITF Register</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Construction QA/QC Records — {filteredITFs.length} of {itfs.length} ITFs
        </Text>
      </View>

      <View style={[styles.searchSection, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by code, title, or trade..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Filter size={18} color={colors.primary} />
            <Text style={[styles.filterButtonText, { color: colors.primary }]}>Filter</Text>
          </TouchableOpacity>

          {itfs.length === 0 && (
            <TouchableOpacity
              style={[styles.templateButton, { backgroundColor: colors.primary }]}
              onPress={handleSeedTemplates}
            >
              <Download size={18} color="#ffffff" />
              <Text style={styles.templateButtonText}>Load Templates</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {itfsQuery.isLoading ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Loading ITFs...</Text>
          </View>
        ) : itfs.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <ClipboardList size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No ITFs Yet</Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Load the standard ITF templates to get started
            </Text>
            <TouchableOpacity
              style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
              onPress={handleSeedTemplates}
            >
              <Download size={20} color="#ffffff" />
              <Text style={styles.emptyStateButtonText}>Load 26 ITF Templates</Text>
            </TouchableOpacity>
          </View>
        ) : filteredITFs.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Search size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Matching ITFs</Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Try adjusting your search or filters
            </Text>
          </View>
        ) : (
          Object.entries(groupedITFs).map(([trade, tradeITFs]) => (
            <View key={trade} style={styles.tradeSection}>
              <Text style={[styles.tradeSectionTitle, { color: colors.text }]}>{trade}</Text>
              <View style={styles.tradeITFsList}>
                {tradeITFs.map((itf) => {
                  const statusColor = getStatusColor(itf.status);
                  return (
                    <TouchableOpacity
                      key={itf.id}
                      style={[styles.itfCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: statusColor }]}
                      onPress={() => {
                        setSelectedITF(itf);
                        setDetailModalVisible(true);
                      }}
                    >
                      <View style={styles.itfCardHeader}>
                        <View style={[styles.itfCodeBadge, { backgroundColor: colors.primary + '20' }]}>
                          <Text style={[styles.itfCodeText, { color: colors.primary }]}>{itf.itfCode}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                          <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                            {getStatusLabel(itf.status)}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.itfTitle, { color: colors.text }]}>{itf.itfTitle}</Text>
                      <Text style={[styles.itfDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                        {itf.description}
                      </Text>
                      {itf.inspectorName && (
                        <Text style={[styles.itfMeta, { color: colors.textSecondary }]}>
                          Inspector: {itf.inspectorName}
                        </Text>
                      )}
                      {itf.date && (
                        <Text style={[styles.itfMeta, { color: colors.textSecondary }]}>
                          Date: {new Date(itf.date).toLocaleDateString()}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.filterModal, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filter ITFs</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterContent}>
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Trade / Category</Text>
              {tradeCategories.map((trade) => (
                <TouchableOpacity
                  key={trade}
                  style={[
                    styles.filterOption,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    selectedTrade === trade && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => setSelectedTrade(trade)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { color: colors.text },
                    selectedTrade === trade && { color: '#ffffff' }
                  ]}>
                    {trade}
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={[styles.filterSectionTitle, { color: colors.text, marginTop: 24 }]}>Status</Text>
              {(['All', 'planned', 'in-progress', 'approved'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterOption,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    selectedStatus === status && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => setSelectedStatus(status)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { color: colors.text },
                    selectedStatus === status && { color: '#ffffff' }
                  ]}>
                    {status === 'All' ? 'All Statuses' : getStatusLabel(status)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.applyFilterButton, { backgroundColor: colors.primary }]}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.applyFilterButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.detailModal, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>ITF Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedITF && (
              <ScrollView style={styles.detailContent}>
                <View style={[styles.detailCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.detailRow}>
                    <View style={[styles.itfCodeBadge, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.itfCodeText, { color: colors.primary }]}>{selectedITF.itfCode}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedITF.status) + '20' }]}>
                      <Text style={[styles.statusBadgeText, { color: getStatusColor(selectedITF.status) }]}>
                        {getStatusLabel(selectedITF.status)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.detailTitle, { color: colors.text }]}>{selectedITF.itfTitle}</Text>
                  
                  <View style={[styles.detailSection, { borderTopColor: colors.border }]}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Trade / Category</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{selectedITF.trade}</Text>
                  </View>

                  <View style={[styles.detailSection, { borderTopColor: colors.border }]}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Description</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{selectedITF.description}</Text>
                  </View>

                  {selectedITF.date && (
                    <View style={[styles.detailSection, { borderTopColor: colors.border }]}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Inspection Date</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {new Date(selectedITF.date).toLocaleDateString()}
                      </Text>
                    </View>
                  )}

                  {selectedITF.inspectorName && (
                    <View style={[styles.detailSection, { borderTopColor: colors.border }]}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Inspector</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{selectedITF.inspectorName}</Text>
                    </View>
                  )}

                  {selectedITF.engineerName && (
                    <View style={[styles.detailSection, { borderTopColor: colors.border }]}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Engineer</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{selectedITF.engineerName}</Text>
                    </View>
                  )}

                  {selectedITF.documentName && (
                    <View style={[styles.detailSection, { borderTopColor: colors.border }]}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Document</Text>
                      <View style={[styles.documentBadge, { backgroundColor: colors.primary + '20' }]}>
                        <FileText size={16} color={colors.primary} />
                        <Text style={[styles.documentName, { color: colors.primary }]}>{selectedITF.documentName}</Text>
                      </View>
                    </View>
                  )}

                  {selectedITF.notes && (
                    <View style={[styles.detailSection, { borderTopColor: colors.border }]}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Notes</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{selectedITF.notes}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: '#fee2e2', borderColor: '#dc2626' }]}
                  onPress={() => handleDeleteITF(selectedITF)}
                >
                  <Trash2 size={20} color="#dc2626" />
                  <Text style={[styles.deleteButtonText, { color: '#dc2626' }]}>Delete ITF</Text>
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
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
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
    textAlign: 'center' as const,
  },
  searchSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  templateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 14,
  },
  templateButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 24,
  },
  tradeSection: {
    gap: 12,
  },
  tradeSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  tradeITFsList: {
    gap: 12,
  },
  itfCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    gap: 8,
  },
  itfCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itfCodeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  itfCodeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  itfTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  itfDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  itfMeta: {
    fontSize: 12,
  },
  emptyState: {
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
  },
  detailModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  modalClose: {
    fontSize: 24,
  },
  filterContent: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  filterOption: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  filterOptionText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  applyFilterButton: {
    margin: 20,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  applyFilterButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  detailContent: {
    padding: 20,
  },
  detailCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  detailSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    lineHeight: 24,
  },
  documentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start' as const,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    marginTop: 16,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
