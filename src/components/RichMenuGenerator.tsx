import React, { useRef } from 'react';
import { Download, Sparkles, Check, Copy } from 'lucide-react';

interface RichMenuGeneratorProps {
  appUrl: string;
}

export const RichMenuGenerator: React.FC<RichMenuGeneratorProps> = ({ appUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloaded, setDownloaded] = React.useState(false);

  const drawRichMenuImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2500;
    canvas.height = 1686;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 2500, 1686);
    bgGradient.addColorStop(0, '#0F172A');
    bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 2500, 1686);

    // 6 Grid blocks: 3 cols x 2 rows
    const colW = 2500 / 3; // 833.33
    const rowH = 1686 / 2; // 843

    const buttons = [
      {
        title: '📦 สรุปสต็อกทั้งหมด',
        subtitle: 'ดูสินค้าคงเหลือ & สถานะ',
        color: '#10B981',
        bg: '#064E3B',
        col: 0,
        row: 0,
        icon: '📦',
      },
      {
        title: '⚠️ สินค้าใกล้หมด',
        subtitle: 'รายการเตือนสั่งซื้อด่วน',
        color: '#F59E0B',
        bg: '#78350F',
        col: 1,
        row: 0,
        icon: '⚠️',
      },
      {
        title: '➕ เพิ่มสต็อกสินค้า',
        subtitle: 'พิมพ์ + [รหัส] [จำนวน]',
        color: '#3B82F6',
        bg: '#1E3A8A',
        col: 2,
        row: 0,
        icon: '📥',
      },
      {
        title: '➖ ตัดเบิก / ขายสินค้า',
        subtitle: 'พิมพ์ - [รหัส] [จำนวน]',
        color: '#EF4444',
        bg: '#7F1D1D',
        col: 0,
        row: 1,
        icon: '📤',
      },
      {
        title: '📱 เปิดแดชบอร์ดคลัง',
        subtitle: 'เปิดเว็บดูแบบเรียลไทม์',
        color: '#8B5CF6',
        bg: '#4C1D95',
        col: 1,
        row: 1,
        icon: '📊',
      },
      {
        title: '❓ คู่มือคำสั่งทั้งหมด',
        subtitle: 'วิธีสั่งงาน & ตัวอย่าง',
        color: '#06B6D4',
        bg: '#164E63',
        col: 2,
        row: 1,
        icon: '📋',
      },
    ];

    buttons.forEach(btn => {
      const x = btn.col * colW + 16;
      const y = btn.row * rowH + 16;
      const w = colW - 32;
      const h = rowH - 32;

      // Card background
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 36);
      ctx.fill();

      // Border
      ctx.lineWidth = 6;
      ctx.strokeStyle = btn.color;
      ctx.stroke();

      // Top colored accent bar
      ctx.fillStyle = btn.color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, 24, [36, 36, 0, 0]);
      ctx.fill();

      // Icon circle
      ctx.fillStyle = btn.bg;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h * 0.38, 110, 0, Math.PI * 2);
      ctx.fill();

      // Emoji/Icon
      ctx.font = '100px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.icon, x + w / 2, y + h * 0.38);

      // Title
      ctx.font = 'bold 56px "Prompt", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(btn.title, x + w / 2, y + h * 0.68);

      // Subtitle
      ctx.font = '40px "Prompt", sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(btn.subtitle, x + w / 2, y + h * 0.82);
    });

    return canvas.toDataURL('image/png');
  };

  const handleDownload = () => {
    const dataUrl = drawRichMenuImage();
    const link = document.createElement('a');
    link.download = 'line-richmenu-2500x1686.png';
    link.href = dataUrl;
    link.click();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-white text-sm flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>ดาวน์โหลดภาพ Rich Menu สำหรับ LINE OA (ขนาด 2500 x 1686 px)</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            ภาพปุ่มเมนูลัด 6 ช่องตามมาตรฐาน LINE Official Account ช่วยให้พนักงานกดสั่งการได้โดยไม่ต้องพิมพ์
          </p>
        </div>

        <button
          onClick={handleDownload}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95 flex-shrink-0"
        >
          {downloaded ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>ดาวน์โหลดแล้ว!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดภาพ Rich Menu (.png)</span>
            </>
          )}
        </button>
      </div>

      {/* Grid preview of 6 buttons */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-slate-800/80 border border-emerald-500/40 p-2.5 rounded-xl">
          <div className="text-lg mb-1">📦</div>
          <div className="font-bold text-emerald-300 text-[11px]">สรุปสต็อก</div>
          <div className="text-[10px] text-slate-400">ส่งข้อความ: "สต็อก"</div>
        </div>
        <div className="bg-slate-800/80 border border-amber-500/40 p-2.5 rounded-xl">
          <div className="text-lg mb-1">⚠️</div>
          <div className="font-bold text-amber-300 text-[11px]">สินค้าใกล้หมด</div>
          <div className="text-[10px] text-slate-400">ส่งข้อความ: "ใกล้หมด"</div>
        </div>
        <div className="bg-slate-800/80 border border-blue-500/40 p-2.5 rounded-xl">
          <div className="text-lg mb-1">📥</div>
          <div className="font-bold text-blue-300 text-[11px]">เพิ่มสต็อก</div>
          <div className="text-[10px] text-slate-400">ส่งข้อความ: "+ "</div>
        </div>
        <div className="bg-slate-800/80 border border-rose-500/40 p-2.5 rounded-xl">
          <div className="text-lg mb-1">📤</div>
          <div className="font-bold text-rose-300 text-[11px]">ตัดเบิก/ขาย</div>
          <div className="text-[10px] text-slate-400">ส่งข้อความ: "- "</div>
        </div>
        <div className="bg-slate-800/80 border border-purple-500/40 p-2.5 rounded-xl">
          <div className="text-lg mb-1">📊</div>
          <div className="font-bold text-purple-300 text-[11px]">เปิดแดชบอร์ด</div>
          <div className="text-[10px] text-slate-400">เปิดลิงก์เว็บ</div>
        </div>
        <div className="bg-slate-800/80 border border-cyan-500/40 p-2.5 rounded-xl">
          <div className="text-lg mb-1">📋</div>
          <div className="font-bold text-cyan-300 text-[11px]">คู่มือคำสั่ง</div>
          <div className="text-[10px] text-slate-400">ส่งข้อความ: "คำสั่ง"</div>
        </div>
      </div>
    </div>
  );
};
