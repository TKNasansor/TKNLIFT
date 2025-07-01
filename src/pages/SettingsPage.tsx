import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AppSettings } from '../types';
import { Plus, Search, X, Check, QrCode, Trash2, Tag, AlertTriangle, Settings, User, Edit2, Save, Building, FileText, Upload } from 'lucide-react';

// Helper function to get file size in MB
const getFileSizeInMB = (base64String: string): number => {
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
  // Calculate size: base64 is about 4/3 times the original size
  const sizeInBytes = (base64Data.length * 3) / 4;
  return sizeInBytes / (1024 * 1024);
};

// Helper function to estimate total storage size
const estimateStorageSize = (certificates: string[]): number => {
  return certificates.reduce((total, cert) => total + getFileSizeInMB(cert), 0);
};

// Helper function to compress image
const compressImage = (file: File, maxSizeKB: number = 500): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions to keep aspect ratio
      let { width, height } = img;
      const maxDimension = 800; // Max width or height
      
      if (width > height) {
        if (width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Try different quality levels to stay under size limit
      let quality = 0.8;
      let result = canvas.toDataURL('image/jpeg', quality);
      
      while (getFileSizeInMB(result) > (maxSizeKB / 1024) && quality > 0.1) {
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality);
      }
      
      resolve(result);
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

const SettingsPage: React.FC = () => {
  const { state, updateSettings, deleteUser, addNotification } = useApp(); // addProposalTemplate, updateProposalTemplate, deleteProposalTemplate kaldırıldı

  const [localSettings, setLocalSettings] = useState<Partial<AppSettings>>(state.settings || {});

  useEffect(() => {
    setLocalSettings(state.settings || {});
  }, [state.settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('companyAddress.')) {
      const addressField = name.split('.')[1] as keyof AppSettings['companyAddress'];
      setLocalSettings(prev => ({
        ...prev,
        companyAddress: {
          ...(prev.companyAddress || {}),
          [addressField]: value
        }
      }));
    } else {
      setLocalSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(localSettings);
    addNotification('Ayarlar başarıyla kaydedildi!');
  };

  // Eski koddan kalan diğer state ve fonksiyon tanımlamaları - ÇOĞU KALDIRILDI
  const [editingCompany, setEditingCompany] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    companyName: state.settings?.companyName ?? '',
    companyPhone: state.settings?.companyPhone ?? '',
    companySlogan: state.settings?.companySlogan ?? '', // YENİ EKLENDİ
    companyAddress: state.settings?.companyAddress ?? {
      mahalle: '',
      sokak: '',
      il: '',
      ilce: '',
      binaNo: ''
    }
  });
  
  // Şablon ayarları ile ilgili state'ler kaldırıldı
  // Teklif şablonları ile ilgili state'ler kaldırıldı
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);

  const handleCompanySave = () => {
    updateSettings(companyInfo);
    setEditingCompany(false);
    addNotification('Firma bilgileri başarıyla kaydedildi!'); // Bildirim eklendi
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === state.currentUser?.id) {
      addNotification('Aktif kullanıcı silinemez!');
      return;
    }
    deleteUser(userId);
    setShowDeleteConfirm(null);
    addNotification('Kullanıcı başarıyla silindi!');
  };

  const handleCertificateUpload = async (files: FileList) => {
    setUploadingCertificate(true);
    
    try {
      const currentCertificates = state.settings?.certificates || [];
      const newCertificates = [...currentCertificates];
      
      for (const file of Array.from(files)) {
        // Check file type
        if (!file.type.match(/^image\/(png|jpg|jpeg)$/)) {
          addNotification(`${file.name} desteklenmeyen bir dosya formatı. Sadece PNG ve JPG dosyaları kabul edilir.`);
          continue;
        }
        
        // Check individual file size (before base64 encoding)
        const fileSizeInMB = file.size / (1024 * 1024);
        if (fileSizeInMB > 2) {
          addNotification(`${file.name} çok büyük (${fileSizeInMB.toFixed(1)}MB). Dosya boyutu 2MB'dan küçük olmalıdır.`);
          continue;
        }
        
        try {
          // Compress image
          const compressedBase64 = await compressImage(file, 400); // Max 400KB
          
          // Check if adding this certificate would exceed storage limits
          const estimatedNewSize = estimateStorageSize([...newCertificates, compressedBase64]);
          if (estimatedNewSize > 3) { // 3MB limit for certificates alone
            addNotification('Sertifika depolama limiti aşıldı. Daha az veya daha küçük sertifika yükleyin.');
            break;
          }
          
          newCertificates.push(compressedBase64);
          
        } catch (compressionError) {
          console.error('Image compression failed:', compressionError);
          addNotification(`${file.name} sıkıştırılamadı. Lütfen tekrar deneyin.`);
        }
      }
      
      if (newCertificates.length > currentCertificates.length) {
        try {
          updateSettings({ certificates: newCertificates });
          const addedCount = newCertificates.length - currentCertificates.length;
          addNotification(`${addedCount} sertifika başarıyla yüklendi!`);
        } catch (storageError) {
          console.error('Storage error:', storageError);
          addNotification('Depolama alanı yetersiz. Lütfen diğer verileri temizleyin veya daha küçük dosyalar yükleyin.');
        }
      }
      
    } catch (error) {
      console.error('Certificate upload error:', error);
      addNotification('Sertifika yükleme sırasında bir hata oluştu.');
    } finally {
      setUploadingCertificate(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size before processing
      const fileSizeInMB = file.size / (1024 * 1024);
      if (fileSizeInMB > 1) {
        addNotification('Logo dosyası çok büyük. Maksimum 1MB olmalıdır.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const base64String = reader.result as string;
          updateSettings({ logo: base64String });
          addNotification('Logo başarıyla yüklendi!');
        } catch (error) {
          console.error('Logo upload error:', error);
          addNotification('Logo yükleme sırasında bir hata oluştu. Daha küçük bir dosya deneyin.');
        }
      };
      reader.onerror = () => {
        addNotification('Logo dosyası okunamadı.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setCompanyInfo(prev => ({
      ...prev,
      companyAddress: {
        ...prev.companyAddress,
        [field]: value
      }
    }));
  };

  const getFullCompanyAddress = () => {
    if (!state.settings?.companyAddress) return 'Belirtilmemiş';
    const { mahalle, sokak, binaNo, ilce, il } = state.settings.companyAddress;
    return `${mahalle} ${sokak} ${binaNo}, ${ilce}/${il}`.trim();
  };
  
  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Uygulama Ayarları</h1>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Uygulama Başlığı bölümü kaldırıldı */}
        {/* Logo bölümü Firma Bilgileri'ne taşındı */}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Building className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Firma Bilgileri</h3>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {editingCompany ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Firma Adı
                  </label>
                  <input
                    type="text"
                    value={companyInfo.companyName}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Firma adı"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Firma Slogan
                  </label>
                  <input
                    type="text"
                    value={companyInfo.companySlogan} // YENİ EKLENDİ
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, companySlogan: e.target.value }))} // YENİ EKLENDİ
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Firma sloganı"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Firma Telefonu
                  </label>
                  <input
                    type="text"
                    value={companyInfo.companyPhone}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, companyPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0555 123 45 67"
                  />
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Firma Adresi</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">İl</label>
                      <input
                        type="text"
                        value={companyInfo.companyAddress.il}
                        onChange={(e) => handleAddressChange('il', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="İstanbul"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600">İlçe</label>
                      <input
                        type="text"
                        value={companyInfo.companyAddress.ilce}
                        onChange={(e) => handleAddressChange('ilce', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Kadıköy"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Mahalle</label>
                    <input
                      type="text"
                      value={companyInfo.companyAddress.mahalle}
                      onChange={(e) => handleAddressChange('mahalle', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Merkez Mahalle"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Sokak</label>
                    <input
                      type="text"
                      value={companyInfo.companyAddress.sokak}
                      onChange={(e) => handleAddressChange('sokak', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Ana Cadde"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Bina No</label>
                    <input
                      type="text"
                      value={companyInfo.companyAddress.binaNo}
                      onChange={(e) => handleAddressChange('binaNo', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="123"
                    />
                  </div>
                </div>

                <div> {/* Logo yükleme buraya taşındı */}
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Firma Logosu
                  </label>
                  <div className="flex items-center space-x-4">
                    {state.settings?.logo && (
                      <img 
                        src={state.settings.logo} 
                        alt="Logo" 
                        className="h-12 w-12 object-contain"
                      />
                    )}
                    <button
                      type="button" // type="button" eklendi
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Logo Yükle
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="button" // type="button" eklendi
                    onClick={handleCompanySave}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 inline mr-1" />
                    Kaydet
                  </button>
                  <button
                    type="button" // type="button" eklendi
                    onClick={() => {
                      setEditingCompany(false);
                      setCompanyInfo({
                        companyName: state.settings?.companyName ?? '',
                        companyPhone: state.settings?.companyPhone ?? '',
                        companySlogan: state.settings?.companySlogan ?? '', // YENİ EKLENDİ
                        companyAddress: state.settings?.companyAddress ?? {
                          mahalle: '',
                          sokak: '',
                          il: '',
                          ilce: '',
                          binaNo: ''
                        }
                      });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    <X className="h-4 w-4 inline mr-1" />
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Firma Adı</h4>
                    <p className="text-gray-900">{state.settings?.companyName}</p>
                  </div>
                  <button
                    type="button" // type="button" eklendi
                    onClick={() => setEditingCompany(true)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Firma Slogan</h4> {/* YENİ EKLENDİ */}
                  <p className="text-gray-900">{state.settings?.companySlogan}</p> {/* YENİ EKLENDİ */}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700">Firma Telefonu</h4>
                  <p className="text-gray-900">{state.settings?.companyPhone}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Firma Adresi</h4>
                  <p className="text-gray-900">{getFullCompanyAddress()}</p>
                </div>

                <div> {/* Logo önizlemesi buraya taşındı */}
                  <h4 className="text-sm font-medium text-gray-700">Firma Logosu</h4>
                  {state.settings?.logo ? (
                    <img 
                      src={state.settings.logo} 
                      alt="Logo" 
                      className="h-12 w-12 object-contain mt-2"
                    />
                  ) : (
                    <p className="text-gray-500 text-sm mt-2">Logo yüklenmemiş.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Şablon Ayarları bölümü kaldırıldı */}
        {/* Teklif Şablonları (Word/PDF) bölümü kaldırıldı */}

        {/* Amblem Ayarları bölümü Sertifika Ayarları olarak güncellendi */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Sertifika Ayarları</h3> {/* BAŞLIK GÜNCELLENDİ */}
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Sertifikalar
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (uploadingCertificate) {
                      addNotification('Sertifika yükleme devam ediyor, lütfen bekleyin...');
                      return;
                    }
                    
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.png,.jpg,.jpeg';
                    input.multiple = true;
                    input.onchange = async (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files) {
                        await handleCertificateUpload(files);
                      }
                    };
                    input.click();
                  }}
                  className={`inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${uploadingCertificate ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={uploadingCertificate}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {uploadingCertificate ? 'Yükleniyor...' : 'Sertifika Yükle'}
                </button>
              </div>
              
              {state.settings?.certificates && state.settings.certificates.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {state.settings.certificates.map((cert, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={cert} 
                        alt={`Sertifika ${index + 1}`} 
                        className="w-full h-20 object-contain border border-gray-200 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            const updatedCertificates = state.settings?.certificates?.filter((_, i) => i !== index) || [];
                            updateSettings({ certificates: updatedCertificates });
                            addNotification('Sertifika silindi!');
                          } catch (error) {
                            console.error('Certificate deletion error:', error);
                            addNotification('Sertifika silinirken bir hata oluştu.');
                          }
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="mt-2 text-xs text-gray-500">
                PNG veya JPG formatında sertifikalarınızı yükleyin (maksimum 2MB). Dosyalar otomatik olarak optimize edilecektir. 
                {state.settings?.certificates && state.settings.certificates.length > 0 && (
                  <span className="block mt-1 text-blue-600">
                    Toplam sertifika boyutu: {estimateStorageSize(state.settings.certificates).toFixed(1)}MB
                  </span>
                )}
              </p>
              
              {state.settings?.certificates && estimateStorageSize(state.settings.certificates) > 2.5 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                    <p className="text-xs text-yellow-800">
                      Sertifika depolama alanı dolmak üzere. Daha fazla sertifika yüklemek için bazılarını silmeniz gerekebilir.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {state.settings?.certificates && state.settings.certificates.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Sertifika Önizlemesi (Bakım Fişi Görünümü):</h4>
                <div className="flex justify-center space-x-2 flex-wrap gap-2">
                  {state.settings.certificates.map((cert, index) => (
                    <img 
                      key={index}
                      src={cert} 
                      alt={`Sertifika ${index + 1}`} 
                      className="h-10 w-auto object-contain"
                    />
                  ))}
                </div>
              </div>
            )}
            
            {(!state.settings?.certificates || state.settings.certificates.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Henüz sertifika yüklenmemiş.</p>
                <p className="text-sm mt-1">
                  Sertifikalarınızı yükleyerek bakım fişlerinizde gösterebilirsiniz.
                  <br />
                  <span className="text-xs text-gray-400">
                    Önerilen boyut: 800x600 piksel veya daha küçük
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Bakım Fişi Notu</h3>
            </div>
          </div>
          
          <div className="p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Varsayılan Bakım Notu
              </label>
              <textarea
                rows={4}
                value={state.settings?.defaultMaintenanceNote || ''}
                onChange={(e) => updateSettings({ defaultMaintenanceNote: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Bu bakım fişinde görünecek varsayılan notu girin..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Bu not tüm bakım fişlerinde gösterilecektir. Özel durumlar için her bakım fişinde ayrı ayrı düzenlenebilir.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Teklif Şablonları</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  // Yeni teklif şablonu ekleme modalını aç
                  // Bu fonksiyonalite ileride eklenecek
                  addNotification('Teklif şablonu yönetimi yakında eklenecektir!');
                }}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Yeni Şablon
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Teklif Şablonu Yönetimi</p>
              <p className="text-sm mb-4">Buradan montaj, bakım ve revizyon teklifleriniz için şablonlar oluşturabilir ve düzenleyebilirsiniz.</p>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Özellikler:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Montaj Teklifi Şablonları</li>
                  <li>Bakım Sözleşmesi Şablonları</li>
                  <li>Revizyon Teklifi Şablonları</li>
                  <li>Özelleştirilebilir Alanlar</li>
                  <li>Logo ve Sertifika Entegrasyonu</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => addNotification('Bu özellik geliştirme aşamasındadır. Yakında kullanılabilir olacaktır!')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                İlk Şablonunuzu Oluşturun
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Kullanıcı Ayarları</h3>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {state.users.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-gray-900 font-medium">{user.name}</span>
                    {user.id === state.currentUser?.id && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Aktif
                      </span>
                    )}
                  </div>
                  {user.id !== state.currentUser?.id && (
                    <button
                      type="button" // type="button" eklendi
                      onClick={() => setShowDeleteConfirm(user.id)}
                      className="p-2 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Teklif Şablonu Form Modalı kaldırıldı */}

      {/* Silme Onayı Modalı */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Kullanıcıyı Sil
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Bu kullanıcıyı silmek istediğinizden emin misiniz?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button" // type="button" eklendi
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="button" // type="button" eklendi
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;