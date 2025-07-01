import { Building } from '../types';

/**
 * Binanın tam adresini formatlar
 */
export const getFullAddress = (building: Building): string => {
  if (!building.address) return 'Adres belirtilmemiş';
  const { mahalle, sokak, binaNo, ilce, il } = building.address;
  return `${mahalle} ${sokak} ${binaNo}, ${ilce}/${il}`.trim();
};

/**
 * Binanın toplam bakım ücretini hesaplar
 */
export const getTotalMaintenanceFee = (building: Building): number => {
  return building.maintenanceFee * building.elevatorCount;
};

/**
 * Bina etiket rengini döndürür
 */
export const getLabelColor = (label: string | null): string => {
  switch (label) {
    case 'green': return 'bg-green-500';
    case 'blue': return 'bg-blue-500';
    case 'yellow': return 'bg-yellow-500';
    case 'red': return 'bg-red-500';
    default: return 'bg-gray-300';
  }
};

/**
 * Bina etiket metnini döndürür
 */
export const getLabelText = (label: string | null): string => {
  switch (label) {
    case 'green': return 'Yeşil';
    case 'blue': return 'Mavi';
    case 'yellow': return 'Sarı';
    case 'red': return 'Kırmızı';
    default: return 'Etiketsiz';
  }
};

/**
 * Binanın arızalı durumunu kontrol eder
 */
export const isBuildingDefective = (building: Building): boolean => {
  return Boolean(building.isDefective);
};

/**
 * Binanın bakım durumunu kontrol eder
 */
export const isBuildingMaintained = (building: Building): boolean => {
  return Boolean(building.isMaintained);
};