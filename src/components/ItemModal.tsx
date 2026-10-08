import React, { useState, useEffect } from 'react';
import { X, Package, AlertCircle } from 'lucide-react';
import type { InventoryItem } from '../types';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<InventoryItem>) => Promise<void>;
  editItem?: InventoryItem | null;
}

const CATEGORIES = [
  'เครื่องดื่ม',
  'อาหารกึ่งสำเร็จรูป',
  'ขนมขบเคี้ยว',
  'ข้าวสาร/ธัญพืช',
  'นมและเนย',
  'เครื่องปรุง/วัตถุดิบ',
  'ของใช้ทั่วไป',
  'ยาและเวชภัณฑ์',
  'เบ็ดเตล็ด'
];

const COMMON_UNITS = ['ชิ้น', 'ขวด', 'กระป๋อง', 'ซอง', 'กล่อง', 'ถุง', 'แพ็ค', 'ลัง', 'แผง', 'กิโลกรัม'];

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
}) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [quantity, setQuantity] = useState<number>(10);
  const [minThreshold, setMinThreshold] = useState<number>(5);
  const [unit, setUnit] = useState('ชิ้น');
  const [price, setPrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editItem) {
      setSku(editItem.sku);
      setName(editItem.name);
      setCategory(editItem.category || CATEGORIES[0]);
      setQuantity(editItem.quantity);
      setMinThreshold(editItem.minThreshold);
      setUnit(editItem.unit || 'ชิ้น');
      setPrice(editItem.price || 0);
      setCost(editItem.cost || 0);
      setLocation(editItem.location || '');
    } else {
      setSku(`SKU-${Math.floor(100 + Math.random() * 900)}`);
      setName('');
      setCategory(CATEGORIES[0]);
      setQuantity(20);
      setMinThreshold(10);
      setUnit('ชิ้น');
      setPrice(35);
      setCost(25);
      setLocation('ชั้นวาง A-1');
    }
    setError(null);
  }, [editItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim()) {
      setError('กรุณาระบุรหัสสินค้า (SKU)');
      return;
    }
    if (!name.trim()) {
      setError('กรุณาระบุชื่อสินค้า');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave({
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        category,
        quantity: Number(quantity) || 0,
        minThreshold: Number(minThreshold) || 1,
        unit: unit.trim() || 'ชิ้น',
        price: Number(price) || 0,
        cost: Number(cost) || 0,
        location: location.trim() || 'คลังหลัก',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">
              {editItem ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่เข้าคลัง'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                รหัสสินค้า (SKU / Barcode) *
              </label>
              <input
                type="text"
                value={sku}
                onChange={e => setSku(e.target.value.toUpperCase())}
                placeholder="เช่น COKE-325, A01"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                พนักงานจะใช้รหัสนี้สั่งงานใน LINE เช่น "+ {sku || 'A01'} 10"
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                หมวดหมู่
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              ชื่อสินค้า *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="เช่น น้ำดื่มสิงห์ 600 มล."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                จำนวนคงเหลือปัจจุบัน
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={e => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">
                จุดเตือนสินค้าใกล้หมด ⚠️
              </label>
              <input
                type="number"
                min="1"
                value={minThreshold}
                onChange={e => setMinThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-800 border border-amber-500/40 rounded-lg text-white font-bold text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
              <p className="text-[10px] text-amber-400/80 mt-1">เตือนเมื่อเหลือน้อยกว่าหรือเท่ากับ</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                หน่วยนับ
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  placeholder="เช่น ชิ้น, ลัง"
                  list="unit-suggestions"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <datalist id="unit-suggestions">
                  {COMMON_UNITS.map(u => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                ราคาขายปลีก (฿)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={price}
                onChange={e => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                ต้นทุนสินค้า (฿)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={cost}
                onChange={e => setCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                ตำแหน่งจัดเก็บ / โกดัง
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="เช่น ตู้แช่ A-01, ชั้น 2"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              {loading ? 'กำลังบันทึก...' : editItem ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
