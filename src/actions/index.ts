// Central action exports
export * from './buildingActions';
export * from './partActions';
export * from './notificationActions';
export * from './userActions';
export * from './settingsActions';

// Combined action type
import { BuildingAction } from './buildingActions';
import { PartAction } from './partActions';
import { NotificationAction } from './notificationActions';
import { UserAction } from './userActions';
import { SettingsAction } from './settingsActions';

export type AppAction = 
  | BuildingAction
  | PartAction
  | NotificationAction
  | UserAction
  | SettingsAction;