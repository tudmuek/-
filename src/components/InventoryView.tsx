import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Minus, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Clock, 
  User,
  Boxes,
  Layers
} from 'lucide-react';
import type { InventoryItem } from '../types';

interface InventoryViewProps {
  items: InventoryItem[];
  onAdjustStock: (id: string, delta: number, reason?: string) => Promise<void>;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => Promise<void>;
  onOpenAddItem: () => void;
  onSwitchToLineSim: (suggestedCommand?: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  items,
  onAdjustStock,
  onEditItem,
  onDeleteItem,
  onOpenAddItem,
  onSwitchToLineSim,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NORMAL' | 'LOW' | 'OUT'>('ALL');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return ['ทั้งหมด', ...Array.from(set)];
  }, [items]);

  // KPI stats
  const totalItems = items.length;
  const totalStockQuantity = items.reduce((acc, i) => acc + i.quantity, 0);
  const lowStockItems = items.filter(i => i.quantity > 0 && i.quantity <= i.minThreshold);
  const outOfStockItems = items.filter(i => i.quantity === 0);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const q = search.toLowerCase();
      const matchSearch = 
        !search ||
        item.sku.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q);

      const matchCategory = selectedCategory === 'ทั้งหมด' || item.category === selectedCategory;

      let matchStatus = true;
      if (statusFilter === 'LOW') {
        matchStatus = item.quantity > 0 && item.quantity <= item.minThreshold;
      } else if (statusFilter === 'OUT') {
        matchStatus = item.quantity === 0;
      } else if (statusFilter === 'NORMAL') {
        matchStatus = item.quantity > item.minThreshold;
      }

      return matchSearch && matchCategory && matchStatus;
    });
  }, [items, search, selectedCategory, statusFilter]);

  return (
    <div className="space-y-6">
      {/* KPI Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Items */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-400">รายการสินค้าทั้งหมด</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {totalItems.toLocaleString()} <span className="text-xs font-normal text-slate-400">รายการ</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* Total Stock Units */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-400">จำนวนสต๊อกรวม</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
              {totalStockQuantity.toLocaleString()} <span className="text-xs font-normal text-slate-400">หน่วย</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Warning */}
        <button
          onClick={() => setStatusFilter(statusFilter === 'LOW' ? 'ALL' : 'LOW')}
          className={`text-left rounded-2xl p-4 sm:p-5 flex items-center justify-between transition-all border ${
            statusFilter === 'LOW'
              ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/50'
              : 'bg-slate-800/80 border-amber-500/40 hover:border-amber-500/80'
          }`}
        >
          <div>
            <p className="text-xs sm:text-sm font-medium text-amber-300 flex items-center space-x-1">
              <span>สินค้าใกล้หมด</span>
              {lowStockItems.length > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">
              {lowStockItems.length} <span className="text-xs font-normal text-slate-400">รายการ</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </button>

        {/* Out of Stock */}
        <button
          onClick={() => setStatusFilter(statusFilter === 'OUT' ? 'ALL' : 'OUT')}
          className={`text-left rounded-2xl p-4 sm:p-5 flex items-center justify-between transition-all border ${
            statusFilter === 'OUT'
              ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/50'
              : 'bg-slate-800/80 border-rose-500/40 hover:border-rose-500/80'
          }`}
        >
          <div>
            <p className="text-xs sm:text-sm font-medium text-rose-300 flex items-center space-x-1">
              <span>สินค้าหมดสต๊อก</span>
              {outOfStockItems.length > 0 && <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />}
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-1">
              {outOfStockItems.length} <span className="text-xs font-normal text-slate-400">รายการ</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <XCircle className="w-6 h-6" />
          </div>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหารหัส SKU, ชื่อสินค้า, หรือตำแหน่งจัดเก็บ..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs bg-slate-800 px-1.5 py-0.5 rounded"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                statusFilter === 'ALL'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              ทั้งหมด ({items.length})
            </button>
            <button
              onClick={() => setStatusFilter('NORMAL')}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                statusFilter === 'NORMAL'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800'
              }`}
            >
              ปกติ ({items.filter(i => i.quantity > i.minThreshold).length})
            </button>
            <button
              onClick={() => setStatusFilter('LOW')}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                statusFilter === 'LOW'
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
              }`}
            >
              ใกล้หมด ⚠️ ({lowStockItems.length})
            </button>
            <button
              onClick={() => setStatusFilter('OUT')}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                statusFilter === 'OUT'
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-rose-300 hover:bg-slate-800'
              }`}
            >
              หมด ❌ ({outOfStockItems.length})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 flex items-center pr-1">
            <Filter className="w-3.5 h-3.5 mr-1" /> หมวดหมู่:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-white font-medium shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List Cards / Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center">
          <Boxes className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h4 className="text-lg font-bold text-white">ไม่พบรายการสินค้าที่ตรงกับเงื่อนไข</h4>
          <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
            ลองปรับเปลี่ยนคำค้นหา หรือกดปุ่มเพิ่มสินค้าใหม่ด้านบน
          </p>
          <button
            onClick={onOpenAddItem}
            className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มสินค้าใหม่</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const isOutOfStock = item.quantity === 0;
            const isLowStock = !isOutOfStock && item.quantity <= item.minThreshold;
            const percentage = Math.min(100, Math.round((item.quantity / (item.minThreshold * 2.5)) * 100));

            return (
              <div
                key={item.id}
                className={`bg-slate-800/90 border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all duration-200 hover:border-slate-600 ${
                  isOutOfStock
                    ? 'border-rose-500/60 bg-gradient-to-b from-rose-950/20 to-slate-900'
                    : isLowStock
                    ? 'border-amber-500/60 bg-gradient-to-b from-amber-950/20 to-slate-900'
                    : 'border-slate-700/70 hover:shadow-emerald-500/5'
                }`}
              >
                <div>
                  {/* Top Bar: SKU, Category & Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-700/80 text-emerald-400 border border-slate-600">
                          {item.sku}
                        </span>
                        <span className="text-xs text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isOutOfStock ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                          <XCircle className="w-3 h-3 mr-1" /> สินค้าหมด
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                          <AlertTriangle className="w-3 h-3 mr-1" /> ใกล้หมด
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> สต็อกปกติ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Item Name */}
                  <h3 className="text-base font-bold text-white line-clamp-2 leading-snug">
                    {item.name}
                  </h3>

                  {/* Stock Quantity Highlight */}
                  <div className="mt-4 mb-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block mb-0.5">ยอดคงเหลือ</span>
                      <div className="flex items-baseline space-x-1.5">
                        <span
                          className={`text-3xl font-extrabold tracking-tight ${
                            isOutOfStock
                              ? 'text-rose-400'
                              : isLowStock
                              ? 'text-amber-400'
                              : 'text-white'
                          }`}
                        >
                          {item.quantity.toLocaleString()}
                        </span>
                        <span className="text-sm font-semibold text-slate-400">
                          {item.unit}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-amber-400/90 block mb-0.5">
                        จุดเตือนขั้นต่ำ
                      </span>
                      <span className="text-sm font-bold text-slate-300">
                        {item.minThreshold} {item.unit}
                      </span>
                    </div>
                  </div>

                  {/* Stock Progress Bar */}
                  <div className="w-full bg-slate-900/80 rounded-full h-2 mb-3 overflow-hidden border border-slate-700/50">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOutOfStock
                          ? 'bg-rose-500 w-0'
                          : isLowStock
                          ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      }`}
                      style={{ width: `${Math.max(5, percentage)}%` }}
                    />
                  </div>

                  {/* Location & Metadata */}
                  <div className="space-y-1 text-xs text-slate-400 border-t border-slate-700/50 pt-2.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-slate-400">
                        <MapPin className="w-3 h-3 mr-1 text-slate-500" /> {item.location}
                      </span>
                      <span className="text-slate-300 font-medium">
                        ขาย: ฿{item.price} <span className="text-[10px] text-slate-500">(ทุน ฿{item.cost})</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span className="flex items-center truncate max-w-[180px]">
                        <User className="w-3 h-3 mr-1" /> {item.updatedBy}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(item.updatedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions: Quick Adjust & LINE OA shortcut */}
                <div className="mt-4 pt-3 border-t border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onAdjustStock(item.id, -1, 'ตัดเบิกด่วน -1')}
                        disabled={item.quantity <= 0}
                        title="ลด 1 ชิ้น"
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-3 h-3 mr-0.5" /> 1
                      </button>

                      <button
                        onClick={() => onAdjustStock(item.id, -10, 'ตัดเบิกด่วน -10')}
                        disabled={item.quantity < 10}
                        title="ลด 10 ชิ้น"
                        className="px-2 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        -10
                      </button>

                      <button
                        onClick={() => onAdjustStock(item.id, 1, 'รับเข้าด่วน +1')}
                        title="เพิ่ม 1 ชิ้น"
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center transition"
                      >
                        <Plus className="w-3 h-3 mr-0.5" /> 1
                      </button>

                      <button
                        onClick={() => onAdjustStock(item.id, 10, 'รับเข้าด่วน +10')}
                        title="เพิ่ม 10 ชิ้น"
                        className="px-2 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center transition"
                      >
                        +10
                      </button>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onEditItem(item)}
                        title="แก้ไขข้อมูลสินค้า"
                        className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        title="ลบสินค้านี้"
                        className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* LINE OA Command Shortcut */}
                  <div className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-lg text-xs border border-slate-700/60">
                    <span className="text-[11px] text-slate-400">
                      คำสั่ง LINE: <code className="text-emerald-400 font-mono font-bold">+ {item.sku} 10</code>
                    </span>
                    <button
                      onClick={() => onSwitchToLineSim(`- ${item.sku} 1`)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium hover:underline flex items-center"
                    >
                      ทดสอบในแชท ➔
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
