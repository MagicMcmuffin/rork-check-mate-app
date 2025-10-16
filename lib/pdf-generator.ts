import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import type { PlantInspection, QuickHitchInspection, VehicleInspection, BucketChangeInspection, PositiveIntervention, ApprenticeshipEntry, CheckStatus } from '@/types';
import { PLANT_INSPECTION_ITEMS, PLANT_INSPECTION_SECONDARY_ITEMS, QUICK_HITCH_ITEMS, VEHICLE_INSPECTION_ITEMS, BUCKET_CHANGE_ITEMS } from '@/constants/inspections';

const getStatusText = (status: CheckStatus | boolean) => {
  if (typeof status === 'boolean') {
    return status ? '✓ Pass' : '✗ Fail';
  }
  return status || '-';
};

const getStatusColor = (status: CheckStatus | boolean) => {
  if (status === 'A' || status === '✓' || status === true) {
    return '#10b981';
  } else if (status === 'B' || status === 'C' || status === '✗' || status === false) {
    return '#ef4444';
  }
  return '#94a3b8';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const generateHTMLStyles = () => `
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
      padding: 40px;
    }
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 32px;
      border-radius: 16px;
      margin-bottom: 32px;
    }
    .header-title {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    .header-meta {
      display: flex;
      gap: 24px;
      margin-top: 12px;
      font-size: 14px;
      opacity: 0.95;
    }
    .info-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #64748b;
      font-size: 14px;
    }
    .info-value {
      color: #1e293b;
      font-weight: 600;
      font-size: 14px;
    }
    .section {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #1e293b;
    }
    .check-row {
      padding: 16px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .check-row:last-child {
      border-bottom: none;
    }
    .check-item-name {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .check-status {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .check-notes {
      color: #64748b;
      font-size: 13px;
      font-style: italic;
      margin-top: 8px;
    }
    .notes-text {
      color: #64748b;
      font-size: 14px;
      line-height: 1.6;
    }
    .images-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 16px;
    }
    .image-container {
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .image-container img {
      width: 100%;
      height: auto;
      display: block;
    }
    .severity-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
    }
    .footer {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    @media print {
      body {
        padding: 20px;
      }
      .check-row {
        page-break-inside: avoid;
      }
    }
  </style>
`;

export const generatePlantInspectionPDF = async (
  inspection: PlantInspection,
  companyName: string,
  projectName?: string
): Promise<void> => {
  try {
    const getItemName = (itemId: string) => {
      const allItems = [...PLANT_INSPECTION_ITEMS, ...PLANT_INSPECTION_SECONDARY_ITEMS];
      const item = allItems.find(i => i.id === itemId);
      return item?.name || itemId;
    };

    const checksHTML = inspection.checks.map((check) => {
      const statusColor = getStatusColor(check.status);
      const picturesHTML = check.pictures && check.pictures.length > 0 ? `
        <div class="images-grid">
          ${check.pictures.map(pic => `
            <div class="image-container">
              <img src="${pic}" alt="Inspection photo" />
            </div>
          `).join('')}
        </div>
      ` : '';

      return `
        <div class="check-row">
          <div class="check-item-name">${getItemName(check.itemId)}</div>
          <div class="check-status" style="background: ${statusColor}22; color: ${statusColor};">
            ${getStatusText(check.status)}
          </div>
          ${check.notes ? `<div class="check-notes">Notes: ${check.notes}</div>` : ''}
          ${picturesHTML}
        </div>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Plant Inspection Report</title>
          ${generateHTMLStyles()}
        </head>
        <body>
          <div class="header">
            <div class="header-title">Plant Daily Inspection Report</div>
            <div class="header-meta">
              <div>📅 ${formatDate(inspection.createdAt)}</div>
              <div>👤 ${inspection.employeeName}</div>
            </div>
          </div>

          <div class="info-card">
            <div class="info-row">
              <span class="info-label">Company:</span>
              <span class="info-value">${companyName}</span>
            </div>
            ${projectName ? `
              <div class="info-row">
                <span class="info-label">Project:</span>
                <span class="info-value">${projectName}</span>
              </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Inspected Item:</span>
              <span class="info-value">Plant #${inspection.plantNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Carried Out By:</span>
              <span class="info-value">${inspection.carriedOutBy}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span class="info-value">${inspection.date}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Inspection Results</div>
            ${checksHTML}
          </div>

          ${inspection.notesOnDefects ? `
            <div class="section">
              <div class="section-title">Notes on Defects</div>
              <div class="notes-text">${inspection.notesOnDefects}</div>
            </div>
          ` : ''}

          <div class="footer">
            Generated by CheckMate Safety • ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.document) {
        const link = window.document.createElement('a');
        link.href = uri;
        link.download = `plant-inspection-${inspection.plantNumber}-${inspection.date}.pdf`;
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
    console.error('Error generating PDF:', error);
    Alert.alert('Error', 'Failed to generate PDF. Please try again.');
  }
};

export const generateQuickHitchInspectionPDF = async (
  inspection: QuickHitchInspection,
  companyName: string,
  projectName?: string
): Promise<void> => {
  try {
    const getItemName = (itemId: string) => {
      const item = QUICK_HITCH_ITEMS.find(i => i.id === itemId);
      return item?.name || itemId;
    };

    const checksHTML = inspection.checks.map((check) => {
      const statusColor = getStatusColor(check.status);
      return `
        <div class="check-row">
          <div class="check-item-name">${getItemName(check.itemId)}</div>
          <div class="check-status" style="background: ${statusColor}22; color: ${statusColor};">
            ${getStatusText(check.status)}
          </div>
        </div>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Quick Hitch Inspection Report</title>
          ${generateHTMLStyles()}
        </head>
        <body>
          <div class="header">
            <div class="header-title">Quick Hitch Inspection Report</div>
            <div class="header-meta">
              <div>📅 ${formatDate(inspection.createdAt)}</div>
              <div>👤 ${inspection.operatorName}</div>
            </div>
          </div>

          <div class="info-card">
            <div class="info-row">
              <span class="info-label">Company:</span>
              <span class="info-value">${companyName}</span>
            </div>
            ${projectName ? `
              <div class="info-row">
                <span class="info-label">Project:</span>
                <span class="info-value">${projectName}</span>
              </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Inspected Item:</span>
              <span class="info-value">${inspection.quickHitchModel}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Operator:</span>
              <span class="info-value">${inspection.operatorName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Excavator:</span>
              <span class="info-value">${inspection.excavatorDetails}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span class="info-value">${inspection.date}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Inspection Results</div>
            ${checksHTML}
          </div>

          ${inspection.remarks ? `
            <div class="section">
              <div class="section-title">Remarks</div>
              <div class="notes-text">${inspection.remarks}</div>
            </div>
          ` : ''}

          <div class="footer">
            Generated by CheckMate Safety • ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.document) {
        const link = window.document.createElement('a');
        link.href = uri;
        link.download = `quickhitch-inspection-${inspection.quickHitchModel}-${inspection.date}.pdf`;
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
    console.error('Error generating PDF:', error);
    Alert.alert('Error', 'Failed to generate PDF. Please try again.');
  }
};

export const generateVehicleInspectionPDF = async (
  inspection: VehicleInspection,
  companyName: string,
  projectName?: string
): Promise<void> => {
  try {
    const getItemName = (itemId: string) => {
      const item = VEHICLE_INSPECTION_ITEMS.find(i => i.id === itemId);
      return item?.name || itemId;
    };

    const checksHTML = inspection.checks.map((check) => {
      const statusColor = getStatusColor(check.status);
      const picturesHTML = check.pictures && check.pictures.length > 0 ? `
        <div class="images-grid">
          ${check.pictures.map(pic => `
            <div class="image-container">
              <img src="${pic}" alt="Inspection photo" />
            </div>
          `).join('')}
        </div>
      ` : '';

      return `
        <div class="check-row">
          <div class="check-item-name">${getItemName(check.itemId)}</div>
          <div class="check-status" style="background: ${statusColor}22; color: ${statusColor};">
            ${getStatusText(check.status)}
          </div>
          ${check.notes ? `<div class="check-notes">Notes: ${check.notes}</div>` : ''}
          ${picturesHTML}
        </div>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Vehicle Inspection Report</title>
          ${generateHTMLStyles()}
        </head>
        <body>
          <div class="header">
            <div class="header-title">Vehicle Inspection Report</div>
            <div class="header-meta">
              <div>📅 ${formatDate(inspection.createdAt)}</div>
              <div>👤 ${inspection.employeeName}</div>
            </div>
          </div>

          <div class="info-card">
            <div class="info-row">
              <span class="info-label">Company:</span>
              <span class="info-value">${companyName}</span>
            </div>
            ${projectName ? `
              <div class="info-row">
                <span class="info-label">Project:</span>
                <span class="info-value">${projectName}</span>
              </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Inspected Item:</span>
              <span class="info-value">${inspection.vehicleRegistration}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Vehicle Type:</span>
              <span class="info-value">${inspection.vehicleType}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Mileage:</span>
              <span class="info-value">${inspection.mileage}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span class="info-value">${inspection.date}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Inspection Results</div>
            ${checksHTML}
          </div>

          ${inspection.additionalComments ? `
            <div class="section">
              <div class="section-title">Additional Comments</div>
              <div class="notes-text">${inspection.additionalComments}</div>
            </div>
          ` : ''}

          <div class="footer">
            Generated by CheckMate Safety • ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.document) {
        const link = window.document.createElement('a');
        link.href = uri;
        link.download = `vehicle-inspection-${inspection.vehicleRegistration}-${inspection.date}.pdf`;
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
    console.error('Error generating PDF:', error);
    Alert.alert('Error', 'Failed to generate PDF. Please try again.');
  }
};

export const generateBucketChangeInspectionPDF = async (
  inspection: BucketChangeInspection,
  companyName: string,
  projectName?: string
): Promise<void> => {
  try {
    const getItemName = (itemId: string) => {
      const item = BUCKET_CHANGE_ITEMS.find(i => i.id === itemId);
      return item?.name || itemId;
    };

    const checksHTML = inspection.checks.map((check) => {
      const statusColor = getStatusColor(check.status);
      return `
        <div class="check-row">
          <div class="check-item-name">${getItemName(check.itemId)}</div>
          <div class="check-status" style="background: ${statusColor}22; color: ${statusColor};">
            ${getStatusText(check.status)}
          </div>
          ${check.notes ? `<div class="check-notes">Notes: ${check.notes}</div>` : ''}
        </div>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bucket Change Check Report</title>
          ${generateHTMLStyles()}
        </head>
        <body>
          <div class="header">
            <div class="header-title">Bucket Change Check Report</div>
            <div class="header-meta">
              <div>📅 ${formatDate(inspection.createdAt)}</div>
              <div>👤 ${inspection.employeeName}</div>
            </div>
          </div>

          <div class="info-card">
            <div class="info-row">
              <span class="info-label">Company:</span>
              <span class="info-value">${companyName}</span>
            </div>
            ${projectName ? `
              <div class="info-row">
                <span class="info-label">Project:</span>
                <span class="info-value">${projectName}</span>
              </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Bucket/Implement Type:</span>
              <span class="info-value">${inspection.bucketType}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Operator:</span>
              <span class="info-value">${inspection.employeeName}</span>
            </div>
            ${inspection.witnessName ? `
              <div class="info-row">
                <span class="info-label">Witness:</span>
                <span class="info-value">${inspection.witnessName}</span>
              </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span class="info-value">${inspection.date}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Inspection Results</div>
            ${checksHTML}
          </div>

          <div class="footer">
            Generated by CheckMate Safety • ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.document) {
        const link = window.document.createElement('a');
        link.href = uri;
        link.download = `bucket-change-${inspection.bucketType}-${inspection.date}.pdf`;
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
    console.error('Error generating PDF:', error);
    Alert.alert('Error', 'Failed to generate PDF. Please try again.');
  }
};

export const generatePositiveInterventionPDF = async (
  intervention: PositiveIntervention,
  companyName: string,
  projectName?: string
): Promise<void> => {
  try {
    const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
      switch (severity) {
        case 'high': return '#ef4444';
        case 'medium': return '#f59e0b';
        case 'low': return '#10b981';
      }
    };

    const getSeverityBg = (severity: 'low' | 'medium' | 'high') => {
      switch (severity) {
        case 'high': return '#fee2e2';
        case 'medium': return '#fef3c7';
        case 'low': return '#dcfce7';
      }
    };

    const picturesHTML = intervention.pictures && intervention.pictures.length > 0 ? `
      <div class="section">
        <div class="section-title">Photos (${intervention.pictures.length})</div>
        <div class="images-grid">
          ${intervention.pictures.map(pic => `
            <div class="image-container">
              <img src="${pic}" alt="Intervention photo" />
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Positive Intervention Report</title>
          ${generateHTMLStyles()}
        </head>
        <body>
          <div class="header">
            <div class="header-title">Positive Intervention Report</div>
            <div class="header-meta">
              <div>📅 ${formatDate(intervention.createdAt)}</div>
              <div>👤 ${intervention.employeeName}</div>
            </div>
          </div>

          <div class="info-card">
            <div class="info-row">
              <span class="info-label">Company:</span>
              <span class="info-value">${companyName}</span>
            </div>
            ${projectName ? `
              <div class="info-row">
                <span class="info-label">Project:</span>
                <span class="info-value">${projectName}</span>
              </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Severity:</span>
              <span class="severity-badge" style="background: ${getSeverityBg(intervention.severity)}; color: ${getSeverityColor(intervention.severity)};">
                ${intervention.severity.toUpperCase()}
              </span>
            </div>
            ${intervention.site ? `
              <div class="info-row">
                <span class="info-label">Site:</span>
                <span class="info-value">${intervention.site}</span>
              </div>
            ` : ''}
            ${intervention.location ? `
              <div class="info-row">
                <span class="info-label">Location:</span>
                <span class="info-value">${intervention.location}</span>
              </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span class="info-value">${intervention.date}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Hazard Description</div>
            <div class="notes-text">${intervention.hazardDescription}</div>
          </div>

          <div class="section">
            <div class="section-title">Action Taken</div>
            <div class="notes-text">${intervention.actionTaken}</div>
          </div>

          ${picturesHTML}

          <div class="footer">
            Generated by CheckMate Safety • ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.document) {
        const link = window.document.createElement('a');
        link.href = uri;
        link.download = `positive-intervention-${intervention.date}.pdf`;
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
    console.error('Error generating PDF:', error);
    Alert.alert('Error', 'Failed to generate PDF. Please try again.');
  }
};

export const generateApprenticeshipLearningPDF = async (
  entry: ApprenticeshipEntry,
  companyName: string
): Promise<void> => {
  try {
    const picturesHTML = entry.pictures && entry.pictures.length > 0 ? `
      <div class="section">
        <div class="section-title">Photos (${entry.pictures.length})</div>
        <div class="images-grid">
          ${entry.pictures.map(pic => `
            <div class="image-container">
              <img src="${pic}" alt="Learning photo" />
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Apprenticeship Learning Report</title>
          ${generateHTMLStyles()}
        </head>
        <body>
          <div class="header">
            <div class="header-title">Apprenticeship Learning Report</div>
            <div class="header-meta">
              <div>📅 ${formatDate(entry.createdAt)}</div>
              <div>👤 ${entry.apprenticeName}</div>
            </div>
          </div>

          <div class="info-card">
            <div class="info-row">
              <span class="info-label">Company:</span>
              <span class="info-value">${companyName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Apprentice:</span>
              <span class="info-value">${entry.apprenticeName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span class="info-value">${entry.date}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">What Was Learned</div>
            <div class="notes-text">${entry.learningDescription}</div>
          </div>

          ${picturesHTML}

          <div class="footer">
            Generated by CheckMate Safety • ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.document) {
        const link = window.document.createElement('a');
        link.href = uri;
        link.download = `apprenticeship-learning-${entry.apprenticeName}-${entry.date}.pdf`;
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
    console.error('Error generating PDF:', error);
    Alert.alert('Error', 'Failed to generate PDF. Please try again.');
  }
};
