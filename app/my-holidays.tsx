import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Calendar as CalendarIcon, Plus, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';

export default function MyHolidaysScreen() {
  const router = useRouter();
  const { user } = useApp();
  
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { submitHolidayRequest, getEmployeeHolidayRequests, getEmployeeHolidayNotifications, markHolidayNotificationRead } = useApp();

  const myRequests = useMemo(() => {
    if (!user) return [];
    return getEmployeeHolidayRequests(user.id);
  }, [user, getEmployeeHolidayRequests]);

  const myNotifications = useMemo(() => {
    if (!user) return [];
    return getEmployeeHolidayNotifications(user.id).filter(n => n.type !== 'request');
  }, [user, getEmployeeHolidayNotifications]);

  const handleSubmitRequest = async () => {
    if (!startDate || !endDate) return;
    
    try {
      console.log('Holiday request submitted', { startDate, endDate, reason });
      await submitHolidayRequest(
        startDate.toISOString(),
        endDate.toISOString(),
        reason || undefined
      );
      setShowModal(false);
      setReason('');
      setStartDate(null);
      setEndDate(null);
      setCurrentMonth(new Date());
    } catch (error) {
      console.error('Error submitting holiday request:', error);
    }
  };

  const handleDayPress = (date: Date) => {
    console.log('Day pressed:', date);
    
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (date >= startDate) {
        setEndDate(date);
      } else {
        setStartDate(date);
        setEndDate(null);
      }
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
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

  const isDateInRange = (date: Date | null) => {
    if (!date || !startDate) return false;
    if (!endDate) return date.toDateString() === startDate.toDateString();
    return date >= startDate && date <= endDate;
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#1e293b' },
          headerTintColor: '#fff',
          title: 'Holiday Requests',
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <CalendarIcon size={32} color="#ec4899" />
          <Text style={styles.headerTitle}>My Holiday Requests</Text>
          <Text style={styles.headerSubtitle}>Request and track your holidays</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            console.log('New Holiday Request button pressed');
            setShowModal(true);
          }}
          activeOpacity={0.7}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>New Holiday Request</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Requests</Text>
          {myRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <CalendarIcon size={48} color="#475569" />
              <Text style={styles.emptyText}>No holiday requests yet</Text>
              <Text style={styles.emptySubtext}>Tap the button above to create your first request</Text>
            </View>
          ) : (
            myRequests.map((request: any) => {
              const StatusIcon = getStatusIcon(request.status);
              return (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
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
                      Reviewed by {request.reviewedBy}
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          console.log('Modal close requested');
          setShowModal(false);
        }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.modalContainer}>
            <ScrollView 
              style={styles.modalContent}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.modalTitle}>New Holiday Request</Text>

                <View style={styles.selectedDatesContainer}>
                  <View style={styles.selectedDateBox}>
                    <Text style={styles.selectedDateLabel}>Start Date</Text>
                    <Text style={styles.selectedDateText}>
                      {startDate ? startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not selected'}
                    </Text>
                  </View>
                  <View style={styles.dateArrow}>
                    <Text style={styles.dateArrowText}>→</Text>
                  </View>
                  <View style={styles.selectedDateBox}>
                    <Text style={styles.selectedDateLabel}>End Date</Text>
                    <Text style={styles.selectedDateText}>
                      {endDate ? endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not selected'}
                    </Text>
                  </View>
                </View>

                <View style={styles.calendarContainer}>
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthButton}>
                      <ChevronLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.monthTitle}>
                      {currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                    </Text>
                    <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
                      <ChevronRight size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.calendar}>
                    <View style={styles.calendarDayNames}>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <Text key={day} style={styles.dayName}>{day}</Text>
                      ))}
                    </View>
                    <View style={styles.calendarDays}>
                      {getDaysInMonth().map((date, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.calendarDay,
                            isDateInRange(date) && styles.calendarDaySelected,
                            isToday(date) && styles.calendarDayToday,
                          ]}
                          onPress={() => date && handleDayPress(date)}
                          disabled={!date}
                        >
                          {date && (
                            <Text style={[
                              styles.calendarDayText,
                              isDateInRange(date) && styles.calendarDayTextSelected,
                              isToday(date) && styles.calendarDayTextToday,
                            ]}>
                              {date.getDate()}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notes (Optional)</Text>
                  <TextInput
                    style={styles.textArea}
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Add any notes about your holiday request..."
                    placeholderTextColor="#64748b"
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => {
                      setShowModal(false);
                      setReason('');
                      setStartDate(null);
                      setEndDate(null);
                      setCurrentMonth(new Date());
                    }}
                  >
                    <Text style={styles.modalButtonCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButton, 
                      styles.modalButtonSubmit,
                      (!startDate || !endDate) && styles.modalButtonDisabled
                    ]}
                    onPress={handleSubmitRequest}
                    disabled={!startDate || !endDate}
                  >
                    <Text style={styles.modalButtonSubmitText}>Submit Request</Text>
                  </TouchableOpacity>
                </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
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
  addButton: {
    backgroundColor: '#ec4899',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
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
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    maxHeight: '95%',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalScrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  selectedDatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  selectedDateBox: {
    flex: 1,
    backgroundColor: '#334155',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
  },
  selectedDateLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#94a3b8',
    marginBottom: 6,
  },
  selectedDateText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  dateArrow: {
    paddingHorizontal: 4,
  },
  dateArrowText: {
    fontSize: 20,
    color: '#64748b',
  },
  calendarContainer: {
    marginBottom: 24,
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
    backgroundColor: '#334155',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  calendar: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#475569',
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
  },
  calendarDaySelected: {
    backgroundColor: '#ec4899',
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#fff',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: '700' as const,
  },
  calendarDayTextToday: {
    color: '#3b82f6',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#e2e8f0',
    marginBottom: 8,
  },

  textArea: {
    backgroundColor: '#334155',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#334155',
  },
  modalButtonCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalButtonSubmit: {
    backgroundColor: '#ec4899',
  },
  modalButtonDisabled: {
    backgroundColor: '#475569',
    opacity: 0.5,
  },
  modalButtonSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
