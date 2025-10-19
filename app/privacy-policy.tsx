import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Privacy Policy',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>CheckMate Privacy Policy</Text>
          <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
            Last Updated: January 2025
          </Text>

          <Text style={[styles.heading, { color: colors.text }]}>1. Introduction</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            Welcome to CheckMate ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.
          </Text>

          <Text style={[styles.heading, { color: colors.text }]}>2. Information We Collect</Text>
          <Text style={[styles.subheading, { color: colors.text }]}>2.1 Personal Information</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            We collect personal information that you voluntarily provide to us when you register on the app, including:
          </Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Name and contact information (email address, phone number)</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Company name and details</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Job role and employee information</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Profile pictures and company logos</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Training certificates and qualifications</Text>

          <Text style={[styles.subheading, { color: colors.text }]}>2.2 Inspection and Safety Data</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            When you use our services, we collect:
          </Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Inspection reports and safety checklists</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Equipment and vehicle inspection records</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Photos and media files related to inspections</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Location data (when conducting site inspections)</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Date and time stamps of activities</Text>

          <Text style={[styles.subheading, { color: colors.text }]}>2.3 Device Information</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            We automatically collect certain information about your device, including:
          </Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Device type and operating system</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• App version and usage statistics</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• IP address and device identifiers</Text>

          <Text style={[styles.heading, { color: colors.text }]}>3. How We Use Your Information</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            We use the information we collect to:
          </Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Provide, operate, and maintain our services</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Facilitate safety inspections and compliance tracking</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Generate inspection reports and certificates</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Send notifications about inspections, renewals, and updates</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Manage user accounts and company profiles</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Improve our app functionality and user experience</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Communicate with you about service updates and support</Text>

          <Text style={[styles.heading, { color: colors.text }]}>4. Data Storage and Security</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            Your data is stored locally on your device using AsyncStorage and may be synced with your company's designated storage systems. We implement appropriate technical and organizational security measures to protect your personal information, including:
          </Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Encrypted data transmission</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Secure authentication mechanisms</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Regular security assessments</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Access controls and user permissions</Text>

          <Text style={[styles.heading, { color: colors.text }]}>5. Information Sharing and Disclosure</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            We do not sell your personal information. We may share your information in the following circumstances:
          </Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• With your company administrators and team members (as configured in your account settings)</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• With regulatory authorities when required for compliance purposes</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• To comply with legal obligations or respond to lawful requests</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• With your explicit consent</Text>

          <Text style={[styles.heading, { color: colors.text }]}>6. Your Rights and Choices</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            You have the right to:
          </Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Access and review your personal information</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Update or correct your information through the app settings</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Delete your account and associated data</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Opt-out of non-essential notifications</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Request a copy of your data</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Withdraw consent for data processing (where applicable)</Text>

          <Text style={[styles.heading, { color: colors.text }]}>7. Data Retention</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Inspection records may be retained for compliance with workplace safety regulations and legal requirements.
          </Text>

          <Text style={[styles.heading, { color: colors.text }]}>8. Children's Privacy</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            CheckMate is intended for workplace use and is not directed to individuals under the age of 18. We do not knowingly collect personal information from children.
          </Text>

          <Text style={[styles.heading, { color: colors.text }]}>9. Camera and Media Library Access</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            CheckMate requires access to your device's camera and photo library to enable inspection documentation. Photos are used solely for creating inspection reports and are stored according to your company's data management policies. You can manage these permissions in your device settings.
          </Text>

          <Text style={[styles.heading, { color: colors.text }]}>10. Changes to This Privacy Policy</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last Updated" date at the top of this policy and, where appropriate, through in-app notifications. Your continued use of CheckMate after any changes constitutes acceptance of the updated policy.
          </Text>

          <Text style={[styles.heading, { color: colors.text }]}>11. Contact Us</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
          </Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Email: checkmatesafty@gmail.com</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Through the "Contact Support" option in the Settings menu</Text>

          <Text style={[styles.heading, { color: colors.text }]}>12. Compliance</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            CheckMate is designed to assist with workplace safety compliance. We are committed to complying with applicable data protection laws, including GDPR (where applicable) and other relevant privacy regulations in your jurisdiction.
          </Text>

          <Text style={[styles.footer, { color: colors.textSecondary }]}>
            By using CheckMate, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
          </Text>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 12,
    marginBottom: 24,
    fontStyle: 'italic' as const,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginTop: 20,
    marginBottom: 12,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6,
    paddingLeft: 8,
  },
  footer: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 24,
    fontStyle: 'italic' as const,
  },
});
