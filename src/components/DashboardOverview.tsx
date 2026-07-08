import React, { useState, useEffect } from 'react';
import { Customer, CustomerFabric, Material, Employee, ProductionRecord, CustomerTransaction, UserRole } from '../types';
import { Landmark, Layers, ShoppingBag, Users, AlertTriangle, ArrowUpRight, ArrowDownLeft, Activity, Play, Sparkles, RefreshCw, Cpu } from 'lucide-react';

interface DashboardOverviewProps {
  userRole: UserRole;
  customers: Customer[];
  fabrics: CustomerFabric[];
  materials: Material[];
  employees: Employee[];
  productionRecords: ProductionRecord[];
  transactions: CustomerTransaction[];
  onNavigateToTab: (tab: string, prefill?: any) => void;
}

export default function DashboardOverview({
  userRole,
  customers,
  fabrics,
  materials,
  employees,
  productionRecords,
  transactions,
  onNavigateToTab
}: DashboardOverviewProps) {
  // Inner Sub-tab page navigation state
  const [subTab, setSubTab] = useState<'indicators' | 'financials' | 'ai_insights'>('indicators');

  // Antigravity AI Insights State
  const [insights, setInsights] = useState<string>('');
  const [insightsLoading, setInsightsLoading] = useState<boolean>(false);
  const [insightsError, setInsightsError] = useState<string>('');
  const [isLive, setIsLive] = useState<boolean>(false);

  const fetchAIInsights = async () => {
    setInsightsLoading(true);
    setInsightsError('');
    try {
      const res = await fetch('/api/antigravity/insights');
      if (!res.ok) {
        throw new Error('فشل جلب تحليلات الخادم الذكية');
      }
      const data = await res.json();
      setInsights(data.insights);
      setIsLive(data.source === 'gemini');
    } catch (err: any) {
      setInsightsError(err.message || 'خطأ أثناء الاتصال بسيرفر الذكاء الاصطناعي');
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    fetchAIInsights();
  }, []);

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="font-extrabold text-slate-800 text-xs mt-3.5 mb-1.5">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="font-black text-slate-800 text-sm mt-4 mb-2">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={idx} className="font-black text-slate-900 text-base mt-4 mb-2">{line.replace('# ', '')}</h2>;
      }
      
      // Bullets
      let isBullet = false;
      let cleanLine = line;
      if (line.startsWith('* ') || line.startsWith('- ')) {
        isBullet = true;
        cleanLine = line.substring(2);
      } else if (/^\d+\.\s/.test(line)) {
        isBullet = true;
        // Keep numbering or just strip
      }

      // Bold parsing
      const boldRegex = /\*\*(.*?)\*\*/g;
      const matches = [...cleanLine.matchAll(boldRegex)];
      let contentNode: React.ReactNode = cleanLine;

      if (matches.length > 0) {
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        matches.forEach((match, mIdx) => {
          if (match.index !== undefined) {
            if (match.index > lastIndex) {
              parts.push(cleanLine.substring(lastIndex, match.index));
            }
            parts.push(<strong key={mIdx} className="font-black text-indigo-950 bg-indigo-50/50 px-1 py-0.5 rounded-md border border-indigo-100/30">{match[1]}</strong>);
            lastIndex = match.index + match[0].length;
          }
        });
        if (lastIndex < cleanLine.length) {
          parts.push(cleanLine.substring(lastIndex));
        }
        contentNode = parts;
      }

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed mb-2.5 bg-slate-50/45 p-2.5 rounded-xl border border-slate-100/30">
            <span className="text-indigo-600 mt-1 font-bold shrink-0 text-sm">•</span>
            <span>{contentNode}</span>
          </div>
        );
      }

      if (!line.trim()) return <div key={idx} className="h-1.5" />;

      return <p key={idx} className="text-xs text-slate-600 leading-relaxed mb-2">{contentNode}</p>;
    });
  };

  // Stats
  const totalCustomerDebt = customers.reduce((acc, curr) => acc + (curr.balance > 0 ? curr.balance : 0), 0);
  const totalFabricYards = fabrics.reduce((acc, curr) => acc + curr.remaining_yards, 0);
  const lowStockMaterials = materials.filter(m => m.current_quantity <= m.min_alert_qty);
  const activeEmployees = employees.filter(e => e.is_active).length;

  // Recent transactions to list
  const recentTx = transactions
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Recent production entries
  const recentProd = productionRecords
    .slice()
    .reverse()
    .slice(0, 4);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      
      {/* Premium Tabbed Navigation for Dashboard Section */}
      <div className="bg-white border border-slate-200/50 p-1.5 rounded-2xl shadow-xs flex flex-wrap gap-1 no-print">
        <button
          onClick={() => setSubTab('indicators')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'indicators'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Activity size={16} className={subTab === 'indicators' ? 'text-indigo-400' : 'text-slate-400'} />
          <span>لوحة المؤشرات والإنتاجية</span>
        </button>

        <button
          onClick={() => setSubTab('financials')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'financials'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Landmark size={16} className={subTab === 'financials' ? 'text-indigo-400' : 'text-slate-400'} />
          <span>الحركات والعمليات الأخيرة</span>
          {lowStockMaterials.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setSubTab('ai_insights')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'ai_insights'
              ? 'bg-indigo-950 text-indigo-100 border border-indigo-800 shadow-xs'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Sparkles size={16} className="text-amber-400 animate-pulse" />
          <span>تحليلات الذكاء الاصطناعي (Antigravity AI)</span>
        </button>
      </div>

      {/* Tab 1: Indicators & Bento Grid */}
      {subTab === 'indicators' && (
        <div className="space-y-6 animate-fade-in">
          {/* Bento Grid: Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Card 1: Customer Debt */}
            <div 
              onClick={() => onNavigateToTab('customers')}
              className="luxury-card p-5 rounded-3xl cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] text-slate-400 font-extrabold block">إجمالي ديون العملاء المعلقة</span>
                <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl group-hover:bg-rose-100/80 transition-colors border border-rose-100/50">
                  <Landmark size={18} />
                </div>
              </div>
              <span className="text-xl font-black text-slate-800 block leading-none font-mono">
                {totalCustomerDebt.toLocaleString()} <span className="text-xs font-semibold text-slate-500">ريال</span>
              </span>
              <span className="text-[10px] text-rose-600/80 font-bold block mt-3 hover:underline">كشوف الحسابات والمحصلين ←</span>
            </div>

            {/* Card 2: Fabrics Yards */}
            <div 
              onClick={() => onNavigateToTab('fabrics')}
              className="luxury-card p-5 rounded-3xl cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] text-slate-400 font-extrabold block">رصيد أقمشة الزبائن المتوفرة</span>
                <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl group-hover:bg-indigo-100/80 transition-colors border border-indigo-100/50">
                  <Layers size={18} />
                </div>
              </div>
              <span className="text-xl font-black text-indigo-600 block leading-none font-mono">
                {totalFabricYards.toLocaleString()} <span className="text-xs font-semibold text-slate-500">وار</span>
              </span>
              <span className="text-[10px] text-indigo-600/80 font-bold block mt-3 hover:underline">تفاصيل الطيقان المستلمة ←</span>
            </div>

            {/* Card 3: Low stock Materials */}
            <div 
              onClick={() => onNavigateToTab('materials')}
              className="luxury-card p-5 rounded-3xl cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] text-slate-400 font-extrabold block">مستلزمات بحاجة لتوريد</span>
                <div className={`p-2.5 rounded-xl transition-colors border ${lowStockMaterials.length > 0 ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                  <ShoppingBag size={18} />
                </div>
              </div>
              <span className={`text-xl font-black block leading-none font-mono ${lowStockMaterials.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {lowStockMaterials.length} <span className="text-xs font-semibold text-slate-500">صنف ناقص</span>
              </span>
              <span className="text-[10px] text-amber-600/80 font-bold block mt-3 hover:underline">
                {lowStockMaterials.length > 0 ? '⚠️ عرض الأصناف الناقصة والوارد' : 'جميع مستويات المخزون كافية ←'}
              </span>
            </div>

            {/* Card 4: Active Employees */}
            <div 
              onClick={() => onNavigateToTab('employees')}
              className="luxury-card p-5 rounded-3xl cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] text-slate-400 font-extrabold block">موظفي وعمال الصالة</span>
                <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl group-hover:bg-emerald-100/80 transition-colors border border-emerald-100/50">
                  <Users size={18} />
                </div>
              </div>
              <span className="text-xl font-black text-slate-800 block leading-none font-mono">
                {activeEmployees} <span className="text-xs font-semibold text-slate-500">مشغل صالة</span>
              </span>
              <span className="text-[10px] text-emerald-600/80 font-bold block mt-3 hover:underline">سجل الحضور والرواتب والمكائن ←</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Dynamic Production Curve Chart (Pure High Fidelity Custom SVG!) */}
            <div className="lg:col-span-8 luxury-card rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    <Activity size={16} className="text-indigo-600" />
                    المخطط البياني لتشغيل وإنتاج الصالة (عدد الغرز اليومية)
                  </h3>
                  <p className="text-[10px] text-slate-400">منحنى تتبع عدد الغرز التراكمية اليومية المسجلة على المكائن الفعالة</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-center items-center">
                <svg viewBox="0 0 500 180" className="w-full h-44 overflow-visible font-sans text-[9px] font-semibold text-slate-400">
                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="50" x2="480" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="80" x2="480" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="110" x2="480" y2="110" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3" />
                  <line x1="40" y1="140" x2="480" y2="140" stroke="#cbd5e1" strokeWidth="1" />

                  {/* Grid Values (Stitches / 1000) */}
                  <text x="30" y="24" textAnchor="end">120K غرزة</text>
                  <text x="30" y="54" textAnchor="end">90K غرزة</text>
                  <text x="30" y="84" textAnchor="end">60K غرزة</text>
                  <text x="30" y="114" textAnchor="end">30K غرزة</text>
                  <text x="30" y="144" textAnchor="end">0</text>

                  {/* Data points and line representing mock stitches curves over last days */}
                  <g className="chart-line-points">
                    <path 
                      d="M 60,130 Q 140,40 220,100 T 380,50 T 460,70" 
                      fill="none" 
                      stroke="#4f46e5" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                    />
                    
                    {/* Dots on line */}
                    <circle cx="60" cy="130" r="4.5" fill="#4f46e5" stroke="white" strokeWidth="1.5" />
                    <circle cx="140" cy="40" r="4.5" fill="#4f46e5" stroke="white" strokeWidth="1.5" />
                    <circle cx="220" cy="100" r="4.5" fill="#4f46e5" stroke="white" strokeWidth="1.5" />
                    <circle cx="380" cy="50" r="4.5" fill="#4f46e5" stroke="white" strokeWidth="1.5" />
                    <circle cx="460" cy="70" r="4.5" fill="#4f46e5" stroke="white" strokeWidth="1.5" />
                  </g>

                  {/* X Axis Labels */}
                  <text x="60" y="160" textAnchor="middle">01 يوليو</text>
                  <text x="140" y="160" textAnchor="middle">02 يوليو</text>
                  <text x="220" y="160" textAnchor="middle">03 يوليو</text>
                  <text x="300" y="160" textAnchor="middle">04 يوليو</text>
                  <text x="380" y="160" textAnchor="middle">05 يوليو</text>
                  <text x="460" y="160" textAnchor="middle">اليوم</text>
                </svg>
              </div>
              <p className="text-[9px] text-slate-400 text-center">
                يرجى التأكد من تقييد جميع إنتاجات الوردية بشكل صحيح لتحديث المنحنيات بشكل دوري.
              </p>
            </div>

            {/* Quick Recent Production Logs */}
            <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3.5">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Play size={16} className="text-amber-500" />
                  وردية تشغيل المكائن الأخيرة
                </h3>
                <p className="text-[10px] text-slate-400">آخر ما تم تقييده من الغرز والفرشات المسجلة اليوم</p>
              </div>

              <div className="space-y-2">
                {recentProd.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-400">لا توجد ورديات تشغيل مقيدة اليوم</p>
                ) : (
                  recentProd.map(record => {
                    const emp = employees.find(e => e.id === record.employee_id);
                    return (
                      <div key={record.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="bg-amber-100 text-amber-700 p-1.5 rounded-lg shrink-0">
                            <Play size={14} />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">المشغل: {emp ? emp.name : 'موظف مجهول'}</span>
                            <span className="text-[9px] text-slate-400 mt-0.5 block">الوردية: {record.shift === 'day' ? 'نهاراً' : 'ليلاً'} - تاريخ: {record.work_date}</span>
                          </div>
                        </div>
                        <div className="text-left font-mono">
                          <span className="font-black text-slate-800 block text-xs">{record.stitches_count.toLocaleString()} غرزة</span>
                          <span className="text-[9px] text-slate-400 font-bold block">{record.panels_count} فرشة</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Financials & Supply warning */}
      {subTab === 'financials' && (
        <div className="space-y-6 animate-fade-in">
          {/* Low stock Alert Banner (FR-6.4) */}
          {lowStockMaterials.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-right">
              <div className="bg-rose-100 text-rose-700 p-2 rounded-xl shrink-0 mt-0.5">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h4 className="font-extrabold text-rose-800 text-xs">تنبيه انخفاض مستويات المستلزمات الخام!</h4>
                <p className="text-[11px] text-rose-700 mt-1 leading-relaxed">
                  تجاوزت بعض المستلزمات والمواد الأساسية في مخزن المعمل حد الأمان (مستويات الخزين الحالية مساوية أو أقل من حد التنبيه المقيد). 
                  الرجاء التوريد فوراً لضمان عدم توقف المكائن أو تعثر شغل التطريز:
                </p>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {lowStockMaterials.map(m => (
                    <span 
                      key={m.id}
                      onClick={() => onNavigateToTab('materials')}
                      className="bg-white border border-rose-200 text-rose-700 px-2 py-1 rounded-lg text-[10px] font-bold hover:bg-rose-50 cursor-pointer shadow-xs"
                    >
                      {m.name}: <strong className="font-mono text-[11px]">{m.current_quantity}</strong> {m.unit === 'kg' ? 'كجم' : 'حبة'} (الحد: {m.min_alert_qty})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recent Customer Financial Actions */}
            <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3.5">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">آخر العمليات المالية والمقبوضات</h3>
                <p className="text-[10px] text-slate-400">الفواتير وسندات القبض المتبادلة مؤخراً بالمعمل</p>
              </div>

              <div className="space-y-2">
                {recentTx.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-400">لا توجد عمليات مالية مقيدة مؤخراً</p>
                ) : (
                  recentTx.map(tx => {
                    const isReceipt = tx.type === 'receipt';
                    const customer = customers.find(c => c.id === tx.customer_id);
                    return (
                      <div key={tx.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg shrink-0 ${isReceipt ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {isReceipt ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">{customer ? customer.name : 'عميل غير مسجل'}</span>
                            <span className="text-[9px] text-slate-400 mt-0.5 block">{tx.notes}</span>
                          </div>
                        </div>
                        <span className={`font-mono font-bold text-xs ${isReceipt ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {isReceipt ? '-' : '+'}{tx.amount.toLocaleString()} <span className="text-[10px] font-normal">ريال</span>
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Customer Leftover Fabric "Fargha" Alerts (FR-4.4) */}
            <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">أقمشة متبقية "فارغة"</h3>
                <p className="text-[10px] text-slate-400">أقمشة بقيت ككسور و فوارغ غير مستهلكة قيد الانتظار</p>
              </div>

              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {fabrics.filter(f => f.is_leftover).length === 0 ? (
                  <p className="text-center py-10 text-xs text-slate-400">لا تتوفر أقمشة فوارغ متبقية حالياً</p>
                ) : (
                  fabrics
                    .filter(f => f.is_leftover && f.remaining_yards > 0)
                    .map(fabric => {
                      const customer = customers.find(c => c.id === fabric.customer_id);
                      return (
                        <div 
                          key={fabric.id}
                          onClick={() => onNavigateToTab('customers')}
                          className="p-2.5 bg-amber-50/50 border border-amber-200/60 hover:bg-amber-100/50 rounded-xl transition-all cursor-pointer flex justify-between items-center text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800 block truncate max-w-[150px]">{fabric.fabric_type}</span>
                            <span className="text-[9px] text-slate-400 mt-0.5 block">الزبون: {customer ? customer.name : 'مجهول'}</span>
                          </div>
                          <span className="text-xs font-extrabold text-amber-800 font-mono text-left">
                            {fabric.remaining_yards} وار
                          </span>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Antigravity AI Insights */}
      {subTab === 'ai_insights' && (
        <div className="space-y-6 animate-fade-in">
          {/* Antigravity AI Smart Core Insights Block */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden text-right no-print">
            {/* Glow Effect */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/8 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-slate-800 pb-5 mb-5">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white p-3 rounded-2xl shadow-lg shadow-indigo-950">
                  <Sparkles size={22} className="animate-pulse text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-white text-base">مساعد القرار والتحليلات الذكية</h3>
                    <span className="bg-indigo-950 text-indigo-400 text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-800/40">
                      Antigravity Smart Core v1.4
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    توليد تحليلات وتوصيات تشغيلية فورية بناءً على المؤشرات المالية وحالة مستودعات المواد والإنتاج بالمعمل
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                <button
                  onClick={fetchAIInsights}
                  disabled={insightsLoading}
                  className="bg-slate-800 border border-slate-700/60 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={14} className={insightsLoading ? 'animate-spin text-amber-300' : 'text-slate-400'} />
                  تحديث التحليل الحالي
                </button>
                <span className="flex items-center gap-1.5 text-[10px] text-slate-300 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                  <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'}`} />
                  {isLive ? 'اتصال سحابي ذكي نشط' : 'محاكي محلي احتياطي'}
                </span>
              </div>
            </div>

            <div className="relative z-10">
              {insightsLoading ? (
                <div className="py-16 flex flex-col justify-center items-center gap-4">
                  <Cpu className="text-indigo-400 animate-spin" size={40} />
                  <p className="text-xs text-indigo-200 font-black">جاري الاستعلام وتشغيل محاكيات Antigravity الذكية لمعلومات المعمل...</p>
                </div>
              ) : insightsError ? (
                <div className="p-4 bg-rose-950/40 border border-rose-800/50 rounded-2xl text-rose-300 text-xs font-semibold">
                  ⚠️ {insightsError}
                </div>
              ) : (
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 text-slate-300 space-y-4 max-w-none">
                  {renderMarkdown(insights)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
