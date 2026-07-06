import React, { useState } from 'react';
import { Machine, MachineAssignment, ProductionRecord, Employee, UserRole } from '../types';
import { PenTool, Plus, CheckCircle, Search, UserCheck, Play, Settings } from 'lucide-react';

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
  const isSupervisor = userRole === 'admin' || userRole === 'production_supervisor';

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

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <PenTool className="text-amber-500" size={20} />
            إدارة صالة الإنتاج والمكائن اليومية
          </h2>
          <p className="text-xs text-slate-400">مراقبة تشغيل المكائن، تعيين المشرفين، وتقييد الغرز والفرشات اليومية للموظفين</p>
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
              className="bg-amber-500 text-white px-3.5 py-1.5 rounded-xl hover:bg-amber-600 transition-colors text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
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
                className="bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-emerald-700 transition-colors text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <UserCheck size={14} />
                تعيين ماكينة لمشرف
              </button>
              <button
                id="btn-open-add-mach"
                onClick={() => setShowMachineModal(true)}
                className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-indigo-700 transition-colors text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                إضافة ماكينة جديدة
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid: Machine Status and Production History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Machine Status List */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2">حالة ومسؤولية مكائن التطريز</h3>
          
          <div className="space-y-3">
            {machines.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">لا توجد مكائن مسجلة حالياً</p>
            ) : (
              machines.map(m => {
                const assign = assignments.find(a => a.machine_id === m.id);
                return (
                  <div key={m.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 text-xs">{m.name}</span>
                      <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-indigo-100 font-mono">
                        {m.code}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>المشرف المسؤول:</span>
                      <strong className="text-slate-600">{assign ? assign.username : 'لم يتم التعيين بعد'}</strong>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Production Logs with Sync to HR Status (FR-7.4) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">يومية إنتاج الصالة المفصلة</h3>
            <p className="text-[10px] text-slate-400">سجل تشغيل المكائن وربط الإنتاج بدفتر حضور الموظفين تلقائياً</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                  <th className="p-2.5 rounded-r-lg">التاريخ</th>
                  <th className="p-2.5">الماكينة</th>
                  <th className="p-2.5">المشغل (الموظف)</th>
                  <th className="p-2.5 text-center">الوردية</th>
                  <th className="p-2.5 text-center">الغرز</th>
                  <th className="p-2.5 text-center">الفرشات</th>
                  <th className="p-2.5">المستلم</th>
                  <th className="p-2.5 rounded-l-lg text-left">مزامنة الحضور</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {productionRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                      لا يوجد قيود إنتاج مسجلة حالياً
                    </td>
                  </tr>
                ) : (
                  productionRecords
                    .slice()
                    .reverse()
                    .map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-mono text-[10px] text-slate-400">{record.work_date}</td>
                        <td className="p-2.5 font-bold text-slate-700">{record.machine_name}</td>
                        <td className="p-2.5 font-semibold text-slate-800">{record.employee_name}</td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            record.shift === 'day' ? 'bg-amber-50 text-amber-700' : 'bg-slate-800 text-slate-100'
                          }`}>
                            {record.shift === 'day' ? 'نهار' : 'ليل'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-800 font-mono">{record.stitches_count.toLocaleString()}</td>
                        <td className="p-2.5 text-center font-bold text-slate-800 font-mono">{record.panels_count}</td>
                        <td className="p-2.5 text-slate-500">{record.receiver_name}</td>
                        <td className="p-2.5 text-left">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 inline-flex">
                            <CheckCircle size={10} />
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

      </div>

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
