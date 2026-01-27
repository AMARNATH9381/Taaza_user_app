
import React, { useState, useRef, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import { revenueData, distributionData, areaDeliveries, mockOrders } from '../services/mockData';
import { OrderStatus } from '../types';

const COLORS = ['#0C2D57', '#FFD700', '#10B981', '#EF4444'];

const StatCard: React.FC<{ title: string; value: string; icon: string; trend?: string; color: string }> = ({ title, value, icon, trend, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-slate-900">{value}</h3>
        {trend && (
          <p className={`text-xs mt-2 flex items-center gap-1 ${trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
            <span className="material-symbols-outlined text-xs">
              {trend.startsWith('+') ? 'trending_up' : 'trending_down'}
            </span>
            {trend} from last week
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <span className="material-symbols-outlined text-white">{icon}</span>
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('2023-11-20');
  const dateInputRef = useRef<HTMLInputElement>(null);

  const filteredOrders = useMemo(() => {
    return mockOrders.filter(order => order.date === selectedDate);
  }, [selectedDate]);

  const stats = useMemo(() => {
    const dailyTotal = filteredOrders.reduce((acc, order) => acc + order.total, 0);
    const deliveredCount = filteredOrders.filter(o => o.status === OrderStatus.DELIVERED).length;
    const pendingCount = filteredOrders.filter(o => o.status === OrderStatus.PENDING).length;

    return {
      revenue: `₹ ${dailyTotal.toLocaleString()}`,
      deliveries: filteredOrders.length,
      pending: pendingCount,
      // For mock purposes, keep one static or scaled
      activeSubs: "1,248"
    };
  }, [filteredOrders]);

  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500">Welcome back! Viewing metrics for {formatDate(selectedDate)}.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => dateInputRef.current?.showPicker()}
              className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-lg">calendar_today</span>
              {formatDate(selectedDate)}
            </button>
            <input 
              ref={dateInputRef}
              type="date" 
              className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button className="bg-zepto-blue text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-800 shadow-md">
            <span className="material-symbols-outlined text-lg">download</span>
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Daily Revenue" value={stats.revenue} icon="payments" trend="+12.5%" color="bg-zepto-blue" />
        <StatCard title="Active Subscriptions" value={stats.activeSubs} icon="local_drink" trend="+5.2%" color="bg-zepto-yellow" />
        <StatCard title="Deliveries" value={stats.deliveries.toString()} icon="delivery_dining" trend="+18.4%" color="bg-zepto-green" />
        <StatCard title="Pending Orders" value={stats.pending.toString()} icon="pending_actions" trend="-2.4%" color="bg-zepto-danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Weekly Revenue Trend</h3>
            <select className="bg-slate-50 border-none text-sm rounded-lg p-1 outline-none text-slate-500 cursor-pointer">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#0C2D57" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#0C2D57', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-6">Order Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {distributionData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{item.name}</span>
                <span className="font-semibold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-6">Deliveries per Area</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaDeliveries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="area" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                   cursor={{fill: '#f8fafc'}}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="count" fill="#FFD700" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Orders for this Date</h3>
            <button className="text-zepto-blue text-sm font-semibold hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="pb-3 font-semibold">Order ID</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Total</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length > 0 ? filteredOrders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 text-sm font-medium text-slate-900">{order.id}</td>
                    <td className="py-4 text-sm text-slate-600">{order.customerName}</td>
                    <td className="py-4 text-sm font-semibold">₹{order.total}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.status === OrderStatus.DELIVERED ? 'bg-emerald-100 text-emerald-700' :
                        order.status === OrderStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                        order.status === OrderStatus.PROCESSING ? 'bg-blue-100 text-blue-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-sm font-medium">
                      No orders recorded for this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
