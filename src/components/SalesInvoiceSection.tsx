import React, { useState, useEffect } from 'react';
import { Customer, CustomerFabric, SalesInvoice, UserRole } from '../types';
import { Landmark, FilePlus, Coins, Layers, ArrowLeftRight, CheckCircle, AlertCircle, Search, Printer, Eye, X, FileText, Receipt } from 'lucide-react';

interface SalesInvoiceSectionProps {
  userRole: UserRole;
  customers: Customer[];
  fabrics: CustomerFabric[];
  invoices: SalesInvoice[];
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
  invoices,
  prefilledInvoiceData,
  onIssueInvoice
}: SalesInvoiceSectionProps) {
  const [salesSubTab, setSalesSubTab] = useState<'list' | 'create'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState<SalesInvoice | null>(null);

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

  const canEdit = userRole === 'admin';

  // Prefill hooks
  useEffect(() => {
    if (prefilledInvoiceData) {
      if (prefilledInvoiceData.customer_id) {
        setSelectedCustomerId(prefilledInvoiceData.customer_id);
      }
      if (prefilledInvoiceData.fabric_id) {
        setSelectedFabricId(prefilledInvoiceData.fabric_id);
      }
      setSalesSubTab('create'); // Auto-switch to create tab
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

  // Grouping & calculations for the invoices archive
  const filteredInvoices = invoices.filter(inv => {
    const cust = customers.find(c => c.id === inv.customer_id);
    const custName = cust ? cust.name : '';
    return inv.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) || 
           custName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (inv.notes && inv.notes.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const totalInvoicedSum = invoices.reduce((sum, i) => sum + i.total_amount, 0);
  const totalPaidSum = invoices.reduce((sum, i) => sum + i.paid_amount, 0);
  const totalDebtSum = invoices.reduce((sum, i) => sum + i.remaining_amount, 0);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      
      {/* Tabbed Navigation Bar */}
      <div className="bg-white border border-slate-200/50 p-1.5 rounded-2xl shadow-xs flex flex-wrap gap-1 no-print">
        <button
          onClick={() => setSalesSubTab('list')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            salesSubTab === 'list'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Receipt size={16} className={salesSubTab === 'list' ? 'text-indigo-400' : 'text-slate-400'} />
          <span>سجل وأرشيف فواتير المبيعات</span>
        </button>

        <button
          onClick={() => setSalesSubTab('create')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            salesSubTab === 'create'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <FilePlus size={16} className={salesSubTab === 'create' ? 'text-indigo-400' : 'text-slate-400'} />
          <span>إصدار فاتورة بيع جديدة</span>
        </button>
      </div>

      {/* TAB 1: INVOICES ARCHIVE LISTING & KPI CARDS */}
      {salesSubTab === 'list' && (
        <div className="space-y-6 animate-fade-in no-print">
          {/* Quick Sales Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-center">
              <div>
                <span className="text-slate-400 block text-xs font-bold">إجمالي المبيعات والعمليات المحررة</span>
                <span className="font-black text-slate-900 text-xl block mt-1">{totalInvoicedSum.toLocaleString()} <span className="text-xs">ريال</span></span>
              </div>
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                <Landmark size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-center">
              <div>
                <span className="text-slate-400 block text-xs font-bold">إجمالي المقبوضات النقدية (الصندوق)</span>
                <span className="font-black text-emerald-600 text-xl block mt-1">{totalPaidSum.toLocaleString()} <span className="text-xs">ريال</span></span>
              </div>
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                <Coins size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-center">
              <div>
                <span className="text-slate-400 block text-xs font-bold">إجمالي الأرصدة المتبقية آجل (الذمم)</span>
                <span className="font-black text-rose-600 text-xl block mt-1">{totalDebtSum.toLocaleString()} <span className="text-xs">ريال</span></span>
              </div>
              <div className="bg-rose-50 text-rose-600 p-3 rounded-xl">
                <ArrowLeftRight size={20} />
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <Receipt className="text-indigo-600" size={18} />
                  الفواتير وسندات التطريز الصادرة
                </h3>
                <p className="text-xs text-slate-400 mt-1">عرض جميع حركات المبيعات وتتبع حالة سداد ديون الزبائن والخصومات المباشرة</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute right-3.5 top-3 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="البحث برقم الفاتورة أو باسم العميل..."
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
                    <th className="p-3.5 rounded-r-lg">رقم الفاتورة</th>
                    <th className="p-3.5">اسم الزبون</th>
                    <th className="p-3.5 text-center">الكمية المباعة (وار)</th>
                    <th className="p-3.5 text-center">السعر الفردي</th>
                    <th className="p-3.5 text-center">إجمالي الفاتورة</th>
                    <th className="p-3.5 text-center">المدفوع نقداً</th>
                    <th className="p-3.5 text-center">المتبقي آجل</th>
                    <th className="p-3.5 rounded-l-lg text-left">التفاصيل والطباعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                        لا توجد فواتير مبيعات مسجلة مطابقة لشرط البحث حالياً
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const customer = customers.find(c => c.id === inv.customer_id);
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3.5 font-bold font-mono text-indigo-600">
                            {inv.invoice_no}
                          </td>
                          <td className="p-3.5 font-black text-slate-800">
                            {customer ? customer.name : 'عميل غير مسجل'}
                          </td>
                          <td className="p-3.5 text-center font-bold text-slate-600 font-mono">{inv.yards_sold} وار</td>
                          <td className="p-3.5 text-center font-bold text-slate-500 font-mono">{inv.price_per_yard.toLocaleString()}</td>
                          <td className="p-3.5 text-center font-extrabold text-slate-900 font-mono">{inv.total_amount.toLocaleString()}</td>
                          <td className="p-3.5 text-center font-bold text-emerald-600 font-mono">{inv.paid_amount.toLocaleString()}</td>
                          <td className="p-3.5 text-center font-bold font-mono">
                            {inv.remaining_amount > 0 ? (
                              <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[10px] font-bold">
                                {inv.remaining_amount.toLocaleString()} آجل
                              </span>
                            ) : (
                              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                                مسدد بالكامل
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-left">
                            <button
                              onClick={() => setSelectedInvoiceForDetails(inv)}
                              className="bg-slate-100 text-slate-700 hover:bg-slate-200 p-2 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold"
                            >
                              <Eye size={14} />
                              عرض الفاتورة
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CREATE INVOICE FORM OR SUCCESS */}
      {salesSubTab === 'create' && (
        <div className="max-w-4xl mx-auto">
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
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {loading ? 'جاري الحفظ والخصم والتثبيت...' : 'تأكيد وإصدار إشعار البيع والخصم التلقائي'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- PRESTINE MODAL POPUP FOR DETAILED VIEW & PRINT --- */}
      {selectedInvoiceForDetails && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl max-w-lg w-full overflow-hidden p-6 relative">
            <button
              onClick={() => setSelectedInvoiceForDetails(null)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Header / Brand info */}
            <div className="text-center pb-4 border-b border-slate-100 mb-4">
              <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase">فاتورة مبيعات تطريز</span>
              <h3 className="font-extrabold text-slate-800 text-lg mt-2">كيان سوفت لإدارة معامل التطريز</h3>
              <p className="text-slate-400 text-[10px]">تاريخ الطباعة: {new Date().toLocaleDateString('ar-YE')}</p>
            </div>

            {/* Printable Area content */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-bold">رقم الفاتورة:</span>
                  <span className="font-extrabold text-slate-800 font-mono">{selectedInvoiceForDetails.invoice_no}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">تاريخ التحرير:</span>
                  <span className="font-extrabold text-slate-800 font-mono">{selectedInvoiceForDetails.invoice_date}</span>
                </div>
                <div className="col-span-2 border-t border-slate-200/50 pt-2 mt-1">
                  <span className="text-slate-400 block font-bold">اسم العميل:</span>
                  <span className="font-black text-slate-950 text-sm">
                    {customers.find(c => c.id === selectedInvoiceForDetails.customer_id)?.name || 'عميل غير معروف'}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50 font-bold text-slate-500 border-b border-slate-100">
                      <th className="p-2">البيان وقماشة الزبون</th>
                      <th className="p-2 text-center">الكمية</th>
                      <th className="p-2 text-center">سعر الوار</th>
                      <th className="p-2 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    <tr>
                      <td className="p-2">
                        {fabrics.find(f => f.id === selectedInvoiceForDetails.fabric_id)?.fabric_type || 'قماش الزبون'}
                        {selectedInvoiceForDetails.notes && (
                          <span className="block text-[10px] text-slate-400 font-medium">{selectedInvoiceForDetails.notes}</span>
                        )}
                      </td>
                      <td className="p-2 text-center font-mono">{selectedInvoiceForDetails.yards_sold} وار</td>
                      <td className="p-2 text-center font-mono">{selectedInvoiceForDetails.price_per_yard.toLocaleString()}</td>
                      <td className="p-2 text-left font-bold font-mono text-slate-900">{selectedInvoiceForDetails.total_amount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Financial Breakdowns */}
              <div className="bg-slate-50/50 p-4 rounded-xl space-y-2 border border-slate-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">إجمالي الفاتورة المستحق:</span>
                  <span className="font-black text-slate-900 font-mono">{selectedInvoiceForDetails.total_amount.toLocaleString()} ريال</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">المبلغ المسدد نقداً:</span>
                  <span className="font-black text-emerald-600 font-mono">{selectedInvoiceForDetails.paid_amount.toLocaleString()} ريال</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/50 pt-2 mt-1">
                  <span className="text-slate-600 font-black">الرصيد المتبقي آجل ذمة العميل:</span>
                  <span className={`font-black font-mono ${selectedInvoiceForDetails.remaining_amount > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                    {selectedInvoiceForDetails.remaining_amount.toLocaleString()} ريال
                  </span>
                </div>
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl text-xs font-black hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Printer size={14} />
                  طباعة الفاتورة الفورية
                </button>
                <button
                  onClick={() => setSelectedInvoiceForDetails(null)}
                  className="px-4 bg-slate-100 text-slate-600 hover:bg-slate-200 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden print element specifically for window.print() of selectedInvoiceForDetails */}
      {selectedInvoiceForDetails && (
        <div className="hidden print:block bg-white p-8 leading-relaxed text-xs">
          <div className="text-center pb-6 border-b-2 border-slate-900 mb-6">
            <h1 className="text-xl font-black text-slate-950">كيان سوفت لإدارة معامل التطريز</h1>
            <p className="text-xs text-slate-500 mt-1">فاتورة مبيعات / سند خصم وتطريز أقمشة</p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-300 mb-6">
            <div>
              <span className="text-slate-500 block font-bold">رقم الفاتورة:</span>
              <span className="font-extrabold text-sm font-mono">{selectedInvoiceForDetails.invoice_no}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-bold">تاريخ التحرير:</span>
              <span className="font-extrabold text-sm font-mono">{selectedInvoiceForDetails.invoice_date}</span>
            </div>
            <div className="col-span-2 border-t border-slate-300 pt-2 mt-2">
              <span className="text-slate-500 block font-bold">اسم العميل:</span>
              <span className="font-black text-base text-slate-950">
                {customers.find(c => c.id === selectedInvoiceForDetails.customer_id)?.name || 'عميل غير معروف'}
              </span>
            </div>
          </div>

          <table className="w-full text-right border-collapse mb-6">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border border-slate-300">
                <th className="p-2 border border-slate-300">البيان وقماشة الزبون</th>
                <th className="p-2 text-center border border-slate-300">الكمية</th>
                <th className="p-2 text-center border border-slate-300">سعر الوار</th>
                <th className="p-2 text-left border border-slate-300">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border border-slate-300">
                <td className="p-2 border border-slate-300">
                  {fabrics.find(f => f.id === selectedInvoiceForDetails.fabric_id)?.fabric_type || 'قماش الزبون'}
                  {selectedInvoiceForDetails.notes && (
                    <span className="block text-[10px] text-slate-400 mt-0.5">{selectedInvoiceForDetails.notes}</span>
                  )}
                </td>
                <td className="p-2 text-center border border-slate-300 font-mono">{selectedInvoiceForDetails.yards_sold} وار</td>
                <td className="p-2 text-center border border-slate-300 font-mono">{selectedInvoiceForDetails.price_per_yard.toLocaleString()}</td>
                <td className="p-2 text-left border border-slate-300 font-bold font-mono">{selectedInvoiceForDetails.total_amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div className="mr-auto max-w-xs bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600 font-bold">إجمالي الفاتورة:</span>
              <span className="font-black font-mono">{selectedInvoiceForDetails.total_amount.toLocaleString()} ريال</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-bold">المبلغ المسدد فوراً:</span>
              <span className="font-black text-emerald-700 font-mono">{selectedInvoiceForDetails.paid_amount.toLocaleString()} ريال</span>
            </div>
            <div className="flex justify-between border-t border-slate-400 pt-2 mt-1">
              <span className="text-slate-700 font-black">الذمة المتبقية آجل:</span>
              <span className="font-black text-rose-700 font-mono">{selectedInvoiceForDetails.remaining_amount.toLocaleString()} ريال</span>
            </div>
          </div>

          <div className="mt-12 text-center border-t border-dashed border-slate-300 pt-6">
            <p className="text-[10px] text-slate-400">نظام كيان سوفت - شكراً لتعاملكم معنا</p>
          </div>
        </div>
      )}

    </div>
  );
}
