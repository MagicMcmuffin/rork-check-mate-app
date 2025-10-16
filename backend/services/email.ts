import nodemailer from 'nodemailer';

export interface SendEmailParams {
  to: string[];
  subject: string;
  html: string;
}

const GMAIL_USER = 'checkmatesafty@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || 'asgp rimm vddj gqob';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; message: string }> {
  try {
    console.log('========================================');
    console.log('📧 EMAIL SERVICE CALLED');
    console.log('========================================');
    console.log('Gmail Account:', GMAIL_USER);
    console.log('App Password:', GMAIL_APP_PASSWORD.substring(0, 4) + '****' + GMAIL_APP_PASSWORD.substring(GMAIL_APP_PASSWORD.length - 4));
    console.log('Recipients:', to);
    console.log('Subject:', subject);
    console.log('Recipients count:', to.length);
    console.log('========================================');

    if (to.length === 0) {
      console.error('❌ No recipients provided');
      return { success: false, message: 'No recipients provided' };
    }

    console.log('🔄 Attempting to send email...');
    
    await transporter.verify();
    console.log('✅ SMTP connection verified');
    
    const info = await transporter.sendMail({
      from: `"CheckMate Safety" <${GMAIL_USER}>`,
      to: to.join(', '),
      subject,
      html,
    });

    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log('Message ID:', info.messageId);
    console.log('📧 Delivered to:', to.join(', '));
    console.log('========================================');
    
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('========================================');
    console.error('❌ EMAIL SENDING FAILED');
    console.error('========================================');
    console.error('Error details:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    console.error('========================================');
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
}

export function getInspectionEmailRecipients(params: {
  companyEmail: string;
  projectEmails?: string[];
  adminEmails?: string[];
}): string[] {
  const recipients = new Set<string>();
  
  if (params.companyEmail) {
    recipients.add(params.companyEmail);
  }
  
  if (params.projectEmails) {
    params.projectEmails.forEach(email => recipients.add(email));
  }
  
  if (params.adminEmails) {
    params.adminEmails.forEach(email => recipients.add(email));
  }
  
  return Array.from(recipients);
}

interface InspectionEmailData {
  inspectionType: string;
  equipmentName: string;
  operatorName: string;
  date: string;
  projectName?: string;
  failedChecks: { name: string; status: string; notes?: string }[];
  notesOnDefects?: string;
  companyName: string;
}

export function generateInspectionEmailHTML(data: InspectionEmailData): string {
  const severityColor = data.failedChecks.some(c => c.status === 'C') ? '#ef4444' : '#f59e0b';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Inspection Alert</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <div style="background: ${severityColor}; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">⚠️ Inspection Alert</h1>
            </div>
            
            <div style="padding: 24px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #64748b;">
                An inspection has been completed with issues that require attention.
              </p>
              
              <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #475569; width: 140px;">Company:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${data.companyName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #475569;">Inspection Type:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${data.inspectionType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #475569;">Equipment:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${data.equipmentName}</td>
                  </tr>
                  ${data.projectName ? `
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #475569;">Project:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${data.projectName}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #475569;">Operator:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${data.operatorName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #475569;">Date:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${data.date}</td>
                  </tr>
                </table>
              </div>
              
              <h2 style="font-size: 18px; font-weight: 700; color: #1e293b; margin: 24px 0 12px 0;">Failed Checks</h2>
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                ${data.failedChecks.map((check, index) => `
                  <div style="padding: 12px 16px; ${index !== 0 ? 'border-top: 1px solid #e2e8f0;' : ''}">
                    <div style="display: flex; align-items: center; margin-bottom: 4px;">
                      <span style="display: inline-block; padding: 2px 8px; background: ${check.status === 'C' ? '#fee2e2' : check.status === 'B' ? '#fef3c7' : '#f1f5f9'}; color: ${check.status === 'C' ? '#dc2626' : check.status === 'B' ? '#d97706' : '#64748b'}; border-radius: 4px; font-size: 12px; font-weight: 600; margin-right: 8px;">${check.status}</span>
                      <span style="font-weight: 600; color: #1e293b;">${check.name}</span>
                    </div>
                    ${check.notes ? `<p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;">${check.notes}</p>` : ''}
                  </div>
                `).join('')}
              </div>
              
              ${data.notesOnDefects ? `
              <h2 style="font-size: 18px; font-weight: 700; color: #1e293b; margin: 24px 0 12px 0;">Additional Notes</h2>
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px;">
                <p style="margin: 0; color: #78350f;">${data.notesOnDefects}</p>
              </div>
              ` : ''}
              
              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="margin: 0; color: #64748b; font-size: 14px;">
                  Please review and take appropriate action.
                </p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">This is an automated message from CheckMate Safety</p>
            <p style="margin: 4px 0 0 0;">checkmatesafty@gmail.com</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

interface PositiveInterventionEmailData {
  companyName: string;
  employeeName: string;
  date: string;
  projectName?: string;
  hazardDescription: string;
  severity: string;
  actionTaken: string;
  site?: string;
  location?: string;
}

export function generatePositiveInterventionEmailHTML(data: PositiveInterventionEmailData): string {
  const severityColor = data.severity === 'high' ? '#ef4444' : data.severity === 'medium' ? '#f59e0b' : '#10b981';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Positive Intervention Submitted</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">🛡️ Positive Intervention</h1>
            </div>
            
            <div style="padding: 24px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #64748b;">
                A positive intervention has been submitted by a team member.
              </p>
              
              <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #475569; width: 140px;">Company:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${data.companyName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #475569;">Submitted By:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${data.employeeName}</td>
                  </tr>
                  ${data.projectName ? `
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #475569;">Project:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${data.projectName}</td>
                  </tr>
                  ` : ''}
                  ${data.site ? `
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #475569;">Site:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${data.site}</td>
                  </tr>
                  ` : ''}
                  ${data.location ? `
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #475569;">Location:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${data.location}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #475569;">Date:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${data.date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #475569;">Severity:</td>
                    <td style="padding: 8px 0;">
                      <span style="display: inline-block; padding: 4px 12px; background: ${severityColor}; color: white; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">${data.severity}</span>
                    </td>
                  </tr>
                </table>
              </div>
              
              <h2 style="font-size: 18px; font-weight: 700; color: #1e293b; margin: 24px 0 12px 0;">Hazard Description</h2>
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
                <p style="margin: 0; color: #78350f;">${data.hazardDescription}</p>
              </div>
              
              <h2 style="font-size: 18px; font-weight: 700; color: #1e293b; margin: 24px 0 12px 0;">Action Taken</h2>
              <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 16px; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">${data.actionTaken}</p>
              </div>
              
              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="margin: 0; color: #64748b; font-size: 14px;">
                  Great work identifying and addressing this safety concern!
                </p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">This is an automated message from CheckMate Safety</p>
            <p style="margin: 4px 0 0 0;">checkmatesafty@gmail.com</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

interface AnnouncementEmailData {
  companyName: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  authorName: string;
  date: string;
}

export function generateAnnouncementEmailHTML(data: AnnouncementEmailData): string {
  const priorityConfig = {
    high: { color: '#dc2626', bg: '#fee2e2', label: 'URGENT', icon: '🚨' },
    normal: { color: '#1e40af', bg: '#dbeafe', label: 'NORMAL', icon: '📢' },
    low: { color: '#64748b', bg: '#f1f5f9', label: 'INFO', icon: 'ℹ️' },
  };
  
  const config = priorityConfig[data.priority];
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Company Announcement</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">${config.icon} Company Announcement</h1>
            </div>
            
            <div style="padding: 24px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                <span style="display: inline-block; padding: 6px 12px; background: ${config.bg}; color: ${config.color}; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase;">${config.label}</span>
              </div>
              
              <h2 style="font-size: 22px; font-weight: 700; color: #1e293b; margin: 0 0 20px 0;">${data.title}</h2>
              
              <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid ${config.color};">
                <p style="margin: 0; color: #1e293b; font-size: 15px; line-height: 1.8; white-space: pre-wrap;">${data.message}</p>
              </div>
              
              <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #475569; width: 120px;">Company:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${data.companyName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #475569;">Posted By:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${data.authorName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #475569;">Date:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${data.date}</td>
                  </tr>
                </table>
              </div>
              
              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="margin: 0; color: #64748b; font-size: 14px;">
                  This announcement was sent to all company members.
                </p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">This is an automated message from CheckMate Safety</p>
            <p style="margin: 4px 0 0 0;">checkmatesafty@gmail.com</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
