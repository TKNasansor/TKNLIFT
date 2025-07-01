import { AppState } from '../types';

/**
 * Kullanıcı adını güvenli bir şekilde getirir
 */
export const getUserName = (state: AppState): string => {
  return state.currentUser?.name || 'Bilinmeyen';
};

/**
 * Geçerli kullanıcının ID'sini güvenli bir şekilde getirir
 */
export const getCurrentUserId = (state: AppState): string => {
  return state.currentUser?.id || '';
};

/**
 * Kullanıcının aktif olup olmadığını kontrol eder
 */
export const isUserActive = (state: AppState): boolean => {
  return state.currentUser !== null;
};

/**
 * Kullanıcı başlık harfini getirir (avatar için)
 */
export const getUserInitial = (state: AppState): string => {
  const name = getUserName(state);
  return name === 'Bilinmeyen' ? 'U' : name.charAt(0).toUpperCase();
};