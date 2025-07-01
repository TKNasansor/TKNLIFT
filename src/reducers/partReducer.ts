import { Part, PartInstallation, ManualPartInstallation, AppState, Update, DebtRecord } from '../types';
import { PartAction, PART_ACTIONS } from '../actions/partActions';
import { getUserName } from '../utils/userHelpers';

export const partReducer = (state: AppState, action: PartAction): Partial<AppState> => {
  switch (action.type) {
    case PART_ACTIONS.ADD_PART: {
      const newPart: Part = {
        ...action.payload,
        id: Date.now().toString(),
      };

      const newUpdate: Update = {
        id: Date.now().toString(),
        action: 'Yeni parça eklendi',
        user: getUserName(state),
        timestamp: new Date().toISOString(),
        details: `${newPart.name} parçası stoka eklendi`,
      };

      return {
        parts: [...state.parts, newPart],
        updates: [newUpdate, ...state.updates],
      };
    }

    case PART_ACTIONS.UPDATE_PART: {
      const updatedParts = state.parts.map(part =>
        part.id === action.payload.id ? action.payload : part
      );

      const newUpdate: Update = {
        id: Date.now().toString(),
        action: 'Parça güncellendi',
        user: getUserName(state),
        timestamp: new Date().toISOString(),
        details: `${action.payload.name} parçası güncellendi`,
      };

      return {
        parts: updatedParts,
        updates: [newUpdate, ...state.updates],
      };
    }

    case PART_ACTIONS.DELETE_PART: {
      const partToDelete = state.parts.find(p => p.id === action.payload);
      const updatedParts = state.parts.filter(part => part.id !== action.payload);

      const newUpdate: Update = {
        id: Date.now().toString(),
        action: 'Parça silindi',
        user: getUserName(state),
        timestamp: new Date().toISOString(),
        details: `${partToDelete?.name || 'Bilinmeyen'} parçası silindi`,
      };

      return {
        parts: updatedParts,
        updates: [newUpdate, ...state.updates],
      };
    }

    case PART_ACTIONS.INSTALL_PART: {
      const { buildingId, partId, quantity, installDate } = action.payload;
      const part = state.parts.find(p => p.id === partId);
      const building = state.buildings.find(b => b.id === buildingId);

      if (!part || !building || part.quantity < quantity) return {};

      // Update part quantity
      const updatedPart: Part = {
        ...part,
        quantity: part.quantity - quantity,
      };

      // Create installation record
      const newInstallation: PartInstallation = {
        id: Date.now().toString(),
        buildingId,
        partId,
        quantity,
        installDate,
        installedBy: getUserName(state),
        isPaid: false,
        // relatedMaintenanceId başlangıçta undefined - bakım yapıldığında set edilecek
      };


      const newUpdate: Update = {
        id: (Date.now() + 1).toString(),
        action: 'Parça kuruldu',
        user: getUserName(state),
        timestamp: new Date().toISOString(),
        details: `${building.name} binasına ${quantity} adet ${part.name} kuruldu`,
      };

      return {
        parts: state.parts.map(p => p.id === partId ? updatedPart : p),
        partInstallations: [...state.partInstallations, newInstallation],
        updates: [newUpdate, ...state.updates],
      };
    }

    case PART_ACTIONS.INSTALL_MANUAL_PART: {
      const { buildingId, partName, quantity, unitPrice, totalPrice, installDate } = action.payload;
      const building = state.buildings.find(b => b.id === buildingId);

      if (!building) return {};

      // Create manual installation record
      const newManualInstallation: ManualPartInstallation = {
        id: Date.now().toString(),
        buildingId,
        partName,
        quantity,
        unitPrice,
        totalPrice,
        installDate,
        installedBy: getUserName(state),
        isPaid: false,
        // relatedMaintenanceId başlangıçta undefined - bakım yapıldığında set edilecek
      };


      const newUpdate: Update = {
        id: (Date.now() + 1).toString(),
        action: 'Manuel parça kuruldu',
        user: getUserName(state),
        timestamp: new Date().toISOString(),
        details: `${building.name} binasına ${quantity} adet ${partName} kuruldu`,
      };

      return {
        manualPartInstallations: [...state.manualPartInstallations, newManualInstallation],
        updates: [newUpdate, ...state.updates],
      };
    }

    case PART_ACTIONS.MARK_PART_AS_PAID: {
      const { installationId, isManual } = action.payload;
      const paymentDate = new Date().toISOString();

      if (isManual) {
        const updatedManualInstallations = state.manualPartInstallations.map(installation =>
          installation.id === installationId
            ? { ...installation, isPaid: true, paymentDate }
            : installation
        );

        return {
          manualPartInstallations: updatedManualInstallations,
        };
      } else {
        const updatedInstallations = state.partInstallations.map(installation =>
          installation.id === installationId
            ? { ...installation, isPaid: true, paymentDate }
            : installation
        );

        return {
          partInstallations: updatedInstallations,
        };
      }
    }

    case PART_ACTIONS.INCREASE_PRICES: {
      const percentage = action.payload;
      const updatedParts = state.parts.map(part => {
        const newPrice = part.price * (1 + percentage / 100);
        // Round to nearest 50
        const roundedPrice = Math.round(newPrice / 50) * 50;
        return {
          ...part,
          price: roundedPrice,
        };
      });

      const newUpdate: Update = {
        id: Date.now().toString(),
        action: 'Fiyatlar artırıldı',
        user: getUserName(state),
        timestamp: new Date().toISOString(),
        details: `Tüm parça fiyatları %${percentage} artırıldı`,
      };

      return {
        parts: updatedParts,
        updates: [newUpdate, ...state.updates],
      };
    }

    default:
      return {};
  }
};