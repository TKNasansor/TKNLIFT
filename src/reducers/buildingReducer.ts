import { Building, AppState, DebtRecord, MaintenanceHistory, Update, ArchivedReceipt } from '../types';
import { BuildingAction, BUILDING_ACTIONS } from '../actions/buildingActions';
import { getUserName, getCurrentDateTime } from '../utils/userHelpers';
import { getTotalMaintenanceFee } from '../utils/buildingHelpers';

export const buildingReducer = (state: AppState, action: BuildingAction): Partial<AppState> => {
  switch (action.type) {
    case BUILDING_ACTIONS.ADD_BUILDING: {
      const newBuilding: Building = {
        ...action.payload,
        id: Date.now().toString(),
      };

      const newUpdate: Update = {
        id: Date.now().toString(),
        action: 'Yeni bina eklendi',
        user: getUserName(state),
        timestamp: new Date().toISOString(),
        details: `${newBuilding.name} binası sisteme eklendi`,
      };

      return {
        buildings: [...state.buildings, newBuilding],
        updates: [newUpdate, ...state.updates],
      };
    }

    case BUILDING_ACTIONS.UPDATE_BUILDING: {
      const updatedBuildings = state.buildings.map(building =>
        building.id === action.payload.id ? action.payload : building
      );

      const newUpdate: Update = {
        id: Date.now().toString(),
        action: 'Bina güncellendi',
        user: getUserName(state),
        timestamp: new Date().toISOString(),
        details: `${action.payload.name} binası güncellendi`,
      };

      return {
        buildings: updatedBuildings,
        updates: [newUpdate, ...state.updates],
      };
    }

    case BUILDING_ACTIONS.DELETE_BUILDING: {
      const buildingToDelete = state.buildings.find(b => b.id === action.payload);
      const updatedBuildings = state.buildings.filter(building => building.id !== action.payload);

      const newUpdate: Update = {
        id: Date.now().toString(),
        action: 'Bina silindi',
        user: getUserName(state),
        timestamp: new Date().toISOString(),
        details: `${buildingToDelete?.name || 'Bilinmeyen'} binası silindi`,
      };

      return {
        buildings: updatedBuildings,
        updates: [newUpdate, ...state.updates],
      };
    }

    case BUILDING_ACTIONS.TOGGLE_MAINTENANCE: {
      const { buildingId, showReceipt } = action.payload;
      const building = state.buildings.find(b => b.id === buildingId);
      
      if (!building) return {};

      const { date, time } = getCurrentDateTime();
      const maintenanceRecordId = Date.now().toString();
      
      // Bu bakımla birlikte faturalandırılacak parçaları bul
      const unpaidParts = state.partInstallations.filter(
        installation => installation.buildingId === buildingId && 
                      !installation.isPaid && 
                      !installation.relatedMaintenanceId
      );
      
      const unpaidManualParts = state.manualPartInstallations.filter(
        installation => installation.buildingId === buildingId && 
                      !installation.isPaid && 
                      !installation.relatedMaintenanceId
      );
      
      // Parça maliyetlerini hesapla
      let totalPartsCost = 0;
      unpaidParts.forEach(installation => {
        const part = state.parts.find(p => p.id === installation.partId);
        if (part) {
          totalPartsCost += part.price * installation.quantity;
        }
      });
      
      unpaidManualParts.forEach(installation => {
        totalPartsCost += installation.totalPrice;
      });
      
      const maintenanceFee = getTotalMaintenanceFee(building);
      const totalAmountToBill = maintenanceFee + totalPartsCost;

      const updatedBuilding: Building = {
        ...building,
        isMaintained: true,
        lastMaintenanceDate: date,
        lastMaintenanceTime: time,
        debt: building.debt + totalAmountToBill,
      };

      // Parçaları bu bakımla ilişkilendir ve ödendi olarak işaretle
      const updatedPartInstallations = state.partInstallations.map(installation => {
        if (unpaidParts.some(up => up.id === installation.id)) {
          return {
            ...installation,
            isPaid: true,
            paymentDate: new Date().toISOString(),
            relatedMaintenanceId: maintenanceRecordId,
          };
        }
        return installation;
      });
      
      const updatedManualPartInstallations = state.manualPartInstallations.map(installation => {
        if (unpaidManualParts.some(up => up.id === installation.id)) {
          return {
            ...installation,
            isPaid: true,
            paymentDate: new Date().toISOString(),
            relatedMaintenanceId: maintenanceRecordId,
          };
        }
        return installation;
      });
      const newMaintenanceHistory: MaintenanceHistory = {
        id: maintenanceRecordId,
        buildingId,
        maintenanceDate: date,
        maintenanceTime: time,
        performedBy: getUserName(state),
        maintenanceFee: totalAmountToBill,
        relatedRecordId: maintenanceRecordId,
      };

      const newDebtRecord: DebtRecord = {
        id: (Date.now() + 1).toString(),
        buildingId,
        date: new Date().toISOString(),
        type: 'maintenance',
        description: `Bakım ücreti ve parçalar - ${building.elevatorCount} asansör${totalPartsCost > 0 ? ` + ${totalPartsCost.toLocaleString('tr-TR')} ₺ parça` : ''}`,
        amount: totalAmountToBill,
        previousDebt: building.debt,
        newDebt: building.debt + totalAmountToBill,
        performedBy: getUserName(state),
        relatedRecordId: newMaintenanceHistory.id,
      };


      const newUpdate: Update = {
        id: (Date.now() + 2).toString(),
        action: 'Bakım tamamlandı',
        user: getUserName(state),
        timestamp: new Date().toISOString(),
        details: `${building.name} binasının bakımı tamamlandı${totalPartsCost > 0 ? ` (${unpaidParts.length + unpaidManualParts.length} parça dahil)` : ''}`,
      };

      let newState: Partial<AppState> = {
        buildings: state.buildings.map(b => 
          b.id === buildingId ? updatedBuilding : b
        ),
        partInstallations: updatedPartInstallations,
        manualPartInstallations: updatedManualPartInstallations,
        maintenanceHistory: [...state.maintenanceHistory, newMaintenanceHistory],
        debtRecords: [...state.debtRecords, newDebtRecord],
        updates: [newUpdate, ...state.updates],
      };

      // If showReceipt is true, generate and show receipt
      if (showReceipt) {
        // This would be handled by the receipt generation logic
        // We'll add this functionality in the receipt service
      }

      return newState;
    }

    case BUILDING_ACTIONS.REVERT_MAINTENANCE: {
      const building = state.buildings.find(b => b.id === action.payload);
      if (!building || !building.isMaintained) return {};

      const updatedBuilding: Building = {
        ...building,
        isMaintained: false,
        lastMaintenanceDate: undefined,
        lastMaintenanceTime: undefined,
      };

      // Remove the last maintenance record
      const lastMaintenanceRecord = state.maintenanceHistory
        .filter(h => h.buildingId === action.payload)
        .sort((a, b) => new Date(b.maintenanceDate).getTime() - new Date(a.maintenanceDate).getTime())[0];

      if (lastMaintenanceRecord) {
        // Remove related debt record
        const relatedDebtRecord = state.debtRecords.find(
          dr => dr.relatedRecordId === lastMaintenanceRecord.id
        );

        if (relatedDebtRecord) {
          const updatedBuildingWithDebt: Building = {
            ...updatedBuilding,
            debt: relatedDebtRecord.previousDebt,
          };

          const newUpdate: Update = {
            id: Date.now().toString(),
            action: 'Bakım geri alındı',
            user: getUserName(state),
            timestamp: new Date().toISOString(),
            details: `${building.name} binasının bakımı geri alındı`,
          };

          return {
            buildings: state.buildings.map(b => 
              b.id === action.payload ? updatedBuildingWithDebt : b
            ),
            maintenanceHistory: state.maintenanceHistory.filter(
              h => h.id !== lastMaintenanceRecord.id
            ),
            debtRecords: state.debtRecords.filter(
              dr => dr.id !== relatedDebtRecord.id
            ),
            archivedReceipts: state.archivedReceipts.filter(
              ar => ar.relatedRecordId !== lastMaintenanceRecord.id
            ),
            updates: [newUpdate, ...state.updates],
          };
        }
      }

      return {
        buildings: state.buildings.map(b => 
          b.id === action.payload ? updatedBuilding : b
        ),
      };
    }

    case BUILDING_ACTIONS.REPORT_FAULT: {
      const { buildingId, faultData } = action.payload;
      const building = state.buildings.find(b => b.id === buildingId);
      
      if (!building) return {};

      const updatedBuilding: Building = {
        ...building,
        isDefective: true,
        faultSeverity: faultData.severity,
        faultTimestamp: new Date().toISOString(),
        faultReportedBy: faultData.reportedBy,
        defectiveNote: faultData.description,
      };

      const newUpdate: Update = {
        id: Date.now().toString(),
        action: 'Arıza bildirildi',
        user: faultData.reportedBy,
        timestamp: new Date().toISOString(),
        details: `${building.name} binasında arıza bildirildi: ${faultData.description}`,
      };

      return {
        buildings: state.buildings.map(b => 
          b.id === buildingId ? updatedBuilding : b
        ),
        updates: [newUpdate, ...state.updates],
      };
    }

    case BUILDING_ACTIONS.MARK_AS_REPAIRED: {
      const building = state.buildings.find(b => b.id === action.payload);
      
      if (!building) return {};

      const updatedBuilding: Building = {
        ...building,
        isDefective: false,
        faultSeverity: undefined,
        faultTimestamp: undefined,
        faultReportedBy: undefined,
        defectiveNote: undefined,
      };

      const newUpdate: Update = {
        id: Date.now().toString(),
        action: 'Arıza giderildi',
        user: getUserName(state),
        timestamp: new Date().toISOString(),
        details: `${building.name} binasının arızası giderildi`,
      };

      return {
        buildings: state.buildings.map(b => 
          b.id === action.payload ? updatedBuilding : b
        ),
        updates: [newUpdate, ...state.updates],
      };
    }

    default:
      return {};
  }
};