
import React, { useState, useMemo, useEffect, useCallback } from 'react';


// API base URL
const API_BASE = '/api';

// Types for API data
interface MilkSubscription {
    id: number;
    user_id: number;
    address_id: number;
    status: string;
    auto_pay: boolean;
    customer_name: string;
    address: string;
    slots: SubscriptionSlot[];
    created_at: string;
    updated_at: string;
}

interface SubscriptionSlot {
    id: number;
    subscription_id: number;
    slot_type: string;
    milk_type: string;
    quantity: number;
    time_slot: string;
    frequency: string;
    days: string[];
    is_enabled: boolean;
}

interface Delivery {
    id: number;
    subscription_id: number;
    slot_id: number;
    user_id: number;
    delivery_date: string;
    slot_type: string;
    quantity: number;
    milk_type: string;
    address: string;
    customer_name: string;
    status: string;
    delivered_at?: string;
    delivered_by?: string;
}

interface InventoryEntry {
    id: number;
    date: string;
    buffalo_stock: number;
    cow_stock: number;
    buffalo_sold: number;
    cow_sold: number;
    wastage: number;
}

interface PricingData {
    id: number;
    milk_type: string;
    price: number;
    previous_price: number;
    updated_at: string;
}

interface AnalyticsData {
    active_subscriptions: number;
    paused_subscriptions: number;
    total_subscriptions: number;
    buffalo_demand: number;
    cow_demand: number;
    total_demand: number;
    buffalo_price: number;
    cow_price: number;
    daily_revenue: number;
    monthly_revenue: number;
    delivered_today: number;
    pending_today: number;
}

const MilkManagement: React.FC = () => {
    const [mainTab, setMainTab] = useState<'Subscriptions' | 'Inventory' | 'Pricing' | 'Analytics'>('Subscriptions');
    const [subTab, setSubTab] = useState<'List' | 'Today' | 'Routes'>('List');
    const [subscriptions, setSubscriptions] = useState<MilkSubscription[]>([]);
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);

    // Inventory States
    const [inventory, setInventory] = useState<InventoryEntry[]>([]);
    const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
    const [newStock, setNewStock] = useState({ buffaloStock: 0, cowStock: 0, date: new Date().toISOString().split('T')[0] });

    // Pricing States
    const [pricing, setPricing] = useState<{ buffalo: { current: number; previous: number; lastUpdated: string }; cow: { current: number; previous: number; lastUpdated: string } }>({
        buffalo: { current: 90, previous: 85, lastUpdated: '' },
        cow: { current: 60, previous: 55, lastUpdated: '' }
    });
    const [isEditPriceModalOpen, setIsEditPriceModalOpen] = useState(false);
    const [editingPrices, setEditingPrices] = useState({ buffalo: 90, cow: 60 });

    // Analytics States
    const [analytics, setAnalytics] = useState<AnalyticsData>({
        active_subscriptions: 0,
        paused_subscriptions: 0,
        total_subscriptions: 0,
        buffalo_demand: 0,
        cow_demand: 0,
        total_demand: 0,
        buffalo_price: 90,
        cow_price: 60,
        daily_revenue: 0,
        monthly_revenue: 0,
        delivered_today: 0,
        pending_today: 0
    });

    // Fetch subscriptions from API
    const fetchSubscriptions = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/subscriptions`);
            if (res.ok) {
                const data = await res.json();
                setSubscriptions(data);
            }
        } catch (err) {
            console.error('Error fetching subscriptions:', err);
        }
    }, []);

    // Fetch deliveries for today
    const fetchDeliveries = useCallback(async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await fetch(`${API_BASE}/admin/deliveries?date=${today}`);
            if (res.ok) {
                const data = await res.json();
                setDeliveries(data);
            }
        } catch (err) {
            console.error('Error fetching deliveries:', err);
        }
    }, []);

    // Fetch inventory
    const fetchInventory = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/inventory`);
            if (res.ok) {
                const data = await res.json();
                setInventory(data);
            }
        } catch (err) {
            console.error('Error fetching inventory:', err);
        }
    }, []);

    // Fetch pricing
    const fetchPricing = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/pricing`);
            if (res.ok) {
                const data: PricingData[] = await res.json();
                const buffalo = data.find(p => p.milk_type === 'buffalo');
                const cow = data.find(p => p.milk_type === 'cow');
                setPricing({
                    buffalo: { current: buffalo?.price || 90, previous: buffalo?.previous_price || 85, lastUpdated: buffalo?.updated_at?.split('T')[0] || '' },
                    cow: { current: cow?.price || 60, previous: cow?.previous_price || 55, lastUpdated: cow?.updated_at?.split('T')[0] || '' }
                });
            }
        } catch (err) {
            console.error('Error fetching pricing:', err);
        }
    }, []);

    // Fetch analytics
    const fetchAnalytics = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/analytics`);
            if (res.ok) {
                const data = await res.json();
                setAnalytics(data);
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
        }
    }, []);

    // Initial data load
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                fetchSubscriptions(),
                fetchDeliveries(),
                fetchInventory(),
                fetchPricing(),
                fetchAnalytics()
            ]);
            setLoading(false);
        };
        loadData();
    }, [fetchSubscriptions, fetchDeliveries, fetchInventory, fetchPricing, fetchAnalytics]);

    const handleToggleStatus = async (sub: MilkSubscription) => {
        const newStatus = sub.status === 'Active' ? 'Paused' : 'Active';
        try {
            const res = await fetch(`${API_BASE}/admin/subscriptions/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: sub.id, status: newStatus })
            });
            if (res.ok) {
                fetchSubscriptions();
                fetchAnalytics();
            }
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const markDelivered = async (deliveryId: number) => {
        try {
            const res = await fetch(`${API_BASE}/admin/deliveries`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: deliveryId, status: 'Delivered', delivered_by: 'Admin' })
            });
            if (res.ok) {
                fetchDeliveries();
                fetchAnalytics();
            }
        } catch (err) {
            console.error('Error marking delivered:', err);
        }
    };

    const handleExportCSV = () => {
        const headers = ['ID', 'Customer', 'Status', 'Address', 'Created'];
        const rows = subscriptions.map(s => [
            s.id,
            s.customer_name,
            s.status,
            `"${s.address}"`,
            s.created_at?.split('T')[0] || ''
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", `taaza_subscriptions_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleAddStock = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/inventory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: newStock.date,
                    buffalo_stock: newStock.buffaloStock,
                    cow_stock: newStock.cowStock,
                    wastage: 0
                })
            });
            if (res.ok) {
                fetchInventory();
                setIsAddStockModalOpen(false);
                setNewStock({ buffaloStock: 0, cowStock: 0, date: new Date().toISOString().split('T')[0] });
            }
        } catch (err) {
            console.error('Error adding stock:', err);
        }
    };

    const handleUpdatePricing = async () => {
        try {
            await fetch(`${API_BASE}/admin/pricing`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ milk_type: 'buffalo', price: editingPrices.buffalo })
            });
            await fetch(`${API_BASE}/admin/pricing`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ milk_type: 'cow', price: editingPrices.cow })
            });
            fetchPricing();
            fetchAnalytics();
            setIsEditPriceModalOpen(false);
        } catch (err) {
            console.error('Error updating pricing:', err);
        }
    };

    const routeGroups = useMemo(() => {
        const groups: Record<string, MilkSubscription[]> = {};
        subscriptions.forEach(s => {
            const area = s.address?.split(',')[1]?.trim() || 'Other';
            if (!groups[area]) groups[area] = [];
            groups[area].push(s);
        });
        return groups;
    }, [subscriptions]);

    // Helper to get total quantity from slots
    const getTotalQuantity = (sub: MilkSubscription) => {
        return sub.slots?.reduce((acc, slot) => acc + (slot.is_enabled ? slot.quantity : 0), 0) || 0;
    };

    const getMilkType = (sub: MilkSubscription) => {
        return sub.slots?.[0]?.milk_type || 'mixed';
    };

    // Group deliveries by time slot
    const groupedDeliveries = useMemo(() => {
        const groups: Record<string, Delivery[]> = {};
        deliveries.forEach(d => {
            const slot = d.slot_type === 'morning' ? 'Morning (6:00-8:00 AM)' : 'Evening (5:00-7:00 PM)';
            if (!groups[slot]) groups[slot] = [];
            groups[slot].push(d);
        });
        return groups;
    }, [deliveries]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zepto-blue"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span className="material-symbols-outlined text-zepto-blue text-3xl">water_drop</span>
                        Milk Management
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Complete milk operations dashboard</p>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="flex p-1.5 bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl w-fit shadow-inner">
                {['Subscriptions', 'Inventory', 'Pricing', 'Analytics'].map((tab) => (
                    <button
                        key={tab}
                        className={`px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${mainTab === tab
                            ? 'bg-white text-zepto-blue shadow-lg shadow-slate-200/50'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                            }`}
                        onClick={() => setMainTab(tab as any)}
                    >
                        <span className="material-symbols-outlined text-lg">
                            {tab === 'Subscriptions' ? 'local_drink' :
                                tab === 'Inventory' ? 'inventory_2' :
                                    tab === 'Pricing' ? 'sell' : 'analytics'}
                        </span>
                        {tab}
                    </button>
                ))}
            </div>

            {/* SUBSCRIPTIONS TAB */}
            {mainTab === 'Subscriptions' && (
                <>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
                            {['List', 'Today', 'Routes'].map((tab) => (
                                <button
                                    key={tab}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${subTab === tab ? 'bg-white text-zepto-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    onClick={() => setSubTab(tab as any)}
                                >
                                    {tab === 'List' ? 'All Plans' : tab === 'Today' ? "Today's Deliveries" : "Route Optimization"}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleExportCSV}
                            className="bg-white border-2 border-slate-100 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">download</span>
                            Export CSV
                        </button>
                    </div>

                    {/* Subscription Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
                            <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Active</p>
                            <p className="text-3xl font-black">{analytics.active_subscriptions}</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white">
                            <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Paused</p>
                            <p className="text-3xl font-black">{analytics.paused_subscriptions}</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
                            <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Buffalo (L/day)</p>
                            <p className="text-3xl font-black">{analytics.buffalo_demand}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
                            <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Cow (L/day)</p>
                            <p className="text-3xl font-black">{analytics.cow_demand}</p>
                        </div>
                    </div>

                    {subTab === 'List' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {subscriptions.length === 0 ? (
                                <div className="col-span-full text-center py-12 text-slate-400">
                                    <span className="material-symbols-outlined text-6xl mb-4">inbox</span>
                                    <p className="font-bold">No subscriptions yet</p>
                                    <p className="text-sm">Subscriptions from the user app will appear here</p>
                                </div>
                            ) : subscriptions.map((sub) => (
                                <div key={sub.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                                    <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-zepto-blue text-white flex items-center justify-center font-black text-lg shadow-inner">
                                                    {sub.customer_name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-slate-900 leading-tight">{sub.customer_name || 'Unknown'}</h3>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">#{sub.id}</p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${sub.status === 'Active' ? 'bg-emerald-100 text-emerald-600' :
                                                sub.status === 'Paused' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                                                }`}>
                                                {sub.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white p-3 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Milk Type</p>
                                                <p className="text-xs font-black text-slate-900 capitalize">{getMilkType(sub)}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Volume</p>
                                                <p className="text-xs font-black text-zepto-blue">{getTotalQuantity(sub)}L/day</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl">
                                            <span className="material-symbols-outlined text-slate-400 text-sm mt-0.5">location_on</span>
                                            <p className="text-xs text-slate-600 font-medium leading-relaxed">{sub.address || 'No address'}</p>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button onClick={() => handleToggleStatus(sub)} className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${sub.status === 'Active' ? 'bg-slate-900 text-white hover:bg-black' : 'bg-emerald-500 text-white'
                                                }`}>
                                                {sub.status === 'Active' ? 'Pause' : 'Resume'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {subTab === 'Today' && (
                        <div className="space-y-6">
                            {Object.keys(groupedDeliveries).length === 0 ? (
                                <div className="text-center py-12 text-slate-400 bg-white rounded-3xl border border-slate-100">
                                    <span className="material-symbols-outlined text-6xl mb-4">event_busy</span>
                                    <p className="font-bold">No deliveries scheduled for today</p>
                                </div>
                            ) : (Object.entries(groupedDeliveries) as [string, Delivery[]][]).map(([slot, slotDeliveries]) => (
                                <div key={slot} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4">
                                    <div className="bg-slate-50/80 backdrop-blur px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-zepto-blue text-white flex items-center justify-center">
                                                <span className="material-symbols-outlined">schedule</span>
                                            </div>
                                            <h3 className="font-black text-slate-900 tracking-tight">{slot}</h3>
                                        </div>
                                        <span className="text-sm font-bold text-slate-400">{slotDeliveries.length} deliveries</span>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        {slotDeliveries.map(delivery => (
                                            <div key={delivery.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center justify-center w-6 h-6 rounded border-2 border-slate-200">
                                                        {delivery.status === 'Delivered' && <span className="material-symbols-outlined text-zepto-green text-xl font-black">check</span>}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900">{delivery.customer_name || 'Unknown'}</p>
                                                        <p className="text-[11px] text-slate-500 font-medium">{delivery.address || 'No address'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-zepto-blue">{delivery.quantity} Liters</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest capitalize">{delivery.milk_type} Milk</p>
                                                    </div>
                                                    <button
                                                        disabled={delivery.status === 'Delivered'}
                                                        onClick={() => markDelivered(delivery.id)}
                                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${delivery.status === 'Delivered' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600 hover:bg-zepto-blue hover:text-white'
                                                            }`}
                                                    >
                                                        {delivery.status === 'Delivered' ? 'Delivered' : 'Mark Delivered'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {subTab === 'Routes' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {Object.keys(routeGroups).length === 0 ? (
                                <div className="col-span-full text-center py-12 text-slate-400">
                                    <p className="font-bold">No routes to show</p>
                                </div>
                            ) : (Object.entries(routeGroups) as [string, MilkSubscription[]][]).map(([area, subs]) => (
                                <div key={area} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-black text-slate-900">{area} Route</h3>
                                        <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                            {subs.length} Drops
                                        </span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-zepto-blue/5 rounded-2xl border border-zepto-blue/10">
                                            <span className="text-xs font-bold text-zepto-blue uppercase tracking-widest">Total Demand</span>
                                            <span className="text-lg font-black text-zepto-blue">
                                                {subs.reduce((acc, curr) => acc + getTotalQuantity(curr), 0)} Liters
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {subs.map(s => (
                                                <div key={s.id} className="flex items-center gap-3 text-xs font-medium text-slate-500">
                                                    <span className="material-symbols-outlined text-[14px]">radio_button_checked</span>
                                                    <span className="font-bold text-slate-700">{s.customer_name}</span>
                                                    <span className="ml-auto">{getTotalQuantity(s)}L</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                            ))}
                        </div>
                    )}
                </>
            )}

            {/* INVENTORY TAB */}
            {mainTab === 'Inventory' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-black text-slate-900">Daily Stock Management</h2>
                        <button
                            onClick={() => setIsAddStockModalOpen(true)}
                            className="bg-zepto-blue text-white px-5 py-2.5 rounded-xl font-black shadow-lg hover:bg-black transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined">add</span>
                            Add Stock Entry
                        </button>
                    </div>

                    {/* Today's Stock Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 text-white">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <span className="text-2xl">🐃</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold opacity-80 uppercase">Buffalo Milk</p>
                                    <p className="text-3xl font-black">{inventory[0]?.buffalo_stock || 0}L</p>
                                </div>
                            </div>
                            <div className="flex justify-between text-xs font-bold opacity-80">
                                <span>Sold: {inventory[0]?.buffalo_sold || 0}L</span>
                                <span>Available: {(inventory[0]?.buffalo_stock || 0) - (inventory[0]?.buffalo_sold || 0)}L</span>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-6 text-white">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <span className="text-2xl">🐄</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold opacity-80 uppercase">Cow Milk</p>
                                    <p className="text-3xl font-black">{inventory[0]?.cow_stock || 0}L</p>
                                </div>
                            </div>
                            <div className="flex justify-between text-xs font-bold opacity-80">
                                <span>Sold: {inventory[0]?.cow_sold || 0}L</span>
                                <span>Available: {(inventory[0]?.cow_stock || 0) - (inventory[0]?.cow_sold || 0)}L</span>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-3xl p-6 text-white">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <span className="material-symbols-outlined text-2xl">warning</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold opacity-80 uppercase">Wastage</p>
                                    <p className="text-3xl font-black">{inventory[0]?.wastage || 0}L</p>
                                </div>
                            </div>
                            <p className="text-xs font-bold opacity-80">Track and minimize wastage daily</p>
                        </div>
                    </div>

                    {/* Inventory History Table */}
                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-black text-slate-900">Inventory History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Buffalo Stock</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cow Stock</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Buffalo Sold</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cow Sold</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Wastage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {inventory.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No inventory records yet</td>
                                        </tr>
                                    ) : inventory.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900">{row.date}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-blue-600">{row.buffalo_stock}L</td>
                                            <td className="px-6 py-4 text-sm font-bold text-amber-600">{row.cow_stock}L</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{row.buffalo_sold}L</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{row.cow_sold}L</td>
                                            <td className="px-6 py-4 text-sm font-bold text-red-500">{row.wastage}L</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* PRICING TAB */}
            {mainTab === 'Pricing' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-black text-slate-900">Milk Pricing</h2>
                        <button
                            onClick={() => {
                                setEditingPrices({ buffalo: pricing.buffalo.current, cow: pricing.cow.current });
                                setIsEditPriceModalOpen(true);
                            }}
                            className="bg-zepto-blue text-white px-5 py-2.5 rounded-xl font-black shadow-lg hover:bg-black transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined">edit</span>
                            Update Prices
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Buffalo Milk Pricing */}
                        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                                        <span className="text-4xl">🐃</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold opacity-80 uppercase">Buffalo Milk</p>
                                        <p className="text-4xl font-black">₹{pricing.buffalo.current}<span className="text-lg font-bold opacity-80">/L</span></p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                                    <span className="text-sm font-bold text-slate-500">Previous Price</span>
                                    <span className="text-sm font-black text-slate-400 line-through">₹{pricing.buffalo.previous}/L</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <span className="text-sm font-bold text-emerald-600">Change</span>
                                    <span className="text-sm font-black text-emerald-600">
                                        {pricing.buffalo.current > pricing.buffalo.previous ? '+' : ''}
                                        ₹{pricing.buffalo.current - pricing.buffalo.previous}/L
                                    </span>
                                </div>
                                {pricing.buffalo.lastUpdated && <p className="text-xs text-slate-400 text-center">Last updated: {pricing.buffalo.lastUpdated}</p>}
                            </div>
                        </div>

                        {/* Cow Milk Pricing */}
                        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                                        <span className="text-4xl">🐄</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold opacity-80 uppercase">Cow Milk</p>
                                        <p className="text-4xl font-black">₹{pricing.cow.current}<span className="text-lg font-bold opacity-80">/L</span></p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                                    <span className="text-sm font-bold text-slate-500">Previous Price</span>
                                    <span className="text-sm font-black text-slate-400 line-through">₹{pricing.cow.previous}/L</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <span className="text-sm font-bold text-emerald-600">Change</span>
                                    <span className="text-sm font-black text-emerald-600">
                                        {pricing.cow.current > pricing.cow.previous ? '+' : ''}
                                        ₹{pricing.cow.current - pricing.cow.previous}/L
                                    </span>
                                </div>
                                {pricing.cow.lastUpdated && <p className="text-xs text-slate-400 text-center">Last updated: {pricing.cow.lastUpdated}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Revenue Calculator */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white">
                        <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined">calculate</span>
                            Daily Revenue Estimate
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white/10 rounded-2xl p-4">
                                <p className="text-xs font-bold opacity-60 uppercase mb-1">Buffalo Revenue</p>
                                <p className="text-2xl font-black">₹{analytics.buffalo_demand * pricing.buffalo.current}</p>
                                <p className="text-xs opacity-60">{analytics.buffalo_demand}L × ₹{pricing.buffalo.current}</p>
                            </div>
                            <div className="bg-white/10 rounded-2xl p-4">
                                <p className="text-xs font-bold opacity-60 uppercase mb-1">Cow Revenue</p>
                                <p className="text-2xl font-black">₹{analytics.cow_demand * pricing.cow.current}</p>
                                <p className="text-xs opacity-60">{analytics.cow_demand}L × ₹{pricing.cow.current}</p>
                            </div>
                            <div className="bg-zepto-yellow/20 rounded-2xl p-4 border border-zepto-yellow/30">
                                <p className="text-xs font-bold text-zepto-yellow uppercase mb-1">Total Daily Revenue</p>
                                <p className="text-3xl font-black text-zepto-yellow">₹{analytics.daily_revenue}</p>
                                <p className="text-xs opacity-60">Based on active subscriptions</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ANALYTICS TAB */}
            {mainTab === 'Analytics' && (
                <div className="space-y-6">
                    <h2 className="text-lg font-black text-slate-900">Analytics Dashboard</h2>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl p-6 border border-slate-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined text-emerald-600">trending_up</span>
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Active Subs</p>
                            </div>
                            <p className="text-3xl font-black text-slate-900">{analytics.active_subscriptions}</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-slate-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined text-blue-600">water_drop</span>
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Daily Demand</p>
                            </div>
                            <p className="text-3xl font-black text-slate-900">{analytics.total_demand}L</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-slate-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined text-amber-600">payments</span>
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Daily Revenue</p>
                            </div>
                            <p className="text-3xl font-black text-slate-900">₹{analytics.daily_revenue}</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-slate-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined text-purple-600">calendar_month</span>
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Monthly Est.</p>
                            </div>
                            <p className="text-3xl font-black text-slate-900">₹{analytics.monthly_revenue}</p>
                        </div>
                    </div>

                    {/* Milk Type Distribution & Today's Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-3xl p-6 border border-slate-100">
                            <h3 className="font-black text-slate-900 mb-6">Milk Type Distribution</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-bold text-slate-700">🐃 Buffalo Milk</span>
                                        <span className="font-black text-blue-600">{analytics.buffalo_demand}L</span>
                                    </div>
                                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                                            style={{ width: `${analytics.total_demand > 0 ? (analytics.buffalo_demand / analytics.total_demand) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-bold text-slate-700">🐄 Cow Milk</span>
                                        <span className="font-black text-amber-600">{analytics.cow_demand}L</span>
                                    </div>
                                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                                            style={{ width: `${analytics.total_demand > 0 ? (analytics.cow_demand / analytics.total_demand) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-slate-100">
                            <h3 className="font-black text-slate-900 mb-6">Today's Delivery Status</h3>
                            <div className="flex items-center justify-center gap-8">
                                <div className="text-center">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-3">
                                        <span className="text-3xl font-black text-white">{analytics.delivered_today}</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Delivered</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-3">
                                        <span className="text-3xl font-black text-white">{analytics.pending_today}</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Pending</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD STOCK MODAL */}
            {isAddStockModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsAddStockModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-slate-900">Add Stock Entry</h2>
                            <button onClick={() => setIsAddStockModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                                <input
                                    type="date"
                                    value={newStock.date}
                                    onChange={(e) => setNewStock({ ...newStock, date: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-zepto-blue transition-all outline-none rounded-2xl font-black"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buffalo Milk (L)</label>
                                    <input
                                        type="number"
                                        value={newStock.buffaloStock}
                                        onChange={(e) => setNewStock({ ...newStock, buffaloStock: Number(e.target.value) })}
                                        className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-zepto-blue transition-all outline-none rounded-2xl font-black"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cow Milk (L)</label>
                                    <input
                                        type="number"
                                        value={newStock.cowStock}
                                        onChange={(e) => setNewStock({ ...newStock, cowStock: Number(e.target.value) })}
                                        className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-zepto-blue transition-all outline-none rounded-2xl font-black"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button onClick={() => setIsAddStockModalOpen(false)} className="flex-1 p-4 border-2 border-slate-100 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
                            <button onClick={handleAddStock} className="flex-1 p-4 bg-zepto-blue text-white rounded-2xl font-black shadow-xl shadow-zepto-blue/20 hover:bg-black transition-all">Add Stock</button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT PRICING MODAL */}
            {isEditPriceModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsEditPriceModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-slate-900">Update Pricing</h2>
                            <button onClick={() => setIsEditPriceModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">🐃 Buffalo Milk (₹/L)</label>
                                <input
                                    type="number"
                                    value={editingPrices.buffalo}
                                    onChange={(e) => setEditingPrices({ ...editingPrices, buffalo: Number(e.target.value) })}
                                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-zepto-blue transition-all outline-none rounded-2xl font-black text-2xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">🐄 Cow Milk (₹/L)</label>
                                <input
                                    type="number"
                                    value={editingPrices.cow}
                                    onChange={(e) => setEditingPrices({ ...editingPrices, cow: Number(e.target.value) })}
                                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-zepto-blue transition-all outline-none rounded-2xl font-black text-2xl"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button onClick={() => setIsEditPriceModalOpen(false)} className="flex-1 p-4 border-2 border-slate-100 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
                            <button onClick={handleUpdatePricing} className="flex-1 p-4 bg-zepto-blue text-white rounded-2xl font-black shadow-xl shadow-zepto-blue/20 hover:bg-black transition-all">Save Prices</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MilkManagement;
