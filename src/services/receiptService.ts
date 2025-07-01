import { Building, AppState } from '../types';
import receiptTemplate from '../templates/receiptTemplate.html?raw';

export class ReceiptService {
  /**
   * Generates HTML content for maintenance receipt
   */
  static generateReceiptHtml(building: Building, state: AppState, maintenanceRecordId?: string): string {
    const maintenanceFee = building.maintenanceFee * building.elevatorCount;
    
    // Bu bakımla ilişkili parçaları al (eğer maintenanceRecordId varsa)
    let partsForThisReceipt: any[] = [];
    let totalPartsCost = 0;
    
    if (maintenanceRecordId) {
      // Bu bakım fişiyle ilişkili parçaları al
      const relatedParts = state.partInstallations
        .filter(installation => installation.relatedMaintenanceId === maintenanceRecordId)
        .map(installation => {
          const part = state.parts.find(p => p.id === installation.partId);
          return part ? {
            name: part.name,
            quantity: installation.quantity,
            unitPrice: part.price,
            totalPrice: part.price * installation.quantity,
          } : null;
        })
        .filter(Boolean);

      const relatedManualParts = state.manualPartInstallations
        .filter(installation => installation.relatedMaintenanceId === maintenanceRecordId)
        .map(installation => ({
          name: installation.partName,
          quantity: installation.quantity,
          unitPrice: installation.unitPrice,
          totalPrice: installation.totalPrice,
        }));

      partsForThisReceipt = [...relatedParts, ...relatedManualParts];
      totalPartsCost = partsForThisReceipt.reduce((sum, part) => sum + (part?.totalPrice || 0), 0);
    } else {
      // Eski yöntem - ödenmemiş parçalar
      const unpaidParts = state.partInstallations
        .filter(installation => installation.buildingId === building.id && !installation.isPaid && !installation.relatedMaintenanceId)
        .map(installation => {
          const part = state.parts.find(p => p.id === installation.partId);
          return part ? {
            name: part.name,
            quantity: installation.quantity,
            unitPrice: part.price,
            totalPrice: part.price * installation.quantity,
          } : null;
        })
        .filter(Boolean);

      const unpaidManualParts = state.manualPartInstallations
        .filter(installation => installation.buildingId === building.id && !installation.isPaid && !installation.relatedMaintenanceId)
        .map(installation => ({
          name: installation.partName,
          quantity: installation.quantity,
          unitPrice: installation.unitPrice,
          totalPrice: installation.totalPrice,
        }));

      partsForThisReceipt = [...unpaidParts, ...unpaidManualParts];
      totalPartsCost = partsForThisReceipt.reduce((sum, part) => sum + (part?.totalPrice || 0), 0);
    }
    
    // Önceki borcu hesapla
    const previousDebt = building.debt - maintenanceFee - totalPartsCost;

    // Prepare template variables
    const companyAddress = state.settings?.companyAddress ? 
      `${state.settings.companyAddress.mahalle} ${state.settings.companyAddress.sokak} ${state.settings.companyAddress.binaNo}, ${state.settings.companyAddress.ilce}/${state.settings.companyAddress.il}` : 
      'Adres belirtilmemiş';

    const buildingAddress = building.address ? 
      `${building.address.mahalle} ${building.address.sokak} ${building.address.binaNo}, ${building.address.ilce}/${building.address.il}` : 
      'Adres belirtilmemiş';

    // Generate parts section HTML
    const partsSection = partsForThisReceipt.length > 0 ? `
      <div class="parts-section">
        <h3>Bu Bakımda Takılan Parçalar</h3>
        <table class="parts-table">
          <thead>
            <tr>
              <th>Parça Adı</th>
              <th>Miktar</th>
              <th>Birim Fiyat</th>
              <th>Toplam</th>
            </tr>
          </thead>
          <tbody>
            ${partsForThisReceipt.map(part => `
              <tr>
                <td>${part?.name}</td>
                <td>${part?.quantity}</td>
                <td>${part?.unitPrice?.toLocaleString('tr-TR')} ₺</td>
                <td>${part?.totalPrice?.toLocaleString('tr-TR')} ₺</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '';

    // Parça maliyeti satırı
    const partsCostRow = totalPartsCost > 0 ? `
      <div class="calc-row">
        <span>Bu Bakımda Takılan Parça Bedeli:</span>
        <span>${totalPartsCost.toLocaleString('tr-TR')} ₺</span>
      </div>
    ` : '';

    // Generate notes section
    const note = building.maintenanceReceiptNote || state.settings?.defaultMaintenanceNote;
    const notesSection = note ? `
      <div class="notes-section">
        <h3>Notlar</h3>
        <p>${note}</p>
      </div>
    ` : '';

    // Generate certificates section
    const certificates = state.settings?.certificates || [];
    const certificatesHtml = certificates.length > 0 ? 
      certificates.map(cert => `<img src="${cert}" alt="Sertifika" class="certificate" />`).join('') : '';

    // Generate watermark
    const watermark = state.settings?.logo ? `
      <div class="watermark" style="background-image: url(${state.settings.logo}); background-size: contain; background-repeat: no-repeat; background-position: center;">
        ${state.settings?.companyName || ''}
      </div>
    ` : `<div class="watermark">${state.settings?.companyName || 'BAKIM FİŞİ'}</div>`;

    // Replace placeholders in template
    return receiptTemplate
      .replace(/{{WATERMARK}}/g, watermark)
      .replace(/{{LOGO}}/g, state.settings?.logo ? `<img src="${state.settings.logo}" alt="Logo" class="logo">` : '')
      .replace(/{{COMPANY_NAME}}/g, state.settings?.companyName || '')
      .replace(/{{COMPANY_SLOGAN}}/g, state.settings?.companySlogan || '')
      .replace(/{{COMPANY_ADDRESS}}/g, companyAddress)
      .replace(/{{COMPANY_PHONE}}/g, state.settings?.companyPhone || '')
      .replace(/{{CERTIFICATIONS}}/g, 'TSE • CE • ISO')
      .replace(/{{BUILDING_NAME}}/g, building.name)
      .replace(/{{BUILDING_ADDRESS}}/g, buildingAddress)
      .replace(/{{BUILDING_RESPONSIBLE}}/g, building.buildingResponsible || 'Belirtilmemiş')
      .replace(/{{CONTACT_PHONE}}/g, building.contactInfo || '')
      .replace(/{{ELEVATOR_COUNT}}/g, building.elevatorCount.toString())
      .replace(/{{MAINTENANCE_DATE}}/g, building.lastMaintenanceDate || new Date().toLocaleDateString('tr-TR'))
      .replace(/{{MAINTENANCE_TIME}}/g, building.lastMaintenanceTime || new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }))
      .replace(/{{TECHNICIAN_NAME}}/g, state.currentUser?.name || 'Teknisyen')
      .replace(/{{MAINTENANCE_FEE_PER_ELEVATOR}}/g, building.maintenanceFee.toLocaleString('tr-TR'))
      .replace(/{{THIS_MAINTENANCE_FEE}}/g, maintenanceFee.toLocaleString('tr-TR'))
      .replace(/{{PREVIOUS_DEBT}}/g, previousDebt.toLocaleString('tr-TR'))
      .replace(/{{NEW_TOTAL_DEBT}}/g, building.debt.toLocaleString('tr-TR'))
      .replace(/{{PARTS_COST_ROW}}/g, partsCostRow)
      .replace(/{{PARTS_SECTION}}/g, partsSection)
      .replace(/{{NOTES_SECTION}}/g, notesSection)
      .replace(/{{CERTIFICATES_IMAGES}}/g, certificatesHtml);
  }

  /**
   * Archives a receipt
   */
  static archiveReceipt(building: Building, htmlContent: string, relatedRecordId?: string) {
    return {
      id: Date.now().toString(),
      buildingId: building.id,
      htmlContent,
      createdDate: new Date().toISOString(),
      createdBy: 'System', // This should be the current user
      maintenanceDate: building.lastMaintenanceDate || new Date().toISOString().split('T')[0],
      buildingName: building.name,
      relatedRecordId,
    };
  }
}