import { NotificationData } from '../types';

// Notification Action Types
export const NOTIFICATION_ACTIONS = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
  MARK_NOTIFICATION_READ: 'MARK_NOTIFICATION_READ',
  ADD_SYSTEM_NOTIFICATION: 'ADD_SYSTEM_NOTIFICATION',
  REMOVE_SYSTEM_NOTIFICATION: 'REMOVE_SYSTEM_NOTIFICATION',
} as const;

export type NotificationActionType = typeof NOTIFICATION_ACTIONS[keyof typeof NOTIFICATION_ACTIONS];

// Notification Actions
export interface AddNotificationAction {
  type: typeof NOTIFICATION_ACTIONS.ADD_NOTIFICATION;
  payload: string; // simple notification message
}

export interface ClearNotificationsAction {
  type: typeof NOTIFICATION_ACTIONS.CLEAR_NOTIFICATIONS;
}

export interface MarkNotificationReadAction {
  type: typeof NOTIFICATION_ACTIONS.MARK_NOTIFICATION_READ;
  payload: string; // notification ID
}

export interface AddSystemNotificationAction {
  type: typeof NOTIFICATION_ACTIONS.ADD_SYSTEM_NOTIFICATION;
  payload: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'>;
}

export interface RemoveSystemNotificationAction {
  type: typeof NOTIFICATION_ACTIONS.REMOVE_SYSTEM_NOTIFICATION;
  payload: string; // notification ID
}

export type NotificationAction = 
  | AddNotificationAction
  | ClearNotificationsAction
  | MarkNotificationReadAction
  | AddSystemNotificationAction
  | RemoveSystemNotificationAction;