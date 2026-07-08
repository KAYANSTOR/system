import React, { useState, useEffect } from 'react';
import { Customer, CustomerFabric, UserRole } from '../types';
import { ClipboardList, Plus, Search, Layers, Activity, AlertCircle } from 'lucide-react';

interface FabricsSectionProps {
  userRole: UserRole;
  customers: Customer[];
  fabrics: CustomerFabric[];
  prefilledCustomerId?: string;
  onReceiveFabric: (customerId: string, fabricType: string, rollsCount: number, totalYards: number, date: string, notes: string) => Promise<void>;
}

export default function FabricsSection({
  userRole,
  customers,
  fabrics,
  prefilledCustomerId,
  onReceiveFabric
}: FabricsSectionProps) {
  const [subTab, setSubTab] = useState<'inventory' | 'receive'>('inventory');
  const [selectedCustomerId, setSelectedCustomerId] = useState(prefilledCustomerId || '');
  const [fabricType, setFabricType] = useState('');
  const [rollsCount, setRollsCount] = useState('');
  const [totalYards, setTotalYards] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const canEdit = userRole === 'admin';

  useEffect(() => {
    if (prefilledCustomerId) {
      setSelectedCustomerId(prefilledCustomerId);
      setSubTab('receive'); // auto-switch to receive tab if prefilled
    }
  }, [prefilledCustomerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !fabricType || !rollsCount || !totalYards) {
      setError('الرجاء تعبئة الحقول الأساسية للنظام');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await onReceiveFabric(
        selectedCustomerId,
        fabricType,
        Number(rollsCount),
        Number(totalYards),
        receivedDate,
        notes
      );
      setSuccess('تم تسجيل استلام الأقمشة بنجاح، وتثبيت الرصيد الجديد للعميل!');
      setFabricType('');
      setRollsCount('');
      setTotalYards('');
      setNotes('');
      // clear success message after 4s
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ القماش');
    } finally {
      setLoading(false);
    }
  };

  // Group fabrics by customer for better listing
  const filteredFabrics = fabrics.filter(f => {
    const cust = customers.find(c => c.id === f.customer_id);
    const custName = cust ? cust.name : '';
    return f.fabric_type.toLowerCase().includes(searchTerm.toLowerCase()) || custName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      
      {/* Premium Tabbed Navigation */}
      <div className="bg-white border border-slate-200/50 p-1.5 rounded-2xl shadow-xs flex flex-wrap gap-1 no-print">
        <button
          onClick={() => setSubTab('inventory')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'inventory'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Layers size={16} className={subTab === 'inventory' ? 'text-indigo-400' : 'text-slate-400'} />
          <span>أرصدة ودفعات الأقمشة الحالية بالخزين</span>
        </button>

        <button
          onClick={() => setSubTab('receive')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'receive'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <ClipboardList size={16} className={subTab === 'receive' ? 'text-indigo-400' : 'text-slate-400'} />
          <span>تسجيل استلام وتوريد قماش جديد</span>
        </button>
      </div>

      {/* Tab 1: Fabrics Inventory Listing (Full Width) */}
      {subTab === 'inventory' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Layers className="text-indigo-600" size={18} />
                أرصدة ودفعات أقمشة زبائن المعمل
              </h3>
              <p className="text-xs text-slate-400 mt-1">تتبع كميات الأثواب والطيقان والياردات المتبقية قيد التشغيل أو كفوارغ</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute right-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="البحث باسم العميل أو نوع قماشه المستلم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                  <th className="p-3.5 rounded-r-lg">الزبون المالك</th>
                  <th className="p-3.5">نوع القماش والدفعة</th>
                  <th className="p-3.5 text-center">الطيقان المستلمة</th>
                  <th className="p-3.5 text-center">الرصيد الأصلي</th>
                  <th className="p-3.5 text-center">الرصيد المتاح حالياً</th>
                  <th className="p-3.5 rounded-l-lg text-left">تاريخ الاستلام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredFabrics.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                      لا يوجد أقمشة مستلمة مطابقة لمعيار البحث حالياً
                    </td>
                  </tr>
                ) : (
                  filteredFabrics.map((fabric) => {
                    const customer = customers.find(c => c.id === fabric.customer_id);
                    const isLeftover = fabric.is_leftover;
                    const isOut = fabric.remaining_yards === 0;
                    return (
                      <tr key={fabric.id} className={`hover:bg-slate-50/50 transition-colors ${isOut ? 'opacity-50 bg-slate-50/20' : ''}`}>
                        <td className="p-3.5 font-black text-slate-800">
                          {customer ? customer.name : 'عميل غير مسجل'}
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-700 block">{fabric.fabric_type}</span>
                          {isLeftover && (
                            <span className="inline-block mt-1 bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm">
                              فارغة متبقية "كسر"
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-600 font-mono">{fabric.rolls_count} طاقة</td>
                        <td className="p-3.5 text-center font-semibold text-slate-500 font-mono">{fabric.total_yards} وار</td>
                        <td className="p-3.5 text-center font-black text-xs font-mono">
                          {isOut ? (
                            <span className="text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">منتهي (0)</span>
                          ) : (
                            <span className="text-indigo-600 bg-indigo-50/50 px-2.5 py-1 rounded-lg border border-indigo-100/30">
                              {fabric.remaining_yards} <span className="text-[10px] font-bold">وار</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-left font-mono text-[10px] text-slate-400">{fabric.received_date}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Fabrics Receipt Form (Centered & Polished) */}
      {subTab === 'receive' && (
        <div className="max-w-2xl mx-auto animate-fade-in">
          {canEdit ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-1.5">
                  <ClipboardList className="text-emerald-600" size={18} />
                  تسجيل استلام وتوريد قماش من زبون
                </h3>
                <p className="text-xs text-slate-400 mt-1">تفريغ بيانات الأثواب والطيقان والياردات الجديدة لصالح حساب العميل</p>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3.5 rounded-xl font-semibold">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs p-3.5 rounded-xl font-semibold flex items-center gap-1.5 animate-pulse">
                  <AlertCircle size={14} />
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">العميل صاحب القماش *</label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  >
                    <option value="">-- اختر العميل --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">نوع وتسمية القماش المستلم *</label>
                  <input
                    type="text"
                    required
                    value={fabricType}
                    onChange={(e) => setFabricType(e.target.value)}
                    placeholder="مثال: حرير هندي مذهب، قطن ياباني أبيض..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">عدد الطيقان *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={rollsCount}
                      onChange={(e) => setRollsCount(e.target.value)}
                      placeholder="مثال: 5"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">إجمالي الطول بالوار/اليارده *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={totalYards}
                      onChange={(e) => setTotalYards(e.target.value)}
                      placeholder="مثال: 500"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">تاريخ استلام القماش من الزبون</label>
                  <input
                    type="date"
                    required
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">ملاحظات عينية أو مواصفات خاصة</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: أقمشة خفيفة مخصصة للتطريز الصيفي، مرسلة لشغل جلابيات ملونة"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none font-semibold leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl text-xs font-black hover:bg-emerald-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-100"
                >
                  <Plus size={16} />
                  {loading ? 'جاري التثبيت والتسجيل...' : 'تثبيت استلام القماش وحفظ الدفعة'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm text-center max-w-md mx-auto space-y-4">
              <ClipboardList className="text-slate-300 mx-auto" size={48} />
              <h3 className="font-extrabold text-slate-700 text-sm">صلاحية إدخال واستلام الأقمشة مقيدة</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                صلاحية استلام الأقمشة وتعديلها مقتصرة فقط على (المدير، المبيعات، ومسؤول مخزن أقمشة الزبائن). دورك الحالي لا يسمح بإضافة أقمشة جديدة.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
