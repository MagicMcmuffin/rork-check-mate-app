import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Platform, KeyboardAvoidingView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Calendar as CalendarIcon, Plus, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { Calendar } from 'react-native-calendars';

export default function MyHolidaysScreen() {
  const router = useRouter();
  const { user } = useApp();
  
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [selectingDate, setSelectingDate] = useState<'start' | 'end' | null>('start');

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
    try {
      console.log('Holiday request submitted', { startDate, endDate, reason });
      await submitHolidayRequest(
        startDate.toISOString(),
        endDate.toISOString(),
        reason || undefined
      );
      setShowModal(false);
      setReason('');
      setStartDate(new Date());
      setEndDate(new Date());
      setSelectingDate('start');
    } catch (error) {
      console.error('Error submitting holiday request:', error);
    }
  };

  const handleDayPress = (day: any) => {
    console.log('Day pressed:', day);
    const selectedDate = new Date(day.dateString);
    if (selectingDate === 'start') {
      setStartDate(selectedDate);
      if (selectedDate > endDate) {
        setEndDate(selectedDate);
      }
      setSelectingDate('end');
    } else if (selectingDate === 'end') {
      if (selectedDate >= startDate) {
        setEndDate(selectedDate);
        setSelectingDate(null);
      } else {
        setStartDate(selectedDate);
      }
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    
    if (!selectingDate || selectingDate === 'end') {
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        marked[dateStr] = {
          color: '#ec4899',
          textColor: '#fff',
        };
        if (dateStr === start) {
          marked[dateStr].startingDay = true;
        }
        if (dateStr === end) {
          marked[dateStr].endingDay = true;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      marked[start] = {
        selected: true,
        selectedColor: '#ec4899',
      };
    }
    
    return marked;
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
          setSelectingDate('start');
        }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={() => {
              setShowModal(false);
              setSelectingDate('start');
            }}
          >
            <TouchableOpacity 
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.modalContentWrapper}
            >
              <ScrollView 
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>New Holiday Request</Text>

                <View style={styles.dateSelectionHeader}>
                  <TouchableOpacity
                    style={[styles.dateTypeButton, selectingDate === 'start' && styles.dateTypeButtonActive]}
                    onPress={() => setSelectingDate('start')}
                  >
                    <Text style={[styles.dateTypeButtonText, selectingDate === 'start' && styles.dateTypeButtonTextActive]}>
                      Start Date
                    </Text>
                    <Text style={[styles.dateTypeButtonDate, selectingDate === 'start' && styles.dateTypeButtonDateActive]}>
                      {startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.dateArrow}>
                    <Text style={styles.dateArrowText}>→</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.dateTypeButton, selectingDate === 'end' && styles.dateTypeButtonActive]}
                    onPress={() => setSelectingDate('end')}
                  >
                    <Text style={[styles.dateTypeButtonText, selectingDate === 'end' && styles.dateTypeButtonTextActive]}>
                      End Date
                    </Text>
                    <Text style={[styles.dateTypeButtonDate, selectingDate === 'end' && styles.dateTypeButtonDateActive]}>
                      {endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.calendarWrapper}>
                  <Text style={styles.calendarHint}>
                    {selectingDate === 'start' ? 'Select start date' : 'Select end date'}
                  </Text>
                  <Calendar
                    current={selectingDate === 'start' ? startDate.toISOString().split('T')[0] : endDate.toISOString().split('T')[0]}
                    onDayPress={handleDayPress}
                    markedDates={getMarkedDates()}
                    markingType="period"
                    minDate={selectingDate === 'end' ? startDate.toISOString().split('T')[0] : undefined}
                    theme={{
                      calendarBackground: '#1e293b',
                      textSectionTitleColor: '#94a3b8',
                      selectedDayBackgroundColor: '#ec4899',
                      selectedDayTextColor: '#fff',
                      todayTextColor: '#ec4899',
                      dayTextColor: '#fff',
                      textDisabledColor: '#475569',
                      monthTextColor: '#fff',
                      indicatorColor: '#ec4899',
                      textDayFontWeight: '500',
                      textMonthFontWeight: '700',
                      textDayHeaderFontWeight: '600',
                      textDayFontSize: 14,
                      textMonthFontSize: 16,
                      textDayHeaderFontSize: 12,
                      arrowColor: '#ec4899',
                    }}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Reason (Optional)</Text>
                  <TextInput
                    style={styles.textArea}
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Enter reason for holiday..."
                    placeholderTextColor="#64748b"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => {
                      setShowModal(false);
                      setReason('');
                      setStartDate(new Date());
                      setEndDate(new Date());
                      setSelectingDate('start');
                    }}
                  >
                    <Text style={styles.modalButtonCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSubmit]}
                    onPress={handleSubmitRequest}
                  >
                    <Text style={styles.modalButtonSubmitText}>Submit Request</Text>
                  </TouchableOpacity>
                </View>
              </View>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
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
  },
  modalOverlayTouchable: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContentWrapper: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    width: '100%',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  modalContent: {
    width: '100%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  dateSelectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  dateTypeButton: {
    flex: 1,
    backgroundColor: '#334155',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
  },
  dateTypeButtonActive: {
    backgroundColor: '#ec489920',
    borderColor: '#ec4899',
  },
  dateTypeButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#94a3b8',
    marginBottom: 4,
  },
  dateTypeButtonTextActive: {
    color: '#ec4899',
  },
  dateTypeButtonDate: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  dateTypeButtonDateActive: {
    color: '#ec4899',
  },
  dateArrow: {
    paddingHorizontal: 4,
  },
  dateArrowText: {
    fontSize: 20,
    color: '#64748b',
  },
  calendarWrapper: {
    marginBottom: 20,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  calendarHint: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 12,
    backgroundColor: '#0f172a',
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
  dateButton: {
    backgroundColor: '#334155',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 16,
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
  modalButtonSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
