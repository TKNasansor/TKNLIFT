import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Building, Part } from '../types';
import { 
  BUILDING_ACTIONS, 
  PART_ACTIONS, 
  NOTIFICATION_ACTIONS, 
  USER_ACTIONS, 
  SETTINGS_ACTIONS 
} from '../actions';

export const useAppActions = () => {
  const { dispatch } = useApp();

  // Building Actions
  const addBuilding = useCallback((building: Omit<Building, 'id'>) => {
    dispatch({
      type: BUILDING_ACTIONS.ADD_BUILDING,
      payload: building,
    });
  }, [dispatch]);

  const updateBuilding = useCallback((building: Building) => {
    dispatch({
      type: BUILDING_ACTIONS.UPDATE_BUILDING,
      payload: building,
    });
  }, [dispatch]);

  const deleteBuilding = useCallback((buildingId: string) => {
    dispatch({
      type: BUILDING_ACTIONS.DELETE_BUILDING,
      payload: buildingId,
    });
  }, [dispatch]);

  const toggleMaintenance = useCallback((buildingId: string, showReceipt: boolean = false) => {
    dispatch({
      type: BUILDING_ACTIONS.TOGGLE_MAINTENANCE,
      payload: { buildingId, showReceipt },
    });
  }, [dispatch]);

  const revertMaintenance = useCallback((buildingId: string) => {
    dispatch({
      type: BUILDING_ACTIONS.REVERT_MAINTENANCE,
      payload: buildingId,
    });
  }, [dispatch]);

  const reportFault = useCallback((
    buildingId: string, 
    faultData: { description: string; severity: 'low' | 'medium' | 'high'; reportedBy: string }
  ) => {
    dispatch({
      type: BUILDING_ACTIONS.REPORT_FAULT,
      payload: { buildingId, faultData },
    });
  }, [dispatch]);

  // Part Actions
  const addPart = useCallback((part: Omit<Part, 'id'>) => {
    dispatch({
      type: PART_ACTIONS.ADD_PART,
      payload: part,
    });
  }, [dispatch]);

  const updatePart = useCallback((part: Part) => {
    dispatch({
      type: PART_ACTIONS.UPDATE_PART,
      payload: part,
    });
  }, [dispatch]);

  const deletePart = useCallback((partId: string) => {
    dispatch({
      type: PART_ACTIONS.DELETE_PART,
      payload: partId,
    });
  }, [dispatch]);

  const installPart = useCallback((data: {
    buildingId: string;
    partId: string;
    quantity: number;
    installDate: string;
  }) => {
    dispatch({
      type: PART_ACTIONS.INSTALL_PART,
      payload: data,
    });
  }, [dispatch]);

  const installManualPart = useCallback((data: {
    buildingId: string;
    partName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    installDate: string;
  }) => {
    dispatch({
      type: PART_ACTIONS.INSTALL_MANUAL_PART,
      payload: data,
    });
  }, [dispatch]);

  const markPartAsPaid = useCallback((installationId: string, isManual: boolean) => {
    dispatch({
      type: PART_ACTIONS.MARK_PART_AS_PAID,
      payload: { installationId, isManual },
    });
  }, [dispatch]);

  const increasePrices = useCallback((percentage: number) => {
    dispatch({
      type: PART_ACTIONS.INCREASE_PRICES,
      payload: percentage,
    });
  }, [dispatch]);

  // Notification Actions
  const addNotification = useCallback((message: string) => {
    dispatch({
      type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
      payload: message,
    });
  }, [dispatch]);

  const clearNotifications = useCallback(() => {
    dispatch({
      type: NOTIFICATION_ACTIONS.CLEAR_NOTIFICATIONS,
    });
  }, [dispatch]);

  // User Actions
  const setUser = useCallback((name: string) => {
    dispatch({
      type: USER_ACTIONS.SET_USER,
      payload: name,
    });
  }, [dispatch]);

  const deleteUser = useCallback((userId: string) => {
    dispatch({
      type: USER_ACTIONS.DELETE_USER,
      payload: userId,
    });
  }, [dispatch]);

  // Settings Actions
  const updateSettings = useCallback((settings: any) => {
    dispatch({
      type: SETTINGS_ACTIONS.UPDATE_SETTINGS,
      payload: settings,
    });
  }, [dispatch]);

  const toggleSidebar = useCallback(() => {
    dispatch({
      type: SETTINGS_ACTIONS.TOGGLE_SIDEBAR,
    });
  }, [dispatch]);

  return {
    // Building actions
    addBuilding,
    updateBuilding,
    deleteBuilding,
    toggleMaintenance,
    revertMaintenance,
    reportFault,
    
    // Part actions
    addPart,
    updatePart,
    deletePart,
    installPart,
    installManualPart,
    markPartAsPaid,
    increasePrices,
    
    // Notification actions
    addNotification,
    clearNotifications,
    
    // User actions
    setUser,
    deleteUser,
    
    // Settings actions
    updateSettings,
    toggleSidebar,
  };
};