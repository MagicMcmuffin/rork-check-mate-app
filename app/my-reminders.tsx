import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Calendar, AlertCircle, CheckCircle } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';

export default function MyRemindersScreen() {
  const { user, tickets, ticketReminders, markReminderCompleted } = useApp();

  const userReminders = useMemo(() => {
    return ticketReminders
      .filter(r => r.employeeId === user?.id && !r.isCompleted)
      .sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime());
  }, [ticketReminders, user?.id]);

  const getStatusInfo = (reminderDate: string) => {
    const reminder = new Date(reminderDate);
    const now = new Date();
    const daysUntil = Math.floor((reminder.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      return { status: 'overdue', color: '#ef4444', text: 'Overdue' };
    } else if (daysUntil === 0) {
      return { status: 'today', color: '#f59e0b', text: 'Today' };
    } else if (daysUntil <= 7) {
      return { status: 'soon', color: '#f59e0b', text: `${daysUntil} days` };
    } else {
      return { status: 'upcoming', color: '#3b82f6', text: `${daysUntil} days` };
    }
  };

  const handleMarkCompleted = async (reminderId: string) => {
    await markReminderCompleted(reminderId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#1e293b' },
          headerTintColor: '#fff',
          title: 'Reminders',
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Bell size={48} color="#f59e0b" />
          <Text style={styles.headerTitle}>Upcoming Reminders</Text>
          <Text style={styles.headerSubtitle}>
            Stay on top of your certificate and license renewals
          </Text>
        </View>

        {userReminders.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle size={64} color="#10b981" />
            <Text style={styles.emptyStateTitle}>All caught up!</Text>
            <Text style={styles.emptyStateText}>
              You have no pending reminders at the moment
            </Text>
          </View>
        ) : (
          <View style={styles.remindersList}>
            {userReminders.map((reminder) => {
              const statusInfo = getStatusInfo(reminder.reminderDate);
              const ticket = tickets.find(t => t.id === reminder.ticketId);
              
              return (
                <View key={reminder.id} style={styles.reminderCard}>
                  <View style={styles.reminderHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                      <Text style={styles.statusBadgeText}>{statusInfo.text}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={() => handleMarkCompleted(reminder.id)}
                    >
                      <CheckCircle size={20} color="#10b981" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.reminderTitle}>{reminder.ticketTitle}</Text>

                  <View style={styles.dateInfo}>
                    <Calendar size={16} color="#64748b" />
                    <Text style={styles.dateText}>
                      Reminder: {new Date(reminder.reminderDate).toLocaleDateString()}
                    </Text>
                  </View>

                  {ticket?.expiryDate && (
                    <View style={styles.expiryInfo}>
                      <AlertCircle size={16} color="#f59e0b" />
                      <Text style={styles.expiryText}>
                        Expires: {new Date(ticket.expiryDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.typeInfo}>
                    <Text style={styles.typeLabel}>Type: </Text>
                    <Text style={styles.typeValue}>
                      {ticket?.type ? ticket.type.charAt(0).toUpperCase() + ticket.type.slice(1) : 'Unknown'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  remindersList: {
    gap: 16,
  },
  reminderCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  completeButton: {
    padding: 4,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 12,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  expiryText: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '500' as const,
  },
  typeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  typeLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  typeValue: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500' as const,
  },
});
