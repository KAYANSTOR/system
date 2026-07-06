import React, { useState, useEffect } from 'react';
import { Employee, AttendanceEntry, AttendanceStatus, UserRole } from '../types';
import { Users, UserPlus, ClipboardList, Coins, Calendar, Check, AlertCircle, Printer, ShieldAlert, Clock, MinusCircle, PlusCircle } from 'lucide-react';

interface EmployeesSectionProps {
  userRole: UserRole;
  employees: Employee[];
  attendanceEntries: AttendanceEntry[];
  onAddEmployee: (name: string, monthlySalary: number, fixedDeparture: number, hireDate: string) => Promise<void>;
  onToggleEmployee: (id: string) => Promise<void>;
  onSaveAttendanceBatch: (entries: Omit<AttendanceEntry, 'id'>[]) => Promise<void>;
  fetchPayrollStatement: (employeeId: string, month: string) => Promise<any>;
}

export default function EmployeesSection({
  userRole,
  employees,
  attendanceEntries,
  onAddEmployee,
  onToggleEmployee,
  onSaveAttendanceBatch,
  fetchPayrollStatement
}: EmployeesSectionProps) {
  const [activeTab, setActiveTab] = useState<'roster' | 'attendance_log' | 'payroll'>('roster');
  
  // Roster States
  const [showAddModal, setShowAddModal] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empSalary, setEmpSalary] = useState('');
  const [empFixedDep, setEmpFixedDep] = useState('');
  const [empHireDate, setEmpHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [empError, setEmpError] = useState('');

  // Daily Log Batch State (الترحيل اليومي الجماعي)
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchLogs, setBatchLogs] = useState<{ [empId: string]: Omit<AttendanceEntry, 'id'> }>({});
  const [batchSuccess, setBatchSuccess] = useState('');
  const [batchError, setBatchError] = useState('');

  // Payroll / Statement States
  const [payrollEmpId, setPayrollEmpId] = useState('');
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [payrollStatement, setPayrollStatement] = useState<any | null>(null);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [payrollError, setPayrollError] = useState('');

  const [loading, setLoading] = useState(false);
  const isAdmin = userRole === 'admin';

  // --- Initialize Attendance Batch on Date / Employees Change ---
  useEffect(() => {
    if (activeTab === 'attendance_log') {
      const activeEmployees = employees.filter(e => e.is_active);
      const initialBatch: { [empId: string]: Omit<AttendanceEntry, 'id'> } = {};

      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const dayOfWeek = days[new Date(logDate).getDay()];

      activeEmployees.forEach(emp => {
        // Look if there is existing entry in loaded entries
        const existing = attendanceEntries.find(ae => ae.employee_id === emp.id && ae.entry_date === logDate);
        
        initialBatch[emp.id] = {
          employee_id: emp.id,
          entry_date: logDate,
          day_of_week: dayOfWeek,
          attendance: existing ? existing.attendance : 'present',
          delay_minutes: existing ? existing.delay_minutes : 0,
          departure_amount: existing ? existing.departure_amount : emp.fixed_departure || 0, // default to fixed
          overtime_amount: existing ? existing.overtime_amount : 0,
          advance_amount: existing ? existing.advance_amount : 0,
          note: existing ? existing.note : ''
        };
      });

      setBatchLogs(initialBatch);
      setBatchError('');
      setBatchSuccess('');
    }
  }, [logDate, employees, activeTab, attendanceEntries]);

  // Handle roster submission
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empSalary) return;
    setLoading(true);
    setEmpError('');
    try {
      await onAddEmployee(empName, Number(empSalary), Number(empFixedDep || 0), empHireDate);
      setEmpName('');
      setEmpSalary('');
      setEmpFixedDep('');
      setShowAddModal(false);
    } catch (err: any) {
      setEmpError(err.message || 'خطأ أثناء تسجيل الموظف');
    } finally {
      setLoading(false);
    }
  };

  // Update specific employee attendance batch row
  const handleBatchChange = (empId: string, field: keyof Omit<AttendanceEntry, 'id'>, value: any) => {
    setBatchLogs(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: value
      }
    }));
  };

  // Submit batch daily logs (الترحيل الجماعي)
  const handleSaveBatch = async () => {
    setLoading(true);
    setBatchSuccess('');
    setBatchError('');
    try {
      const payload = Object.values(batchLogs) as Omit<AttendanceEntry, 'id'>[];
      await onSaveAttendanceBatch(payload);
      setBatchSuccess('تم ترحيل وحفظ يومية حضور الموظفين بالكامل بنجاح!');
      setTimeout(() => setBatchSuccess(''), 4000);
    } catch (err: any) {
      setBatchError(err.message || 'حدث خطأ أثناء حفظ الدفعة');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Payroll payslip calculation (FR-5, payroll equations)
  const handleFetchPayroll = async () => {
    if (!payrollEmpId || !payrollMonth) return;
    setPayrollLoading(true);
    setPayrollError('');
    setPayrollStatement(null);
    try {
      const statement = await fetchPayrollStatement(payrollEmpId, payrollMonth);
      setPayrollStatement(statement);
    } catch (err: any) {
      setPayrollError(err.message || 'خطأ أثناء جلب الراتب وكشف الحساب');
    } finally {
      setPayrollLoading(false);
    }
  };

  const printPayslip = () => {
    window.print();
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      
      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 no-print">
        <button
          onClick={() => setActiveTab('roster')}
          className={`pb-3 px-6 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'roster'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users size={16} />
          شؤون الموظفين
        </button>
        <button
          onClick={() => setActiveTab('attendance_log')}
          className={`pb-3 px-6 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'attendance_log'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <ClipboardList size={16} />
          الترحيل اليومي الجماعي
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`pb-3 px-6 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'payroll'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Coins size={16} />
          الرواتب وكشوف الحسابات
        </button>
      </div>

      {/* --- TAB 1: ROSTER --- */}
      {activeTab === 'roster' && (
        <div className="space-y-4 no-print">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">سجل موظفي وعمال المعمل</h3>
              <p className="text-[10px] text-slate-400">بيانات الموظفين والراتب الأساسي الثابت وقيمة الصرفة اليومية التلقائية</p>
            </div>
            {isAdmin && (
              <button
                id="btn-open-add-emp"
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl hover:bg-indigo-700 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <UserPlus size={14} />
                موظف جديد
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                    <th className="p-3 rounded-r-lg">الاسم بالكامل</th>
                    <th className="p-3 text-center">الراتب الشهري الأساسي</th>
                    <th className="p-3 text-center">الصرفة اليومية الثابتة</th>
                    <th className="p-3 text-center">تاريخ التعيين</th>
                    <th className="p-3 text-center">الحالة</th>
                    {isAdmin && <th className="p-3 rounded-l-lg text-left">التحكم</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {employees.map((emp) => (
                    <tr key={emp.id} className={`hover:bg-slate-50/50 ${!emp.is_active ? 'opacity-50' : ''}`}>
                      <td className="p-3 font-bold text-slate-800 text-xs">{emp.name}</td>
                      <td className="p-3 text-center font-extrabold text-slate-700">
                        {emp.monthly_salary ? `${emp.monthly_salary.toLocaleString()} ريال` : 'مخفي لغير الإدارة'}
                      </td>
                      <td className="p-3 text-center font-semibold text-slate-600">
                        {emp.fixed_departure ? `${emp.fixed_departure.toLocaleString()} ريال` : '-'}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-400">{emp.hire_date}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                          emp.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {emp.is_active ? 'فعال' : 'موقف'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="p-3 text-left">
                          <button
                            id={`btn-toggle-emp-${emp.id}`}
                            onClick={() => onToggleEmployee(emp.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              emp.is_active
                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                          >
                            {emp.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: DAILY ATTENDANCE BATCH LOG --- */}
      {activeTab === 'attendance_log' && (
        <div className="space-y-4 no-print">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">الترحيل اليومي الجماعي لموظفي الصالة</h3>
              <p className="text-[10px] text-slate-400">تقييد حالة حضور الموظفين، السلف، الإضافي، الصرفات والتأخيرات دفعة واحدة لليوم المحدد</p>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="text-slate-400" size={16} />
              <input
                type="date"
                required
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
              />
            </div>
          </div>

          {!isAdmin ? (
            <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl text-center text-slate-500 text-xs">
              <ShieldAlert className="mx-auto text-rose-500 mb-2" size={24} />
              عذراً، ترحيل يومية حضور الموظفين وحساباتهم المالية واليومية مقتصر فقط على المدير العام.
            </div>
          ) : (
            <div className="space-y-4">
              {batchSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs p-3.5 rounded-xl font-bold">
                  {batchSuccess}
                </div>
              )}
              {batchError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3.5 rounded-xl font-bold">
                  {batchError}
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                      <th className="p-2.5 rounded-r-lg">اسم الموظف</th>
                      <th className="p-2.5 text-center" style={{ width: '130px' }}>حالة الحضور</th>
                      <th className="p-2.5 text-center" style={{ width: '90px' }}>التأخير (دقيقة)</th>
                      <th className="p-2.5 text-center" style={{ width: '90px' }}>الصرفة (ريال)</th>
                      <th className="p-2.5 text-center" style={{ width: '90px' }}>الإضافي (ريال)</th>
                      <th className="p-2.5 text-center" style={{ width: '90px' }}>السلفة (ريال)</th>
                      <th className="p-2.5 rounded-l-lg">ملاحظة اليوم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {Object.keys(batchLogs).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-slate-400">لا يوجد موظفين فعالين حالياً للترحيل</td>
                      </tr>
                    ) : (
                      employees
                        .filter(e => e.is_active)
                        .map((emp) => {
                          const log = batchLogs[emp.id];
                          if (!log) return null;
                          return (
                            <tr key={emp.id} className="hover:bg-slate-50/50">
                              <td className="p-2 text-slate-800 font-bold">{emp.name}</td>
                              <td className="p-2 text-center">
                                <select
                                  value={log.attendance}
                                  onChange={(e) => handleBatchChange(emp.id, 'attendance', e.target.value as AttendanceStatus)}
                                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold w-full"
                                >
                                  <option value="present">حاضر (1)</option>
                                  <option value="half_day">نصف يوم (0.5)</option>
                                  <option value="absent">غياب (0)</option>
                                  <option value="holiday">إجازة (0)</option>
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min={0}
                                  value={log.delay_minutes || ''}
                                  onChange={(e) => handleBatchChange(emp.id, 'delay_minutes', Number(e.target.value))}
                                  placeholder="0"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] focus:outline-none font-bold text-center"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min={0}
                                  value={log.departure_amount || ''}
                                  onChange={(e) => handleBatchChange(emp.id, 'departure_amount', Number(e.target.value))}
                                  placeholder="0"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] focus:outline-none font-bold text-center"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min={0}
                                  value={log.overtime_amount || ''}
                                  onChange={(e) => handleBatchChange(emp.id, 'overtime_amount', Number(e.target.value))}
                                  placeholder="0"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] focus:outline-none font-bold text-center"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min={0}
                                  value={log.advance_amount || ''}
                                  onChange={(e) => handleBatchChange(emp.id, 'advance_amount', Number(e.target.value))}
                                  placeholder="0"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] focus:outline-none font-bold text-center"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={log.note || ''}
                                  onChange={(e) => handleBatchChange(emp.id, 'note', e.target.value)}
                                  placeholder="سلف استثنائية، عذر طبي..."
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] focus:outline-none"
                                />
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>

              <button
                id="btn-save-attendance-batch"
                onClick={handleSaveBatch}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer shadow-xs"
              >
                {loading ? 'جاري حفظ وترحيل دفتر اليومية...' : 'حفظ ترحيل يومية اليوم بالكامل'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: PAYROLL & DETAILED SALARY STATEMENT --- */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm no-print">
            <div className="flex flex-wrap gap-4 items-end flex-1">
              <div className="min-w-[180px]">
                <label className="block text-xs font-bold text-slate-500 mb-1">اختر الموظف المستهدف *</label>
                <select
                  required
                  value={payrollEmpId}
                  onChange={(e) => setPayrollEmpId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                >
                  <option value="">-- اختر الموظف --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">الشهر المستهدف *</label>
                <input
                  type="month"
                  required
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold font-mono"
                />
              </div>

              <button
                id="btn-calculate-payroll"
                onClick={handleFetchPayroll}
                disabled={payrollLoading || !payrollEmpId}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {payrollLoading ? 'جاري الحساب...' : 'حساب الراتب التفصيلي'}
              </button>
            </div>
          </div>

          {!isAdmin ? (
            <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl text-center text-slate-500 text-xs no-print">
              <ShieldAlert className="mx-auto text-rose-500 mb-2" size={24} />
              عذراً، الاطلاع على الرواتب وكشوفات استحقاق الموظفين وصرف السلف مقيد فقط للإدارة والمخولين.
            </div>
          ) : payrollError ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3.5 rounded-xl font-semibold no-print">
              {payrollError}
            </div>
          ) : payrollStatement ? (
            <div className="space-y-6">
              {/* Premium Payslip (كشف الاستحقاق) Panel */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6 print-card">
                
                {/* Print Headers */}
                <div className="flex justify-between items-center border-b pb-4 border-slate-100">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-800">مسير رواتب واستحقاقات الموظفين</h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">تفاصيل كشف راتب شهر: <span className="font-mono font-bold text-slate-700">{payrollStatement.month}</span></p>
                  </div>
                  <button
                    onClick={printPayslip}
                    className="bg-slate-700 text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors text-xs font-bold flex items-center gap-1.5 shadow-xs no-print cursor-pointer"
                  >
                    <Printer size={14} />
                    طباعة قسيمة الراتب
                  </button>
                </div>

                {/* Payslip info cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block font-bold">اسم الموظف:</span>
                    <strong className="text-slate-800 text-sm block mt-1">{payrollStatement.employee.name}</strong>
                    <span className="text-[10px] text-slate-400 block mt-1">الراتب الأساسي: {payrollStatement.employee.monthly_salary.toLocaleString()} ريال</span>
                  </div>

                  <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100/50">
                    <span className="text-slate-400 block font-bold">ملخص حضور الوردية:</span>
                    <div className="grid grid-cols-2 gap-1 mt-1 text-[11px] text-slate-600 font-bold">
                      <span>• حاضر: {payrollStatement.summary.days_present}</span>
                      <span>• نصف يوم: {payrollStatement.summary.days_half_day}</span>
                      <span>• غياب: {payrollStatement.summary.days_absent}</span>
                      <span>• إجازة: {payrollStatement.summary.days_holiday}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block font-bold">إجمالي ساعات ومبالغ الإضافي:</span>
                    <strong className="text-emerald-600 text-sm block mt-1">+{payrollStatement.summary.total_overtime.toLocaleString()} ريال</strong>
                    <span className="text-[10px] text-slate-400 block mt-1">أيام حضور معتمدة للراتب: {payrollStatement.summary.attendance_days_credited} يوم</span>
                  </div>

                  <div className="bg-slate-900 text-white p-3.5 rounded-2xl">
                    <span className="text-slate-400 block font-bold text-[10px]">صافي الراتب المستحق للصرف</span>
                    <strong className="text-xl font-black block mt-1 text-amber-400 font-mono">
                      {payrollStatement.summary.net_salary.toLocaleString()} <span className="text-xs font-bold">ريال</span>
                    </strong>
                    <span className="text-[9px] text-slate-400 block mt-1">محسوب وفقاً لمعادلات الكيان الرسمية</span>
                  </div>
                </div>

                {/* Mathematical Equation Detail (FR-5, FR-5.1) */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 text-xs text-slate-600 space-y-2">
                  <span className="font-extrabold text-slate-800 block">تفصيل المعادلة الحسابية للراتب:</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-400 block">1. الراتب اليومي المستحق (monthly_salary ÷ 30):</span>
                      <span className="font-bold text-slate-800">
                        {payrollStatement.employee.monthly_salary.toLocaleString()} ÷ 30 = {Math.round(payrollStatement.employee.monthly_salary / 30).toLocaleString()} ريال
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">2. الراتب على أيام الحضور (dailyWage × creditedDays):</span>
                      <span className="font-bold text-slate-800">
                        {Math.round(payrollStatement.employee.monthly_salary / 30).toLocaleString()} × {payrollStatement.summary.attendance_days_credited} = {payrollStatement.summary.gross_earned.toLocaleString()} ريال
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">3. خصومات التأخير ((delay_minutes ÷ 60) × hourlyWage):</span>
                      <span className="font-bold text-rose-600">
                        ({payrollStatement.summary.total_delay_minutes} ÷ 60) × {Math.round((payrollStatement.employee.monthly_salary / 30) / 12).toLocaleString()} = {payrollStatement.summary.delay_deduction.toLocaleString()} ريال
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">4. المسحوبات الأخرى (الصرفات + السلف):</span>
                      <span className="font-bold text-rose-600">
                        صرفة: {payrollStatement.summary.total_departure.toLocaleString()} + سلفة: {payrollStatement.summary.total_advance.toLocaleString()} = {(payrollStatement.summary.total_departure + payrollStatement.summary.total_advance).toLocaleString()} ريال
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/50 pt-2 text-[11px] font-bold text-indigo-700 flex flex-wrap gap-2">
                    <span>صافي الراتب المستحق</span>
                    <span>=</span>
                    <span>(الراتب الفعلي: {payrollStatement.summary.gross_earned.toLocaleString()})</span>
                    <span>+</span>
                    <span>(الإضافي: {payrollStatement.summary.total_overtime.toLocaleString()})</span>
                    <span>-</span>
                    <span>(الخصومات والتأخير: {(payrollStatement.summary.total_departure + payrollStatement.summary.total_advance + payrollStatement.summary.delay_deduction).toLocaleString()})</span>
                    <span>=</span>
                    <span className="text-slate-900 font-extrabold underline">{payrollStatement.summary.net_salary.toLocaleString()} ريال يمني</span>
                  </div>
                </div>

                {/* Daily attendance items of the payslip */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs border-b pb-1.5 border-slate-100">سجل اليوميات المفصل للشهر</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                          <th className="p-2">التاريخ</th>
                          <th className="p-2">اليوم</th>
                          <th className="p-2 text-center">حالة الحضور</th>
                          <th className="p-2 text-center">التأخير</th>
                          <th className="p-2 text-center">الصرفة (Departure)</th>
                          <th className="p-2 text-center">الإضافي (Overtime)</th>
                          <th className="p-2 text-center">السلفة (Advance)</th>
                          <th className="p-2 rounded-l-lg">ملاحظة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {payrollStatement.entries.map((entry: any) => (
                          <tr key={entry.id} className="hover:bg-slate-50/50">
                            <td className="p-2 font-mono text-[10px] text-slate-400">{entry.entry_date}</td>
                            <td className="p-2 font-bold text-slate-700">{entry.day_of_week}</td>
                            <td className="p-2 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                                entry.attendance === 'present' 
                                  ? 'bg-emerald-50 text-emerald-700' 
                                  : entry.attendance === 'half_day'
                                    ? 'bg-amber-50 text-amber-700'
                                    : entry.attendance === 'holiday'
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-rose-50 text-rose-700'
                              }`}>
                                {entry.attendance === 'present' ? 'حاضر' : entry.attendance === 'half_day' ? 'نصف يوم' : entry.attendance === 'holiday' ? 'إجازة' : 'غياب'}
                              </span>
                            </td>
                            <td className="p-2 text-center font-bold text-rose-500">{entry.delay_minutes > 0 ? `${entry.delay_minutes} د` : '-'}</td>
                            <td className="p-2 text-center font-semibold text-rose-500">{entry.departure_amount > 0 ? entry.departure_amount.toLocaleString() : '-'}</td>
                            <td className="p-2 text-center font-semibold text-emerald-600">{entry.overtime_amount > 0 ? `+${entry.overtime_amount.toLocaleString()}` : '-'}</td>
                            <td className="p-2 text-center font-semibold text-rose-500">{entry.advance_amount > 0 ? entry.advance_amount.toLocaleString() : '-'}</td>
                            <td className="p-2 text-slate-400 max-w-[200px] truncate" title={entry.note}>{entry.note || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payslip Print Signatures */}
                <div className="hidden print:flex justify-between items-center mt-12 pt-6 border-t border-slate-300 text-xs text-slate-500">
                  <div className="text-center min-w-[120px]">
                    <span>توقيع المحاسب / شؤون الموظفين</span>
                    <div className="h-10"></div>
                    <span className="block border-t border-slate-300 pt-1">.........................</span>
                  </div>
                  <div className="text-center min-w-[120px]">
                    <span>توقيع الموظف المستلم</span>
                    <div className="h-10"></div>
                    <span className="block border-t border-slate-300 pt-1">.........................</span>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-xs text-slate-400 text-xs">
              الرجاء اختيار الموظف والشهر المراد حسابه، ثم اضغط على زر "حساب الراتب التفصيلي" لعرض قسيمة الراتب والمعادلة الحسابية.
            </div>
          )}
        </div>
      )}

      {/* MODAL: Add Employee (Roster) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 border border-slate-100 shadow-xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-1.5">
              <UserPlus className="text-indigo-600" size={18} />
              تسجيل وتعيين موظف جديد بالمعمل
            </h3>
            
            {empError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl mb-4 font-semibold">
                {empError}
              </div>
            )}

            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">اسم الموظف بالكامل *</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="مثال: صالح محمد المري"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">الراتب الشهري الأساسي (ريال) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={empSalary}
                  onChange={(e) => setEmpSalary(e.target.value)}
                  placeholder="مثال: 120000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">قيمة الصرفة التلقائية اليومية الثابتة</label>
                <input
                  type="number"
                  min={0}
                  value={empFixedDep}
                  onChange={(e) => setEmpFixedDep(e.target.value)}
                  placeholder="تخصم تلقائياً عند ترحيل الحضور اليومي"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ مباشرة العمل / التعيين</label>
                <input
                  type="date"
                  required
                  value={empHireDate}
                  onChange={(e) => setEmpHireDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  {loading ? 'جاري الحفظ...' : 'تسجيل وتوظيف'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
