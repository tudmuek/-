import React from 'react';
import { 
  Package, 
  MessageSquare, 
  AlertTriangle, 
  History, 
  Settings, 
  Volume2, 
  VolumeX, 
  Plus, 
  RefreshCw 
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'inventory' | 'simulator' | 'alerts' | 'history' | 'settings';
  setCurrentTab: (tab: 'inventory' | 'simulator' | 'alerts' | 'history' | 'settings') => void;
  lowStockCount: number;
  unreadLogsCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  onOpenAddItem: () => void;
  isConnected: boolean;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  lowStockCount,
  soundEnabled,
  setSoundEnabled,
  onOpenAddItem,
  isConnected,
  onResetData,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Status */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/20 text-white font-black text-xl">
              L
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-white tracking-tight">
                  LINE Stock <span className="text-emerald-400">Pro</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  LINE OA Sync
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{isConnected ? 'เชื่อมต่อเรียลไทม์ (Live SSE)' : 'กำลังเชื่อมต่อ...'}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setCurrentTab('inventory')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'inventory'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>คลังสินค้า</span>
            </button>

            <button
              onClick={() => setCurrentTab('simulator')}
              className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'simulator'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>แชท LINE OA</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </button>

            <button
              onClick={() => setCurrentTab('alerts')}
              className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'alerts'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>เตือนใกล้หมด</span>
              {lowStockCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('history')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>ประวัติอัปเดต</span>
            </button>

            <button
              onClick={() => setCurrentTab('settings')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'settings'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>ตั้งค่า LINE</span>
            </button>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'เปิดเสียงแจ้งเตือนอยู่' : 'ปิดเสียงแจ้งเตือน'}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            <button
              onClick={onResetData}
              title="รีเซ็ตข้อมูลตัวอย่าง"
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenAddItem}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">เพิ่มสินค้า</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800">
          <button
            onClick={() => setCurrentTab('inventory')}
            className={`flex flex-col items-center py-1 px-2 text-xs ${
              currentTab === 'inventory' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Package className="w-4 h-4 mb-0.5" />
            <span>คลังสินค้า</span>
          </button>
          <button
            onClick={() => setCurrentTab('simulator')}
            className={`flex flex-col items-center py-1 px-2 text-xs relative ${
              currentTab === 'simulator' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <MessageSquare className="w-4 h-4 mb-0.5" />
            <span>LINE แชท</span>
            <span className="absolute top-0 right-3 w-2 h-2 rounded-full bg-emerald-400"></span>
          </button>
          <button
            onClick={() => setCurrentTab('alerts')}
            className={`flex flex-col items-center py-1 px-2 text-xs relative ${
              currentTab === 'alerts' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <AlertTriangle className="w-4 h-4 mb-0.5" />
            <span>เตือนใกล้หมด</span>
            {lowStockCount > 0 && (
              <span className="absolute top-0 right-1 px-1 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                {lowStockCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setCurrentTab('history')}
            className={`flex flex-col items-center py-1 px-2 text-xs ${
              currentTab === 'history' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <History className="w-4 h-4 mb-0.5" />
            <span>ประวัติ</span>
          </button>
          <button
            onClick={() => setCurrentTab('settings')}
            className={`flex flex-col items-center py-1 px-2 text-xs ${
              currentTab === 'settings' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Settings className="w-4 h-4 mb-0.5" />
            <span>ตั้งค่า</span>
          </button>
        </div>
      </div>
    </header>
  );
};
