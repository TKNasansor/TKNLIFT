import { AppSettings } from '../types';

// Settings Action Types
export const SETTINGS_ACTIONS = {
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  RESET_SETTINGS: 'RESET_SETTINGS',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
} as const;

export type SettingsActionType = typeof SETTINGS_ACTIONS[keyof typeof SETTINGS_ACTIONS];

// Settings Actions
export interface UpdateSettingsAction {
  type: typeof SETTINGS_ACTIONS.UPDATE_SETTINGS;
  payload: Partial<AppSettings>;
}

export interface ResetSettingsAction {
  type: typeof SETTINGS_ACTIONS.RESET_SETTINGS;
}

export interface ToggleSidebarAction {
  type: typeof SETTINGS_ACTIONS.TOGGLE_SIDEBAR;
}

export type SettingsAction = 
  | UpdateSettingsAction
  | ResetSettingsAction
  | ToggleSidebarAction;