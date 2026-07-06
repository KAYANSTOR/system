import React, { useState, useEffect } from 'react';
import { Customer, CustomerFabric, SalesInvoice, UserRole } from '../types';
import { Landmark, FilePlus, Coins, Layers, ArrowLeftRight, CheckCircle, AlertCircle } from 'lucide-react';

interface SalesInvoiceSectionProps {
  userRole: UserRole;
  customers: Customer[];
  fabrics: CustomerFabric[];
  prefilledInvoiceData?: { customer_id?: string; fabric_id?: string };
  onIssueInvoice: (
    customerId: string,
    fabricId: string,
    yardsSold: number,
    pricePerYard: number,
    paidAmount: number,
    paymentType: 'cash' | 'credit' | 'partial',
    invoiceDate: string,
    notes: string
  ) => Promise<{ invoice: SalesInvoice, leftover: CustomerFabric | null }>;
}

export default function SalesInvoiceSection({
  userRole,
  customers,
  fabrics,
  prefilledInvoiceData,
  onIssueInvoice
}: SalesInvoiceSectionProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedFabricId, setSelectedFabricId] = useState('');
  const [yardsSold, setYardsSold] = useState('');
  const [pricePerYard, setPricePerYard] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'credit' | 'partial'>('credit');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState<{ invoice: SalesInvoice; leftover: CustomerFabric | null } | null>(null);

  const canEdit = userRole === 'admin' || userRole === 'sales';

  // Prefill hooks
  useEffect(() => {
    if (prefilledInvoiceData) {
      if (prefilledInvoiceData.customer_id) {
        setSelectedCustomerId(prefilledInvoiceData.customer_id);
      }
      if (prefilledInvoiceData.fabric_id) {
        setSelectedFabricId(prefilledInvoiceData.fabric_id);
      }
    }
  }, [prefilledInvoiceData]);

  // Dynamically filter active fabrics (remaining_yards > 0) for the selected customer
  const activeFabricsForCustomer = fabrics.filter(f => 
    f.customer_id === selectedCustomerId && f.remaining_yards > 0
  );

  // Selected fabric details
  const selectedFabric = fabrics.find(f => f.id === selectedFabricId);

  // Auto Calculations
  const calculatedTotal = Number(yardsSold || 0) * Number(pricePerYard || 0);
  const remainingDebt = calculatedTotal - Number(paidAmount || 0);

  // Adjust payment type details based on user selection
  const handlePaymentTypeChange = (type: 'cash' | 'credit' | 'partial') => {
    setPaymentType(type);
    if (type === 'cash') {
      setPaidAmount(calculatedTotal.toString());
    } else if (type === 'credit') {
      setPaidAmount('0');
    } else {
      setPaidAmount('');
    }
  };

  // Keep paid amount synced if type is cash
  useEffect(() => {
    if (paymentType === 'cash') {
      setPaidAmount(calculatedTotal.toString());
    }
  }, [calculatedTotal, paymentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedFabricId || !yardsSold || !pricePerYard) {
      setError('الرجاء اختيار العميل، القماش وتحديد الكمية والسعر!');
      return;
    }
    
    if (selectedFabric && selectedFabric.remaining_yards < Number(yardsSold)) {
      setError(`الكمية المشغولة المطلوبة (${yardsSold} وار) أكبر من رصيد القماش المتبقي المتاح للعميل (${selectedFabric.remaining_yards} وار)!`);
      return;
    }

    if (paymentType === 'partial' && (Number(paidAmount) >= calculatedTotal || Number(paidAmount) <= 0)) {
      setError('في الدفع الجزئي، يجب أن يكون المدفوع أكبر من الصفر وأقل من إجمالي الفاتورة');
      return;
    }

    setError('');
    setSuccessResult(null);
    setLoading(true);

    try {
      const result = await onIssueInvoice(
        selectedCustomerId,
        selectedFabricId,
        Number(yardsSold),
        Number(pricePerYard),
        Number(paidAmount || 0),
        paymentType,
        invoiceDate,
        notes
      );

      setSuccessResult(result);
      
      // Reset form on success
      setYardsSold('');
      setPricePerYard('');
      setPaidAmount('');
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إصدار الفاتورة وإثبات البيع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {successResult ? (
        /* Dynamic Leftover Splitting Success View */
        <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center shadow-md space-y-6 animate-in fade-in duration-300">
          <div className="mx-auto bg-emerald-100 text-emerald-600 p-4 rounded-full w-16 h-16 flex items-center justify-center">
            <CheckCircle size={36} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-800">تم إصدار إشعار البيع وتثبيته بنجاح!</h2>
            <p className="text-xs text-slate-400">الفاتورة رقم: <span className="font-mono font-bold text-slate-700">{successResult.invoice.invoice_no}</span></p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block font-bold">المبلغ الإجمالي</span>
              <span className="font-extrabold text-slate-800 text-base">{successResult.invoice.total_amount.toLocaleString()} <span className="text-[10px]">ريال</span></span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold">المدفوع فوراً</span>
              <span className="font-extrabold text-emerald-600 text-base">{successResult.invoice.paid_amount.toLocaleString()} <span className="text-[10px]">ريال</span></span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold">المرحل آجل للعميل</span>
              <span className={`font-extrabold text-base block ${successResult.invoice.remaining_amount > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                {successResult.invoice.remaining_amount.toLocaleString()} <span className="text-[10px]">ريال</span>
              </span>
            </div>
          </div>

          {/* Dynamic Splitting ("الفارغة المتبقية") Logic Indicator */}
          {successResult.leftover ? (
            <div className="max-w-lg mx-auto bg-amber-50 border border-amber-200 rounded-2xl p-4 text-right space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-800 font-extrabold text-xs">
                <AlertCircle size={16} />
                تنبيه انقسام أقمشة الزبون (منطق الفارغة)
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                بما أن الكمية المشغولة المبيعة أقل من الرصيد المتوفر، قام النظام تلقائياً بخصم الكمية وإنشاء سجل قماش متبقي جديد 
                باسم <strong>{successResult.leftover.fabric_type}</strong> برصيد <strong>{successResult.leftover.remaining_yards} وار</strong> بحالة 
                <span className="font-extrabold bg-amber-100 text-amber-900 px-1 rounded-sm mx-1 text-[10px]">فارغة غير محتسبة</span> 
                تُبقى باسم العميل في ذمته لمتابعة الشغل لاحقاً.
              </p>
            </div>
          ) : (
            <div className="max-w-lg mx-auto bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-right">
              <p className="text-[11px] text-indigo-700 leading-relaxed text-center font-bold">
                تم استهلاك كامل الرصيد المتاح من دفعة القماش المحددة بالكامل دون بقاء فوارغ غير مستغلة.
              </p>
            </div>
          )}

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setSuccessResult(null)}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              إصدار فاتورة مبيعات جديدة
            </button>
          </div>
        </div>
      ) : (
        /* Invoice Entry Form */
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <FilePlus className="text-indigo-600" size={20} />
                إصدار إشعار بيع جديد (سند مبيعات تطريز)
              </h2>
              <p className="text-[11px] text-slate-400">خصم من رصيد أقمشة العميل المشتغلة، وترحيل المبالغ آجل أو نقدي لحسابهم</p>
            </div>
          </div>

          {!canEdit ? (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 text-xs">
              صلاحية إصدار الفواتير محصورة فقط بـ (المدير العام والمبيعات/المحاسب). دورك الحالي لا يسمح بالوصول لهذه الشاشة.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl font-semibold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Right Column: Customer & Lot selection */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">العميل صاحب الشغل *</label>
                    <select
                      required
                      value={selectedCustomerId}
                      onChange={(e) => {
                        setSelectedCustomerId(e.target.value);
                        setSelectedFabricId('');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                    >
                      <option value="">-- اختر العميل --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">دفعة القماش المشتغل عليها بالمخزن *</label>
                    <select
                      required
                      disabled={!selectedCustomerId}
                      value={selectedFabricId}
                      onChange={(e) => setSelectedFabricId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                    >
                      <option value="">
                        {!selectedCustomerId ? 'الرجاء اختيار العميل أولاً' : '-- اختر دفعة القماش --'}
                      </option>
                      {activeFabricsForCustomer.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.fabric_type} (الرصيد المتاح: {f.remaining_yards} وار)
                        </option>
                      ))}
                    </select>
                    {selectedCustomerId && activeFabricsForCustomer.length === 0 && (
                      <span className="text-[10px] text-rose-500 font-bold mt-1 block">
                        لا تتوفر أقمشة برصيد متاح حالياً لهذا العميل!
                      </span>
                    )}
                  </div>

                  {selectedFabric && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-slate-600">
                      <span className="font-bold text-indigo-700 block mb-1">تفاصيل الدفعة المحددة:</span>
                      <ul className="space-y-0.5 text-[11px]">
                        <li>• إجمالي المستلم: {selectedFabric.total_yards} وار</li>
                        <li>• الرصيد الحالي المتاح: <strong className="text-indigo-600">{selectedFabric.remaining_yards} وار</strong></li>
                        <li>• تاريخ الاستلام: {selectedFabric.received_date}</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Left Column: Quantities, price and money elements */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">الكمية المشغولة (وار) *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={yardsSold}
                        onChange={(e) => setYardsSold(e.target.value)}
                        placeholder="مثال: 298"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">سعر الوار الواحد (ريال) *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={pricePerYard}
                        onChange={(e) => setPricePerYard(e.target.value)}
                        placeholder="مثال: 500"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">طريقة سداد الفاتورة *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['credit', 'partial', 'cash'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handlePaymentTypeChange(type)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            paymentType === type
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {type === 'credit' ? 'آجل بالكامل' : type === 'partial' ? 'دفعة جزئية' : 'كاش بالكامل'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">المبلغ المدفوع مقدمًا (ريال)</label>
                    <input
                      type="number"
                      required
                      disabled={paymentType === 'credit' || paymentType === 'cash'}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder={paymentType === 'credit' ? '0 (آجل)' : 'مثال: 50000'}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* Live Calculations Banner */}
              {calculatedTotal > 0 && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">إجمالي الفاتورة:</span>
                    <span className="font-extrabold text-slate-800 text-sm">{calculatedTotal.toLocaleString()} ريال</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">المدفوع فوراً:</span>
                    <span className="font-extrabold text-emerald-600 text-sm">{Number(paidAmount || 0).toLocaleString()} ريال</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">الذمة (آجل):</span>
                    <span className={`font-extrabold text-sm ${remainingDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {remainingDebt.toLocaleString()} ريال
                    </span>
                  </div>
                </div>
              )}

              {/* Extra Inputs & Submissions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ تحرير السند / الفاتورة</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">بيانات ونقشات التطريز المشتغل عليها</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: شغل نقشة رقم #14 وردات، عبايات..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedFabricId}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {loading ? 'جاري الحفظ والخصم والتثبيت...' : 'تأكيد وإصدار إشعار البيع والخصم التلقائي'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
