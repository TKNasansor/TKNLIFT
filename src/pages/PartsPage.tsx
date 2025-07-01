import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, X, Percent } from 'lucide-react';

const PartsPage: React.FC = () => {
  const { state, addPart, updatePart, deletePart, increasePrices } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPriceIncreaseForm, setShowPriceIncreaseForm] = useState(false);
  const [increasePercentage, setIncreasePercentage] = useState(5);
  
  const [newPart, setNewPart] = useState({
    name: '',
    quantity: 0,
    price: 0,
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPart(prev => ({
      ...prev,
      [name]: name === 'name' ? value : Number(value),
    }));
  };
  
  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    addPart(newPart);
    setNewPart({
      name: '',
      quantity: 0,
      price: 0,
    });
    setShowAddForm(false);
  };
  
  const handleIncreasePrices = (e: React.FormEvent) => {
    e.preventDefault();
    increasePrices(increasePercentage);
    setShowPriceIncreaseForm(false);
    alert(`Tüm parça fiyatları %${increasePercentage} artırıldı ve en yakın 50'nin katına yuvarlandı.`);
  };
  
  const filteredParts = state.parts.filter(part => {
    if (searchQuery.trim() === '') return true;
    
    const query = searchQuery.toLowerCase();
    return part.name.toLowerCase().includes(query);
  });
  
  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Parçalar</h1>
        
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Parça ara..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button
            type="button"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Parça Ekle
          </button>
          
          <button
            type="button"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            onClick={() => setShowPriceIncreaseForm(true)}
          >
            <Percent className="h-5 w-5 mr-2" />
            Fiyat Artışı
          </button>
        </div>
      </div>
      
      {/* Add Part Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-800">Yeni Parça Ekle</h2>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowAddForm(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddPart} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Parça Adı
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={newPart.name}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    Miktar
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    required
                    min="0"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={newPart.quantity}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Fiyat (₺)
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    required
                    min="0"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={newPart.price}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Price Increase Modal */}
      {showPriceIncreaseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-800">Fiyat Artışı</h2>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowPriceIncreaseForm(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleIncreasePrices} className="p-6">
              <div>
                <label htmlFor="increasePercentage" className="block text-sm font-medium text-gray-700">
                  Artış Yüzdesi (%)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    id="increasePercentage"
                    min="1"
                    max="100"
                    className="block w-full pr-12 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={increasePercentage}
                    onChange={(e) => setIncreasePercentage(Number(e.target.value))}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <span className="h-full inline-flex items-center px-3 border-l border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                      %
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Bu işlem tüm parçaların fiyatlarını belirtilen yüzde oranında artıracaktır.
                </p>
              </div>
              
              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Fiyat Artışını Uygula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow overflow-x-auto rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parça Adı
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Miktar
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Birim Fiyat
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Toplam Değer
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Eylemler</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredParts.length > 0 ? (
              filteredParts.map((part) => (
                <tr key={part.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{part.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{part.quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{part.price.toLocaleString('tr-TR')} ₺</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{(part.quantity * part.price).toLocaleString('tr-TR')} ₺</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-900"
                      onClick={() => deletePart(part.id)}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  {searchQuery ? 'Arama kriterine uygun parça bulunamadı.' : 'Henüz parça bulunmamaktadır.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PartsPage;