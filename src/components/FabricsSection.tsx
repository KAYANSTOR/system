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

  const canEdit = userRole === 'admin' || userRole === 'sales' || userRole === 'fabric_manager';

  useEffect(() => {
    if (prefilledCustomerId) {
      setSelectedCustomerId(prefilledCustomerId);
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Fabric Receipt Form (FR-3) */}
        {canEdit ? (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm h-fit">
            <h3 className="font-extrabold text-slate-800 text-sm mb-4 flex items-center gap-1.5">
              <ClipboardList className="text-emerald-600" size={18} />
              تسجيل استلام وتوريد قماش من زبون
            </h3>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl mb-4 font-semibold">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs p-3 rounded-xl mb-4 font-semibold flex items-center gap-1.5">
                <AlertCircle size={14} />
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">العميل صاحب القماش *</label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                >
                  <option value="">-- اختر العميل --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">نوع وتسمية القماش *</label>
                <input
                  type="text"
                  required
                  value={fabricType}
                  onChange={(e) => setFabricType(e.target.value)}
                  placeholder="مثال: حرير هندي مذهب، قطن ياباني أبيض..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">عدد الطيقان *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={rollsCount}
                    onChange={(e) => setRollsCount(e.target.value)}
                    placeholder="مثال: 5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">إجمالي الطول بالوار/اليارده *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={totalYards}
                    onChange={(e) => setTotalYards(e.target.value)}
                    placeholder="مثال: 500"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ استلام القماش من الزبون</label>
                <input
                  type="date"
                  required
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">بيانات أو تفاصيل عينية (ملاحظات)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: أقمشة خفيفة مخصصة للتطريز الصيفي، مرسلة لشغل جلابيات ملونة"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus size={16} />
                {loading ? 'جاري التثبيت...' : 'تثبيت استلام القماش'}
              </button>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm h-fit text-center">
            <ClipboardList className="text-slate-300 mx-auto mb-2" size={32} />
            <h3 className="font-bold text-slate-700 text-xs">صلاحية إدخال الأقمشة مقيدة</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              صلاحية استلام الأقمشة وتعديلها مقتصرة فقط على (المدير، المبيعات، ومسؤول مخزن أقمشة الزبائن). دورك الحالي لا يسمح بإضافة أقمشة جديدة.
            </p>
          </div>
        )}

        {/* Fabric Inventory View */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <Layers className="text-indigo-600" size={16} />
                أرصدة ودفعات الأقمشة الحالية بالمخازن
              </h3>
              <p className="text-[10px] text-slate-400">إجمالي الأرصدة المتبقية لزبائن المعمل للاستخدام والتطريز</p>
            </div>
            <div className="relative w-full sm:w-56">
              <Search className="absolute right-3 top-2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="البحث بالعميل أو نوع القماش..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-8 pl-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                  <th className="p-2.5 rounded-r-lg">الزبون المالك</th>
                  <th className="p-2.5">نوع القماش والدفعة</th>
                  <th className="p-2.5 text-center">الطيقان المستلمة</th>
                  <th className="p-2.5 text-center">الرصيد الأصلي</th>
                  <th className="p-2.5 text-center">الرصيد المتاح حالياً</th>
                  <th className="p-2.5 rounded-l-lg text-left">تاريخ الاستلام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredFabrics.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                      لا يوجد أقمشة مطابقة للبحث أو مدخلة حالياً
                    </td>
                  </tr>
                ) : (
                  filteredFabrics.map((fabric) => {
                    const customer = customers.find(c => c.id === fabric.customer_id);
                    const isLeftover = fabric.is_leftover;
                    const isOut = fabric.remaining_yards === 0;
                    return (
                      <tr key={fabric.id} className={`hover:bg-slate-50/50 ${isOut ? 'opacity-50' : ''}`}>
                        <td className="p-2.5 font-bold text-slate-800">
                          {customer ? customer.name : 'عميل غير مسجل'}
                        </td>
                        <td className="p-2.5">
                          <span className="font-semibold text-slate-700 block">{fabric.fabric_type}</span>
                          {isLeftover && (
                            <span className="inline-block mt-0.5 bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1 rounded-xs">
                              فارغة متبقية
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-600">{fabric.rolls_count} طاقة</td>
                        <td className="p-2.5 text-center font-semibold text-slate-500">{fabric.total_yards} وار</td>
                        <td className="p-2.5 text-center font-extrabold text-sm">
                          {isOut ? (
                            <span className="text-slate-400 text-xs">منتهي (0)</span>
                          ) : (
                            <span className="text-indigo-600">{fabric.remaining_yards} <span className="text-[10px] font-bold">وار</span></span>
                          )}
                        </td>
                        <td className="p-2.5 text-left font-mono text-[10px] text-slate-400">{fabric.received_date}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
