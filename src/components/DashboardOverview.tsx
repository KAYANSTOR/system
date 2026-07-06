import React from 'react';
import { Customer, CustomerFabric, Material, Employee, ProductionRecord, CustomerTransaction, UserRole } from '../types';
import { Landmark, Layers, ShoppingBag, Users, AlertTriangle, ArrowUpRight, ArrowDownLeft, Activity, Play } from 'lucide-react';

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
      
      {/* Bento Grid: Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Customer Debt */}
        <div 
          onClick={() => onNavigateToTab('customers')}
          className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-xs hover:border-indigo-200 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] text-slate-400 font-bold block">إجمالي ديون العملاء معلقة</span>
            <div className="bg-rose-50 text-rose-600 p-2 rounded-xl group-hover:bg-rose-100 transition-colors">
              <Landmark size={18} />
            </div>
          </div>
          <span className="text-lg font-black text-slate-800 block leading-none font-mono">
            {totalCustomerDebt.toLocaleString()} <span className="text-xs font-semibold text-slate-500">ريال</span>
          </span>
          <span className="text-[9px] text-slate-400 block mt-2 hover:underline">اضغط لعرض كشوف الحسابات والمحصلين ←</span>
        </div>

        {/* Card 2: Fabrics Yards */}
        <div 
          onClick={() => onNavigateToTab('fabrics')}
          className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-xs hover:border-indigo-200 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] text-slate-400 font-bold block">رصيد أقمشة الزبائن المتوفرة</span>
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl group-hover:bg-indigo-100 transition-colors">
              <Layers size={18} />
            </div>
          </div>
          <span className="text-lg font-black text-indigo-600 block leading-none font-mono">
            {totalFabricYards.toLocaleString()} <span className="text-xs font-semibold text-slate-500">وار</span>
          </span>
          <span className="text-[9px] text-slate-400 block mt-2 hover:underline">اضغط لعرض تفاصيل الطيقان المستلمة ←</span>
        </div>

        {/* Card 3: Low stock Materials */}
        <div 
          onClick={() => onNavigateToTab('materials')}
          className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-xs hover:border-indigo-200 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] text-slate-400 font-bold block">مستلزمات بحاجة لتوريد</span>
            <div className={`p-2 rounded-xl transition-colors ${lowStockMaterials.length > 0 ? 'bg-amber-50 text-amber-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'}`}>
              <ShoppingBag size={18} />
            </div>
          </div>
          <span className={`text-lg font-black block leading-none font-mono ${lowStockMaterials.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {lowStockMaterials.length} <span className="text-xs font-semibold text-slate-500">صنف ناقص</span>
          </span>
          <span className="text-[9px] text-slate-400 block mt-2 hover:underline">
            {lowStockMaterials.length > 0 ? '⚠️ انقر لعرض الأصناف الناقصة والوارد والمنصرف' : 'جميع مستويات المخزون كافية ووافية ←'}
          </span>
        </div>

        {/* Card 4: Active Employees */}
        <div 
          onClick={() => onNavigateToTab('employees')}
          className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-xs hover:border-indigo-200 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] text-slate-400 font-bold block">موظفي وعمال الصالة</span>
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl group-hover:bg-emerald-100 transition-colors">
              <Users size={18} />
            </div>
          </div>
          <span className="text-lg font-black text-slate-800 block leading-none font-mono">
            {activeEmployees} <span className="text-xs font-semibold text-slate-500">مشغل صالة</span>
          </span>
          <span className="text-[9px] text-slate-400 block mt-2 hover:underline">اضغط لعرض كشف الحضور والرواتب والمكائن ←</span>
        </div>
      </div>

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

      {/* Middle Grid: Dynamic SVG Production Curve & Leftover Fabrics alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Dynamic Production Curve Chart (Pure High Fidelity Custom SVG!) */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
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
            {/* SVG line and bar chart */}
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
              {/* Days: 01, 02, 03, 04, 05 July */}
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

        {/* Customer Leftover Fabric "Fargha" Alerts (FR-4.4) */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">أقمشة متبقية "فارغة"</h3>
            <p className="text-[10px] text-slate-400">أقمشة بقيت ككسور و فوارغ غير مستهلكة قيد الانتظار</p>
          </div>

          <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
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

      {/* Bottom Row: Recent Financial Movements & Quick Production Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recent Customer Financial Actions */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3.5">
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

        {/* Quick Recent Production Logs */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3.5">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">وردية تشغيل المكائن الأخيرة</h3>
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
  );
}
