import React, { useState, useMemo } from 'react';
import { 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  SlidersHorizontal, 
  Download, 
  Search, 
  Filter, 
  Clock, 
  User, 
  MessageSquare, 
  Globe,
  AlertTriangle
} from 'lucide-react';
import type { StockTransaction } from '../types';

interface TransactionsViewProps {
  transactions: StockTransaction[];
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ transactions }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT' | 'ADJUST'>('ALL');

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const q = search.toLowerCase();
      const matchSearch = 
        !search ||
        tx.itemSku.toLowerCase().includes(q) ||
        tx.itemName.toLowerCase().includes(q) ||
        tx.operator.toLowerCase().includes(q) ||
        tx.reason.toLowerCase().includes(q);

      const matchType = typeFilter === 'ALL' || tx.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [transactions, search, typeFilter]);

  const handleExportCSV = () => {
    const headers = ['วัน-เวลา', 'รหัสสินค้า', 'ชื่อสินค้า', 'ประเภท', 'จำนวนที่ปรับ', 'ยอดเดิม', 'ยอดใหม่', 'ผู้ดำเนินการ', 'เหตุผล'];
    const rows = filtered.map(tx => [
      `"${new Date(tx.timestamp).toLocaleString('th-TH')}"`,
      `"${tx.itemSku}"`,
      `"${tx.itemName}"`,
      `"${tx.type}"`,
      tx.delta,
      tx.prevQuantity,
      tx.newQuantity,
      `"${tx.operator}"`,
      `"${tx.reason}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `line-stock-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Controls */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-emerald-400" />
            <span>ประวัติการทำรายการสต๊อก (Audit Trail)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            บันทึกการรับเข้า ตัดจำหน่าย และแก้ไขยอดทั้งหมดอย่างละเอียดแบบเรียลไทม์
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-600 transition shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>ส่งออก CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาตามรหัส SKU, ชื่อสินค้า, พนักงาน หรือเหตุผล..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              typeFilter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            ทั้งหมด ({transactions.length})
          </button>
          <button
            onClick={() => setTypeFilter('IN')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              typeFilter === 'IN' ? 'bg-emerald-600/30 text-emerald-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            รับเข้า (+)
          </button>
          <button
            onClick={() => setTypeFilter('OUT')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              typeFilter === 'OUT' ? 'bg-rose-600/30 text-rose-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            ตัดออก (-)
          </button>
          <button
            onClick={() => setTypeFilter('ADJUST')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              typeFilter === 'ADJUST' ? 'bg-blue-600/30 text-blue-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            ปรับยอด (=)
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      {filtered.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center text-slate-400">
          ไม่พบรายการประวัติที่ค้นหา
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">วัน-เวลา</th>
                  <th className="py-3 px-4">สินค้า</th>
                  <th className="py-3 px-4">ประเภท</th>
                  <th className="py-3 px-4 text-right">จำนวนที่ปรับ</th>
                  <th className="py-3 px-4 text-right">ยอดเดิม ➔ ยอดใหม่</th>
                  <th className="py-3 px-4">ผู้ดำเนินการ & ช่องทาง</th>
                  <th className="py-3 px-4">เหตุผล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map(tx => {
                  const isLine = tx.operator.includes('LINE');
                  const isPositive = tx.delta > 0;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 text-xs">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(tx.timestamp).toLocaleString('th-TH')}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{tx.itemName}</div>
                        <div className="font-mono text-xs text-emerald-400">{tx.itemSku}</div>
                      </td>

                      <td className="py-3 px-4">
                        {tx.type === 'IN' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <ArrowUpRight className="w-3 h-3 mr-0.5" /> รับเข้า
                          </span>
                        )}
                        {tx.type === 'OUT' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            <ArrowDownRight className="w-3 h-3 mr-0.5" /> ตัดจำหน่าย
                          </span>
                        )}
                        {tx.type === 'ADJUST' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            <SlidersHorizontal className="w-3 h-3 mr-0.5" /> ปรับยอด
                          </span>
                        )}
                        {tx.type === 'INITIAL' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            เปิดสต๊อก
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPositive ? `+${tx.delta}` : `${tx.delta}`}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-300 whitespace-nowrap">
                        {tx.prevQuantity} ➔ <b className="text-white text-sm">{tx.newQuantity}</b>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          {isLine ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center">
                              <MessageSquare className="w-2.5 h-2.5 mr-1" /> LINE OA
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-medium flex items-center">
                              <Globe className="w-2.5 h-2.5 mr-1" /> Web UI
                            </span>
                          )}
                          <span className="text-xs text-slate-200 font-medium">{tx.operator.replace(/^LINE:\s*/, '')}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-xs max-w-xs truncate">
                        {tx.reason}
                        {tx.triggeredAlert && (
                          <span className="inline-flex items-center ml-1 text-amber-400 font-bold text-[10px]">
                            <AlertTriangle className="w-3 h-3 mr-0.5" /> ใกล้หมด
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
