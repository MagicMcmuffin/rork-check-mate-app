import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import type { PlantInspection, QuickHitchInspection, VehicleInspection, BucketChangeInspection, PositiveIntervention, ApprenticeshipEntry, CheckStatus, GreasingRecord, AirTestingInspection } from '@/types';
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
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 20px 24px;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    .header-title {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .header-meta {
      display: flex;
      gap: 20px;
      margin-top: 8px;
      font-size: 12px;
      opacity: 0.95;
    }
    .info-card {
      background: #f8fafc;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 16px;
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
      font-size: 11px;
      font-weight: 600;
    }
    .info-value {
      color: #1e293b;
      font-weight: 700;
      font-size: 11px;
    }
    .section {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 10px;
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
      gap: 20px;
      margin-top: 16px;
    }
    @media print {
      .images-grid {
        page-break-inside: avoid;
      }
      .image-container {
        page-break-inside: avoid;
      }
    }
    .image-container {
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid #e2e8f0;
      background: #ffffff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .image-container img {
      width: 100%;
      height: auto;
      display: block;
      object-fit: contain;
      max-height: 300px;
      background: #f8fafc;
    }
    .image-label {
      padding: 8px;
      background: #f1f5f9;
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      text-align: center;
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
    .inspection-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      background: #ffffff;
      border: 2px solid #334155;
      font-size: 10px;
    }
    .inspection-table th {
      background: #1e40af;
      color: white;
      padding: 10px 8px;
      text-align: center;
      font-size: 10px;
      font-weight: 700;
      border: 1px solid #1e3a8a;
      vertical-align: middle;
    }
    .inspection-table th:first-child {
      text-align: left;
      min-width: 160px;
      max-width: 160px;
      position: sticky;
      left: 0;
      z-index: 10;
    }
    .day-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .day-name {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .day-date {
      font-size: 9px;
      font-weight: 500;
      opacity: 0.9;
    }
    .inspection-table td {
      padding: 8px 6px;
      border: 1px solid #cbd5e1;
      text-align: center;
      font-size: 9px;
      vertical-align: middle;
      min-height: 40px;
    }
    .inspection-table td:first-child {
      text-align: left;
      font-weight: 600;
      background: #f1f5f9;
      color: #1e293b;
      font-size: 10px;
      position: sticky;
      left: 0;
      z-index: 5;
      border-right: 2px solid #64748b;
      padding-left: 10px;
    }
    .inspection-table tbody tr:nth-child(even) td:first-child {
      background: #e2e8f0;
    }
    .inspection-table tbody tr:hover td {
      background: #fef3c7;
    }
    .inspection-table tbody tr:hover td:first-child {
      background: #fde68a;
    }
    .table-status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .table-notes {
      font-size: 7px;
      color: #475569;
      margin-top: 4px;
      font-style: italic;
      line-height: 1.2;
      max-width: 120px;
      word-wrap: break-word;
    }
    .empty-cell {
      background: #f8fafc;
      color: #94a3b8;
      font-style: italic;
    }
    @media print {
      body {
        padding: 20px;
      }
      .check-row {
        page-break-inside: avoid;
      }
      .section {
        page-break-inside: avoid;
      }
      .inspection-table {
        font-size: 9px;
      }
      .inspection-table th {
        padding: 8px 6px;
      }
      .inspection-table td {
        padding: 6px 5px;
      }
    }
    @page {
      size: A4 landscape;
      margin: 10mm;
    }
  </style>
`;

export const generatePlantInspectionPDF = async (
  inspection: PlantInspection,
  companyName: string,
  projectName?: string,
  customFilename?: string
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
    const filename = customFilename || `plant-inspection-${inspection.plantNumber}-${inspection.date}`;
    
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.document) {
        const link = window.document.createElement('a');
        link.href = uri;
        link.download = `${filename}.pdf`;
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
  projectName?: string,
  customFilename?: string
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
    const filename = customFilename || `quickhitch-inspection-${inspection.quickHitchModel}-${inspection.date}`;
    
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.document) {
        const link = window.document.createElement('a');
        link.href = uri;
        link.download = `${filename}.pdf`;
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
  projectName?: string,
  customFilename?: string
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
    const filename = customFilename || `vehicle-inspection-${inspection.vehicleRegistration}-${inspection.date}`;
    
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.document) {
        const link = window.document.createElement('a');
        link.href = uri;
        link.download = `${filename}.pdf`;
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
  projectName?: string,
  customFilename?: string
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
    const filename = customFilename || `bucket-change-${inspection.bucketType}-${inspection.date}`;
    
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.document) {
        const link = window.document.createElement('a');
        link.href = uri;
        link.download = `${filename}.pdf`;
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

export const generateWeeklyInspectionPDF = async (
  weeklyData: any,
  inspectionType: 'plant' | 'vehicle' | 'quickhitch' | 'bucketchange',
  companyName: string,
  employeeName: string,
  projectName?: string
): Promise<void> => {
  try {
    const getItemName = (itemId: string) => {
      let allItems: any[] = [];
      if (inspectionType === 'plant') {
        allItems = [...PLANT_INSPECTION_ITEMS, ...PLANT_INSPECTION_SECONDARY_ITEMS];
      } else if (inspectionType === 'quickhitch') {
        allItems = QUICK_HITCH_ITEMS;
      } else if (inspectionType === 'vehicle') {
        allItems = VEHICLE_INSPECTION_ITEMS;
      } else if (inspectionType === 'bucketchange') {
        allItems = BUCKET_CHANGE_ITEMS;
      }
      const item = allItems.find(i => i.id === itemId);
      return item?.name || itemId;
    };

    const getDayName = (day: string) => {
      const names: Record<string, string> = {
        'M': 'Monday',
        'T': 'Tuesday',
        'W': 'Wednesday',
        'Th': 'Thursday',
        'F': 'Friday',
        'S': 'Saturday',
        'Su': 'Sunday',
      };
      return names[day] || day;
    };

    const getInspectionTitle = () => {
      switch (inspectionType) {
        case 'plant': return 'Plant Weekly Inspection Report';
        case 'vehicle': return 'Vehicle Weekly Inspection Report';
        case 'quickhitch': return 'Quick Hitch Weekly Inspection Report';
        case 'bucketchange': return 'Bucket Change Weekly Report';
        default: return 'Weekly Inspection Report';
      }
    };

    const getEquipmentInfo = () => {
      if (inspectionType === 'plant' && weeklyData.plantNumber) {
        return `Plant #${weeklyData.plantNumber}`;
      } else if (inspectionType === 'vehicle' && weeklyData.vehicleRegistration) {
        return `${weeklyData.vehicleRegistration} (${weeklyData.vehicleType || 'Vehicle'})`;
      } else if (inspectionType === 'quickhitch' && weeklyData.quickHitchModel) {
        return `${weeklyData.quickHitchModel} - ${weeklyData.excavatorDetails || ''}`;
      } else if (inspectionType === 'bucketchange' && weeklyData.bucketType) {
        return weeklyData.bucketType;
      }
      return 'N/A';
    };

    const completedDays = weeklyData.days.filter((d: any) => d.completed);

    const allCheckItems: Set<string> = new Set();
    completedDays.forEach((day: any) => {
      day.checks.forEach((check: any) => {
        allCheckItems.add(check.itemId);
      });
    });

    const checkItemsArray = Array.from(allCheckItems);

    const tableHeaderHTML = `
      <tr>
        <th style="width: 180px;">Inspection Item</th>
        ${completedDays.map((day: any) => `
          <th style="min-width: 130px; max-width: 180px;">
            <div class="day-header">
              <div class="day-name">${getDayName(day.day)}</div>
              <div class="day-date">${day.date}</div>
            </div>
          </th>
        `).join('')}
      </tr>
    `;

    const tableRowsHTML = checkItemsArray.map(itemId => {
      const rowCells = completedDays.map((day: any) => {
        const check = day.checks.find((c: any) => c.itemId === itemId);
        if (!check) {
          return '<td class="empty-cell">—</td>';
        }
        const statusColor = getStatusColor(check.status);
        const statusBg = statusColor === '#10b981' ? '#d1fae5' : statusColor === '#ef4444' ? '#fee2e2' : '#fef3c7';
        return `
          <td>
            <div class="table-status" style="background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusColor};">
              ${getStatusText(check.status)}
            </div>
            ${check.notes ? `<div class="table-notes">📝 ${check.notes}</div>` : ''}
          </td>
        `;
      }).join('');

      return `
        <tr>
          <td>${getItemName(itemId)}</td>
          ${rowCells}
        </tr>
      `;
    }).join('');

    const inspectionTableHTML = `
      <table class="inspection-table">
        <thead>
          ${tableHeaderHTML}
        </thead>
        <tbody>
          ${tableRowsHTML}
        </tbody>
      </table>
    `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${getInspectionTitle()}</title>
          ${generateHTMLStyles()}
        </head>
        <body>
          <div class="header">
            <div class="header-title">${getInspectionTitle()}</div>
            <div class="header-meta">
              <div>📅 Week of ${weeklyData.weekStartDate}</div>
              <div>👤 ${employeeName}</div>
              <div>📊 ${completedDays.length} day${completedDays.length !== 1 ? 's' : ''}</div>
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
              <span class="info-label">Equipment:</span>
              <span class="info-value">${getEquipmentInfo()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Week Period:</span>
              <span class="info-value">${weeklyData.weekStartDate}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">📊 Daily Inspection Summary</div>
            <div style="overflow-x: auto; margin-top: 12px;">
              ${inspectionTableHTML}
            </div>
          </div>

          <div class="footer">
            Generated by CheckMate Safety • ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;

    const fileName = `weekly-${inspectionType}-${weeklyData.weekStartDate}.pdf`;
    const { uri } = await Print.printToFileAsync({ html });
    
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.document) {
        const link = window.document.createElement('a');
        link.href = uri;
        link.download = fileName;
        link.click();
      }
    } else {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
        });
      } else {
        Alert.alert('Success', 'Weekly report PDF generated successfully');
      }
    }
  } catch (error) {
    console.error('Error generating weekly PDF:', error);
    Alert.alert('Error', 'Failed to generate weekly PDF. Please try again.');
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

export const generateGreasingRecordsPDF = async (
  records: GreasingRecord[],
  companyName: string
): Promise<void> => {
  try {
    const groupedByEquipment = records.reduce((acc, record) => {
      if (!acc[record.equipmentName]) {
        acc[record.equipmentName] = [];
      }
      acc[record.equipmentName].push(record);
      return acc;
    }, {} as Record<string, GreasingRecord[]>);

    const equipmentSections = Object.entries(groupedByEquipment)
      .map(([equipmentName, equipmentRecords]) => {
        const sortedRecords = equipmentRecords.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const recordsHTML = sortedRecords
          .map(
            (record) => `
          <tr>
            <td>${new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            <td>${record.time}</td>
            <td>${record.employeeName}</td>
            <td>${record.notes || '-'}</td>
          </tr>
        `
          )
          .join('');

        return `
        <div class="section">
          <div class="section-title">📦 ${equipmentName}</div>
          <table class="greasing-table">
            <thead>
              <tr>
                <th style="width: 120px;">Date</th>
                <th style="width: 80px;">Time</th>
                <th style="width: 140px;">Employee</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${recordsHTML}
            </tbody>
          </table>
        </div>
      `;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Plant Greasing Records</title>
          ${generateHTMLStyles()}
          <style>
            .greasing-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              background: #ffffff;
              border: 1px solid #cbd5e1;
            }
            .greasing-table th {
              background: #06b6d4;
              color: white;
              padding: 10px 8px;
              text-align: left;
              font-size: 11px;
              font-weight: 700;
              border: 1px solid #0891b2;
            }
            .greasing-table td {
              padding: 10px 8px;
              border: 1px solid #cbd5e1;
              font-size: 11px;
            }
            .greasing-table tbody tr:nth-child(even) {
              background: #f8fafc;
            }
            .greasing-table tbody tr:hover {
              background: #e0f2fe;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-title">Plant Greasing Records</div>
            <div class="header-meta">
              <div>📅 Generated on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              <div>📊 ${records.length} record${records.length !== 1 ? 's' : ''}</div>
            </div>
          </div>

          <div class="info-card">
            <div class="info-row">
              <span class="info-label">Company:</span>
              <span class="info-value">${companyName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Records:</span>
              <span class="info-value">${records.length}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Equipment Count:</span>
              <span class="info-value">${Object.keys(groupedByEquipment).length}</span>
            </div>
          </div>

          ${equipmentSections}

          <div class="footer">
            Generated by CheckMate Safety • ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    const filename = `plant-greasing-records-${new Date().toISOString().split('T')[0]}.pdf`;
    
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
    console.error('Error generating greasing records PDF:', error);
    Alert.alert('Error', 'Failed to generate PDF. Please try again.');
  }
};

export const generateAirTestingInspectionPDF = async (
  inspection: AirTestingInspection,
  companyName: string,
  projectName?: string
): Promise<void> => {
  try {
    const imagesHTML = (() => {
      const images = [inspection.startImage, inspection.finishImage, ...(inspection.additionalImages || [])].filter(Boolean) as string[];
      if (images.length === 0) return '';
      
      return `
        <div class="section">
          <div class="section-title">Photos (${images.length})</div>
          <div class="images-grid">
            ${images.map((img, index) => {
              const label = index === 0 ? 'Start Image' : index === 1 && inspection.finishImage ? 'Finish Image' : `Photo ${index + 1}`;
              return `
                <div class="image-container">
                  <div class="image-label" style="padding: 8px; background: #f1f5f9; font-size: 11px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;">${label}</div>
                  <img src="${img}" alt="${label}" style="width: 100%; height: auto; display: block; object-fit: contain; max-height: 300px;" />
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    })();

    const getResultColor = (result?: 'pass' | 'fail') => {
      if (!result) return '#94a3b8';
      return result === 'pass' ? '#10b981' : '#ef4444';
    };

    const getResultBg = (result?: 'pass' | 'fail') => {
      if (!result) return '#f1f5f9';
      return result === 'pass' ? '#dcfce7' : '#fee2e2';
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Air Testing Report</title>
          ${generateHTMLStyles()}
        </head>
        <body>
          <div class="header">
            <div class="header-title">Air Testing Inspection Report</div>
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
              <span class="info-label">Date:</span>
              <span class="info-value">${inspection.date}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Time:</span>
              <span class="info-value">${inspection.time}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Test Details</div>
            <div class="info-card">
              ${inspection.section ? `
                <div class="info-row">
                  <span class="info-label">Section:</span>
                  <span class="info-value">${inspection.section}</span>
                </div>
              ` : ''}
              <div class="info-row">
                <span class="info-label">Pipe Run:</span>
                <span class="info-value">${inspection.pipeRun}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Pipe Joint:</span>
                <span class="info-value">${inspection.pipeJoint}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Pipe Size:</span>
                <span class="info-value">${inspection.pipeSize}</span>
              </div>
              ${inspection.testPressure ? `
                <div class="info-row">
                  <span class="info-label">Test Pressure:</span>
                  <span class="info-value">${inspection.testPressure}</span>
                </div>
              ` : ''}
              ${inspection.testDuration ? `
                <div class="info-row">
                  <span class="info-label">Test Duration:</span>
                  <span class="info-value">${inspection.testDuration}</span>
                </div>
              ` : ''}
              ${inspection.testResult ? `
                <div class="info-row">
                  <span class="info-label">Test Result:</span>
                  <span class="severity-badge" style="background: ${getResultBg(inspection.testResult)}; color: ${getResultColor(inspection.testResult)};">
                    ${inspection.testResult.toUpperCase()}
                  </span>
                </div>
              ` : ''}
            </div>
          </div>

          ${inspection.notes ? `
            <div class="section">
              <div class="section-title">Notes</div>
              <div class="notes-text">${inspection.notes}</div>
            </div>
          ` : ''}

          ${imagesHTML}

          <div class="footer">
            Generated by CheckMate Safety • ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    const filename = `air-testing-${inspection.pipeRun}-${inspection.date}.pdf`;
    
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
    console.error('Error generating air testing PDF:', error);
    Alert.alert('Error', 'Failed to generate PDF. Please try again.');
  }
};
