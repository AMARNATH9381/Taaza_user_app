
import React, { useState, useMemo, useEffect } from 'react';
import { mockOrders as initialOrders } from '../services/mockData';
import { OrderStatus, Order } from '../types';

const ITEMS_PER_PAGE = 5;

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<OrderStatus | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // UI State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Order; direction: 'asc' | 'desc' } | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sorting Logic
  const handleSort = (key: keyof Order) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter, Search, and Sort Logic
  const processedOrders = useMemo(() => {
    let result = orders.filter(order => {
      const matchesStatus = filter === 'All' || order.status === filter;
      const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.phone.includes(searchTerm);
      return matchesStatus && matchesSearch;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [orders, filter, searchTerm, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(processedOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [processedOrders, currentPage]);

  // Actions
  const handleUpdateStatus = (id: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === id) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }
    showToast(`Order ${id} updated to ${newStatus}`);
  };

  const handleBulkUpdate = (newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => selectedRows.includes(o.id) ? { ...o, status: newStatus } : o));
    showToast(`Updated ${selectedRows.length} orders to ${newStatus}`);
    setSelectedRows([]);
  };

  const handleCreateOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newOrder: Order = {
      id: `ORD-00${orders.length + 1}`,
      customerName: formData.get('customerName') as string,
      phone: formData.get('phone') as string,
      items: Number(formData.get('items')),
      total: Number(formData.get('total')),
      status: OrderStatus.PENDING,
      date: new Date().toISOString().split('T')[0],
      address: formData.get('address') as string,
    };
    setOrders([newOrder, ...orders]);
    setIsCreateModalOpen(false);
    showToast('New order created successfully!');
  };

  const toggleRow = (id: string) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
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

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Orders</h1>
          <p className="text-slate-500 text-sm font-medium">Monitoring {orders.length} active delivery requests</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
              className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-zepto-blue">calendar_month</span>
              <span>Nov 01 - Nov 30</span>
              <span className="material-symbols-outlined text-slate-400">expand_more</span>
            </button>
            {isDateMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 p-2 overflow-hidden animate-in zoom-in-95">
                {['Today', 'Yesterday', 'Last 7 Days', 'This Month', 'Custom Range'].map(range => (
                  <button key={range} onClick={() => setIsDateMenuOpen(false)} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-zepto-blue text-white px-5 py-2.5 rounded-xl font-black shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
          >
            <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
            Create Order
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedRows.length > 0 && (
        <div className="bg-zepto-yellow/10 border border-zepto-yellow/30 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <span className="bg-zepto-yellow text-zepto-blue w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">
              {selectedRows.length}
            </span>
            <span className="text-sm font-bold text-zepto-blue">Orders selected</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleBulkUpdate(OrderStatus.DELIVERED)}
              className="px-4 py-2 bg-zepto-blue text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Mark Delivered
            </button>
            <button 
              onClick={() => setSelectedRows([])}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-white transition-colors"
            >
              Cancel Selection
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input 
            type="text"
            placeholder="Search by ID, customer, or phone..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-transparent rounded-xl outline-none focus:ring-2 focus:ring-zepto-blue/10 transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          {['All', OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.DELIVERED, OrderStatus.CANCELLED].map((status) => (
            <button
              key={status}
              className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                filter === status 
                  ? 'bg-zepto-blue text-white shadow-lg shadow-zepto-blue/20' 
                  : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
              }`}
              onClick={() => {
                setFilter(status as any);
                setCurrentPage(1);
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-xs text-slate-500 uppercase font-bold tracking-widest border-b border-slate-100">
                <th className="px-6 py-5 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-zepto-blue" 
                    onChange={(e) => {
                      if (e.target.checked) setSelectedRows(paginatedOrders.map(o => o.id));
                      else setSelectedRows([]);
                    }}
                    checked={paginatedOrders.length > 0 && paginatedOrders.every(o => selectedRows.includes(o.id))}
                  />
                </th>
                <th className="px-6 py-5 cursor-pointer hover:text-zepto-blue transition-colors" onClick={() => handleSort('id')}>
                  Order ID {sortConfig?.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-5 cursor-pointer hover:text-zepto-blue transition-colors" onClick={() => handleSort('customerName')}>
                  Customer {sortConfig?.key === 'customerName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-5">Items</th>
                <th className="px-6 py-5 cursor-pointer hover:text-zepto-blue transition-colors" onClick={() => handleSort('total')}>
                  Amount {sortConfig?.key === 'total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 cursor-pointer hover:text-zepto-blue transition-colors" onClick={() => handleSort('date')}>
                  Date {sortConfig?.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.length > 0 ? paginatedOrders.map((order) => (
                <tr 
                  key={order.id} 
                  className={`transition-colors cursor-pointer group ${selectedRows.includes(order.id) ? 'bg-zepto-blue/5' : 'hover:bg-slate-50/80'}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-zepto-blue" 
                      checked={selectedRows.includes(order.id)}
                      onChange={() => toggleRow(order.id)}
                    />
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-black text-zepto-blue">#{order.id.split('-')[1]}</span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-black text-slate-900 group-hover:text-zepto-blue transition-colors">{order.customerName}</p>
                    <p className="text-[10px] text-slate-400 font-bold tracking-tight">{order.phone}</p>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-500">{order.items} Items</td>
                  <td className="px-6 py-5 text-sm font-black text-slate-900">₹{order.total}</td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      order.status === OrderStatus.DELIVERED ? 'bg-emerald-100 text-emerald-700' :
                      order.status === OrderStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                      order.status === OrderStatus.PROCESSING ? 'bg-blue-100 text-blue-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-500 font-bold">{order.date}</td>
                  <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => setSelectedOrder(order)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-zepto-blue transition-colors">
                          <span className="material-symbols-outlined text-lg">visibility</span>
                       </button>
                       <button onClick={() => showToast(`Printing receipt for ${order.id}`)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
                          <span className="material-symbols-outlined text-lg">print</span>
                       </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <span className="material-symbols-outlined text-5xl">search_off</span>
                      <p className="font-black text-lg">No Orders Found</p>
                      <p className="text-sm font-medium">Try adjusting your filters or search terms</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 font-bold">
            Showing <span className="text-slate-900">{Math.min(processedOrders.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}-{Math.min(processedOrders.length, currentPage * ITEMS_PER_PAGE)}</span> of <span className="text-slate-900">{processedOrders.length}</span> results
          </p>
          <div className="flex gap-1.5">
            <button 
              className="px-4 py-2 text-xs border border-slate-200 rounded-xl font-black hover:bg-slate-50 transition-all disabled:opacity-30" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, idx) => (
              <button 
                key={idx}
                className={`w-10 h-10 text-xs rounded-xl font-black transition-all ${
                  currentPage === idx + 1 ? 'bg-zepto-blue text-white shadow-xl shadow-zepto-blue/20' : 'border border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => setCurrentPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button 
              className="px-4 py-2 text-xs border border-slate-200 rounded-xl font-black hover:bg-slate-50 transition-all disabled:opacity-30" 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setIsCreateModalOpen(false)}></div>
          <form onSubmit={handleCreateOrder} className="bg-white w-full max-w-xl rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-900">Create New Order</h2>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Customer Name</label>
                  <input name="customerName" required type="text" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-zepto-blue transition-all font-bold" placeholder="e.g. Rahul Sharma" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                  <input name="phone" required type="tel" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-zepto-blue transition-all font-bold" placeholder="9876543210" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Item Count</label>
                  <input name="items" required type="number" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-zepto-blue transition-all font-bold" placeholder="5" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Amount (₹)</label>
                  <input name="total" required type="number" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-zepto-blue transition-all font-bold" placeholder="1250" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Delivery Date</label>
                  <input type="date" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-zepto-blue transition-all font-bold" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Address</label>
                  <textarea name="address" required rows={3} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-zepto-blue transition-all font-bold" placeholder="Indiranagar, Block 4, House 12..."></textarea>
                </div>
              </div>
            </div>
            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 px-4 py-4 border-2 border-slate-200 rounded-2xl font-black text-slate-600 hover:bg-white hover:border-slate-300 transition-all">Discard</button>
              <button type="submit" className="flex-1 px-4 py-4 bg-zepto-blue text-white rounded-2xl font-black shadow-xl shadow-zepto-blue/20 hover:bg-slate-800 transition-all">Submit Order</button>
            </div>
          </form>
        </div>
      )}

      {/* Enhanced Order Detail Modal (Simplified implementation from previous turn but integrated) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setSelectedOrder(null)}></div>
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">Order Details</h2>
              <button className="p-2 hover:bg-slate-100 rounded-full" onClick={() => setSelectedOrder(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-6">
              <div className="flex justify-between border-b pb-6">
                 <div>
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                   <p className="text-lg font-bold">{selectedOrder.customerName}</p>
                   <p className="text-sm text-slate-500">{selectedOrder.phone}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                   <p className="text-3xl font-black text-zepto-blue">₹{selectedOrder.total}</p>
                 </div>
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Delivery Timeline</p>
                <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
                   <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                         <div className="w-3 h-3 rounded-full bg-zepto-green"></div>
                         <div className="w-0.5 h-12 bg-zepto-green"></div>
                         <div className={`w-3 h-3 rounded-full ${selectedOrder.status !== OrderStatus.PENDING ? 'bg-zepto-green' : 'bg-slate-300'}`}></div>
                      </div>
                      <div className="flex-1 space-y-8">
                         <div>
                            <p className="text-sm font-bold">Order Received</p>
                            <p className="text-xs text-slate-400">{selectedOrder.date} - 10:45 AM</p>
                         </div>
                         <div>
                            <p className="text-sm font-bold">In Processing</p>
                            <p className="text-xs text-slate-400">Ready for pickup</p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
            <div className="p-8 border-t bg-slate-50/50 flex gap-3">
              <button 
                onClick={() => handleUpdateStatus(selectedOrder.id, OrderStatus.DELIVERED)}
                disabled={selectedOrder.status === OrderStatus.DELIVERED}
                className="flex-1 bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-emerald-600 disabled:opacity-50"
              >
                Complete Delivery
              </button>
              <button onClick={() => setSelectedOrder(null)} className="px-6 py-4 border-2 rounded-2xl font-black text-slate-400 hover:text-slate-600">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
