
import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface ProductFormProps {
  product?: Product;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    category: product?.category || 'Milk',
    stock: product?.stock || 0,
    weight: product?.weight || '',
    image: product?.image || '',
    isAvailable: product?.isAvailable ?? true
  });

  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    setPreviewError(false);
  }, [formData.image]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.price <= 0 || formData.stock < 0) {
      alert('Please enter valid price and stock values.');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose}></div>
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{product ? 'Update Inventory Item' : 'Create New Product'}</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Fill in the details below to manage your catalog</p>
          </div>
          <button type="button" onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
          {/* Image & Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-4">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Image</label>
              <div className="aspect-square w-full rounded-3xl bg-slate-100 overflow-hidden border-2 border-slate-100 relative group">
                {formData.image && !previewError ? (
                  <img 
                    src={formData.image} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                    onError={() => setPreviewError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                    <span className="material-symbols-outlined text-4xl">image</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">No Preview Available</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <span className="text-white text-xs font-black uppercase tracking-widest">Image Preview</span>
                </div>
              </div>
              <input 
                type="text"
                placeholder="Paste Image URL..."
                value={formData.image}
                onChange={e => setFormData({...formData, image: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-zepto-blue/10 transition-all font-medium text-xs"
              />
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Title</label>
                <input 
                  type="text" required value={formData.name}
                  placeholder="e.g. Fresh Malai Paneer"
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-zepto-blue focus:bg-white transition-all font-black text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as any})}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-zepto-blue font-black text-slate-900 appearance-none"
                  >
                    <option>Milk</option>
                    <option>Meat</option>
                    <option>Fruits</option>
                    <option>Vegetables</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit / Weight</label>
                  <input 
                    type="text" placeholder="e.g. 500g, 1L" value={formData.weight}
                    onChange={e => setFormData({...formData, weight: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-zepto-blue font-black text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Inventory Description</label>
            <textarea 
              rows={3} value={formData.description}
              placeholder="Provide a detailed description of the product for customers..."
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-zepto-blue transition-all font-bold text-slate-600 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Retail Price (₹)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</span>
                <input 
                  type="number" required value={formData.price}
                  onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                  className="w-full pl-10 pr-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-zepto-blue font-black text-slate-900"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Stock</label>
              <input 
                type="number" required value={formData.stock}
                onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-zepto-blue font-black text-slate-900"
              />
            </div>
            <div className="col-span-2 md:col-span-1 flex items-end pb-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-14 h-8 rounded-full p-1 transition-all ${formData.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`} onClick={() => setFormData({...formData, isAvailable: !formData.isAvailable})}>
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all ${formData.isAvailable ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Status</span>
              </label>
            </div>
          </div>
        </div>

        <div className="p-10 border-t border-slate-100 bg-slate-50/50 flex gap-4">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-5 border-2 border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-white hover:border-slate-300 transition-all uppercase tracking-widest text-[11px]">Discard Changes</button>
          <button type="submit" className="flex-1 px-4 py-5 bg-zepto-blue text-white rounded-2xl font-black shadow-xl shadow-zepto-blue/20 hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px]">
            {product ? 'Update Inventory' : 'Add to Catalog'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
