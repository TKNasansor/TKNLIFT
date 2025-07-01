import { Part, PartInstallation, ManualPartInstallation } from '../types';

// Part Action Types
export const PART_ACTIONS = {
  ADD_PART: 'ADD_PART',
  UPDATE_PART: 'UPDATE_PART',
  DELETE_PART: 'DELETE_PART',
  INSTALL_PART: 'INSTALL_PART',
  INSTALL_MANUAL_PART: 'INSTALL_MANUAL_PART',
  MARK_PART_AS_PAID: 'MARK_PART_AS_PAID',
  INCREASE_PRICES: 'INCREASE_PRICES',
} as const;

export type PartActionType = typeof PART_ACTIONS[keyof typeof PART_ACTIONS];

// Part Actions
export interface AddPartAction {
  type: typeof PART_ACTIONS.ADD_PART;
  payload: Omit<Part, 'id'>;
}

export interface UpdatePartAction {
  type: typeof PART_ACTIONS.UPDATE_PART;
  payload: Part;
}

export interface DeletePartAction {
  type: typeof PART_ACTIONS.DELETE_PART;
  payload: string; // part ID
}

export interface InstallPartAction {
  type: typeof PART_ACTIONS.INSTALL_PART;
  payload: {
    buildingId: string;
    partId: string;
    quantity: number;
    installDate: string;
  };
}

export interface InstallManualPartAction {
  type: typeof PART_ACTIONS.INSTALL_MANUAL_PART;
  payload: {
    buildingId: string;
    partName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    installDate: string;
  };
}

export interface MarkPartAsPaidAction {
  type: typeof PART_ACTIONS.MARK_PART_AS_PAID;
  payload: {
    installationId: string;
    isManual: boolean;
  };
}

export interface IncreasePricesAction {
  type: typeof PART_ACTIONS.INCREASE_PRICES;
  payload: number; // percentage
}

export type PartAction = 
  | AddPartAction
  | UpdatePartAction
  | DeletePartAction
  | InstallPartAction
  | InstallManualPartAction
  | MarkPartAsPaidAction
  | IncreasePricesAction;