import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Calendar, CheckCircle, XCircle, Clock, Users, Bell, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { HolidayRequest } from '@/types';

export default function HolidayManagementScreen() {
  const router = useRouter();
  const { 
    user, 
    getCompanyHolidayRequests, 
    approveHolidayRequest, 
    rejectHolidayRequest,
    getCompanyHolidayNotifications,
    getCompanyUsers 
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const requests = useMemo(() => {
    const all = getCompanyHolidayRequests();
    if (filter === 'all') return all;
    return all.filter(r => r.status === filter);
  }, [getCompanyHolidayRequests, filter]);

  const pendingCount = useMemo(() => {
    return getCompanyHolidayRequests().filter(r => r.status === 'pending').length;
  }, [getCompanyHolidayRequests]);

  const notifications = useMemo(() => {
    return getCompanyHolidayNotifications().filter(n => !n.isRead);
  }, [getCompanyHolidayNotifications]);

  const companyUsers = useMemo(() => {
    return getCompanyUsers();
  }, [getCompanyUsers]);

  const handleApprove = async (requestId: string) => {
    try {
      await approveHolidayRequest(requestId);
      Alert.alert('Success', 'Holiday request approved');
    } catch (error) {
      console.error('Error approving request:', error);
      Alert.alert('Error', 'Failed to approve request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectHolidayRequest(requestId);
      Alert.alert('Success', 'Holiday request rejected');
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'Failed to reject request');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      default:
        return Clock;
    }
  };

  const getUpcomingHolidays = () => {
    const now = new Date();
    return requests
      .filter(r => r.status === 'approved' && new Date(r.startDate) > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  };

  const upcomingHolidays = useMemo(() => getUpcomingHolidays(), [requests]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getHolidaysForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return requests.filter(r => {
      if (r.status !== 'approved') return false;
      const start = new Date(r.startDate).toISOString().split('T')[0];
      const end = new Date(r.endDate).toISOString().split('T')[0];
      return dateStr >= start && dateStr <= end;
    });
  };

  const getDateColor = (date: Date | null) => {
    if (!date) return 'transparent';
    const holidays = getHolidaysForDate(date);
    if (holidays.length === 0) return 'transparent';
    if (holidays.length === 1) return '#3b82f620';
    if (holidays.length === 2) return '#f59e0b40';
    return '#ef444460';
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleDateClick = (date: Date | null) => {
    if (!date) return;
    const holidays = getHolidaysForDate(date);
    if (holidays.length > 0) {
      setSelectedDate(date);
      setModalVisible(true);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#1e293b' },
          headerTintColor: '#fff',
          title: 'Holiday Management',
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Calendar size={32} color="#ec4899" />
          <Text style={styles.headerTitle}>Holiday Management</Text>
          <Text style={styles.headerSubtitle}>Manage employee holiday requests</Text>
        </View>

        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.viewModeButtonText, viewMode === 'list' && styles.viewModeButtonTextActive]}>
              List View
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'calendar' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('calendar')}
          >
            <Text style={[styles.viewModeButtonText, viewMode === 'calendar' && styles.viewModeButtonTextActive]}>
              Calendar View
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Bell size={24} color="#f59e0b" />
            <Text style={styles.statNumber}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending Requests</Text>
          </View>
          <View style={styles.statCard}>
            <Users size={24} color="#3b82f6" />
            <Text style={styles.statNumber}>{companyUsers.length}</Text>
            <Text style={styles.statLabel}>Team Members</Text>
          </View>
        </View>

        {viewMode === 'calendar' ? (
          <View style={styles.section}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthButton}>
                <ChevronLeft size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </Text>
              <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
                <ChevronRight size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#3b82f620' }]} />
                <Text style={styles.legendText}>1 person</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#f59e0b40' }]} />
                <Text style={styles.legendText}>2 people</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#ef444460' }]} />
                <Text style={styles.legendText}>3+ people</Text>
              </View>
            </View>

            <View style={styles.calendar}>
              <View style={styles.calendarDayNames}>
                {dayNames.map((day) => (
                  <Text key={day} style={styles.dayName}>{day}</Text>
                ))}
              </View>
              <View style={styles.calendarDays}>
                {days.map((date, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDay,
                      { backgroundColor: getDateColor(date) },
                      isToday(date) && styles.calendarDayToday,
                    ]}
                    onPress={() => handleDateClick(date)}
                    disabled={!date}
                  >
                    {date && (
                      <>
                        <Text style={[
                          styles.calendarDayText,
                          isToday(date) && styles.calendarDayTextToday,
                        ]}>
                          {date.getDate()}
                        </Text>
                        {getHolidaysForDate(date).length > 0 && (
                          <View style={styles.calendarDayDot} />
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <>
            {upcomingHolidays.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Upcoming Holidays</Text>
                {upcomingHolidays.slice(0, 3).map((request) => (
                  <View key={request.id} style={styles.upcomingCard}>
                    <View style={styles.upcomingHeader}>
                      <Text style={styles.upcomingName}>{request.employeeName}</Text>
                      <Text style={styles.upcomingDates}>
                        {formatDate(request.startDate)} - {formatDate(request.endDate)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.filterContainer}>
              {['all', 'pending', 'approved', 'rejected'].map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.filterButton,
                    filter === f && styles.filterButtonActive
                  ]}
                  onPress={() => setFilter(f as typeof filter)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    filter === f && styles.filterButtonTextActive
                  ]}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Holiday Requests</Text>
              {requests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Calendar size={48} color="#475569" />
                  <Text style={styles.emptyText}>No requests found</Text>
                </View>
              ) : (
                requests.map((request: HolidayRequest) => {
                  const StatusIcon = getStatusIcon(request.status);
                  return (
                    <View key={request.id} style={styles.requestCard}>
                      <View style={styles.requestHeader}>
                        <Text style={styles.requestName}>{request.employeeName}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(request.status)}20` }]}>
                          <StatusIcon size={16} color={getStatusColor(request.status)} />
                          <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.requestDates}>
                        <Text style={styles.requestDate}>{formatDate(request.startDate)}</Text>
                        <Text style={styles.requestDateSeparator}>→</Text>
                        <Text style={styles.requestDate}>{formatDate(request.endDate)}</Text>
                      </View>
                      {request.reason && (
                        <Text style={styles.requestReason}>{request.reason}</Text>
                      )}
                      {request.reviewedBy && (
                        <Text style={styles.reviewedBy}>
                          Reviewed by {request.reviewedBy} on {formatDate(request.reviewedAt!)}
                        </Text>
                      )}
                      {request.status === 'pending' && (
                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.approveButton]}
                            onPress={() => handleApprove(request.id)}
                          >
                            <CheckCircle size={18} color="#fff" />
                            <Text style={styles.actionButtonText}>Approve</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => handleReject(request.id)}
                          >
                            <XCircle size={18} color="#fff" />
                            <Text style={styles.actionButtonText}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDate && formatDate(selectedDate.toISOString())}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.modalSubtitle}>People off on this day:</Text>
              {selectedDate && getHolidaysForDate(selectedDate).map((request) => (
                <View key={request.id} style={styles.modalRequestCard}>
                  <Text style={styles.modalEmployeeName}>{request.employeeName}</Text>
                  <Text style={styles.modalDates}>
                    {formatDate(request.startDate)} - {formatDate(request.endDate)}
                  </Text>
                  {request.reason && (
                    <Text style={styles.modalReason}>{request.reason}</Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 16,
  },
  upcomingCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upcomingName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  upcomingDates: {
    fontSize: 12,
    color: '#94a3b8',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#94a3b8',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed' as const,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#94a3b8',
    marginTop: 16,
  },
  requestCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  requestDates: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  requestDate: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  requestDateSeparator: {
    fontSize: 16,
    color: '#64748b',
  },
  requestReason: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  reviewedBy: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  viewModeToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  viewModeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#94a3b8',
  },
  viewModeButtonTextActive: {
    color: '#fff',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  monthButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  legendText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  calendar: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  calendarDayNames: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#94a3b8',
    paddingVertical: 8,
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%' as any,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
    position: 'relative',
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: '#ec4899',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#fff',
  },
  calendarDayTextToday: {
    color: '#ec4899',
    fontWeight: '700' as const,
  },
  calendarDayDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ec4899',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  modalScrollView: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#94a3b8',
    marginBottom: 16,
  },
  modalRequestCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalEmployeeName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 8,
  },
  modalDates: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
  modalReason: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic' as const,
    marginTop: 8,
  },
});
