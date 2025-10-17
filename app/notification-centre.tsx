import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack, router } from 'expo-router';
import { Bell, Calendar, AlertCircle, Package, Wrench } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function NotificationCentreScreen() {
  const { user, company, getCompanyEquipmentItems } = useApp();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'plant' | 'equipment'>('plant');

  const canSeeEquipmentReminders = user?.role === 'company' || user?.role === 'administrator' || user?.role === 'management' || user?.role === 'mechanic';

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired' as const, days: Math.abs(daysUntilExpiry), color: '#dc2626' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring-soon' as const, days: daysUntilExpiry, color: '#f59e0b' };
    } else {
      return { status: 'valid' as const, days: daysUntilExpiry, color: '#10b981' };
    }
  };

  const plantReminders = useMemo(() => {
    if (!company?.equipment) return [];
    
    const reminders: Array<{
      id: string;
      equipmentName: string;
      expiryDate: string;
      daysUntilExpiry: number;
      status: 'expired' | 'expiring-soon';
      type: 'thorough-examination' | 'mot';
      has7DayReminder: boolean;
      has30DayReminder: boolean;
    }> = [];

    company.equipment.forEach(item => {
      if (item.type === 'plant' && item.thoroughExaminationDate && (item.has7DayReminder || item.has30DayReminder)) {
        const expiryStatus = getExpiryStatus(item.thoroughExaminationDate);
        if (expiryStatus && (expiryStatus.status === 'expired' || expiryStatus.status === 'expiring-soon')) {
          reminders.push({
            id: item.id,
            equipmentName: item.name,
            expiryDate: item.thoroughExaminationDate,
            daysUntilExpiry: expiryStatus.days,
            status: expiryStatus.status,
            type: 'thorough-examination',
            has7DayReminder: item.has7DayReminder || false,
            has30DayReminder: item.has30DayReminder || false,
          });
        }
      }

      if (item.type === 'vehicles' && item.motDate && (item.hasMot7DayReminder || item.hasMot30DayReminder)) {
        const expiryStatus = getExpiryStatus(item.motDate);
        if (expiryStatus && (expiryStatus.status === 'expired' || expiryStatus.status === 'expiring-soon')) {
          reminders.push({
            id: item.id,
            equipmentName: item.name,
            expiryDate: item.motDate,
            daysUntilExpiry: expiryStatus.days,
            status: expiryStatus.status,
            type: 'mot',
            has7DayReminder: item.hasMot7DayReminder || false,
            has30DayReminder: item.hasMot30DayReminder || false,
          });
        }
      }
    });

    return reminders.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }, [company?.equipment]);

  const equipmentReminders = useMemo(() => {
    if (!canSeeEquipmentReminders) return [];
    
    const allItems = getCompanyEquipmentItems();
    const reminders: Array<{
      id: string;
      itemName: string;
      certificateName: string;
      expiryDate: string;
      daysUntilExpiry: number;
      status: 'expired' | 'expiring-soon';
      has7DayReminder: boolean;
      has30DayReminder: boolean;
    }> = [];

    allItems.forEach(item => {
      item.certificates.forEach(cert => {
        if (cert.expiryDate && (cert.has7DayReminder || cert.has30DayReminder)) {
          const expiryStatus = getExpiryStatus(cert.expiryDate);
          if (expiryStatus && (expiryStatus.status === 'expired' || expiryStatus.status === 'expiring-soon')) {
            reminders.push({
              id: cert.id,
              itemName: item.name,
              certificateName: cert.name,
              expiryDate: cert.expiryDate,
              daysUntilExpiry: expiryStatus.days,
              status: expiryStatus.status,
              has7DayReminder: cert.has7DayReminder || false,
              has30DayReminder: cert.has30DayReminder || false,
            });
          }
        }
      });
    });

    return reminders.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }, [canSeeEquipmentReminders, getCompanyEquipmentItems]);

  const totalReminders = plantReminders.length + (canSeeEquipmentReminders ? equipmentReminders.length : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notification Centre',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Back</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
          <Bell size={32} color={colors.primary} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notification Centre</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {totalReminders} {totalReminders === 1 ? 'active reminder' : 'active reminders'}
        </Text>
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'plant' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('plant')}
        >
          <Wrench size={18} color={activeTab === 'plant' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'plant' ? colors.primary : colors.textSecondary }]}>
            Plant & Vehicles
          </Text>
          {plantReminders.length > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: '#dc2626' }]}>
              <Text style={styles.tabBadgeText}>{plantReminders.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        {canSeeEquipmentReminders && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'equipment' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab('equipment')}
          >
            <Package size={18} color={activeTab === 'equipment' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.tabText, { color: activeTab === 'equipment' ? colors.primary : colors.textSecondary }]}>
              Equipment
            </Text>
            {equipmentReminders.length > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: '#dc2626' }]}>
                <Text style={styles.tabBadgeText}>{equipmentReminders.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'plant' ? (
          plantReminders.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Bell size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Active Reminders</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                All plant and vehicle certifications are up to date
              </Text>
            </View>
          ) : (
            plantReminders.map(reminder => (
              <View key={reminder.id} style={[styles.reminderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.reminderStatus, { backgroundColor: reminder.status === 'expired' ? '#fee2e2' : '#fef3c7' }]}>
                  <AlertCircle size={16} color={reminder.status === 'expired' ? '#dc2626' : '#f59e0b'} />
                </View>
                <View style={styles.reminderContent}>
                  <View style={[styles.reminderTypeBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.reminderTypeBadgeText, { color: colors.primary }]}>
                      {reminder.type === 'thorough-examination' ? 'Thorough Examination' : 'MOT'}
                    </Text>
                  </View>
                  <Text style={[styles.reminderItemName, { color: colors.text }]}>{reminder.equipmentName}</Text>
                  <View style={styles.reminderMeta}>
                    <Calendar size={12} color={colors.textSecondary} />
                    <Text style={[styles.reminderDate, { color: colors.textSecondary }]}>
                      {reminder.status === 'expired' 
                        ? `Expired ${reminder.daysUntilExpiry} days ago`
                        : `Expires in ${reminder.daysUntilExpiry} days`}
                    </Text>
                  </View>
                  <View style={styles.reminderBadges}>
                    {reminder.has7DayReminder && (
                      <View style={[styles.reminderBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.reminderBadgeText, { color: colors.primary }]}>7-day</Text>
                      </View>
                    )}
                    {reminder.has30DayReminder && (
                      <View style={[styles.reminderBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.reminderBadgeText, { color: colors.primary }]}>30-day</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))
          )
        ) : (
          equipmentReminders.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Bell size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Active Reminders</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                All equipment certificates are up to date
              </Text>
            </View>
          ) : (
            equipmentReminders.map(reminder => (
              <View key={reminder.id} style={[styles.reminderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.reminderStatus, { backgroundColor: reminder.status === 'expired' ? '#fee2e2' : '#fef3c7' }]}>
                  <AlertCircle size={16} color={reminder.status === 'expired' ? '#dc2626' : '#f59e0b'} />
                </View>
                <View style={styles.reminderContent}>
                  <Text style={[styles.reminderItemName, { color: colors.text }]}>{reminder.itemName}</Text>
                  <Text style={[styles.reminderCertName, { color: colors.textSecondary }]}>{reminder.certificateName}</Text>
                  <View style={styles.reminderMeta}>
                    <Calendar size={12} color={colors.textSecondary} />
                    <Text style={[styles.reminderDate, { color: colors.textSecondary }]}>
                      {reminder.status === 'expired' 
                        ? `Expired ${reminder.daysUntilExpiry} days ago`
                        : `Expires in ${reminder.daysUntilExpiry} days`}
                    </Text>
                  </View>
                  <View style={styles.reminderBadges}>
                    {reminder.has7DayReminder && (
                      <View style={[styles.reminderBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.reminderBadgeText, { color: colors.primary }]}>7-day</Text>
                      </View>
                    )}
                    {reminder.has30DayReminder && (
                      <View style={[styles.reminderBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.reminderBadgeText, { color: colors.primary }]}>30-day</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  reminderStatus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderContent: {
    flex: 1,
  },
  reminderTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  reminderTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  reminderItemName: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  reminderCertName: {
    fontSize: 13,
    marginBottom: 8,
  },
  reminderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  reminderDate: {
    fontSize: 12,
  },
  reminderBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  reminderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reminderBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
});
