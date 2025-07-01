import { AppState } from '../types';
import { SettingsAction, SETTINGS_ACTIONS } from '../actions/settingsActions';

export const settingsReducer = (state: AppState, action: SettingsAction): Partial<AppState> => {
  switch (action.type) {
    case SETTINGS_ACTIONS.UPDATE_SETTINGS: {
      return {
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };
    }

    case SETTINGS_ACTIONS.RESET_SETTINGS: {
      // Return to default settings
      return {
        settings: {
          appTitle: 'Asansör Bakım Takip',
          logo: null,
          companyName: '',
          companyPhone: '',
          companyAddress: {
            mahalle: '',
            sokak: '',
            il: '',
            ilce: '',
            binaNo: '',
          },
          receiptTemplate: '',
          installationProposalTemplate: '',
          maintenanceProposalTemplate: '',
          revisionProposalTemplate: '',
          faultReportTemplate: '',
          autoSaveInterval: 60,
        },
      };
    }

    case SETTINGS_ACTIONS.TOGGLE_SIDEBAR: {
      return {
        sidebarOpen: !state.sidebarOpen,
      };
    }

    default:
      return {};
  }
};