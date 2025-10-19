import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FileText, Bell, Award, BookOpen, Calendar } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function MyPortalScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, tickets } = useApp();

  const userTickets = useMemo(() => {
    return tickets.filter(t => t.employeeId === user?.id);
  }, [tickets, user?.id]);

  const expiringSoonCount = useMemo(() => {
    return userTickets.filter(t => {
      if (!t.expiryDate) return false;
      const expiry = new Date(t.expiryDate);
      const now = new Date();
      const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    }).length;
  }, [userTickets]);

  const portalOptions = [
    {
      id: 'tickets',
      title: 'My Tickets',
      description: 'Certificates, licenses & training records',
      icon: FileText,
      color: '#3b82f6',
      route: 'my-tickets' as any,
    },
    {
      id: 'holidays',
      title: 'Holiday Requests',
      description: 'Request and track your holidays',
      icon: Calendar,
      color: '#ec4899',
      route: 'my-holidays' as any,
    },
    {
      id: 'reminders',
      title: 'Reminders',
      description: 'Upcoming renewals & expiry dates',
      icon: Bell,
      color: '#f59e0b',
      route: 'my-reminders' as any,
    },
    {
      id: 'certifications',
      title: 'Certifications',
      description: 'View all your certifications',
      icon: Award,
      color: '#10b981',
      route: 'my-certifications' as any,
    },
    {
      id: 'training',
      title: 'Training History',
      description: 'Your completed training courses',
      icon: BookOpen,
      color: '#8b5cf6',
      route: 'my-training' as any,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          title: 'My Portal',
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Welcome back,</Text>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'User'}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your training and documents</Text>
        </View>

        <View style={styles.grid}>
          {portalOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(option.route)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[option.color, `${option.color}dd`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconContainer}
                >
                  <IconComponent size={28} color="#fff" />
                </LinearGradient>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{option.title}</Text>
                  <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.quickStats}>
          <Text style={[styles.quickStatsTitle, { color: colors.text }]}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.statNumber}>{userTickets.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Tickets</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, expiringSoonCount > 0 && styles.statNumberWarning]}>
                {expiringSoonCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Expiring Soon</Text>
            </View>
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
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 16,
    marginBottom: 4,
  },
  userName: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
  grid: {
    gap: 16,
    marginBottom: 30,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
  },
  quickStats: {
    marginTop: 10,
  },
  quickStatsTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: '#3b82f6',
    marginBottom: 4,
  },
  statNumberWarning: {
    color: '#f59e0b',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});
