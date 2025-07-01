import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, Building, Part, PartInstallation, ManualPartInstallation, Update, Income, User, DebtRecord, MaintenanceHistory, MaintenanceRecord, Printer, SMSTemplate, Proposal, Payment, QRCodeData, AutoSaveData, ArchivedReceipt, AppSettings } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Initial state
const initialState: AppState = {
  buildings: [],
  parts: [],
  partInstallations: [],
  manualPartInstallations: [],
  updates: [],
  incomes: [],
  currentUser: null,
  users: [
    { id: '1', name: 'Admin User' },
    { id: '2', name: 'Teknisyen 1' },
    { id: '3', name: 'Teknisyen 2' }
  ],
  notifications: [],
  sidebarOpen: true,
  settings: {
    appTitle: 'Asansör Bakım Takip',
    logo: null,
    companyName: 'TKNLİFT',
    companyPhone: '0555 123 45 67',
    companyAddress: {
      mahalle: 'Merkez Mahalle',
      sokak: 'Ana Cadde',
      il: 'İstanbul',
      ilce: 'Kadıköy',
      binaNo: '123'
    },
    companySlogan: 'Güvenli Yükselişin Adresi',
    certificates: [],
    receiptTemplate: '',
    defaultMaintenanceNote: 'Bu bakım sırasında asansörün genel durumu kontrol edilmiş, gerekli ayarlamalar yapılmıştır.',
    installationProposalTemplate: '',
    maintenanceProposalTemplate: '',
    revisionProposalTemplate: '',
    faultReportTemplate: `
      <div class="fault-report">
        <div class="header">
          <div class="logo-section">
            {{LOGO}}
          </div>
          <div class="company-details">
            <div class="company-name">{{COMPANY_NAME}}</div>
            <div class="certifications">{{COMPANY_SLOGAN}}</div>
          </div>
          <div class="address-info">
            <div class="address-text">{{COMPANY_ADDRESS}}</div>
            <div class="phone-text">Tel: {{COMPANY_PHONE}}</div>
          </div>
        </div>
        
        <div class="report-title">
          <h1>ARIZA BİLDİRİM FORMU</h1>
        </div>
        
        <div class="building-info">
          <h2>{{BUILDING_NAME}}</h2>
          <p>{{BUILDING_ADDRESS}}</p>
        </div>
        
        <div class="footer">
          <p>Acil durumlar için 112'yi arayınız</p>
          <p>{{COMPANY_PHONE}} numaralı hattımızdan bize ulaşabilirsiniz</p>
        </div>
      </div>
    `,
    autoSaveInterval: 60
  },
  lastMaintenanceReset: undefined,
  faultReports: [],
  maintenanceReceipts: [],
  maintenanceHistory: [],
  maintenanceRecords: [],
  printers: [],
  unreadNotifications: 0,
  smsTemplates: [],
  proposals: [],
  payments: [],
  debtRecords: [],
  proposalTemplates: [],
  qrCodes: [],
  systemNotifications: [],
  autoSaveData: [],
  hasUnsavedChanges: false,
  isAutoSaving: false,
  lastAutoSave: undefined,
  showReceiptModal: false,
  receiptModalHtml: null,
  archivedReceipts: [],
  showPrinterSelectionModal: false,
  printerSelectionContent: null
};

// Action types
type Action =
  | { type: 'ADD_BUILDING'; payload: Omit<Building, 'id'> }
  | { type: 'UPDATE_BUILDING'; payload: Building }
  | { type: 'DELETE_BUILDING'; payload: string }
  | { type: 'ADD_PART'; payload: Omit<Part, 'id'> }
  | { type: 'UPDATE_PART'; payload: Part }
  | { type: 'DELETE_PART'; payload: string }
  | { type: 'INCREASE_PRICES'; payload: number }
  | { type: 'INSTALL_PART'; payload: { buildingId: string; partId: string; quantity: number; installDate: string } }
  | { type: 'INSTALL_MANUAL_PART'; payload: { buildingId: string; partName: string; quantity: number; unitPrice: number; totalPrice: number; installDate: string } }
  | { type: 'MARK_PART_AS_PAID'; payload: { installationId: string; isManual: boolean } }
  | { type: 'TOGGLE_MAINTENANCE'; payload: { buildingId: string; showReceipt: boolean } }
  | { type: 'REVERT_MAINTENANCE'; payload: string }
  | { type: 'RESET_ALL_MAINTENANCE' }
  | { type: 'ADD_UPDATE'; payload: Omit<Update, 'id'> }
  | { type: 'ADD_INCOME'; payload: Omit<Income, 'id'> }
  | { type: 'SET_USER'; payload: string }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'ADD_FAULT_REPORT'; payload: { buildingId: string; reporterName: string; reporterSurname: string; reporterPhone: string; apartmentNo: string; description: string } }
  | { type: 'RESOLVE_FAULT_REPORT'; payload: string }
  | { type: 'REPORT_FAULT'; payload: { buildingId: string; faultData: { description: string; severity: 'low' | 'medium' | 'high'; reportedBy: string } } }
  | { type: 'ADD_MAINTENANCE_RECORD'; payload: { buildingId: string; performedBy: string; maintenanceDate: string; maintenanceTime: string; elevatorCount: number; totalFee: number; notes?: string } }
  | { type: 'ADD_PRINTER'; payload: Omit<Printer, 'id'> }
  | { type: 'UPDATE_PRINTER'; payload: Printer }
  | { type: 'DELETE_PRINTER'; payload: string }
  | { type: 'ADD_SMS_TEMPLATE'; payload: Omit<SMSTemplate, 'id'> }
  | { type: 'UPDATE_SMS_TEMPLATE'; payload: SMSTemplate }
  | { type: 'DELETE_SMS_TEMPLATE'; payload: string }
  | { type: 'SEND_BULK_SMS'; payload: { templateId: string; buildingIds: string[] } }
  | { type: 'SEND_WHATSAPP'; payload: { templateId: string; buildingIds: string[] } }
  | { type: 'ADD_PROPOSAL'; payload: any }
  | { type: 'UPDATE_PROPOSAL'; payload: any }
  | { type: 'DELETE_PROPOSAL'; payload: string }
  | { type: 'ADD_PAYMENT'; payload: any }
  | { type: 'ADD_QR_CODE_DATA'; payload: QRCodeData }
  | { type: 'UPDATE_AUTO_SAVE_DATA'; payload: AutoSaveData }
  | { type: 'SHOW_RECEIPT_MODAL'; payload: string }
  | { type: 'CLOSE_RECEIPT_MODAL' }
  | { type: 'SHOW_PRINTER_SELECTION'; payload: string }
  | { type: 'CLOSE_PRINTER_SELECTION' };

// Reducer
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_BUILDING': {
      const newBuilding: Building = {
        ...action.payload,
        id: uuidv4(),
      };
      
      const newUpdate: Update = {
        id: uuidv4(),
        action: 'Bina Eklendi',
        user: state.currentUser?.name || 'Bilinmeyen',
        timestamp: new Date().toISOString(),
        details: `${newBuilding.name} binası sisteme eklendi.`,
      };

      return {
        ...state,
        buildings: [...state.buildings, newBuilding],
        updates: [newUpdate, ...state.updates].slice(0, 50),
      };
    }
    
    case 'UPDATE_BUILDING': {
      const oldBuilding = state.buildings.find(b => b.id === action.payload.id);
      
      const newUpdate: Update = {
        id: uuidv4(),
        action: 'Bina Güncellendi',
        user: state.currentUser?.name || 'Bilinmeyen',
        timestamp: new Date().toISOString(),
        details: `${action.payload.name} binası güncellendi.`,
      };

      return {
        ...state,
        buildings: state.buildings.map(building =>
          building.id === action.payload.id ? action.payload : building
        ),
        updates: [newUpdate, ...state.updates].slice(0, 50),
      };
    }
    
    case 'DELETE_BUILDING': {
      const building = state.buildings.find(b => b.id === action.payload);
      
      const newUpdate: Update = {
        id: uuidv4(),
        action: 'Bina Silindi',
        user: state.currentUser?.name || 'Bilinmeyen',
        timestamp: new Date().toISOString(),
        details: `${building?.name} binası sistemden silindi.`,
      };

      return {
        ...state,
        buildings: state.buildings.filter(building => building.id !== action.payload),
        updates: [newUpdate, ...state.updates].slice(0, 50),
      };
    }
    
    case 'ADD_PART': {
      const newPart: Part = {
        ...action.payload,
        id: uuidv4(),
      };
      
      const newUpdate: Update = {
        id: uuidv4(),
        action: 'Parça Eklendi',
        user: state.currentUser?.name || 'Bilinmeyen',
        timestamp: new Date().toISOString(),
        details: `${newPart.name} parçası stoğa eklendi.`,
      };

      return {
        ...state,
        parts: [...state.parts, newPart],
        updates: [newUpdate, ...state.updates].slice(0, 50),
      };
    }
    
    case 'UPDATE_PART': {
      const newUpdate: Update = {
        id: uuidv4(),
        action: 'Parça Güncellendi',
        user: state.currentUser?.name || 'Bilinmeyen',
        timestamp: new Date().toISOString(),
        details: `${action.payload.name} parçası güncellendi.`,
      };

      return {
        ...state,
        parts: state.parts.map(part =>
          part.id === action.payload.id ? action.payload : part
        ),
        updates: [newUpdate, ...state.updates].slice(0, 50),
      };
    }
    
    case 'DELETE_PART': {
      const part = state.parts.find(p => p.id === action.payload);
      
      const newUpdate: Update = {
        id: uuidv4(),
        action: 'Parça Silindi',
        user: state.currentUser?.name || 'Bilinmeyen',
        timestamp: new Date().toISOString(),
        details: `${part?.name} parçası stoktan silindi.`,
      };

      return {
        ...state,
        parts: state.parts.filter(part => part.id !== action.payload),
        updates: [newUpdate, ...state.updates].slice(0, 50),
      };
    }
    
    case 'INCREASE_PRICES': {
      const percentage = action.payload;
      
      const updatedParts = state.parts.map(part => {
        const newPrice = part.price * (1 + percentage / 100);
        // En yakın 50'nin katına yuvarla
        const roundedPrice = Math.round(newPrice / 50) * 50;
        return {
          ...part,
          price: roundedPrice
        };
      });
      
      const newUpdate: Update = {
        id: uuidv4(),
        action: 'Fiyat Artışı',
        user: state.currentUser?.name || 'Bilinmeyen',
        timestamp: new Date().toISOString(),
        details: `Tüm parça fiyatları %${percentage} artırıldı ve en yakın 50'nin katına yuvarlandı.`,
      };

      return {
        ...state,
        parts: updatedParts,
        updates: [newUpdate, ...state.updates].slice(0, 50),
      };
    }
    
    case 'INSTALL_PART': {
      const { buildingId, partId, quantity, installDate } = action.payload;
      const part = state.parts.find(p => p.id === partId);
      const building = state.buildings.find(b => b.id === buildingId);
      
      if (!part || !building || part.quantity < quantity) {
        return state;
      }
      
      const installationId = uuidv4();
      const totalCost = part.price * quantity;
      
      const newInstallation: PartInstallation = {
        id: installationId,
        buildingId,
        partId,
        quantity,
        installDate,
        installedBy: state.currentUser?.name || 'Bilinmeyen',
        isPaid: false,
      };
      
      // Parça stok güncellemesi
      const updatedParts = state.parts.map(p =>
        p.id === partId ? { ...p, quantity: p.quantity - quantity } : p
      );
      
      // Bina borç güncellemesi
      const updatedBuildings = state.buildings.map(b =>
        b.id === buildingId ? { ...b, debt: b.debt + totalCost } : b
      );
      
      // Borç kaydı ekleme
      const newDebtRecord: DebtRecord = {
        id: uuidv4(),
        buildingId,
        date: installDate,
        type: 'part',
        description: `${quantity} adet ${part.name} takıldı`,
        amount: totalCost,
        previousDebt: building.debt,
        newDebt: building.debt + totalCost,
        performedBy: state.currentUser?.name || 'Bilinmeyen',
        relatedRecordId: installationId
      };
      
      const newUpdate: Update = {
        id: uuidv4(),
        action: 'Parça Takıldı',
        user: state.currentUser?.name || 'Bilinmeyen',
        timestamp: new Date().toISOString(),
        details: `${building.name} binasına ${quantity} adet ${part.name} takıldı.`,
      };

      return {
        ...state,
        partInstallations: [...state.partInstallations, newInstallation],
        parts: updatedParts,
        buildings: updatedBuildings,
        debtRecords: [newDebtRecord, ...state.debtRecords],
        updates: [newUpdate, ...state.updates].slice(0, 50),
      };
    }
    
    case 'INSTALL_MANUAL_PART': {
      const { buildingId, partName, quantity, unitPrice, totalPrice, installDate } = action.payload;
      const building = state.buildings.find(b => b.id === buildingId);
      
      if (!building) {
        return state;
      }
      
      const installationId = uuidv4();
      
      const newInstallation: ManualPartInstallation = {
        id: installationId,
        buildingId,
        partName,
        quantity,
        unitPrice,
        totalPrice,
        installDate,
        installedBy: state.currentUser?.name || 'Bilinmeyen',
        isPaid: false,
      };
      
      // Bina borç güncellemesi
      const updatedBuildings = state.buildings.map(b =>
        b.id === buildingId ? { ...b, debt: b.debt + totalPrice } : b
      );
      
      // Borç kaydı ekleme
      const newDebtRecord: DebtRecord = {
        id: uuidv4(),
        buildingId,
        date: installDate,
        type: 'part',
        description: `${quantity} adet ${partName} takıldı (Manuel)`,
        amount: totalPrice,
        previousDebt: building.debt,
        newDebt: building.debt + totalPrice,
        performedBy: state.currentUser?.name || 'Bilinmeyen',
        relatedRecordId: installationId
      };
      
      const newUpdate: Update = {
        id: uuidv4(),
        action: 'Manuel Parça Takıldı',
        user: state.currentUser?.name || 'Bilinmeyen',
        timestamp: new Date().toISOString(),
        details: `${building.name} binasına ${quantity} adet ${partName} takıldı (Manuel).`,
      };

      return {
        ...state,
        manualPartInstallations: [...state.manualPartInstallations, newInstallation],
        buildings: updatedBuildings,
        debtRecords: [newDebtRecord, ...state.debtRecords],
        updates: [newUpdate, ...state.updates].slice(0, 50),
      };
    }
    
    case 'MARK_PART_AS_PAID': {
      const { installationId, isManual } = action.payload;
      const currentDate = new Date().toISOString();
      
      if (isManual) {
        const updatedManualInstallations = state.manualPartInstallations.map(installation =>
          installation.id === installationId
            ? { ...installation, isPaid: true, paymentDate: currentDate }
            : installation
        );
        
        return {
          ...state,
          manualPartInstallations: updatedManualInstallations,
        };
      } else {
        const updatedInstallations = state.partInstallations.map(installation =>
          installation.id === installationId
            ? { ...installation, isPaid: true, paymentDate: currentDate }
            : installation
        );
        
        return {
          ...state,
          partInstallations: updatedInstallations,
        };
      }
    }
    
    case 'TOGGLE_MAINTENANCE': {
      const { buildingId, showReceipt } = action.payload;
      const building = state.buildings.find(b => b.id === buildingId);
      
      if (!building) {
        return state;
      }
      
      const currentDate = new Date();
      const maintenanceDate = currentDate.toISOString().split('T')[0];
      const maintenanceTime = currentDate.toTimeString().split(' ')[0].slice(0, 5);
      const maintenanceFee = building.maintenanceFee * building.elevatorCount;
      
      // Eğer showReceipt true ise, bakım kaydı oluştur ve bakımı tamamlandı olarak işaretle
      if (showReceipt) {
        const recordId = uuidv4();
        
        const newMaintenanceRecord: MaintenanceRecord = {
          id: recordId,
          buildingId,
          performedBy: state.currentUser?.name || 'Bilinmeyen',
          maintenanceDate,
          maintenanceTime,
          elevatorCount: building.elevatorCount,
          totalFee: maintenanceFee, // Sadece bakım ücreti, parça fiyatları dahil değil
          status: 'completed',
          priority: 'medium'
        };
        
        const newMaintenanceHistory: MaintenanceHistory = {
          id: uuidv4(),
          buildingId,
          maintenanceDate,
          maintenanceTime,
          performedBy: state.currentUser?.name || 'Bilinmeyen',
          maintenanceFee,
          relatedRecordId: recordId
        };
        
        // Borç kaydı ekleme
        const newDebtRecord: DebtRecord = {
          id: uuidv4(),
          buildingId,
          date: maintenanceDate,
          type: 'maintenance',
          description: `Bakım ücreti (${building.elevatorCount} asansör)`,
          amount: maintenanceFee,
          previousDebt: building.debt,
          newDebt: building.debt + maintenanceFee,
          performedBy: state.currentUser?.name || 'Bilinmeyen',
          relatedRecordId: recordId
        };
        
        // Bina güncelleme - bakım yapıldı olarak işaretle
        const updatedBuildings = state.buildings.map(b =>
          b.id === buildingId
            ? {
                ...b,
                isMaintained: true,
                lastMaintenanceDate: maintenanceDate,
                lastMaintenanceTime: maintenanceTime,
                debt: b.debt + maintenanceFee,
                isDefective: false // Bakım yapıldığında arıza durumunu temizle
              }
            : b
        );
        
        // Fişi arşivle
        const receiptHtml = generateReceiptHtml(building, state.settings, state);
        const archivedReceipt: ArchivedReceipt = {
          id: uuidv4(),
          buildingId,
          htmlContent: receiptHtml,
          createdDate: new Date().toISOString(),
          createdBy: state.currentUser?.name || 'Bilinmeyen',
          maintenanceDate,
          buildingName: building.name,
          relatedRecordId: recordId
        };
        
        const newUpdate: Update = {
          id: uuidv4(),
          action: 'Bakım Tamamlandı',
          user: state.currentUser?.name || 'Bilinmeyen',
          timestamp: new Date().toISOString(),
          details: `${building.name} binasının bakımı tamamlandı ve fiş oluşturuldu.`,
        };
        
        return {
          ...state,
          buildings: updatedBuildings,
          maintenanceRecords: [...state.maintenanceRecords, newMaintenanceRecord],
          maintenanceHistory: [...state.maintenanceHistory, newMaintenanceHistory],
          debtRecords: [newDebtRecord, ...state.debtRecords],
          archivedReceipts: [...state.archivedReceipts, archivedReceipt],
          updates: [newUpdate, ...state.updates].slice(0, 50),
          showReceiptModal: true,
          receiptModalHtml: receiptHtml
        };
      } else {
        // Sadece bakım durumunu değiştir, fiş oluşturma
        const updatedBuildings = state.buildings.map(building =>
          building.id === buildingId
            ? {
                ...building,
                isMaintained: !building.isMaintained,
                lastMaintenanceDate: !building.isMaintained ? maintenanceDate : building.lastMaintenanceDate,
                lastMaintenanceTime: !building.isMaintained ? maintenanceTime : building.lastMaintenanceTime,
                isDefective: false // Bakım yapıldığında arıza durumunu temizle
              }
            : building
        );
        
        const newUpdate: Update = {
          id: uuidv4(),
          action: building.isMaintained ? 'Bakım Geri Alındı' : 'Bakım İşaretlendi',
          user: state.currentUser?.name || 'Bilinmeyen',
          timestamp: new Date().toISOString(),
          details: `${building.name} binası ${building.isMaintained ? 'bakım geri alındı' : 'bakım yapıldı olarak işaretlendi'}.`,
        };

        return {
          ...state,
          buildings: updatedBuildings,
          updates: [newUpdate, ...state.updates].slice(0, 50),
        };
      }
    }
    
    case 'REVERT_MAINTENANCE': {
      const buildingId = action.payload;
      const building = state.buildings.find(b => b.id === buildingId);
      
      if (!building || !building.isMaintained) {
        return state;
      }
      
      // Son bakım kaydını bul
      const lastMaintenanceRecord = state.maintenanceRecords
        .filter(record => record.buildingId === buildingId)
        .sort((a, b) => new Date(b.maintenanceDate).getTime() - new Date(a.maintenanceDate).getTime())[0];
      
      if (lastMaintenanceRecord) {
        // Bakım ücretini borçtan düş
        const maintenanceFee = lastMaintenanceRecord.totalFee;
        
        // Bina güncelleme
        const updatedBuildings = state.buildings.map(b =>
          b.id === buildingId
            ? {
                ...b,
                isMaintained: false,
                lastMaintenanceDate: undefined,
                lastMaintenanceTime: undefined,
                debt: Math.max(0, b.debt - maintenanceFee)
              }
            : b
        );
        
        // İlgili kayıtları sil
        const updatedMaintenanceRecords = state.maintenanceRecords.filter(
          record => record.id !== lastMaintenanceRecord.id
        );
        
        const updatedMaintenanceHistory = state.maintenanceHistory.filter(
          history => history.relatedRecordId !== lastMaintenanceRecord.id
        );
        
        const updatedDebtRecords = state.debtRecords.filter(
          record => record.relatedRecordId !== lastMaintenanceRecord.id
        );
        
        const updatedArchivedReceipts = state.archivedReceipts.filter(
          receipt => receipt.relatedRecordId !== lastMaintenanceRecord.id
        );
        
        const newUpdate: Update = {
          id: uuidv4(),
          action: 'Bakım Geri Alındı',
          user: state.currentUser?.name || 'Bilinmeyen',
          timestamp: new Date().toISOString(),
          details: `${building.name} binasının bakımı geri alındı.`,
        };
        
        return {
          ...state,
          buildings: updatedBuildings,
          maintenanceRecords: updatedMaintenanceRecords,
          maintenanceHistory: updatedMaintenanceHistory,
          debtRecords: updatedDebtRecords,
          archivedReceipts: updatedArchivedReceipts,
          updates: [newUpdate, ...state.updates].slice(0, 50),
        };
      }
      
      return state;
    }
    
    case 'RESET_ALL_MAINTENANCE': {
      const updatedBuildings = state.buildings.map(building => ({
        ...building,
        isMaintained: false,
        lastMaintenanceDate: undefined,
        lastMaintenanceTime: undefined,
      }));
      
      const newUpdate: Update = {
        id: uuidv4(),
        action: 'Tüm Bakımlar Sıfırlandı',
        user: state.currentUser?.name || 'Bilinmeyen',
        timestamp: new Date().toISOString(),
        details: 'Tüm binaların bakım durumu sıfırlandı.',
      };

      return {
        ...state,
        buildings: updatedBuildings,
        lastMaintenanceReset: new Date().toISOString(),
        updates: [newUpdate, ...state.updates].slice(0, 50),
      };
    }
    
    case 'ADD_UPDATE':
      return {
        ...state,
        updates: [{ ...action.payload, id: uuidv4() }, ...state.updates].slice(0, 50),
      };
    
    case 'ADD_INCOME': {
      const newIncome: Income = {
        ...action.payload,
        id: uuidv4(),
      };
      
      const newUpdate: Update = {
        id: uuidv4(),
        action: 'Gelir Eklendi',
        user: state.currentUser?.name || 'Bilinmeyen',
        timestamp: new Date().toISOString(),
        details: `${newIncome.amount} ₺ gelir kaydedildi.`,
      };

      return {
        ...state,
        incomes: [...state.incomes, newIncome],
        updates: [newUpdate, ...state.updates].slice(0, 50),
      };
    }
    
    case 'SET_USER': {
      const user = state.users.find(u => u.name === action.payload) || 
                   { id: uuidv4(), name: action.payload };
      
      if (!state.users.find(u => u.name === action.payload)) {
        return {
          ...state,
          currentUser: user,
          users: [...state.users, user],
        };
      }
      
      return {
        ...state,
        currentUser: user,
      };
    }
    
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload),
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications].slice(0, 10),
        unreadNotifications: state.unreadNotifications + 1,
      };
    
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        unreadNotifications: 0,
      };
    
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen,
      };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case 'ADD_FAULT_REPORT': {
      const { buildingId, reporterName, reporterSurname, reporterPhone, apartmentNo, description } = action.payload;
      
      const newFaultReport = {
        id: uuidv4(),
        buildingId,
        reporterName,
        reporterSurname,
        reporterPhone,
        apartmentNo,
        description,
        timestamp: new Date().toISOString(),
        status: 'pending' as const
      };
      
      const newUpdate: Update = {
        id: uuidv4(),
        action: 'Arıza Bildirimi Alındı',
        user: 'Sistem',
        timestamp: new Date().toISOString(),
        details: `${reporterName} ${reporterSurname} tarafından arıza bildirimi yapıldı.`,
      };

      return {
        ...state,
        faultReports: [...state.faultReports, newFaultReport],
        updates: [newUpdate, ...state.updates].slice(0, 50),
        unreadNotifications: state.unreadNotifications + 1,
      };
    }

    case 'RESOLVE_FAULT_REPORT': {
      const updatedFaultReports = state.faultReports.map(report =>
        report.id === action.payload
          ? { ...report, status: 'resolved' as const }
          : report
      );
      
      const newUpdate: Update = {
        id: uuidv4(),
        action: 'Arıza Çözüldü',
        user: state.currentUser?.name || 'Bilinmeyen',
        timestamp: new Date().toISOString(),
        details: 'Arıza bildirimi çözüldü olarak işaretlendi.',
      };

      return {
        ...state,
        faultReports: updatedFaultReports,
        updates: [newUpdate, ...state.updates].slice(0, 50),
      };
    }

    case 'REPORT_FAULT': {
      const { buildingId, faultData } = action.payload;
      const building = state.buildings.find(b => b.id === buildingId);
      
      if (!building) {
        return state;
      }
      
      const updatedBuildings = state.buildings.map(b =>
        b.id === buildingId
          ? {
              ...b,
              isDefective: true,
              faultSeverity: faultData.severity,
              faultTimestamp: new Date().toISOString(),
              faultReportedBy: faultData.reportedBy
            }
          : b
      );
      
      const newUpdate: Update = {
        id: uuidv4(),
        action: 'Bina Arızalı Olarak İşaretlendi',
        user: state.currentUser?.name || 'Bilinmeyen',
        timestamp: new Date().toISOString(),
        details: `${building.name} binası arızalı olarak işaretlendi. Bildiren: ${faultData.reportedBy}`,
      };

      return {
        ...state,
        buildings: updatedBuildings,
        updates: [newUpdate, ...state.updates].slice(0, 50),
        notifications: [`${building.name} binası arızalı olarak işaretlendi!`, ...state.notifications].slice(0, 10),
        unreadNotifications: state.unreadNotifications + 1,
      };
    }

    case 'ADD_MAINTENANCE_RECORD': {
      const newRecord: MaintenanceRecord = {
        id: uuidv4(),
        ...action.payload,
        status: 'completed',
        priority: 'medium'
      };
      
      return {
        ...state,
        maintenanceRecords: [...state.maintenanceRecords, newRecord],
      };
    }

    case 'ADD_PRINTER': {
      const newPrinter: Printer = {
        ...action.payload,
        id: uuidv4(),
      };
      
      // If this is set as default, remove default from others
      let updatedPrinters = state.printers;
      if (newPrinter.isDefault) {
        updatedPrinters = state.printers.map(printer => ({
          ...printer,
          isDefault: false
        }));
      }
      
      return {
        ...state,
        printers: [...updatedPrinters, newPrinter],
      };
    }

    case 'UPDATE_PRINTER': {
      let updatedPrinters = state.printers.map(printer =>
        printer.id === action.payload.id ? action.payload : printer
      );
      
      // If this is set as default, remove default from others
      if (action.payload.isDefault) {
        updatedPrinters = updatedPrinters.map(printer =>
          printer.id !== action.payload.id ? { ...printer, isDefault: false } : printer
        );
      }
      
      return {
        ...state,
        printers: updatedPrinters,
      };
    }

    case 'DELETE_PRINTER':
      return {
        ...state,
        printers: state.printers.filter(printer => printer.id !== action.payload),
      };

    case 'ADD_SMS_TEMPLATE': {
      const newTemplate: SMSTemplate = {
        ...action.payload,
        id: uuidv4(),
      };
      
      return {
        ...state,
        smsTemplates: [...state.smsTemplates, newTemplate],
      };
    }

    case 'UPDATE_SMS_TEMPLATE':
      return {
        ...state,
        smsTemplates: state.smsTemplates.map(template =>
          template.id === action.payload.id ? action.payload : template
        ),
      };

    case 'DELETE_SMS_TEMPLATE':
      return {
        ...state,
        smsTemplates: state.smsTemplates.filter(template => template.id !== action.payload),
      };

    case 'SEND_BULK_SMS': {
      const { templateId, buildingIds } = action.payload;
      const template = state.smsTemplates.find(t => t.id === templateId);
      
      if (template) {
        const newUpdate: Update = {
          id: uuidv4(),
          action: 'Toplu SMS Gönderildi',
          user: state.currentUser?.name || 'Bilinmeyen',
          timestamp: new Date().toISOString(),
          details: `${buildingIds.length} binaya "${template.name}" şablonu ile SMS gönderildi.`,
        };

        return {
          ...state,
          updates: [newUpdate, ...state.updates].slice(0, 50),
        };
      }
      
      return state;
    }

    case 'SEND_WHATSAPP': {
      const { templateId, buildingIds } = action.payload;
      const template = state.smsTemplates.find(t => t.id === templateId);
      
      if (template) {
        // Open WhatsApp for each building
        buildingIds.forEach(buildingId => {
          const building = state.buildings.find(b => b.id === buildingId);
          if (building && building.contactInfo) {
            const phone = building.contactInfo.replace(/\D/g, '');
            const message = encodeURIComponent(template.content);
            const whatsappUrl = `https://wa.me/90${phone}?text=${message}`;
            window.open(whatsappUrl, '_blank');
          }
        });
        
        const newUpdate: Update = {
          id: uuidv4(),
          action: 'WhatsApp Mesajları Açıldı',
          user: state.currentUser?.name || 'Bilinmeyen',
          timestamp: new Date().toISOString(),
          details: `${buildingIds.length} bina için "${template.name}" şablonu ile WhatsApp pencereleri açıldı.`,
        };

        return {
          ...state,
          updates: [newUpdate, ...state.updates].slice(0, 50),
        };
      }
      
      return state;
    }

    case 'ADD_PROPOSAL': {
      const newProposal: Proposal = {
        ...action.payload,
        id: uuidv4(),
        createdDate: new Date().toISOString(),
        createdBy: state.currentUser?.name || 'Bilinmeyen',
      };
      
      return {
        ...state,
        proposals: [...state.proposals, newProposal],
      };
    }

    case 'UPDATE_PROPOSAL':
      return {
        ...state,
        proposals: state.proposals.map(proposal =>
          proposal.id === action.payload.id ? action.payload : proposal
        ),
      };

    case 'DELETE_PROPOSAL':
      return {
        ...state,
        proposals: state.proposals.filter(proposal => proposal.id !== action.payload),
      };

    case 'ADD_PAYMENT': {
      const { buildingId, amount, date, receivedBy, notes } = action.payload;
      const building = state.buildings.find(b => b.id === buildingId);
      
      if (!building) {
        return state;
      }
      
      const newPayment: Payment = {
        id: uuidv4(),
        buildingId,
        amount,
        date,
        receivedBy,
        notes
      };
      
      const newIncome: Income = {
        id: uuidv4(),
        buildingId,
        amount,
        date,
        receivedBy
      };
      
      // Binadan borç düş
      const updatedBuildings = state.buildings.map(b =>
        b.id === buildingId
          ? { ...b, debt: Math.max(0, b.debt - amount) }
          : b
      );
      
      // Borç kaydı ekleme
      const newDebtRecord: DebtRecord = {
        id: uuidv4(),
        buildingId,
        date,
        type: 'payment',
        description: `Ödeme alındı${notes ? ` - ${notes}` : ''}`,
        amount: amount,
        previousDebt: building.debt,
        newDebt: Math.max(0, building.debt - amount),
        performedBy: receivedBy
      };
      
      const newUpdate: Update = {
        id: uuidv4(),
        action: 'Ödeme Alındı',
        user: state.currentUser?.name || 'Bilinmeyen',
        timestamp: new Date().toISOString(),
        details: `${building.name} binasından ${amount.toLocaleString('tr-TR')} ₺ ödeme alındı.`,
      };
      
      return {
        ...state,
        payments: [newPayment, ...state.payments],
        incomes: [newIncome, ...state.incomes],
        buildings: updatedBuildings,
        debtRecords: [newDebtRecord, ...state.debtRecords],
        updates: [newUpdate, ...state.updates].slice(0, 50),
      };
    }

    case 'ADD_QR_CODE_DATA':
      return {
        ...state,
        qrCodes: [...state.qrCodes, action.payload],
      };

    case 'UPDATE_AUTO_SAVE_DATA':
      return {
        ...state,
        autoSaveData: [action.payload, ...state.autoSaveData.filter(data => data.id !== action.payload.id)],
        lastAutoSave: action.payload.timestamp,
      };

    case 'SHOW_RECEIPT_MODAL':
      return {
        ...state,
        showReceiptModal: true,
        receiptModalHtml: action.payload,
      };

    case 'CLOSE_RECEIPT_MODAL':
      return {
        ...state,
        showReceiptModal: false,
        receiptModalHtml: null,
      };

    case 'SHOW_PRINTER_SELECTION':
      return {
        ...state,
        showPrinterSelectionModal: true,
        printerSelectionContent: action.payload,
      };

    case 'CLOSE_PRINTER_SELECTION':
      return {
        ...state,
        showPrinterSelectionModal: false,
        printerSelectionContent: null,
      };
    
    default:
      return state;
  }
}

// Helper function to generate receipt HTML
const generateReceiptHtml = (building: Building, settings: AppSettings, state: AppState): string => {
  const currentDate = new Date();
  const receiptDate = currentDate.toLocaleDateString('tr-TR');
  const receiptTime = currentDate.toTimeString().split(' ')[0].slice(0, 5);
  
  const maintenanceFee = building.maintenanceFee * building.elevatorCount;
  
  // Get building-specific note or default note
  const maintenanceNote = building.maintenanceReceiptNote || settings.defaultMaintenanceNote || '';
  
  // Get unpaid parts for this building
  const unpaidParts = state.partInstallations
    .filter(installation => installation.buildingId === building.id && !installation.isPaid)
    .map(installation => {
      const part = state.parts.find(p => p.id === installation.partId);
      return part ? {
        name: part.name,
        quantity: installation.quantity,
        unitPrice: part.price,
        totalPrice: part.price * installation.quantity
      } : null;
    })
    .filter(Boolean);
    
  const unpaidManualParts = state.manualPartInstallations
    .filter(installation => installation.buildingId === building.id && !installation.isPaid)
    .map(installation => ({
      name: installation.partName,
      quantity: installation.quantity,
      unitPrice: installation.unitPrice,
      totalPrice: installation.totalPrice
    }));
    
  const allUnpaidParts = [...unpaidParts, ...unpaidManualParts];
  const totalPartsPrice = allUnpaidParts.reduce((sum, part) => sum + (part?.totalPrice || 0), 0);
  const grandTotal = maintenanceFee + totalPartsPrice;
  
  // Company address
  const companyAddress = settings.companyAddress ? 
    `${settings.companyAddress.mahalle} ${settings.companyAddress.sokak} ${settings.companyAddress.binaNo}, ${settings.companyAddress.ilce}/${settings.companyAddress.il}` : 
    'Adres belirtilmemiş';
    
  // Building address
  const buildingAddress = building.address ? 
    `${building.address.mahalle} ${building.address.sokak} ${building.address.binaNo}, ${building.address.ilce}/${building.address.il}` : 
    'Adres belirtilmemiş';
  
  // Generate certificates HTML
  const certificatesHtml = settings.certificates && settings.certificates.length > 0 
    ? settings.certificates.map(cert => `<img src="${cert}" alt="Sertifika" class="certificate">`).join('')
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Bakım Fişi - ${building.name}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Zapfino&display=swap');
        
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
          position: relative;
        }
        
        .receipt {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          position: relative;
          z-index: 2;
        }
        
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          opacity: 0.1;
          z-index: 1;
          pointer-events: none;
        }
        
        .watermark img {
          max-width: 400px;
          max-height: 400px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          border-bottom: 3px solid #333;
          padding-bottom: 20px;
        }
        
        .logo-section {
          flex: 1;
        }
        
        .logo {
          max-height: 80px;
          max-width: 150px;
        }
        
        .company-details {
          flex: 2;
          text-align: center;
        }
        
        .company-name {
          font-size: 28px;
          font-weight: bold;
          color: #333;
          margin: 10px 0;
        }
        
        .slogan {
          font-size: 14px;
          color: #666;
          font-style: italic;
          margin-bottom: 15px;
        }
        
        .certificates {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .certificate {
          height: 40px;
          width: auto;
          object-fit: contain;
        }
        
        .address-info {
          flex: 1;
          text-align: right;
          font-size: 12px;
          color: #666;
        }
        
        .address-text {
          font-weight: bold;
          margin-bottom: 5px;
          line-height: 1.4;
        }
        
        .phone-text {
          font-weight: bold;
        }
        
        .receipt-title {
          text-align: center;
          font-size: 24px;
          font-weight: bold;
          margin: 30px 0;
          background: #f0f0f0;
          padding: 15px;
          border: 2px solid #333;
        }
        
        .receipt-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .info-section h3 {
          font-size: 16px;
          margin-bottom: 10px;
          color: #333;
          border-bottom: 1px solid #ccc;
          padding-bottom: 5px;
        }
        
        .info-section p {
          margin: 5px 0;
          font-size: 14px;
        }
        
        .maintenance-fee {
          background: #f9f9f9;
          padding: 15px;
          border: 1px solid #ddd;
          margin: 20px 0;
          text-align: center;
        }
        
        .maintenance-fee h3 {
          margin: 0 0 10px 0;
          color: #333;
        }
        
        .fee-calculation {
          font-size: 18px;
          font-weight: bold;
          color: #2563eb;
        }
        
        .parts-section {
          margin: 20px 0;
        }
        
        .parts-table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        
        .parts-table th,
        .parts-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        .parts-table th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        
        .debt-info {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 15px;
          margin: 20px 0;
        }
        
        .total-section {
          background: #e8f5e8;
          border: 2px solid #4caf50;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        
        .total-amount {
          font-size: 24px;
          font-weight: bold;
          color: #2e7d32;
        }
        
        .notes-section {
          margin: 30px 0;
          padding: 15px;
          background: #f8f9fa;
          border-left: 4px solid #007bff;
        }
        
        .notes-section h3 {
          margin: 0 0 10px 0;
          color: #333;
        }
        
        .signature-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin: 40px 0;
          padding: 20px 0;
          border-top: 1px solid #ccc;
        }
        
        .signature-box {
          text-align: center;
          padding: 20px 0;
        }
        
        .signature-line {
          border-top: 1px solid #333;
          margin: 40px 20px 10px 20px;
        }
        
        .technician-name {
          font-family: 'Zapfino', cursive;
          font-size: 18px;
          margin-top: 10px;
        }
        
        .footer {
          text-align: center;
          margin-top: 40px;
          padding: 20px;
          background: #f0f0f0;
          border: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
        
        @media print {
          body { margin: 0; padding: 10px; }
          .receipt { max-width: none; }
        }
      </style>
    </head>
    <body>
      ${settings.logo ? `<div class="watermark"><img src="${settings.logo}" alt="Logo"></div>` : ''}
      
      <div class="receipt">
        <div class="header">
          <div class="logo-section">
            ${settings.logo ? `<img src="${settings.logo}" alt="Logo" class="logo">` : ''}
          </div>
          
          <div class="company-details">
            <div class="company-name">${settings.companyName || 'Firma Adı'}</div>
            ${settings.companySlogan ? `<div class="slogan">${settings.companySlogan}</div>` : ''}
            <div class="certificates">
              ${certificatesHtml}
            </div>
          </div>
          
          <div class="address-info">
            <div class="address-text">${companyAddress}</div>
            <div class="phone-text">Tel: ${settings.companyPhone || '0555 123 45 67'}</div>
          </div>
        </div>
        
        <div class="receipt-title">
          BAKIM FİŞİ
        </div>
        
        <div class="receipt-info">
          <div class="info-section">
            <h3>Bina Bilgileri</h3>
            <p><strong>Bina Adı:</strong> ${building.name}</p>
            <p><strong>Adres:</strong> ${buildingAddress}</p>
            <p><strong>İletişim:</strong> ${building.contactInfo || 'Belirtilmemiş'}</p>
            ${building.buildingResponsible ? `<p><strong>Sorumlu:</strong> ${building.buildingResponsible}</p>` : ''}
          </div>
          
          <div class="info-section">
            <h3>Bakım Bilgileri</h3>
            <p><strong>Tarih:</strong> ${receiptDate}</p>
            <p><strong>Asansör Sayısı:</strong> ${building.elevatorCount}</p>
            <p><strong>Toplam Borç:</strong> ${building.debt.toLocaleString('tr-TR')} ₺</p>
          </div>
        </div>
        
        <div class="maintenance-fee">
          <h3>Bakım Ücreti</h3>
          <div class="fee-calculation">
            ${building.elevatorCount} asansör × ${building.maintenanceFee.toLocaleString('tr-TR')} ₺ = ${maintenanceFee.toLocaleString('tr-TR')} ₺
          </div>
        </div>
        
        ${allUnpaidParts.length > 0 ? `
          <div class="parts-section">
            <h3>Takılan Parçalar</h3>
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
                ${allUnpaidParts.map(part => `
                  <tr>
                    <td>${part?.name || ''}</td>
                    <td>${part?.quantity || 0}</td>
                    <td>${(part?.unitPrice || 0).toLocaleString('tr-TR')} ₺</td>
                    <td>${(part?.totalPrice || 0).toLocaleString('tr-TR')} ₺</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        ${building.debt > 0 ? `
          <div class="debt-info">
            <h3>Borç Durumu</h3>
            <p>Toplam Borç: <strong>${building.debt.toLocaleString('tr-TR')} ₺</strong></p>
          </div>
        ` : ''}
        
        <div class="total-section">
          <h3>TOPLAM TUTAR</h3>
          <div class="total-amount">${grandTotal.toLocaleString('tr-TR')} ₺</div>
        </div>
        
        ${maintenanceNote ? `
          <div class="notes-section">
            <h3>Bakım Notları</h3>
            <p>${maintenanceNote}</p>
          </div>
        ` : ''}
        
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div><strong>TEKNİSYEN</strong></div>
            <div class="technician-name">${state.currentUser?.name || 'Teknisyen'}</div>
          </div>
          
          <div class="signature-box">
            <div class="signature-line"></div>
            <div><strong>MÜŞTERİ İMZASI</strong></div>
          </div>
        </div>
        
        <div class="footer">
          <p>${settings.companyName || 'Firma Adı'} - ${settings.companyPhone || '0555 123 45 67'}</p>
          <p>Bu fiş ${receiptDate} ${receiptTime} tarihinde düzenlenmiştir.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Context
const AppContext = createContext<{
  state: AppState;
  addBuilding: (building: Omit<Building, 'id'>) => void;
  updateBuilding: (building: Building) => void;
  deleteBuilding: (id: string) => void;
  addPart: (part: Omit<Part, 'id'>) => void;
  updatePart: (part: Part) => void;
  deletePart: (id: string) => void;
  increasePrices: (percentage: number) => void;
  installPart: (data: { buildingId: string; partId: string; quantity: number; installDate: string }) => void;
  installManualPart: (data: { buildingId: string; partName: string; quantity: number; unitPrice: number; totalPrice: number; installDate: string }) => void;
  markPartAsPaid: (installationId: string, isManual: boolean) => void;
  toggleMaintenance: (buildingId: string, showReceipt: boolean) => void;
  revertMaintenance: (buildingId: string) => void;
  resetAllMaintenance: () => void;
  addUpdate: (update: Omit<Update, 'id'>) => void;
  addIncome: (income: Omit<Income, 'id'>) => void;
  setUser: (name: string) => void;
  deleteUser: (id: string) => void;
  addNotification: (message: string) => void;
  clearNotifications: () => void;
  toggleSidebar: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  addFaultReport: (buildingId: string, reporterName: string, reporterSurname: string, reporterPhone: string, apartmentNo: string, description: string) => void;
  resolveFaultReport: (id: string) => void;
  reportFault: (buildingId: string, faultData: { description: string; severity: 'low' | 'medium' | 'high'; reportedBy: string }) => void;
  addMaintenanceRecord: (data: { buildingId: string; performedBy: string; maintenanceDate: string; maintenanceTime: string; elevatorCount: number; totalFee: number; notes?: string }) => void;
  addPrinter: (printer: Omit<Printer, 'id'>) => void;
  updatePrinter: (printer: Printer) => void;
  deletePrinter: (id: string) => void;
  addSMSTemplate: (template: Omit<SMSTemplate, 'id'>) => void;
  updateSMSTemplate: (template: SMSTemplate) => void;
  deleteSMSTemplate: (id: string) => void;
  sendBulkSMS: (templateId: string, buildingIds: string[]) => void;
  sendWhatsApp: (templateId: string, buildingIds: string[]) => void;
  addProposal: (proposal: any) => void;
  updateProposal: (proposal: any) => void;
  deleteProposal: (id: string) => void;
  addPayment: (payment: any) => void;
  addQRCodeData: (qrData: QRCodeData) => void;
  updateAutoSaveData: (data: AutoSaveData) => void;
  showReceiptModal: (htmlContent: string) => void;
  closeReceiptModal: () => void;
  showPrinterSelection: (content: string) => void;
  closePrinterSelection: () => void;
  getLatestArchivedReceiptHtml: (buildingId: string) => string | null;
} | undefined>(undefined);

// Provider
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('elevator-maintenance-app-state');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        Object.keys(parsedState).forEach(key => {
          if (key !== 'currentUser' && key !== 'sidebarOpen' && key !== 'notifications' && key !== 'unreadNotifications') {
            if (key === 'settings') {
              dispatch({ type: 'UPDATE_SETTINGS', payload: parsedState[key] });
            }
          }
        });
      } catch (error) {
        console.error('Error loading state from localStorage:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      ...state,
      currentUser: null, // Don't persist current user
      sidebarOpen: true,  // Reset sidebar state
      notifications: [], // Don't persist notifications
      unreadNotifications: 0,
      showReceiptModal: false,
      receiptModalHtml: null,
      showPrinterSelectionModal: false,
      printerSelectionContent: null
    };
    localStorage.setItem('elevator-maintenance-app-state', JSON.stringify(stateToSave));
  }, [state]);

  const contextValue = {
    state,
    addBuilding: (building: Omit<Building, 'id'>) => dispatch({ type: 'ADD_BUILDING', payload: building }),
    updateBuilding: (building: Building) => dispatch({ type: 'UPDATE_BUILDING', payload: building }),
    deleteBuilding: (id: string) => dispatch({ type: 'DELETE_BUILDING', payload: id }),
    addPart: (part: Omit<Part, 'id'>) => dispatch({ type: 'ADD_PART', payload: part }),
    updatePart: (part: Part) => dispatch({ type: 'UPDATE_PART', payload: part }),
    deletePart: (id: string) => dispatch({ type: 'DELETE_PART', payload: id }),
    increasePrices: (percentage: number) => dispatch({ type: 'INCREASE_PRICES', payload: percentage }),
    installPart: (data: { buildingId: string; partId: string; quantity: number; installDate: string }) => 
      dispatch({ type: 'INSTALL_PART', payload: data }),
    installManualPart: (data: { buildingId: string; partName: string; quantity: number; unitPrice: number; totalPrice: number; installDate: string }) => 
      dispatch({ type: 'INSTALL_MANUAL_PART', payload: data }),
    markPartAsPaid: (installationId: string, isManual: boolean) => 
      dispatch({ type: 'MARK_PART_AS_PAID', payload: { installationId, isManual } }),
    toggleMaintenance: (buildingId: string, showReceipt: boolean = false) => 
      dispatch({ type: 'TOGGLE_MAINTENANCE', payload: { buildingId, showReceipt } }),
    revertMaintenance: (buildingId: string) => dispatch({ type: 'REVERT_MAINTENANCE', payload: buildingId }),
    resetAllMaintenance: () => dispatch({ type: 'RESET_ALL_MAINTENANCE' }),
    addUpdate: (update: Omit<Update, 'id'>) => dispatch({ type: 'ADD_UPDATE', payload: update }),
    addIncome: (income: Omit<Income, 'id'>) => dispatch({ type: 'ADD_INCOME', payload: income }),
    setUser: (name: string) => dispatch({ type: 'SET_USER', payload: name }),
    deleteUser: (id: string) => dispatch({ type: 'DELETE_USER', payload: id }),
    addNotification: (message: string) => dispatch({ type: 'ADD_NOTIFICATION', payload: message }),
    clearNotifications: () => dispatch({ type: 'CLEAR_NOTIFICATIONS' }),
    toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    updateSettings: (settings: Partial<AppSettings>) => dispatch({ type: 'UPDATE_SETTINGS', payload: settings }),
    addFaultReport: (buildingId: string, reporterName: string, reporterSurname: string, reporterPhone: string, apartmentNo: string, description: string) => 
      dispatch({ type: 'ADD_FAULT_REPORT', payload: { buildingId, reporterName, reporterSurname, reporterPhone, apartmentNo, description } }),
    resolveFaultReport: (id: string) => dispatch({ type: 'RESOLVE_FAULT_REPORT', payload: id }),
    reportFault: (buildingId: string, faultData: { description: string; severity: 'low' | 'medium' | 'high'; reportedBy: string }) => 
      dispatch({ type: 'REPORT_FAULT', payload: { buildingId, faultData } }),
    addMaintenanceRecord: (data: { buildingId: string; performedBy: string; maintenanceDate: string; maintenanceTime: string; elevatorCount: number; totalFee: number; notes?: string }) => 
      dispatch({ type: 'ADD_MAINTENANCE_RECORD', payload: data }),
    addPrinter: (printer: Omit<Printer, 'id'>) => dispatch({ type: 'ADD_PRINTER', payload: printer }),
    updatePrinter: (printer: Printer) => dispatch({ type: 'UPDATE_PRINTER', payload: printer }),
    deletePrinter: (id: string) => dispatch({ type: 'DELETE_PRINTER', payload: id }),
    addSMSTemplate: (template: Omit<SMSTemplate, 'id'>) => dispatch({ type: 'ADD_SMS_TEMPLATE', payload: template }),
    updateSMSTemplate: (template: SMSTemplate) => dispatch({ type: 'UPDATE_SMS_TEMPLATE', payload: template }),
    deleteSMSTemplate: (id: string) => dispatch({ type: 'DELETE_SMS_TEMPLATE', payload: id }),
    sendBulkSMS: (templateId: string, buildingIds: string[]) => dispatch({ type: 'SEND_BULK_SMS', payload: { templateId, buildingIds } }),
    sendWhatsApp: (templateId: string, buildingIds: string[]) => dispatch({ type: 'SEND_WHATSAPP', payload: { templateId, buildingIds } }),
    addProposal: (proposal: any) => dispatch({ type: 'ADD_PROPOSAL', payload: proposal }),
    updateProposal: (proposal: any) => dispatch({ type: 'UPDATE_PROPOSAL', payload: proposal }),
    deleteProposal: (id: string) => dispatch({ type: 'DELETE_PROPOSAL', payload: id }),
    addPayment: (payment: any) => dispatch({ type: 'ADD_PAYMENT', payload: payment }),
    addQRCodeData: (qrData: QRCodeData) => dispatch({ type: 'ADD_QR_CODE_DATA', payload: qrData }),
    updateAutoSaveData: (data: AutoSaveData) => dispatch({ type: 'UPDATE_AUTO_SAVE_DATA', payload: data }),
    showReceiptModal: (htmlContent: string) => dispatch({ type: 'SHOW_RECEIPT_MODAL', payload: htmlContent }),
    closeReceiptModal: () => dispatch({ type: 'CLOSE_RECEIPT_MODAL' }),
    showPrinterSelection: (content: string) => dispatch({ type: 'SHOW_PRINTER_SELECTION', payload: content }),
    closePrinterSelection: () => dispatch({ type: 'CLOSE_PRINTER_SELECTION' }),
    getLatestArchivedReceiptHtml: (buildingId: string) => {
      const receipts = state.archivedReceipts
        .filter(receipt => receipt.buildingId === buildingId)
        .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
      
      return receipts.length > 0 ? receipts[0].htmlContent : null;
    }
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

// Hook
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};