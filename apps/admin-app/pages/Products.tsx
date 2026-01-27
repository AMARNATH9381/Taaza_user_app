
import React, { useState, useMemo } from 'react';
import { mockProducts as initialProducts } from '../services/mockData';
import { Product } from '../types';
import ProductForm from '../components/ProductForm';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCat && matchesSearch;
    });

    result.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [products, selectedCategory, searchTerm, sortConfig]);

  const toggleProductAvailability = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isAvailable: !p.isAvailable } : p));
    showToast('Product availability updated');
  };

  const handleBulkMarkOutOfStock = () => {
    setProducts(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, isAvailable: false } : p));
    showToast(`Updated ${selectedIds.length} products to Out of Stock`);
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) {
      setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
      showToast(`Successfully deleted ${selectedIds.length} products`, 'success');
      setSelectedIds([]);
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Delete this product permanently?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast('Product deleted successfully');
    }
  };

  const handleSaveProduct = (data: any) => {
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...data } : p));
      showToast('Product updated successfully');
    } else {
      const newProduct: Product = {
        ...data,
        id: `PROD-${Date.now()}`,
        image: data.image || `https://picsum.photos/400/300?random=${Date.now()}`
      };
      setProducts(prev => [newProduct, ...prev]);
      showToast('New product added to inventory');
    }
    setIsFormOpen(false);
    setEditingProduct(undefined);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative pb-20">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 ${
          toast.type === 'success' ? 'bg-zepto-blue text-white' : 'bg-red-600 text-white'
        }`}>
          <span className="material-symbols-outlined">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inventory Control</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Managing {products.length} catalog items across {Array.from(new Set(products.map(p => p.category))).length} categories</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-2xl flex border border-slate-100 shadow-sm">
            <button className={`p-2 rounded-xl transition-all ${viewType === 'grid' ? 'bg-zepto-blue text-white' : 'text-slate-400 hover:bg-slate-50'}`} onClick={() => setViewType('grid')}>
              <span className="material-symbols-outlined text-xl">grid_view</span>
            </button>
            <button className={`p-2 rounded-xl transition-all ${viewType === 'list' ? 'bg-zepto-blue text-white' : 'text-slate-400 hover:bg-slate-50'}`} onClick={() => setViewType('list')}>
              <span className="material-symbols-outlined text-xl">view_list</span>
            </button>
          </div>
          <button 
            onClick={() => { setEditingProduct(undefined); setIsFormOpen(true); }}
            className="bg-zepto-blue text-white px-6 py-3.5 rounded-2xl font-black shadow-xl shadow-zepto-blue/20 flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">add_box</span>
            New Product
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              type="text" 
              placeholder="Search by product name, category, or ID..." 
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:border-zepto-blue/10 focus:bg-white transition-all font-medium text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0 w-full lg:w-auto">
            {['All', 'Milk', 'Meat', 'Fruits', 'Vegetables'].map(cat => (
              <button
                key={cat}
                className={`px-5 py-3 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-zepto-yellow text-zepto-blue shadow-lg shadow-zepto-yellow/20' : 'bg-slate-50 text-slate-500 border border-transparent hover:border-slate-200'}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between border-t border-slate-50 pt-4">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort By:</span>
            <div className="flex gap-2">
              {[
                { label: 'Name', key: 'name' },
                { label: 'Price', key: 'price' },
                { label: 'Stock', key: 'stock' }
              ].map(opt => (
                <button 
                  key={opt.label}
                  onClick={() => setSortConfig({ key: opt.key as any, direction: sortConfig.key === opt.key && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${sortConfig.key === opt.key ? 'bg-zepto-blue text-white border-zepto-blue' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`}
                >
                  {opt.label}
                  {sortConfig.key === opt.key && (
                    <span className="material-symbols-outlined text-xs">
                      {sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Found {filteredAndSortedProducts.length} Products
          </p>
        </div>
      </div>

      {/* Bulk Actions Float */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 rounded-[2rem] p-4 flex items-center gap-6 text-white shadow-2xl z-50 border border-white/10 animate-in slide-in-from-bottom-8">
           <div className="flex items-center gap-3 pl-4">
              <div className="w-10 h-10 rounded-full bg-zepto-yellow text-zepto-blue flex items-center justify-center font-black">
                {selectedIds.length}
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-white/80 pr-4 border-r border-white/10">Selected</p>
           </div>
           <div className="flex gap-2">
              <button onClick={handleBulkMarkOutOfStock} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Mark Sold Out</button>
              <button onClick={handleBulkDelete} className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Delete Bulk</button>
              <button onClick={() => setSelectedIds([])} className="p-3 text-white/50 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
           </div>
        </div>
      )}

      {filteredAndSortedProducts.length === 0 ? (
        <div className="bg-white rounded-[3rem] py-32 text-center border-2 border-dashed border-slate-100">
           <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
             <span className="material-symbols-outlined text-5xl text-slate-300">inventory_2</span>
           </div>
           <h3 className="text-xl font-black text-slate-900">No products match your search</h3>
           <p className="text-slate-400 font-medium mt-2">Try adjusting your filters or search terms</p>
        </div>
      ) : viewType === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredAndSortedProducts.map(product => (
            <div key={product.id} className={`bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-2xl hover:shadow-slate-200 transition-all flex flex-col relative ${!product.isAvailable ? 'opacity-75' : ''}`}>
              <div className="relative h-60 bg-slate-100 overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-5 left-5">
                   <input 
                    type="checkbox" 
                    checked={selectedIds.includes(product.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelection(product.id);
                    }}
                    className="w-6 h-6 rounded-xl border-white bg-white/40 backdrop-blur-md text-zepto-blue focus:ring-0 cursor-pointer shadow-lg" 
                   />
                </div>
                <div className="absolute top-5 right-5 flex flex-col gap-2">
                  <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md border border-white/20 ${product.isAvailable ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                    {product.isAvailable ? 'In Stock' : 'Sold Out'}
                  </span>
                  {product.stock < 50 && product.isAvailable && (
                    <span className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl bg-zepto-yellow text-zepto-blue">
                      Low Stock
                    </span>
                  )}
                </div>
              </div>
              <div className="p-8 space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-black text-slate-900 text-lg leading-tight group-hover:text-zepto-blue transition-colors truncate pr-2">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-lg">{product.category}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">• {product.weight}</span>
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900">₹{product.price}</p>
                </div>
                
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <span>Stock Level</span>
                    <span className={`${product.stock < 50 ? 'text-red-500' : 'text-slate-900'}`}>{product.stock} Units</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${product.stock < 50 ? 'bg-red-500' : 'bg-zepto-blue'}`}
                      style={{ width: `${Math.min(100, (product.stock / 500) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 mt-auto">
                  <button onClick={() => { setEditingProduct(product); setIsFormOpen(true); }} className="flex-1 bg-slate-900 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-900/10">Edit</button>
                  <button onClick={() => toggleProductAvailability(product.id)} className={`px-4 py-3.5 rounded-2xl border-2 transition-all active:scale-95 ${product.isAvailable ? 'border-red-50 text-red-500 hover:bg-red-50' : 'border-emerald-50 text-emerald-500 hover:bg-emerald-50'}`}>
                    <span className="material-symbols-outlined text-xl">{product.isAvailable ? 'block' : 'check_circle'}</span>
                  </button>
                  <button onClick={() => handleDeleteProduct(product.id)} className="px-4 py-3.5 rounded-2xl border-2 border-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95">
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] border-b border-slate-100">
                  <th className="px-8 py-6 w-16">
                     <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-lg border-slate-200 text-zepto-blue" 
                      onChange={(e) => setSelectedIds(e.target.checked ? filteredAndSortedProducts.map(p => p.id) : [])} 
                      checked={filteredAndSortedProducts.length > 0 && filteredAndSortedProducts.every(p => selectedIds.includes(p.id))}
                     />
                  </th>
                  <th className="px-8 py-6">Product Item</th>
                  <th className="px-8 py-6">Category</th>
                  <th className="px-8 py-6">Price</th>
                  <th className="px-8 py-6">Availability</th>
                  <th className="px-8 py-6">Stock Level</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAndSortedProducts.map(product => (
                  <tr key={product.id} className={`hover:bg-slate-50/50 transition-colors group ${selectedIds.includes(product.id) ? 'bg-zepto-blue/5' : ''}`}>
                    <td className="px-8 py-5">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(product.id)} 
                        onChange={() => toggleSelection(product.id)} 
                        className="w-5 h-5 rounded-lg border-slate-200 text-zepto-blue focus:ring-0" 
                      />
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                          <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{product.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{product.weight}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/50">{product.category}</span>
                    </td>
                    <td className="px-8 py-5 text-sm font-black text-slate-900">₹{product.price}</td>
                    <td className="px-8 py-5">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                         product.isAvailable ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                       }`}>
                         {product.isAvailable ? 'Active' : 'Hidden'}
                       </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1.5 min-w-[120px]">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <span>{product.stock} Units</span>
                           {product.stock < 50 && <span className="text-red-500">Low</span>}
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                           <div className={`h-full rounded-full ${product.stock < 50 ? 'bg-red-500' : 'bg-zepto-blue'}`} style={{ width: `${Math.min(100, (product.stock / 500) * 100)}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditingProduct(product); setIsFormOpen(true); }} className="p-2.5 hover:bg-zepto-blue/10 rounded-xl text-slate-300 hover:text-zepto-blue transition-all">
                          <span className="material-symbols-outlined text-xl">edit_square</span>
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="p-2.5 hover:bg-red-50 rounded-xl text-slate-200 hover:text-red-500 transition-all">
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isFormOpen && (
        <ProductForm 
          product={editingProduct} 
          onClose={() => { setIsFormOpen(false); setEditingProduct(undefined); }} 
          onSubmit={handleSaveProduct} 
        />
      )}
    </div>
  );
};

export default Products;
