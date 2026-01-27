import React, { useEffect, useState, useRef } from 'react';
import { Header } from '../components/Layout';
import { useNavigate, useLocation } from 'react-router-dom';

interface ChatMessage {
    id: string;
    sender: 'bot' | 'user';
    text: string;
    isAction?: boolean;
}

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<'All' | 'Processing' | 'Delivered' | 'Cancelled'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected Order for Details Sheet
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  
  // Cancel Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [otherReasonText, setOtherReasonText] = useState('');

  // Rating Modal State
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingOrder, setRatingOrder] = useState<any>(null);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');

  // Cancellation Reasons
  const cancellationReasons = [
      "Placed by mistake",
      "Forgot to add items",
      "Found a better price",
      "Delivery time is too long",
      "Change of plans",
      "Other"
  ];

  // --- HELP / SUPPORT STATE ---
  const [showHelpSheet, setShowHelpSheet] = useState(false);
  const [helpOrder, setHelpOrder] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showAgentButton, setShowAgentButton] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load orders from localStorage
    const stored = localStorage.getItem('taaza_orders');
    if (stored) {
      const loadedOrders = JSON.parse(stored);
      setOrders(loadedOrders);

      // Deep link to specific order
      const highlightId = location.state?.highlightOrderId;
      if (highlightId) {
          const target = loadedOrders.find((o: any) => o.id === highlightId);
          if (target) {
              setSelectedOrder(target);
              // Clear state to prevent reopening on reload
              window.history.replaceState({}, document.title);
          }
      }
    }
  }, [location.state]);

  // Auto-scroll chat to bottom
  useEffect(() => {
      if (showHelpSheet) {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  }, [chatMessages, isTyping, showHelpSheet]);

  const handleReorder = (e: React.MouseEvent, orderItems: any[]) => {
      e.stopPropagation(); // Prevent opening modal
      // Add items to existing cart
      const currentCart = JSON.parse(localStorage.getItem('taaza_cart') || '[]');
      
      // Simple merge strategy: Add items from order to cart. If exists, increase quantity.
      const newCart = [...currentCart];
      
      orderItems.forEach(orderItem => {
          const existingItemIndex = newCart.findIndex(c => c.id === orderItem.id || c.name === orderItem.name);
          if (existingItemIndex > -1) {
              newCart[existingItemIndex].quantity += (orderItem.quantity || 1);
          } else {
              newCart.push({ ...orderItem });
          }
      });

      localStorage.setItem('taaza_cart', JSON.stringify(newCart));
      navigate('/cart');
  };

  const initiateCancel = () => {
      setCancelReason('');
      setOtherReasonText('');
      setShowCancelModal(true);
  };

  const confirmCancelOrder = () => {
      if (!selectedOrder) return;

      const finalReason = cancelReason === 'Other' ? otherReasonText : cancelReason;

      const updatedOrders = orders.map(o => 
          o.id === selectedOrder.id ? { 
              ...o, 
              status: 'Cancelled',
              cancellationReason: finalReason 
          } : o
      );
      
      setOrders(updatedOrders);
      localStorage.setItem('taaza_orders', JSON.stringify(updatedOrders));
      
      // Update selected order view to reflect change immediately
      setSelectedOrder({ ...selectedOrder, status: 'Cancelled', cancellationReason: finalReason });
      
      setShowCancelModal(false);
  };

  const openRatingModal = (e: React.MouseEvent, order: any) => {
      e.stopPropagation();
      setRatingOrder(order);
      setRatingScore(0);
      setRatingFeedback('');
      setShowRatingModal(true);
  };

  const submitRating = () => {
      if (!ratingOrder || ratingScore === 0) return;

      const updatedOrders = orders.map(o => 
          o.id === ratingOrder.id ? {
              ...o,
              rating: ratingScore,
              feedback: ratingFeedback
          } : o
      );

      setOrders(updatedOrders);
      localStorage.setItem('taaza_orders', JSON.stringify(updatedOrders));
      
      if (selectedOrder && selectedOrder.id === ratingOrder.id) {
          setSelectedOrder({ ...selectedOrder, rating: ratingScore, feedback: ratingFeedback });
      }

      setShowRatingModal(false);
  };

  // --- HELP CHAT LOGIC ---
  const handleHelpClick = (e: React.MouseEvent, order: any) => {
      e.stopPropagation();
      setHelpOrder(order);
      setShowHelpSheet(true);
      setChatMessages([]);
      setShowAgentButton(false);
      
      // Start Automated Flow
      setIsTyping(true);
      setTimeout(() => {
          setChatMessages([{
              id: '1',
              sender: 'bot',
              text: `Hi ${localStorage.getItem('taaza_user_name') || 'there'}! I'm Taaza's virtual assistant.`
          }]);
          
          setTimeout(() => {
             setChatMessages(prev => [...prev, {
                 id: '2',
                 sender: 'bot',
                 text: `Let me check the status of your Order #${order.id}...`
             }]);
             
             setTimeout(() => {
                 let statusMsg = '';
                 // Generate dynamic status message based on order state
                 if (order.status === 'Processing') {
                     statusMsg = `Your order is currently **Processing**. It is confirmed and being packed at the farm. It is scheduled to arrive **Tomorrow between 7 AM - 9 AM**.`;
                 } else if (order.status === 'Delivered') {
                     statusMsg = `This order was successfully **Delivered** on ${order.date}. I hope you enjoyed the fresh produce!`;
                 } else if (order.status === 'Cancelled') {
                     statusMsg = `This order was **Cancelled**. If you paid online, the refund has been initiated and will reflect in your source account within 5-7 business days.`;
                 }

                 setChatMessages(prev => [...prev, {
                     id: '3',
                     sender: 'bot',
                     text: statusMsg
                 }]);
                 setIsTyping(false);
                 setShowAgentButton(true);
             }, 1500);
          }, 1000);
      }, 500);
  };

  const handleConnectAgent = () => {
      setShowAgentButton(false);
      setChatMessages(prev => [...prev, {
          id: 'user-req',
          sender: 'user',
          text: 'I want to talk to customer care.'
      }]);

      setIsTyping(true);
      setTimeout(() => {
          setIsTyping(false);
          setChatMessages(prev => [...prev, {
              id: 'bot-connect',
              sender: 'bot',
              text: 'I understand. I am connecting you to a customer support executive now. Estimated wait time: 2 minutes.',
              isAction: true
          }]);
      }, 1500);
  };

  const filteredOrders = orders.filter(o => {
      const matchesFilter = filter === 'All' ? true : o.status === filter;
      const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            o.items.some((i: any) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="My Orders" backPath="/profile" />
      
      {/* Search & Filter */}
      <div className="sticky top-14 bg-gray-50 z-10 pt-2 border-b border-gray-100">
          <div className="px-4 mb-2">
            <div className="bg-white rounded-xl flex items-center px-4 h-11 shadow-sm border border-gray-200">
                <span className="material-symbols-outlined text-gray-400 mr-2">search</span>
                <input 
                    type="text" 
                    placeholder="Search by Order ID or Item..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-grow bg-transparent outline-none text-sm font-medium placeholder-gray-400"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                )}
            </div>
          </div>
          
          <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
            {['All', 'Processing', 'Delivered', 'Cancelled'].map((f) => (
                <button 
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${filter === f ? 'bg-zepto-blue text-white border-zepto-blue shadow-md' : 'bg-white text-gray-600 border-gray-200'}`}
                >
                    {f}
                </button>
            ))}
          </div>
      </div>

      <div className="p-4 space-y-4 pb-20 flex-grow overflow-y-auto">
        {filteredOrders.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
               <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">receipt_long</span>
               <h3 className="font-bold text-gray-500">No orders found</h3>
               <p className="text-xs text-gray-400 mt-1">Start shopping to see your orders here</p>
           </div>
        ) : (
          filteredOrders.map((order) => (
            <div 
                key={order.id} 
                onClick={() => setSelectedOrder(order)}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-slide-up group relative overflow-hidden hover:border-blue-200 transition-colors cursor-pointer"
            >
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${order.status === 'Delivered' ? 'bg-green-100 text-green-600' : order.status === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-zepto-blue'}`}>
                      <span className="material-symbols-outlined">
                        {order.status === 'Delivered' ? 'check_circle' : order.status === 'Cancelled' ? 'cancel' : 'inventory_2'}
                      </span>
                   </div>
                   <div>
                      <h3 className="font-bold text-gray-800 text-lg">₹{order.amount}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                          {order.date} 
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span className="font-mono">{order.id}</span>
                      </p>
                   </div>
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wide border ${
                    order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-100' : 
                    order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100' : 
                    'bg-blue-50 text-blue-700 border-blue-100'
                }`}>
                  {order.status}
                </div>
              </div>
              
              {/* Item Previews */}
              <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{order.items.length} ITEMS</p>
                     {order.paymentMethod && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{order.paymentMethod}</p>}
                  </div>
                  
                  <div className="flex -space-x-2 overflow-hidden py-1">
                      {order.items.slice(0, 4).map((item: any, i: number) => (
                          <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-white shadow-sm overflow-hidden relative flex items-center justify-center">
                              {item.image ? (
                                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                  <span className="text-xs font-bold text-gray-400">{item.name.charAt(0)}</span>
                              )}
                          </div>
                      ))}
                      {order.items.length > 4 && (
                           <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm z-10">
                               +{order.items.length - 4}
                           </div>
                      )}
                  </div>
                  <p className="text-xs text-gray-600 mt-2 truncate font-medium">
                      {order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>
              </div>

              <div className="flex gap-3 pt-2">
                 {order.status === 'Delivered' && !order.rating && (
                     <button 
                        onClick={(e) => openRatingModal(e, order)}
                        className="flex-1 py-2.5 rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-700 text-xs font-bold hover:bg-yellow-100 transition-colors flex items-center justify-center gap-1"
                     >
                         <span className="material-symbols-outlined text-sm">star</span>
                         Rate Order
                     </button>
                 )}
                 {order.status === 'Delivered' && order.rating && (
                     <div className="flex-1 py-2.5 rounded-xl border border-yellow-100 bg-yellow-50/50 text-yellow-600 text-xs font-bold flex items-center justify-center gap-1">
                         <span className="material-symbols-outlined text-sm text-yellow-500">star</span>
                         You Rated {order.rating}
                     </div>
                 )}
                 {order.status !== 'Delivered' && (
                    <button 
                        onClick={(e) => handleHelpClick(e, order)}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                    >
                        <span className="material-symbols-outlined text-sm">support_agent</span>
                        Help
                    </button>
                 )}
                 {order.status !== 'Cancelled' && (
                     <button 
                        onClick={(e) => handleReorder(e, order.items)}
                        className="flex-1 py-2.5 rounded-xl bg-blue-50 text-zepto-blue text-xs font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 border border-blue-100"
                     >
                         <span className="material-symbols-outlined text-sm">refresh</span>
                         Reorder
                     </button>
                 )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Details Bottom Sheet */}
      {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
              <div 
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                  onClick={() => setSelectedOrder(null)}
              ></div>
              
              <div className="relative bg-gray-50 rounded-t-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden">
                  
                  {/* Sheet Header */}
                  <div className="p-5 bg-white border-b border-gray-100 sticky top-0 z-10 flex justify-between items-start">
                      <div>
                          <h3 className="text-lg font-bold text-gray-800">Order Details</h3>
                          <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{selectedOrder.id}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                              <span className="text-xs text-gray-500">{selectedOrder.date}</span>
                          </div>
                      </div>
                      <button onClick={() => setSelectedOrder(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                           <span className="material-symbols-outlined text-gray-600">close</span>
                      </button>
                  </div>

                  <div className="overflow-y-auto p-4 space-y-5">
                      {/* Live Tracking for Processing Orders */}
                      {selectedOrder.status === 'Processing' && (
                          <div className="rounded-xl overflow-hidden shadow-sm border border-blue-200 relative h-48 bg-gray-100 group">
                              <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/77.5946,12.9716,14,0/400x200?access_token=YOUR_TOKEN')] bg-cover bg-center opacity-70"></div>
                              {/* Animated Map Background Simulation */}
                              <div className="absolute inset-0 bg-[#e5e7eb] w-full h-full">
                                   <div className="w-full h-full relative" style={{ backgroundImage: `linear-gradient(#d1d5db 1px, transparent 1px), linear-gradient(90deg, #d1d5db 1px, transparent 1px)`, backgroundSize: '40px 40px', backgroundColor: '#f3f4f6' }}></div>
                                   {/* Road */}
                                   <div className="absolute top-1/2 left-0 right-0 h-8 bg-white border-y-2 border-gray-300 -translate-y-1/2"></div>
                                   {/* Bike Animation */}
                                   <div className="absolute top-1/2 left-0 -translate-y-1/2 animate-[drive_10s_linear_infinite]">
                                       <div className="w-8 h-8 bg-zepto-blue text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white relative z-10">
                                           <span className="material-symbols-outlined text-sm">two_wheeler</span>
                                       </div>
                                       <div className="w-10 h-2 bg-black/20 rounded-full blur-sm absolute bottom-[-4px] left-[-2px]"></div>
                                   </div>
                                   <style>{`@keyframes drive { 0% { left: -10%; } 100% { left: 110%; } }`}</style>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-3 flex justify-between items-center border-t border-gray-200">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                          <span className="material-symbols-outlined">person</span>
                                      </div>
                                      <div>
                                          <p className="text-xs font-bold text-gray-800">Assigning Partner...</p>
                                          <p className="text-[10px] text-gray-500">Your order is being packed</p>
                                      </div>
                                  </div>
                                  <span className="text-xs font-bold text-zepto-blue bg-blue-50 px-2 py-1 rounded">7 AM</span>
                              </div>
                          </div>
                      )}

                      {/* Status Card */}
                      <div className={`p-4 rounded-xl border shadow-sm flex items-center gap-4 ${
                          selectedOrder.status === 'Cancelled' ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'
                      }`}>
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                               selectedOrder.status === 'Delivered' ? 'bg-green-100 text-green-600' : 
                               selectedOrder.status === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-zepto-blue'
                           }`}>
                                <span className="material-symbols-outlined text-2xl">
                                    {selectedOrder.status === 'Delivered' ? 'check_circle' : 
                                     selectedOrder.status === 'Cancelled' ? 'cancel' : 'inventory_2'}
                                </span>
                           </div>
                           <div>
                               <h4 className="font-bold text-gray-800 text-sm">Order {selectedOrder.status}</h4>
                               {selectedOrder.status === 'Processing' && <p className="text-xs text-gray-500">Arriving Tomorrow, 7 AM</p>}
                               {selectedOrder.status === 'Delivered' && <p className="text-xs text-gray-500">Delivered on time</p>}
                               {selectedOrder.status === 'Cancelled' && (
                                   <div className="space-y-0.5">
                                       <p className="text-xs text-red-500 font-medium">Refund initiated</p>
                                       {selectedOrder.cancellationReason && (
                                           <p className="text-[10px] text-gray-500">Reason: {selectedOrder.cancellationReason}</p>
                                       )}
                                   </div>
                               )}
                           </div>
                      </div>

                      {/* Items List */}
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                          <div className="p-3 bg-gray-50 border-b border-gray-100">
                              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Items ({selectedOrder.items.length})</h4>
                          </div>
                          <div className="divide-y divide-gray-50">
                              {selectedOrder.items.map((item: any, idx: number) => (
                                  <div key={idx} className="p-3 flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                          {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : null}
                                      </div>
                                      <div className="flex-grow">
                                          <p className="text-sm font-medium text-gray-800">{item.name}</p>
                                          <p className="text-xs text-gray-500">{item.quantity} x ₹{item.price}</p>
                                      </div>
                                      <p className="text-sm font-bold text-gray-800">₹{item.price * item.quantity}</p>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Delivery Address */}
                      {selectedOrder.deliveryAddress && (
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Delivered To</h4>
                            <div className="flex gap-3">
                                <span className="material-symbols-outlined text-gray-400">location_on</span>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">Home</p>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                        {typeof selectedOrder.deliveryAddress === 'string' ? selectedOrder.deliveryAddress : `${selectedOrder.deliveryAddress.houseNo || ''}, ${selectedOrder.deliveryAddress.address || ''}`}
                                    </p>
                                </div>
                            </div>
                        </div>
                      )}

                      {/* Bill Summary */}
                      {selectedOrder.billDetails ? (
                           <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-2">
                               <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-50 pb-2">Bill Summary</h4>
                               <div className="flex justify-between text-xs text-gray-600">
                                   <span>Item Total</span>
                                   <span>₹{selectedOrder.billDetails.itemTotal}</span>
                               </div>
                               <div className="flex justify-between text-xs text-gray-600">
                                   <span>Handling & Delivery</span>
                                   <span>₹{selectedOrder.billDetails.handlingCharge + selectedOrder.billDetails.deliveryFee}</span>
                               </div>
                               <div className="flex justify-between text-sm font-bold text-gray-800 pt-2 border-t border-dashed border-gray-200 mt-2">
                                   <span>Grand Total</span>
                                   <span>₹{selectedOrder.billDetails.grandTotal}</span>
                               </div>
                               <div className="flex justify-between text-xs text-gray-500 mt-1">
                                   <span>Paid via</span>
                                   <span>{selectedOrder.paymentMethod}</span>
                               </div>
                           </div>
                      ) : (
                          // Fallback if bill details weren't saved in older version
                           <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                               <span className="font-bold text-gray-800">Total Paid</span>
                               <span className="font-bold text-xl text-zepto-blue">₹{selectedOrder.amount}</span>
                           </div>
                      )}
                      
                      {/* Cancel Order Button (Only for Processing orders) */}
                      {selectedOrder.status === 'Processing' && (
                          <button 
                            onClick={initiateCancel}
                            className="w-full py-3 text-red-500 font-bold text-sm bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                          >
                             <span className="material-symbols-outlined text-lg">cancel</span>
                             Cancel Order
                          </button>
                      )}
                  </div>

                  <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
                      {selectedOrder.status === 'Delivered' && !selectedOrder.rating ? (
                          <button 
                            onClick={(e) => openRatingModal(e, selectedOrder)}
                            className="flex-1 bg-yellow-50 text-yellow-700 border border-yellow-200 font-bold py-3.5 rounded-xl shadow-sm hover:bg-yellow-100 transition-all flex items-center justify-center gap-2"
                          >
                              <span className="material-symbols-outlined">star</span>
                              Rate Order
                          </button>
                      ) : (
                          <button 
                            onClick={(e) => handleHelpClick(e, selectedOrder)}
                            className="flex-1 bg-white text-gray-700 border border-gray-200 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                          >
                              <span className="material-symbols-outlined">support_agent</span>
                              Help
                          </button>
                      )}
                      
                      <button 
                        onClick={(e) => handleReorder(e, selectedOrder.items)}
                        className="flex-1 bg-zepto-blue text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-blue-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                          <span className="material-symbols-outlined">refresh</span>
                          Reorder
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Cancel Reason Questionnaire Modal */}
      {showCancelModal && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">
                  
                  {/* Modal Header */}
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="text-lg font-bold text-gray-800">Reason for Cancellation</h3>
                      <button onClick={() => setShowCancelModal(false)} className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-500">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5 overflow-y-auto">
                      <p className="text-sm text-gray-500 mb-4">Please select a reason to cancel Order #{selectedOrder?.id}</p>
                      
                      <div className="space-y-3">
                          {cancellationReasons.map((reason) => (
                              <label 
                                key={reason}
                                className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    cancelReason === reason 
                                    ? 'border-red-500 bg-red-50/50' 
                                    : 'border-gray-100 hover:border-gray-200 bg-white'
                                }`}
                              >
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                                      cancelReason === reason ? 'border-red-500' : 'border-gray-300'
                                  }`}>
                                      {cancelReason === reason && <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>}
                                  </div>
                                  <input 
                                    type="radio" 
                                    name="cancelReason" 
                                    className="hidden" 
                                    value={reason}
                                    checked={cancelReason === reason}
                                    onChange={() => setCancelReason(reason)}
                                  />
                                  <span className={`font-medium text-sm ${cancelReason === reason ? 'text-red-700' : 'text-gray-700'}`}>
                                      {reason}
                                  </span>
                              </label>
                          ))}
                      </div>

                      {/* Custom Text for 'Other' */}
                      {cancelReason === 'Other' && (
                          <div className="mt-4 animate-slide-up">
                              <textarea 
                                value={otherReasonText}
                                onChange={(e) => setOtherReasonText(e.target.value)}
                                placeholder="Please tell us the reason..."
                                className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-red-500 min-h-[80px]"
                              ></textarea>
                          </div>
                      )}
                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                      <button 
                          onClick={() => setShowCancelModal(false)}
                          className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                      >
                          Don't Cancel
                      </button>
                      <button 
                          onClick={confirmCancelOrder}
                          disabled={!cancelReason || (cancelReason === 'Other' && !otherReasonText.trim())}
                          className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          Confirm
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
          <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-slide-up text-center p-6">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-500">
                      <span className="material-symbols-outlined text-4xl">star</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">Rate your experience</h3>
                  <p className="text-gray-500 text-sm mb-6">How was your order from Taaza?</p>
                  
                  <div className="flex justify-center gap-3 mb-6">
                      {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star}
                            onClick={() => setRatingScore(star)}
                            className={`text-4xl transition-transform hover:scale-110 active:scale-95 ${star <= ratingScore ? 'text-yellow-400' : 'text-gray-200'}`}
                          >
                              ★
                          </button>
                      ))}
                  </div>

                  <textarea 
                      value={ratingFeedback}
                      onChange={(e) => setRatingFeedback(e.target.value)}
                      placeholder="Tell us what you liked (optional)..."
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-400 min-h-[80px] bg-gray-50 mb-4 resize-none"
                  ></textarea>

                  <div className="flex gap-3">
                      <button 
                          onClick={() => setShowRatingModal(false)}
                          className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                      >
                          Skip
                      </button>
                      <button 
                          onClick={submitRating}
                          disabled={ratingScore === 0}
                          className="flex-1 py-3 bg-zepto-blue text-white font-bold rounded-xl hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          Submit
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* HELP & SUPPORT CHAT SHEET */}
      {showHelpSheet && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center">
              <div 
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                  onClick={() => setShowHelpSheet(false)}
              ></div>
              
              <div className="relative bg-white w-full max-w-lg h-[80vh] rounded-t-3xl flex flex-col shadow-2xl animate-slide-up overflow-hidden">
                  
                  {/* Chat Header */}
                  <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm z-10">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zepto-blue flex items-center justify-center text-white">
                              <span className="material-symbols-outlined">support_agent</span>
                          </div>
                          <div>
                              <h3 className="font-bold text-gray-800">Support Chat</h3>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                  Online
                              </p>
                          </div>
                      </div>
                      <button onClick={() => setShowHelpSheet(false)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
                          <span className="material-symbols-outlined text-gray-600">close</span>
                      </button>
                  </div>

                  {/* Chat Area */}
                  <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-gray-50" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                      {chatMessages.map((msg, idx) => (
                          <div key={idx} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                              <div className={`max-w-[80%] p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                  msg.sender === 'user' 
                                  ? 'bg-zepto-blue text-white rounded-br-none' 
                                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                              }`}>
                                  <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                                  
                                  {/* Special Action UI for Connect Agent */}
                                  {msg.isAction && (
                                      <div className="mt-3 pt-3 border-t border-gray-100">
                                          <button className="w-full bg-green-500 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-600 active:scale-95 transition-all">
                                              <span className="material-symbols-outlined">call</span>
                                              Call Support
                                          </button>
                                          <p className="text-[10px] text-gray-400 text-center mt-2">Wait time: ~2 mins</p>
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))}
                      
                      {isTyping && (
                          <div className="flex justify-start animate-slide-up">
                              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                              </div>
                          </div>
                      )}
                      <div ref={chatEndRef}></div>
                  </div>

                  {/* Bottom Options */}
                  <div className="p-4 bg-white border-t border-gray-100">
                      {showAgentButton ? (
                          <div className="space-y-3 animate-slide-up">
                              <p className="text-xs text-gray-400 text-center font-medium">Was this helpful?</p>
                              <div className="flex gap-2">
                                  <button 
                                      onClick={handleConnectAgent}
                                      className="flex-1 py-3 bg-white border border-zepto-blue text-zepto-blue font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                                  >
                                      <span className="material-symbols-outlined text-lg">headset_mic</span>
                                      Connect to Customer Support
                                  </button>
                                  <button 
                                      onClick={() => setShowHelpSheet(false)}
                                      className="px-4 py-3 bg-zepto-blue text-white font-bold rounded-xl hover:bg-blue-900 transition-colors"
                                  >
                                      Close
                                  </button>
                              </div>
                          </div>
                      ) : (
                          <p className="text-center text-xs text-gray-300">Taaza Support Assistant</p>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Orders;