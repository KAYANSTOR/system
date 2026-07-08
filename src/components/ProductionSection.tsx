import React, { useState } from 'react';
import { Machine, MachineAssignment, ProductionRecord, Employee, UserRole } from '../types';
import { PenTool, Plus, CheckCircle, Search, UserCheck, Play, Settings, Cpu, History, ClipboardList, SlidersHorizontal, Layers, Award } from 'lucide-react';

interface ProductionSectionProps {
  userRole: UserRole;
  machines: Machine[];
  assignments: (MachineAssignment & { machine_name?: string })[];
  productionRecords: (ProductionRecord & { machine_name?: string; employee_name?: string })[];
  employees: Employee[];
  onAddMachine: (name: string, code: string) => Promise<void>;
  onAssignMachine: (machineId: string, username: string) => Promise<void>;
  onRecordProduction: (
    machineId: string,
    employeeId: string,
    receiverName: string,
    stitchesCount: number,
    panelsCount: number,
    workDate: string,
    shift: string
  ) => Promise<void>;
}

export default function ProductionSection({
  userRole,
  machines,
  assignments,
  productionRecords,
  employees,
  onAddMachine,
  onAssignMachine,
  onRecordProduction
}: ProductionSectionProps) {
  const [subTab, setSubTab] = useState<'status' | 'records' | 'actions'>('status');
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);

  // Machine form state
  const [machName, setMachName] = useState('');
  const [machCode, setMachCode] = useState('');
  const [machError, setMachError] = useState('');

  // Assignment form state
  const [assignMachId, setAssignMachId] = useState('');
  const [assignUsername, setAssignUsername] = useState('');
  const [assignError, setAssignError] = useState('');

  // Production record form state
  const [prodMachId, setProdMachId] = useState('');
  const [prodEmployeeId, setProdEmployeeId] = useState('');
  const [prodReceiver, setProdReceiver] = useState('');
  const [prodStitches, setProdStitches] = useState('');
  const [prodPanels, setProdPanels] = useState('');
  const [prodDate, setProdDate] = useState(new Date().toISOString().split('T')[0]);
  const [prodShift, setProdShift] = useState('day');
  const [prodError, setProdError] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const isAdmin = userRole === 'admin';
  const isSupervisor = userRole === 'admin';

  const handleAddMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machName || !machCode) return;
    setLoading(true);
    setMachError('');
    try {
      await onAddMachine(machName, machCode);
      setMachName('');
      setMachCode('');
      setShowMachineModal(false);
    } catch (err: any) {
      setMachError(err.message || 'خطأ أثناء تسجيل الماكينة');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignMachId || !assignUsername) return;
    setLoading(true);
    setAssignError('');
    try {
      await onAssignMachine(assignMachId, assignUsername);
      setAssignMachId('');
      setAssignUsername('');
      setShowAssignModal(false);
    } catch (err: any) {
      setAssignError(err.message || 'خطأ أثناء تعيين الماكينة');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodMachId || !prodEmployeeId || !prodStitches || !prodPanels || !prodReceiver) {
      setProdError('الرجاء تعبئة جميع الحقول الأساسية للوردية');
      return;
    }
    setLoading(true);
    setProdError('');
    setSuccessMsg('');
    try {
      await onRecordProduction(
        prodMachId,
        prodEmployeeId,
        prodReceiver,
        Number(prodStitches),
        Number(prodPanels),
        prodDate,
        prodShift
      );
      
      // Feedback
      setSuccessMsg('تم تقييد إنتاج الماكينة بنجاح، وتحديث وترحيل سجل حضور الموظف تلقائياً لليوم!');
      
      // Clear
      setProdMachId('');
      setProdEmployeeId('');
      setProdReceiver('');
      setProdStitches('');
      setProdPanels('');
      
      setTimeout(() => {
        setSuccessMsg('');
        setShowRecordModal(false);
      }, 4000);

    } catch (err: any) {
      setProdError(err.message || 'خطأ أثناء تسجيل الإنتاج');
    } finally {
      setLoading(false);
    }
  };

  // Calculate live production statistics
  const totalMachinesCount = machines.length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = productionRecords.filter(r => r.work_date === todayStr);
  const todayStitches = todayRecords.reduce((sum, r) => sum + r.stitches_count, 0);
  const todayPanels = todayRecords.reduce((sum, r) => sum + r.panels_count, 0);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <PenTool className="text-amber-500" size={22} />
            إدارة صالة الإنتاج والمكائن اليومية
          </h2>
          <p className="text-xs text-slate-400">مراقبة تشغيل المكائن، تعيين المشرفين، وتقييد الغرز والفرشات اليومية للموظفين في معمل كيان سوفت</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isSupervisor && (
            <button
              id="btn-open-record-prod"
              onClick={() => {
                setProdError('');
                setSuccessMsg('');
                setShowRecordModal(true);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Play size={14} />
              تسجيل وردية إنتاج
            </button>
          )}
          {isAdmin && (
            <>
              <button
                id="btn-open-assign-mach"
                onClick={() => setShowAssignModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <UserCheck size={14} />
                تعيين ماكينة لمشرف
              </button>
              <button
                id="btn-open-add-mach"
                onClick={() => setShowMachineModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                إضافة ماكينة جديدة
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="bg-white border border-slate-200/50 p-1.5 rounded-2xl shadow-xs flex flex-wrap gap-1">
        <button
          onClick={() => setSubTab('status')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'status'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Cpu size={16} />
          <span>حالة ومسؤولية مكائن التطريز</span>
          <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full font-black">
            {totalMachinesCount}
          </span>
        </button>

        <button
          onClick={() => setSubTab('records')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'records'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <History size={16} />
          <span>يومية إنتاج الصالة وسجل الورديات</span>
        </button>

        <button
          onClick={() => setSubTab('actions')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'actions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal size={16} />
          <span>التحكم السريع بتكليف الوردية</span>
        </button>
      </div>

      {/* SUBTAB 1: MACHINES STATUS LIST */}
      {subTab === 'status' && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Metrics of Today's production */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-center">
              <div>
                <span className="text-slate-400 block text-xs font-bold">إجمالي مكائن التطريز بصالة الإنتاج</span>
                <span className="font-black text-slate-800 text-lg block mt-1">{totalMachinesCount} مكائن فعالة</span>
              </div>
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl animate-pulse">
                <Cpu size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-center">
              <div>
                <span className="text-slate-400 block text-xs font-bold">عدد غرز صالة التطريز المقيدة (اليوم)</span>
                <span className="font-black text-emerald-600 text-lg block mt-1">{todayStitches.toLocaleString()} غرزة</span>
              </div>
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                <Award size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-center">
              <div>
                <span className="text-slate-400 block text-xs font-bold">عدد الفرشات والقطع المنفذة (اليوم)</span>
                <span className="font-black text-amber-600 text-lg block mt-1">{todayPanels} قطعة / فرشة</span>
              </div>
              <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
                <PenTool size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">حالة ومسؤولية مكائن التطريز</h3>
              <p className="text-xs text-slate-400 mt-1">توضح قائمة المكائن المتاحة، أكوادها المرجعية والمشرفين المعينين عليها</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {machines.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-400 text-xs">
                  لا توجد مكائن مسجلة حالياً
                </div>
              ) : (
                machines.map(m => {
                  const assign = assignments.find(a => a.machine_id === m.id);
                  return (
                    <div key={m.id} className="p-5 bg-slate-50/50 border border-slate-150 rounded-2xl space-y-3 hover:border-slate-300 transition-all">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-black text-slate-800 text-sm">{m.name}</span>
                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-100 font-mono">
                          {m.code}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex justify-between border-t border-slate-200/50 pt-2">
                        <span>المشرف المسؤول:</span>
                        <strong className="text-slate-600 font-bold">{assign ? assign.username : 'لم يتم التعيين بعد'}</strong>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: DETAILED PRODUCTION RECORDS */}
      {subTab === 'records' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5 animate-fade-in">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">يومية إنتاج الصالة وسجل الورديات المفصل</h3>
            <p className="text-xs text-slate-400 mt-1">سجل تشغيل المكائن وربط الإنتاج بدفتر حضور الموظفين تلقائياً لليوميات</p>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                  <th className="p-3.5">التاريخ</th>
                  <th className="p-3.5">الماكينة المستهدفة</th>
                  <th className="p-3.5">المشغل (الموظف)</th>
                  <th className="p-3.5 text-center">الوردية</th>
                  <th className="p-3.5 text-center">عدد الغرز المنجزة</th>
                  <th className="p-3.5 text-center">عدد الفرشات / القطع</th>
                  <th className="p-3.5">أمين الاستلام</th>
                  <th className="p-3.5 text-left">مزامنة الحضور والتلقائية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {productionRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                      لا يوجد قيود إنتاج مسجلة حالياً
                    </td>
                  </tr>
                ) : (
                  productionRecords
                    .slice()
                    .reverse()
                    .map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-3.5 font-mono text-slate-400">{record.work_date}</td>
                        <td className="p-3.5 font-bold text-slate-700">{record.machine_name}</td>
                        <td className="p-3.5 font-extrabold text-slate-800">{record.employee_name}</td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                            record.shift === 'day' ? 'bg-amber-50 text-amber-700' : 'bg-slate-900 text-slate-100'
                          }`}>
                            {record.shift === 'day' ? 'نهار (صباحي)' : 'ليل (مسائي)'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-black text-slate-800 font-mono">{record.stitches_count.toLocaleString()}</td>
                        <td className="p-3.5 text-center font-black text-slate-800 font-mono">{record.panels_count}</td>
                        <td className="p-3.5 text-slate-500 font-semibold">{record.receiver_name}</td>
                        <td className="p-3.5 text-left">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                            <CheckCircle size={12} />
                            حاضر وتلقائي
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: QUICK ACTIONS PANEL */}
      {subTab === 'actions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
              <ClipboardList className="text-indigo-600" size={18} />
              عمليات التكليف والورديات السريعة
            </h3>
            <p className="text-xs text-slate-400">تحكم ووجه صالة الإنتاج بشكل سريع ومباشر عبر الخيارات التالية:</p>

            <div className="grid grid-cols-1 gap-2.5 pt-2">
              {isSupervisor && (
                <button
                  onClick={() => {
                    setProdError('');
                    setSuccessMsg('');
                    setShowRecordModal(true);
                  }}
                  className="w-full bg-amber-50 text-amber-700 border border-amber-200 p-4 rounded-2xl text-xs font-black text-right flex justify-between items-center hover:bg-amber-100/50 transition-all cursor-pointer"
                >
                  <span>تسجيل وتقييد وردية إنتاج جديدة لماكينة (غرز وفرشات)</span>
                  <Play size={16} />
                </button>
              )}

              {isAdmin && (
                <>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-2xl text-xs font-black text-right flex justify-between items-center hover:bg-emerald-100/50 transition-all cursor-pointer"
                  >
                    <span>تكليف وتعيين ماكينة تطريز معينة لمشرف مسؤول</span>
                    <UserCheck size={16} />
                  </button>

                  <button
                    onClick={() => setShowMachineModal(true)}
                    className="w-full bg-indigo-50 text-indigo-700 border border-indigo-200 p-4 rounded-2xl text-xs font-black text-right flex justify-between items-center hover:bg-indigo-100/50 transition-all cursor-pointer"
                  >
                    <span>إضافة وتسجيل ماكينة جديدة بالكامل في صالة التطريز</span>
                    <Plus size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 text-slate-600 space-y-3 text-xs leading-relaxed">
            <h4 className="font-extrabold text-slate-800">💡 دليل نظام ورديات "كيان سوفت" الذكي</h4>
            <p>1. <strong>المزامنة التلقائية مع الحضور (FR-7.4):</strong> بمجرد تسجيل وردية إنتاج لموظف، يقوم النظام ذكياً بترحيل حالته إلى "حاضر" لليوم وتثبيتها في شؤون الموظفين لتبسيط حساب الرواتب والإنتاجية.</p>
            <p>2. <strong>الغرز والفرشات:</strong> يعتمد حساب الراتب في بعض المكائن على عدد الغرز أو عدد القطع (الفرشات) المنفذة، لذا يجب تقييد هذه البيانات بدقة فائقة.</p>
            <p>3. <strong>توجيه المكائن:</strong> تأكد من تعيين مشرف نشط لكل ماكينة لمتابعة خط سير العمليات والجودة أولاً بأول.</p>
          </div>
        </div>
      )}

      {/* MODAL: Define new Machine */}
      {showMachineModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 border border-slate-100 shadow-xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-1.5">
              <Settings className="text-indigo-600" size={18} />
              إضافة وتسجيل ماكينة تطريز جديدة
            </h3>
            
            {machError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl mb-4 font-semibold">
                {machError}
              </div>
            )}

            <form onSubmit={handleAddMachine} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">اسم الماكينة التجاري *</label>
                <input
                  type="text"
                  required
                  value={machName}
                  onChange={(e) => setMachName(e.target.value)}
                  placeholder="مثال: تاجيما اليابانية 20 رأس"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">كود/ترميز الماكينة *</label>
                <input
                  type="text"
                  required
                  value={machCode}
                  onChange={(e) => setMachCode(e.target.value)}
                  placeholder="مثال: TAJ-01"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                />
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ الماكينة'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMachineModal(false)}
                  className="w-full bg-slate-100 text-slate-600 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Assign Machine to supervisor */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 border border-slate-100 shadow-xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-1.5">
              <UserCheck className="text-emerald-600" size={18} />
              تعيين الماكينة لمشرف الصالة
            </h3>
            
            {assignError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl mb-4 font-semibold">
                {assignError}
              </div>
            )}

            <form onSubmit={handleAssignMachine} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">اختر الماكينة *</label>
                <select
                  required
                  value={assignMachId}
                  onChange={(e) => setAssignMachId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                >
                  <option value="">-- اختر الماكينة --</option>
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">اسم المشرف المسؤول (Username) *</label>
                <select
                  required
                  value={assignUsername}
                  onChange={(e) => setAssignUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                >
                  <option value="">-- اختر المشرف --</option>
                  <option value="production">production (عمر مشرف الصالة)</option>
                  <option value="admin">admin (المدير العام)</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer"
                >
                  {loading ? 'جاري الحفظ...' : 'تثبيت التعيين'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="w-full bg-slate-100 text-slate-600 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Production Log */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-100 shadow-xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-slate-800 mb-1 flex items-center gap-1.5">
              <Play className="text-amber-500" size={18} />
              تسجيل وردية تشغيل وإنتاج ماكينة
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">ترحيل فوري وسينك تلقائي مع ورقة حضور وانصراف الموظف المختار</p>
            
            {prodError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl mb-4 font-semibold">
                {prodError}
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs p-3 rounded-xl mb-4 font-semibold flex items-center gap-1">
                <CheckCircle size={14} />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleRecordProduction} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الماكينة الشغالة *</label>
                  <select
                    required
                    value={prodMachId}
                    onChange={(e) => setProdMachId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  >
                    <option value="">-- اختر الماكينة --</option>
                    {machines.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">المشغل (الموظف) *</label>
                  <select
                    required
                    value={prodEmployeeId}
                    onChange={(e) => setProdEmployeeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  >
                    <option value="">-- اختر الموظف --</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">عدد الغرز المنجزة *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={prodStitches}
                    onChange={(e) => setProdStitches(e.target.value)}
                    placeholder="مثال: 120000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">عدد الفرشات المنجزة *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={prodPanels}
                    onChange={(e) => setProdPanels(e.target.value)}
                    placeholder="مثال: 12"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">اسم مستلم الوردية *</label>
                  <input
                    type="text"
                    required
                    value={prodReceiver}
                    onChange={(e) => setProdReceiver(e.target.value)}
                    placeholder="مثال: فؤاد المقطري"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ الوردية / العمل</label>
                  <input
                    type="date"
                    required
                    value={prodDate}
                    onChange={(e) => setProdDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">فترة الوردية</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProdShift('day')}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      prodShift === 'day'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    نهاراً
                  </button>
                  <button
                    type="button"
                    onClick={() => setProdShift('night')}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      prodShift === 'night'
                        ? 'bg-slate-800 text-slate-100 border-slate-800'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ليلاً
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-amber-600 transition-all cursor-pointer shadow-xs"
                >
                  {loading ? 'جاري الحفظ والترحيل...' : 'تثبيت وترحيل الوردية'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="w-full bg-slate-100 text-slate-600 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
