import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  ExternalLink, 
  Key, 
  Activity, 
  HelpCircle, 
  CheckCircle2, 
  RefreshCw, 
  AlertTriangle,
  Bot,
  Zap,
  Smartphone,
  ShieldCheck,
  Send
} from 'lucide-react';
import type { LineConfig, LineWebhookLog } from '../types';
import { RichMenuGenerator } from './RichMenuGenerator';

interface SettingsViewProps {
  config: LineConfig;
  onSaveConfig: (updated: Partial<LineConfig>) => Promise<void>;
  logs: LineWebhookLog[];
  onRefreshLogs: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onSaveConfig,
  logs,
  onRefreshLogs,
}) => {
  const [channelAccessToken, setChannelAccessToken] = useState(config.channelAccessToken || '');
  const [channelSecret, setChannelSecret] = useState(config.channelSecret || '');
  const [adminLineUserId, setAdminLineUserId] = useState(config.adminLineUserId || '');
  const [autoNotifyLowStock, setAutoNotifyLowStock] = useState(config.autoNotifyLowStock ?? true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [testingToken, setTestingToken] = useState(false);
  const [tokenTestResult, setTokenTestResult] = useState<{ success: boolean; message: string; botInfo?: any } | null>(null);

  useEffect(() => {
    setChannelAccessToken(config.channelAccessToken || '');
    setChannelSecret(config.channelSecret || '');
    setAdminLineUserId(config.adminLineUserId || '');
    setAutoNotifyLowStock(config.autoNotifyLowStock ?? true);
    if (config.botInfo) {
      setTokenTestResult({
        success: true,
        message: `เชื่อมต่อกับ "${config.botInfo.displayName}" สำเร็จ`,
        botInfo: config.botInfo,
      });
    }
  }, [config]);

  const webhookUrl = config.webhookUrl || `${window.location.origin}/api/line/webhook`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveConfig({
        channelAccessToken: channelAccessToken.trim(),
        channelSecret: channelSecret.trim(),
        adminLineUserId: adminLineUserId.trim(),
        autoNotifyLowStock,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleTestToken = async () => {
    if (!channelAccessToken.trim()) {
      alert('กรุณากรอก Channel Access Token ก่อนทำการทดสอบ');
      return;
    }
    setTestingToken(true);
    setTokenTestResult(null);

    try {
      const res = await fetch('/api/line/test-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: channelAccessToken.trim(),
          secret: channelSecret.trim(),
        }),
      });

      const data = await res.json();
      setTokenTestResult({
        success: data.success,
        message: data.success ? data.message : (data.error || 'เชื่อมต่อไม่สำเร็จ'),
        botInfo: data.botInfo,
      });
    } catch (e: any) {
      setTokenTestResult({
        success: false,
        message: 'เชื่อมต่อล้มเหลว: ' + e.message,
      });
    } finally {
      setTestingToken(false);
    }
  };

  const handleTestPing = async () => {
    setPingStatus('กำลังตรวจสอบ...');
    try {
      const res = await fetch('/api/line/webhook');
      if (res.ok) {
        setPingStatus('✅ Webhook Endpoint พร้อมใช้งาน (HTTP 200 OK)');
      } else {
        setPingStatus(`⚠️ ตอบกลับสถานะ: ${res.status}`);
      }
    } catch (e: any) {
      setPingStatus(`❌ ไม่สามารถเชื่อมต่อได้: ${e.message}`);
    }
  };

  const isConnected = !!config.botInfo || (tokenTestResult?.success && tokenTestResult.botInfo);
  const botDisplay = tokenTestResult?.botInfo || config.botInfo;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Bot Status Banner */}
      <div className={`border rounded-3xl p-6 sm:p-7 shadow-xl transition-all ${
        isConnected 
          ? 'bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border-emerald-500/50' 
          : 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/40'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg overflow-hidden border ${
              isConnected ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-800 border-slate-700'
            }`}>
              {botDisplay?.pictureUrl ? (
                <img src={botDisplay.pictureUrl} alt="LINE Bot" className="w-full h-full object-cover" />
              ) : (
                <Bot className="w-8 h-8 text-white" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {isConnected ? (botDisplay?.displayName || 'LINE Official Account เชื่อมต่อแล้ว') : 'ยังไม่ได้เชื่อมต่อกับ LINE OA จริง'}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isConnected 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {isConnected ? '🟢 ออนไลน์ (Active)' : '🟡 รอการเชื่อมต่อ'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {isConnected 
                  ? 'ระบบพร้อมรับคำสั่งสต๊อกและตอบกลับ Flex Messages อัตโนมัติในแชท LINE เรียบร้อยแล้ว'
                  : 'ทำตาม 4 ขั้นตอนด้านล่าง เพื่อเปิดให้พนักงานพิมพ์สั่งการใน LINE ได้ทันที'}
              </p>
            </div>
          </div>

          <button
            onClick={handleTestToken}
            disabled={testingToken}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center space-x-1.5 flex-shrink-0"
          >
            <Zap className="w-4 h-4" />
            <span>{testingToken ? 'กำลังทดสอบ...' : 'ทดสอบ Token กับ LINE'}</span>
          </button>
        </div>

        {tokenTestResult && (
          <div className={`mt-4 p-3 rounded-xl text-xs flex items-center space-x-2 border ${
            tokenTestResult.success 
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}>
            {tokenTestResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
            <span>{tokenTestResult.message}</span>
          </div>
        )}
      </div>

      {/* Webhook Endpoint Highlight */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-3">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2">
              <Activity className="w-3.5 h-3.5" />
              <span>Webhook Endpoint (LINE Developers)</span>
            </div>
            <h3 className="text-lg font-black text-white">
              Webhook URL สำหรับรับข้อความคำสั่งสต๊อก
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              คัดลอก URL นี้ไปใส่ในช่อง <b>Webhook URL</b> ที่หน้า LINE Developers Console
            </p>
          </div>

          <button
            onClick={handleTestPing}
            className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition"
          >
            ตรวจสอบการตอบสนอง Webhook
          </button>
        </div>

        {/* Copyable Webhook URL */}
        <div className="flex items-center bg-slate-950/90 border border-slate-800 rounded-2xl p-2 sm:p-3">
          <div className="flex-1 font-mono text-xs sm:text-sm text-emerald-300 px-3 truncate select-all">
            {webhookUrl}
          </div>
          <button
            onClick={handleCopyUrl}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-md flex-shrink-0"
          >
            {copiedUrl ? (
              <>
                <Check className="w-4 h-4" />
                <span>คัดลอกแล้ว!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>คัดลอก Webhook URL</span>
              </>
            )}
          </button>
        </div>

        {pingStatus && (
          <div className="mt-3 text-xs text-slate-300 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800">
            {pingStatus}
          </div>
        )}
      </div>

      {/* 4-Step Connection Guide */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center space-x-2">
          <HelpCircle className="w-5 h-5 text-emerald-400" />
          <span>4 ขั้นตอนเปิดใช้งานใน LINE Official Account (ทำครั้งเดียวเสร็จใน 3 นาที)</span>
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          โปรดทำตามลำดับเพื่อความถูกต้องและให้บอทสต็อกตอบกลับทันที:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Step 1 */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm">
                1
              </span>
              <a
                href="https://developers.line.biz/console/"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center text-xs font-medium"
              >
                เปิด LINE Developers <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
            <h4 className="font-bold text-white text-sm">สร้าง Messaging API Channel</h4>
            <p className="text-slate-400 leading-relaxed">
              เข้าสู่ระบบ LINE Developers เลือกหรือสร้าง Provider แล้วกดสร้าง <b>Messaging API Channel</b> (หากมีบัญชี LINE OA อยู่แล้ว สามารถผูก Messaging API เข้ากับบัญชีเดิมได้)
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm">
                2
              </span>
              <span className="text-emerald-400 font-medium text-xs">Webhook Setup</span>
            </div>
            <h4 className="font-bold text-white text-sm">วาง Webhook URL และเปิดใช้งาน</h4>
            <p className="text-slate-400 leading-relaxed">
              ไปที่แท็บ <b>Messaging API</b> วาง Webhook URL ด้านบนลงในช่อง Webhook URL จากนั้นเปิดสวิตช์ <b>"Use webhook"</b> และกดปุ่ม <b>Verify</b> เพื่อยืนยันความพร้อม
            </p>
          </div>

          {/* Step 3 (CRITICAL) */}
          <div className="bg-slate-900/90 border border-amber-500/40 p-4 rounded-2xl space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-bl">
              สำคัญมาก! ⚠️
            </div>
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-sm">
                3
              </span>
              <a
                href="https://manager.line.biz/"
                target="_blank"
                rel="noreferrer"
                className="text-amber-300 hover:underline flex items-center text-xs font-medium"
              >
                เปิด LINE OA Manager <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
            <h4 className="font-bold text-amber-200 text-sm">ปิดข้อความตอบกลับอัตโนมัติของ LINE</h4>
            <p className="text-slate-300 leading-relaxed">
              ไปที่ <b>manager.line.biz</b> ➔ ตั้งค่าการตอบกลับ (Response settings):<br />
              • โหมดการตอบกลับ = <b>บอต (Bot)</b><br />
              • Webhooks = <b>เปิด (On)</b><br />
              • ข้อความตอบกลับอัตโนมัติ (Auto-response) = <b>ปิด (Off)</b> <i>(เพื่อไม่ให้ข้อความสุ่มของ LINE แย่งตอบตัดหน้าบอทสต็อก)</i>
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm">
                4
              </span>
              <span className="text-emerald-400 font-medium text-xs">Credentials</span>
            </div>
            <h4 className="font-bold text-white text-sm">นำ Token & Secret มากรอก</h4>
            <p className="text-slate-400 leading-relaxed">
              คัดลอก <b>Channel Secret</b> (จากแท็บ Basic settings) และกด Issue <b>Channel Access Token</b> (จากแท็บ Messaging API) นำมากรอกในฟอร์มด้านล่างนี้แล้วกดบันทึก
            </p>
          </div>
        </div>
      </div>

      {/* LINE Rich Menu Generator Section */}
      <RichMenuGenerator appUrl={webhookUrl.replace('/api/line/webhook', '')} />

      {/* Secret Keys Form */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center space-x-2">
          <Key className="w-5 h-5 text-emerald-400" />
          <span>กรอก LINE Messaging API Credentials</span>
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          ข้อมูลนี้จะถูกเก็บไว้บนเซิร์ฟเวอร์เพื่อใช้ส่งข้อความ Flex Messages และแจ้งเตือนสต๊อกเข้า LINE พนักงาน
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Channel Access Token (Long-lived) *
            </label>
            <input
              type="password"
              value={channelAccessToken}
              onChange={e => setChannelAccessToken(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Channel Secret
            </label>
            <input
              type="password"
              value={channelSecret}
              onChange={e => setChannelSecret(e.target.value)}
              placeholder="เช่น 8e3c4b12984501a4e98f..."
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              ใช้สำหรับตรวจสอบลายเซ็นดิจิทัล (X-Line-Signature) ป้องกันคำสั่งปลอมแปลง
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin LINE User ID (ตัวเลือกเสริมสำหรับส่งแจ้งเตือนสินค้าใกล้หมดโดยตรง)
            </label>
            <input
              type="text"
              value={adminLineUserId}
              onChange={e => setAdminLineUserId(e.target.value)}
              placeholder="เช่น U1a2b3c4d5e6f7g8h9..."
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              สามารถดู User ID ของตนเองได้จากหน้า Basic settings หรือปล่อยว่างไว้เพื่อบรอดแคสต์
            </p>
          </div>

          <div className="pt-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoNotifyLowStock}
                onChange={e => setAutoNotifyLowStock(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-xs sm:text-sm text-slate-200 font-medium">
                ส่งข้อความแจ้งเตือนอัตโนมัติเข้า LINE เมื่อมีสินค้าใกล้หมดสต็อก (Auto Low-Stock Alert)
              </span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-700 flex items-center justify-between">
            {saveSuccess ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1" /> บันทึกการตั้งค่าเรียบร้อย
              </span>
            ) : (
              <span className="text-xs text-slate-500">พร้อมใช้งานทันทีหลังบันทึก</span>
            )}

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
          </div>
        </form>
      </div>

      {/* Live Webhook Logs */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>ประวัติการเรียก Webhook จาก LINE (Live Event Logs)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              แสดงข้อความที่พนักงานส่งเข้ามาทาง LINE และผลการประมวลผลของระบบ
            </p>
          </div>
          <button
            onClick={onRefreshLogs}
            className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
            title="รีเฟรชบันทึก"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            ยังไม่มีข้อความส่งเข้ามาจาก LINE (ลองส่งข้อความในแชทจำลองหรือใน LINE OA จริง)
          </div>
        ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto">
            {logs.map(l => (
              <div
                key={l.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-300">{l.senderName}</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400">
                      {new Date(l.timestamp).toLocaleTimeString('th-TH')}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      l.status === 'warning'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {l.status === 'warning' ? '⚠️ แจ้งเตือน' : '✅ สำเร็จ'}
                  </span>
                </div>

                <div className="font-mono text-emerald-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-850">
                  ข้อความส่งมา: "{l.rawMessage}"
                </div>

                <div className="text-slate-400 text-[11px] line-clamp-2">
                  ผลลัพธ์: {l.actionTaken}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
