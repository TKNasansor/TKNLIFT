import { Building } from '../types';

// Building Action Types
export const BUILDING_ACTIONS = {
  ADD_BUILDING: 'ADD_BUILDING',
  UPDATE_BUILDING: 'UPDATE_BUILDING',
  DELETE_BUILDING: 'DELETE_BUILDING',
  TOGGLE_MAINTENANCE: 'TOGGLE_MAINTENANCE',
  REVERT_MAINTENANCE: 'REVERT_MAINTENANCE',
  REPORT_FAULT: 'REPORT_FAULT',
  MARK_AS_REPAIRED: 'MARK_AS_REPAIRED',
} as const;

export type BuildingActionType = typeof BUILDING_ACTIONS[keyof typeof BUILDING_ACTIONS];

// Building Actions
export interface AddBuildingAction {
  type: typeof BUILDING_ACTIONS.ADD_BUILDING;
  payload: Omit<Building, 'id'>;
}

export interface UpdateBuildingAction {
  type: typeof BUILDING_ACTIONS.UPDATE_BUILDING;
  payload: Building;
}

export interface DeleteBuildingAction {
  type: typeof BUILDING_ACTIONS.DELETE_BUILDING;
  payload: string; // building ID
}

export interface ToggleMaintenanceAction {
  type: typeof BUILDING_ACTIONS.TOGGLE_MAINTENANCE;
  payload: {
    buildingId: string;
    showReceipt: boolean;
  };
}

export interface RevertMaintenanceAction {
  type: typeof BUILDING_ACTIONS.REVERT_MAINTENANCE;
  payload: string; // building ID
}

export interface ReportFaultAction {
  type: typeof BUILDING_ACTIONS.REPORT_FAULT;
  payload: {
    buildingId: string;
    faultData: {
      description: string;
      severity: 'low' | 'medium' | 'high';
      reportedBy: string;
    };
  };
}

export interface MarkAsRepairedAction {
  type: typeof BUILDING_ACTIONS.MARK_AS_REPAIRED;
  payload: string; // building ID
}

export type BuildingAction = 
  | AddBuildingAction
  | UpdateBuildingAction
  | DeleteBuildingAction
  | ToggleMaintenanceAction
  | RevertMaintenanceAction
  | ReportFaultAction
  | MarkAsRepairedAction;