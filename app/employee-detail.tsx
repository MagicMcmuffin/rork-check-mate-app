import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, Modal } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Download, ArrowLeft, Award, Calendar, AlertCircle, CheckCircle, X } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { Ticket } from '@/types';

export default function EmployeeDetailScreen() {
  const { employeeId } = useLocalSearchParams();
  const { getCompanyUsers, tickets, user } = useApp();
  const { colors, isDarkMode } = useTheme();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const isAdmin = user?.role === 'company' || user?.role === 'administrator' || user?.role === 'management';

  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Access Denied</Text>
        </View>
      </SafeAreaView>
    );
  }

  const companyUsers = getCompanyUsers();
  const employee = companyUsers.find(u => u.id === employeeId);

  if (!employee) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Employee not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const employeeTickets = tickets.filter((t: Ticket) => t.employeeId === employee.id);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'certificate': return '#3b82f6';
      case 'license': return '#10b981';
      case 'training': return '#8b5cf6';
      case 'card': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'certificate': return 'Certificate';
      case 'license': return 'License';
      case 'training': return 'Training';
      case 'card': return 'Card';
      default: return 'Other';
    }
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const handleDownloadTicket = async (ticket: Ticket) => {
    if (!ticket.fileUri) {
      Alert.alert('No File', 'This ticket has no attached file.');
      return;
    }

    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = ticket.fileUri;
        link.download = ticket.fileName || 'ticket-file';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(ticket.fileUri, {
            mimeType: ticket.mimeType,
            dialogTitle: `Download ${ticket.fileName}`,
          });
        } else {
          Alert.alert('Sharing Unavailable', 'File sharing is not available on this device.');
        }
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', 'Failed to download file.');
    }
  };

  const handleDownloadAllTickets = async () => {
    if (employeeTickets.length === 0) {
      Alert.alert('No Tickets', 'This employee has no tickets to download.');
      return;
    }

    try {
      const ticketsHTML = employeeTickets.map((ticket, index) => {
        const typeColor = getTypeColor(ticket.type);
        const expired = isExpired(ticket.expiryDate);
        const expiringSoon = isExpiringSoon(ticket.expiryDate);
        
        return `
          <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div style="background: ${typeColor}; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">
                ${getTypeLabel(ticket.type)}
              </div>
              <div style="color: #64748b; font-size: 12px;">
                Added ${new Date(ticket.createdAt).toLocaleDateString()}
              </div>
            </div>
            <h3 style="color: #1e293b; font-size: 18px; margin-bottom: 8px;">${ticket.title}</h3>
            ${ticket.fileName ? `
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="color: #64748b; font-size: 14px;">📎 ${ticket.fileName}</span>
              </div>
            ` : ''}
            ${ticket.expiryDate ? `
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="color: ${expired ? '#ef4444' : expiringSoon ? '#f59e0b' : '#64748b'}; font-size: 14px; font-weight: ${expired || expiringSoon ? '600' : '400'};">
                  ${expired ? '⚠️ Expired: ' : expiringSoon ? '⚠️ Expires Soon: ' : '📅 Expires: '}${new Date(ticket.expiryDate).toLocaleDateString()}
                </span>
              </div>
            ` : ''}
            ${ticket.notes ? `
              <div style="color: #64748b; font-size: 14px; margin-top: 8px;">
                ${ticket.notes}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${employee.name} - Tickets Report</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                color: #1e293b;
                background: #ffffff;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                color: white;
                padding: 24px;
                border-radius: 12px;
                margin-bottom: 24px;
              }
              .header-title {
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 8px;
              }
              .header-subtitle {
                font-size: 14px;
                opacity: 0.9;
              }
              .info-card {
                background: #f8fafc;
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 24px;
                border: 1px solid #e2e8f0;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #e2e8f0;
              }
              .info-row:last-child {
                border-bottom: none;
              }
              .info-label {
                color: #64748b;
                font-size: 13px;
                font-weight: 600;
              }
              .info-value {
                color: #1e293b;
                font-weight: 700;
                font-size: 13px;
              }
              .footer {
                margin-top: 40px;
                padding-top: 24px;
                border-top: 2px solid #e2e8f0;
                text-align: center;
                color: #64748b;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-title">${employee.name} - Tickets & Certifications</div>
              <div class="header-subtitle">Generated on ${new Date().toLocaleDateString()}</div>
            </div>

            <div class="info-card">
              <div class="info-row">
                <span class="info-label">Employee Name:</span>
                <span class="info-value">${employee.name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Role:</span>
                <span class="info-value">${employee.role}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total Tickets:</span>
                <span class="info-value">${employeeTickets.length}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Generated Date:</span>
                <span class="info-value">${new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div style="margin-top: 24px;">
              <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 16px; color: #1e293b;">Tickets & Certifications</h2>
              ${ticketsHTML}
            </div>

            <div class="footer">
              Generated by CheckMate Safety • ${new Date().toLocaleDateString()}
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      const filename = `${employee.name}-tickets-${new Date().toISOString().split('T')[0]}.pdf`;
      
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.document) {
          const link = window.document.createElement('a');
          link.href = uri;
          link.download = filename;
          link.click();
        }
      } else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            UTI: '.pdf',
            mimeType: 'application/pdf',
          });
        } else {
          Alert.alert('Success', 'PDF generated successfully');
        }
      }
    } catch (error) {
      console.error('Error generating tickets PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Employee Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.employeeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {employee.profilePicture ? (
            <Image source={{ uri: employee.profilePicture }} style={styles.employeeAvatar} />
          ) : (
            <View style={[styles.employeeAvatarPlaceholder, { backgroundColor: isDarkMode ? '#1e3a5f' : '#dbeafe' }]}>
              <Text style={styles.employeeAvatarText}>{employee.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.employeeInfo}>
            <Text style={[styles.employeeName, { color: colors.text }]}>{employee.name}</Text>
            <Text style={[styles.employeeRole, { color: colors.textSecondary }]}>{employee.role}</Text>
            {employee.email && (
              <Text style={[styles.employeeEmail, { color: colors.textSecondary }]}>{employee.email}</Text>
            )}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Award size={20} color="#3b82f6" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Tickets & Certifications</Text>
              <View style={[styles.badge, { backgroundColor: isDarkMode ? '#1e3a5f' : '#dbeafe' }]}>
                <Text style={[styles.badgeText, { color: '#1e40af' }]}>{employeeTickets.length}</Text>
              </View>
            </View>
            {employeeTickets.length > 0 && (
              <TouchableOpacity
                style={[styles.downloadAllButton, { backgroundColor: isDarkMode ? '#1e3a5f' : '#eff6ff' }]}
                onPress={handleDownloadAllTickets}
              >
                <Download size={16} color="#3b82f6" />
                <Text style={[styles.downloadAllButtonText, { color: '#3b82f6' }]}>Download All</Text>
              </TouchableOpacity>
            )}
          </View>

          {employeeTickets.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                No tickets or certifications yet
              </Text>
            </View>
          ) : (
            <View style={styles.ticketsList}>
              {employeeTickets.map((ticket: Ticket) => (
                <TouchableOpacity
                  key={ticket.id}
                  style={[styles.ticketCard, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}
                  onPress={() => setSelectedTicket(ticket)}
                >
                  <View style={styles.ticketHeader}>
                    <View style={[styles.typeBadge, { backgroundColor: getTypeColor(ticket.type) }]}>
                      <Text style={styles.typeBadgeText}>{getTypeLabel(ticket.type)}</Text>
                    </View>
                    {ticket.fileUri && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDownloadTicket(ticket);
                        }}
                        style={styles.iconButton}
                      >
                        <Download size={18} color="#3b82f6" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={[styles.ticketTitle, { color: colors.text }]}>{ticket.title}</Text>

                  {ticket.expiryDate && (
                    <View style={styles.expiryInfo}>
                      {isExpired(ticket.expiryDate) ? (
                        <AlertCircle size={14} color="#ef4444" />
                      ) : isExpiringSoon(ticket.expiryDate) ? (
                        <AlertCircle size={14} color="#f59e0b" />
                      ) : (
                        <CheckCircle size={14} color="#10b981" />
                      )}
                      <Text style={[
                        styles.expiryText,
                        { color: isExpired(ticket.expiryDate) ? '#ef4444' : isExpiringSoon(ticket.expiryDate) ? '#f59e0b' : colors.textSecondary }
                      ]}>
                        {isExpired(ticket.expiryDate) ? 'Expired: ' : 'Expires: '}
                        {new Date(ticket.expiryDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}

                  <Text style={[styles.ticketDate, { color: colors.textSecondary }]}>
                    Added {new Date(ticket.createdAt).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {selectedTicket && (
        <Modal
          visible={!!selectedTicket}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedTicket(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedTicket(null)}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Ticket Details</Text>
                <TouchableOpacity onPress={() => setSelectedTicket(null)}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(selectedTicket.type), alignSelf: 'flex-start' }]}>
                  <Text style={styles.typeBadgeText}>{getTypeLabel(selectedTicket.type)}</Text>
                </View>

                <Text style={[styles.modalTicketTitle, { color: colors.text }]}>{selectedTicket.title}</Text>

                {selectedTicket.fileName && (
                  <View style={[styles.modalInfoRow, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}>
                    <FileText size={16} color={colors.textSecondary} />
                    <Text style={[styles.modalInfoText, { color: colors.text }]}>{selectedTicket.fileName}</Text>
                  </View>
                )}

                {selectedTicket.expiryDate && (
                  <View style={[styles.modalInfoRow, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}>
                    <Calendar size={16} color={isExpired(selectedTicket.expiryDate) ? '#ef4444' : isExpiringSoon(selectedTicket.expiryDate) ? '#f59e0b' : colors.textSecondary} />
                    <Text style={[
                      styles.modalInfoText,
                      { color: isExpired(selectedTicket.expiryDate) ? '#ef4444' : isExpiringSoon(selectedTicket.expiryDate) ? '#f59e0b' : colors.text }
                    ]}>
                      {isExpired(selectedTicket.expiryDate) ? 'Expired: ' : 'Expires: '}
                      {new Date(selectedTicket.expiryDate).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                {selectedTicket.notes && (
                  <View style={styles.modalNotesSection}>
                    <Text style={[styles.modalNotesLabel, { color: colors.textSecondary }]}>Notes:</Text>
                    <Text style={[styles.modalNotesText, { color: colors.text }]}>{selectedTicket.notes}</Text>
                  </View>
                )}

                <Text style={[styles.modalDate, { color: colors.textSecondary }]}>
                  Added on {new Date(selectedTicket.createdAt).toLocaleDateString()}
                </Text>

                {selectedTicket.fileUri && (
                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={() => {
                      handleDownloadTicket(selectedTicket);
                      setSelectedTicket(null);
                    }}
                  >
                    <Download size={20} color="#fff" />
                    <Text style={styles.downloadButtonText}>Download File</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  employeeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  employeeAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeAvatarText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1e40af',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  employeeRole: {
    fontSize: 14,
    fontWeight: '500' as const,
    textTransform: 'capitalize' as const,
    marginBottom: 4,
  },
  employeeEmail: {
    fontSize: 13,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  downloadAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  downloadAllButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    marginTop: 12,
  },
  ticketsList: {
    gap: 12,
  },
  ticketCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600' as const,
  },
  iconButton: {
    padding: 4,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  expiryText: {
    fontSize: 13,
  },
  ticketDate: {
    fontSize: 11,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  modalScroll: {
    padding: 20,
  },
  modalTicketTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    marginTop: 12,
    marginBottom: 16,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalInfoText: {
    fontSize: 14,
    flex: 1,
  },
  modalNotesSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  modalNotesLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  modalNotesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalDate: {
    fontSize: 12,
    marginBottom: 20,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
