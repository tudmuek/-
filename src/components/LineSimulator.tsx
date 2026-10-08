import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle, 
  Package, 
  Trash2, 
  CornerDownLeft,
  Barcode,
  Layers,
  Info
} from 'lucide-react';
import type { InventoryItem } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  senderName: string;
  text: string;
  timestamp: string;
  type?: 'text' | 'flex' | 'alert';
  triggeredAlert?: boolean;
  item?: InventoryItem;
  actions?: { label: string; cmd: string; color?: string }[];
}

interface LineSimulatorProps {
  items: InventoryItem[];
  initialCommand?: string;
  onClearInitialCommand?: () => void;
  onStockUpdated?: () => void;
}

const EMPLOYEES = [
  { id: 'emp-1', name: 'สมชาย (คลังสินค้า)', role: 'ฝ่ายคลังสินค้า' },
  { id: 'emp-2', name: 'สมหญิง (แคชเชียร์)', role: 'หน้าร้าน / แคชเชียร์' },
  { id: 'emp-3', name: 'วิชัย (ผู้จัดการ)', role: 'ผู้จัดการสาขา' },
  { id: 'emp-4', name: 'อนุชา (ตรวจนับ)', role: 'เจ้าหน้าที่ตรวจนับ' },
];

export const LineSimulator: React.FC<LineSimulatorProps> = ({
  items,
  initialCommand,
  onClearInitialCommand,
  onStockUpdated,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState(EMPLOYEES[0]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init-1',
      sender: 'bot',
      senderName: 'LINE Stock Bot (Official)',
      text: `👋 สวัสดีครับ! ยินดีต้อนรับสู่ระบบจัดการสต๊อกสินค้าผ่าน LINE Official Account\n\n📌 คุณสามารถพิมพ์คำสั่งจัดการสต๊อกได้ทันที เช่น:\n• "สต็อก" เพื่อดูภาพรวมสินค้า\n• "+ [รหัส] [จำนวน]" เพื่อเพิ่มสต็อก (รับเข้า)\n• "- [รหัส] [จำนวน]" เพื่อลดสต็อก (ขาย/เบิก)\n• "ใกล้หมด" หรือ "เตือน" เพื่อดูสินค้าใกล้หมด\n• "คำสั่ง" เพื่อดูวิธีใช้งานทั้งหมด`,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    }
  ]);

  useEffect(() => {
    if (initialCommand) {
      setInputText(initialCommand);
      if (onClearInitialCommand) onClearInitialCommand();
    }
  }, [initialCommand]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      senderName: selectedEmployee.name,
      text,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await fetch('/api/line/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          senderName: selectedEmployee.name,
        }),
      });

      if (!res.ok) {
        throw new Error('ไม่สามารถส่งคำสั่งได้');
      }

      const data = await res.json();

      const actions: { label: string; cmd: string; color?: string }[] = [];
      if (data.item) {
        actions.push({ label: `➕ เพิ่ม 10`, cmd: `+ ${data.item.sku} 10`, color: 'emerald' });
        actions.push({ label: `➖ ตัดขาย 1`, cmd: `- ${data.item.sku} 1`, color: 'rose' });
      }
      if (data.triggeredAlert || data.replyType === 'alert') {
        actions.push({ label: `📦 ดูสต็อกทั้งหมด`, cmd: `สต็อก`, color: 'blue' });
      }

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        senderName: 'LINE Stock Bot (Official)',
        text: data.replyText,
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        type: data.replyType,
        triggeredAlert: data.triggeredAlert,
        item: data.item,
        actions: actions.length > 0 ? actions : undefined,
      };

      setMessages(prev => [...prev, botMsg]);
      if (onStockUpdated) onStockUpdated();
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          senderName: 'LINE Stock Bot (Official)',
          text: `❌ เกิดข้อผิดพลาด: ${err.message}`,
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          type: 'alert'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        senderName: 'LINE Stock Bot (Official)',
        text: '🧹 เคลียร์ประวัติการสนทนาเรียบร้อย พร้อมรับคำสั่งใหม่ครับ',
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  // Sample quick command chips
  const sampleSku = items[0]?.sku || 'COKE-325';
  const quickActions = [
    { label: '📦 ดูสต็อกทั้งหมด', cmd: 'สต็อก' },
    { label: '⚠️ สินค้าใกล้หมด', cmd: 'ใกล้หมด' },
    { label: `🔍 เช็ค ${sampleSku}`, cmd: `เช็ค ${sampleSku}` },
    { label: `➕ เพิ่ม ${sampleSku} 10`, cmd: `+ ${sampleSku} 10` },
    { label: `➖ ลด ${sampleSku} 2`, cmd: `- ${sampleSku} 2` },
    { label: '📜 ดูประวัติล่าสุด', cmd: 'ประวัติ' },
    { label: '❓ คู่มือคำสั่ง', cmd: 'คำสั่ง' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
      {/* Left/Sidebar: Employee switch & Command Guide */}
      <div className="lg:col-span-4 space-y-4">
        {/* Switch Employee Persona */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center space-x-2 mb-3">
            <User className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              สลับบัญชีผู้ใช้งาน (พนักงาน)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            จำลองว่าพนักงานคนไหนกำลังพิมพ์คำสั่งผ่าน LINE OA เพื่อตรวจสอบการบันทึกประวัติ (Audit Trail)
          </p>

          <div className="space-y-2">
            {EMPLOYEES.map(emp => (
              <button
                key={emp.id}
                onClick={() => setSelectedEmployee(emp)}
                className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-center justify-between ${
                  selectedEmployee.id === emp.id
                    ? 'bg-emerald-500/10 border-emerald-500 text-white font-medium ring-1 ring-emerald-500/30'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-200">{emp.name}</div>
                  <div className="text-[11px] text-slate-500">{emp.role}</div>
                </div>
                {selectedEmployee.id === emp.id && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Command Reference */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                คลิกคำสั่งด่วนเพื่อทดสอบ
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {quickActions.map((qa, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qa.cmd)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-emerald-500/60 text-slate-300 hover:text-emerald-300 text-xs transition font-medium flex items-center active:scale-95"
              >
                {qa.label}
              </button>
            ))}
          </div>

          {/* Tips note */}
          <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center text-slate-300 font-semibold">
              <Info className="w-3.5 h-3.5 mr-1 text-emerald-400" /> เทคนิคการพิมพ์ภาษาไทย:
            </div>
            <p>• พิมพ์แบบย่อ: <code className="text-emerald-400">+ A01 10</code> หรือ <code className="text-rose-400">- A01 2</code></p>
            <p>• หรือพิมพ์ธรรมชาติ: <code className="text-emerald-400">เพิ่ม โค้ก 20</code> หรือ <code className="text-rose-400">ขาย เลย์ 3</code></p>
            <p>• ตั้งยอดนับใหม่: <code className="text-blue-400">ตั้ง A01 50</code></p>
          </div>
        </div>
      </div>

      {/* Right/Main: Realistic LINE Chat Simulator UI */}
      <div className="lg:col-span-8">
        <div className="bg-[#1b2733] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[700px]">
          {/* LINE Header */}
          <div className="bg-[#2c3e50] px-5 py-3.5 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shadow">
                  <Bot className="w-6 h-6" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900"></span>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h4 className="text-sm font-bold text-white tracking-wide">
                    LINE Stock Bot
                  </h4>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                    Official
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  กำลังใช้งานในนาม: <span className="text-emerald-300 font-medium">{selectedEmployee.name}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleClearChat}
                title="ล้างข้อความทั้งหมด"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Bubble Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-gradient-to-b from-[#18232c] to-[#121c24]">
            {messages.map(msg => {
              const isUser = msg.sender === 'user';
              const isAlert = msg.type === 'alert' || msg.triggeredAlert;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1 animate-fade-in`}
                >
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 px-1">
                    <span>{msg.senderName}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-md transition-all ${
                      isUser
                        ? 'bg-[#00c300] text-white rounded-tr-none font-medium'
                        : isAlert
                        ? 'bg-gradient-to-br from-amber-950/70 to-slate-900 border border-amber-500/60 text-amber-100 rounded-tl-none shadow-amber-500/10'
                        : 'bg-slate-800 border border-slate-700/80 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    {isAlert && !isUser && (
                      <div className="flex items-center space-x-1 text-xs font-bold text-amber-400 mb-1.5 pb-1 border-b border-amber-500/30">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>แจ้งเตือนสถานะสต๊อก</span>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap leading-relaxed font-sans text-[13px]">
                      {msg.text}
                    </div>

                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex flex-wrap gap-1.5">
                        {msg.actions.map((act, i) => (
                          <button
                            key={i}
                            onClick={() => handleSendMessage(act.cmd)}
                            className="px-2.5 py-1 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-white text-xs font-semibold flex items-center transition active:scale-95"
                          >
                            {act.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs px-2 py-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce delay-100"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce delay-200"></div>
                <span>LINE Bot กำลังประมวลผลคำสั่ง...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Bar */}
          <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center space-x-2 overflow-x-auto text-xs">
            <span className="text-[11px] text-slate-500 whitespace-nowrap">พิมพ์ด่วน:</span>
            <button
              onClick={() => handleSendMessage('สต็อก')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap border border-slate-700 transition"
            >
              สต็อก
            </button>
            <button
              onClick={() => handleSendMessage('ใกล้หมด')}
              className="px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 whitespace-nowrap border border-amber-500/40 transition"
            >
              ⚠️ ใกล้หมด
            </button>
            <button
              onClick={() => handleSendMessage('ประวัติ')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap border border-slate-700 transition"
            >
              ประวัติ
            </button>
            <button
              onClick={() => handleSendMessage('คำสั่ง')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap border border-slate-700 transition"
            >
              ช่วยเหลือ
            </button>
          </div>

          {/* Input Box */}
          <div className="p-3 bg-slate-900 border-t border-slate-800">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="พิมพ์คำสั่ง เช่น + COKE-325 10 หรือ สต็อก..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white shadow-lg transition active:scale-95"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
