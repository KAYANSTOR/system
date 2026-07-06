import React, { useState } from 'react';
import { Customer, CustomerTransaction, CustomerFabric, UserRole } from '../types';
import { Search, UserPlus, Phone, MapPin, Notebook, Plus, Landmark, Receipt, FileText, Printer, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface CustomersSectionProps {
  userRole: UserRole;
  customers: Customer[];
  fabrics: CustomerFabric[];
  transactions: CustomerTransaction[];
  companyName: string;
  companyPhone: string;
  companyAddress: string;
  companyLogo: string;
  onAddCustomer: (name: string, phone: string, address: string, notes: string) => Promise<void>;
  onAddReceipt: (customerId: string, amount: number, notes: string, date: string) => Promise<void>;
  onNavigateToTab: (tab: string, prefill?: any) => void;
}

export default function CustomersSection({
  userRole,
  customers,
  fabrics,
  transactions,
  companyName,
  companyPhone,
  companyAddress,
  companyLogo,
  onAddCustomer,
  onAddReceipt,
  onNavigateToTab
}: CustomersSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  
  // Add Customer Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Receipt Form State
  const [receiptAmount, setReceiptAmount] = useState('');
  const [receiptNotes, setReceiptNotes] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptError, setReceiptError] = useState('');

  const canEdit = userRole === 'admin' || userRole === 'sales';

  // Filters
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const customerTransactions = transactions
    .filter(t => t.customer_id === selectedCustomerId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const customerFabrics = fabrics.filter(f => f.customer_id === selectedCustomerId);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) {
      setError('اسم العميل مطلوب');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onAddCustomer(newName, newPhone, newAddress, newNotes);
      setNewName('');
      setNewPhone('');
      setNewAddress('');
      setNewNotes('');
      setShowAddModal(false);
    } catch (err: any) {
      setError(err.message || 'خطأ أثناء إضافة العميل');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !receiptAmount || Number(receiptAmount) <= 0) {
      setReceiptError('الرجاء إدخال مبلغ صحيح أكبر من صفر');
      return;
    }
    setLoading(true);
    setReceiptError('');
    try {
      await onAddReceipt(selectedCustomerId, Number(receiptAmount), receiptNotes, receiptDate);
      setReceiptAmount('');
      setReceiptNotes('');
      setShowReceiptModal(false);
    } catch (err: any) {
      setReceiptError(err.message || 'خطأ أثناء تسجيل سند القبض');
    } finally {
      setLoading(false);
    }
  };

  const printLedger = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 max-w-7xl mx-auto">
      {/* Sidebar: Customer List */}
      <div className={`lg:col-span-4 space-y-4 no-print ${selectedCustomerId ? 'hidden lg:block' : 'block'}`}>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-800 text-base">دليل العملاء</h3>
            {canEdit && (
              <button
                id="btn-open-add-customer"
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1 text-xs font-bold"
              >
                <UserPlus size={14} />
                عميل جديد
              </button>
            )}
          </div>

          <div className="relative mb-3">
            <Search className="absolute right-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="البحث بالاسم أو رقم الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredCustomers.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">لا يوجد عملاء مطابقين للبحث</p>
            ) : (
              filteredCustomers.map(customer => {
                const isActive = customer.id === selectedCustomerId;
                return (
                  <button
                    key={customer.id}
                    id={`customer-item-${customer.id}`}
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className={`w-full text-right p-3 rounded-xl border transition-all duration-250 block ${
                      isActive 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform -translate-x-1' 
                        : 'bg-white text-slate-700 border-slate-100 hover:border-indigo-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm block truncate max-w-[180px]">{customer.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : customer.balance > 0 
                            ? 'bg-rose-50 text-rose-600' 
                            : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {customer.balance > 0 ? `عليه: ${customer.balance.toLocaleString()}` : 'خالص'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] mt-1.5 opacity-80">
                      <Phone size={10} />
                      <span>{customer.phone || 'بدون رقم'}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Panel: Selected Customer File / Statement */}
      <div className={`lg:col-span-8 ${selectedCustomerId ? 'block' : 'hidden lg:block'}`}>
        {!selectedCustomer ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm h-full flex flex-col justify-center items-center">
            <Notebook size={48} className="text-slate-300 mb-3" />
            <h3 className="font-bold text-slate-700 text-base">لم يتم اختيار أي عميل</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              الرجاء تحديد عميل من القائمة الجانبية لعرض كشف حسابه، وسندات أقمشته، والعمليات المالية والبيع الخاصة به.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Customer Brief Header */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm relative no-print">
              <button 
                onClick={() => setSelectedCustomerId(null)}
                className="lg:hidden absolute left-4 top-4 text-xs font-bold bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600"
              >
                رجوع للقائمة
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">{selectedCustomer.name}</h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-indigo-500" />
                      هاتف: <span className="font-semibold text-slate-700">{selectedCustomer.phone || 'غير مسجل'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-indigo-500" />
                      العنوان: <span className="font-semibold text-slate-700">{selectedCustomer.address || 'غير مسجل'}</span>
                    </span>
                  </div>
                  {selectedCustomer.notes && (
                    <p className="text-[11px] text-slate-400 mt-2 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                      <strong>ملاحظات العميل:</strong> {selectedCustomer.notes}
                    </p>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center min-w-[150px] self-start sm:self-auto">
                  <span className="text-[10px] text-slate-400 block font-bold">الرصيد المالي الحالي</span>
                  <span className={`text-xl font-extrabold block mt-0.5 ${selectedCustomer.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {selectedCustomer.balance.toLocaleString()} <span className="text-xs">ريال</span>
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-1">
                    {selectedCustomer.balance > 0 ? 'مستحق الدفع لصالح المعمل' : 'حساب العميل خالص'}
                  </span>
                </div>
              </div>

              {/* Action Bar inside Selected Customer */}
              <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-50">
                {canEdit && (
                  <>
                    <button
                      id="btn-issue-invoice"
                      onClick={() => onNavigateToTab('sales_invoice', { customer_id: selectedCustomer.id })}
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl hover:bg-indigo-700 transition-colors text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus size={14} />
                      إصدار إشعار بيع (تطريز)
                    </button>
                    <button
                      id="btn-receive-fabric"
                      onClick={() => onNavigateToTab('fabrics', { customer_id: selectedCustomer.id })}
                      className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl hover:bg-emerald-700 transition-colors text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus size={14} />
                      استلام أقمشة زبون
                    </button>
                    <button
                      id="btn-open-receipt"
                      onClick={() => setShowReceiptModal(true)}
                      className="bg-amber-500 text-white px-3 py-1.5 rounded-xl hover:bg-amber-600 transition-colors text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Receipt size={14} />
                      قبض دفعة مالية
                    </button>
                  </>
                )}
                <button
                  id="btn-print-ledger"
                  onClick={printLedger}
                  className="bg-slate-700 text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Printer size={14} />
                  طباعة كشف الحساب
                </button>
              </div>
            </div>

            {/* Fabrics Inventory Panel */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm no-print">
              <h3 className="font-extrabold text-slate-800 text-sm mb-3.5 flex items-center gap-1.5">
                <FileText className="text-indigo-500" size={16} />
                رصيد أقمشة العميل المتوفرة بالمخزن
              </h3>
              {customerFabrics.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-xs text-slate-400">لا يوجد أقمشة مسجلة حالياً لهذا العميل</p>
                  {canEdit && (
                    <button
                      onClick={() => onNavigateToTab('fabrics', { customer_id: selectedCustomer.id })}
                      className="text-xs text-indigo-600 font-bold underline mt-1 block hover:text-indigo-700"
                    >
                      اضغط هنا لاستلام دفعة أقمشة منه
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customerFabrics.map((fabric) => {
                    const isLeftover = fabric.is_leftover;
                    return (
                      <div 
                        key={fabric.id} 
                        className={`p-3.5 rounded-xl border relative transition-all ${
                          isLeftover 
                            ? 'bg-amber-50/50 border-amber-200' 
                            : 'bg-white border-slate-100 hover:border-slate-200 shadow-xs'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-800 text-xs block">{fabric.fabric_type}</span>
                          {isLeftover && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm">
                              فارغة متبقية
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] text-slate-500 border-t border-slate-50 pt-2">
                          <div>
                            <span className="text-slate-400 block">عدد الطيقان:</span>
                            <span className="font-bold text-slate-700 text-xs">{fabric.rolls_count} طاقة</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">الرصيد المتاح:</span>
                            <span className={`font-extrabold text-xs block ${fabric.remaining_yards > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                              {fabric.remaining_yards} <span className="text-[10px]">وار</span>
                            </span>
                          </div>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-2 flex justify-between">
                          <span>تاريخ الاستلام: {fabric.received_date}</span>
                          {fabric.total_yards !== fabric.remaining_yards && (
                            <span>الإجمالي المستلم: {fabric.total_yards} وار</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Financial Ledger (Transactions) */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm no-print">
              <h3 className="font-extrabold text-slate-800 text-sm mb-3 flex items-center gap-1.5">
                <Landmark className="text-indigo-500" size={16} />
                سجل الحركة المالية المفصل (كشف الحساب)
              </h3>
              {customerTransactions.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">لا توجد عمليات مالية مسجلة</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                        <th className="p-2.5 rounded-r-lg">التاريخ</th>
                        <th className="p-2.5">البيان والعملية</th>
                        <th className="p-2.5 text-center">المبلغ المستحق (+)</th>
                        <th className="p-2.5 text-center">المبلغ المدفوع (-)</th>
                        <th className="p-2.5 text-left rounded-l-lg">الرصيد بعد الحركة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {customerTransactions.map((tx) => {
                        const isSale = tx.type === 'sale';
                        const isReceipt = tx.type === 'receipt';
                        const isInit = tx.type === 'initial_balance';
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 text-slate-400 font-mono text-[10px]">{tx.date}</td>
                            <td className="p-2.5 font-medium text-slate-700 max-w-[280px]">
                              <span className="block">{tx.notes}</span>
                            </td>
                            <td className="p-2.5 text-center font-bold text-slate-700">
                              {(isSale || isInit) ? tx.amount.toLocaleString() : '-'}
                            </td>
                            <td className="p-2.5 text-center font-bold text-emerald-600">
                              {isReceipt ? tx.amount.toLocaleString() : '-'}
                            </td>
                            <td className="p-2.5 text-left font-extrabold font-mono text-slate-900">
                              {tx.balance_after.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* --- PRISTINE FULLY STYLED PRINT LEDGER SHEET --- */}
            <div className="hidden print:block print-card bg-white p-6 leading-relaxed">
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-6 mb-6">
                <div>
                  <h1 className="text-xl font-black text-slate-950">{companyName}</h1>
                  <p className="text-xs text-slate-500 mt-1">{companyAddress} | هاتف: {companyPhone}</p>
                </div>
                {companyLogo ? (
                  <img src={companyLogo} alt="Logo" className="max-h-16 max-w-16 object-contain" />
                ) : (
                  <div className="bg-slate-100 p-2 border border-slate-300 rounded font-bold text-xs">شعار المعمل</div>
                )}
              </div>

              <div className="text-center mb-6">
                <h2 className="text-lg font-black underline text-slate-900 tracking-wide">كشف حساب عميل تفصيلي</h2>
                <p className="text-[10px] text-slate-400 mt-1">تاريخ الطباعة: {new Date().toLocaleDateString('ar-YE')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs">
                <div>
                  <span className="text-slate-400 block font-bold">اسم العميل:</span>
                  <span className="font-extrabold text-slate-900 text-sm">{selectedCustomer.name}</span>
                  <span className="block mt-1">رقم الهاتف: {selectedCustomer.phone || '-'}</span>
                  <span>العنوان: {selectedCustomer.address || '-'}</span>
                </div>
                <div className="text-left">
                  <span className="text-slate-400 block font-bold">الرصيد المالي المستحق:</span>
                  <span className={`text-lg font-extrabold block mt-1 ${selectedCustomer.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {selectedCustomer.balance.toLocaleString()} ريال يمني
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1 font-bold">
                    {selectedCustomer.balance > 0 ? 'مستحق للمعمل (مدين)' : 'مسدد بالكامل'}
                  </span>
                </div>
              </div>

              <h4 className="font-bold text-slate-800 text-xs mb-2 border-b border-slate-300 pb-1">سجل المعاملات المالية المتبادلة</h4>
              <table className="w-full text-right text-xs border-collapse mb-6">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border border-slate-300">
                    <th className="p-2 border border-slate-300">التاريخ</th>
                    <th className="p-2 border border-slate-300">البيان بالتفصيل</th>
                    <th className="p-2 border border-slate-300 text-center">المبلغ المضاف (مدين)</th>
                    <th className="p-2 border border-slate-300 text-center">المسدد (دائن)</th>
                    <th className="p-2 border border-slate-300 text-left">الرصيد المتبقي</th>
                  </tr>
                </thead>
                <tbody>
                  {customerTransactions.map((tx) => (
                    <tr key={tx.id} className="border border-slate-300">
                      <td className="p-2 border border-slate-300 font-mono text-[10px]">{tx.date}</td>
                      <td className="p-2 border border-slate-300">{tx.notes}</td>
                      <td className="p-2 border border-slate-300 text-center font-bold">
                        {(tx.type === 'sale' || tx.type === 'initial_balance') ? tx.amount.toLocaleString() : '-'}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-bold">
                        {tx.type === 'receipt' ? tx.amount.toLocaleString() : '-'}
                      </td>
                      <td className="p-2 border border-slate-300 text-left font-bold font-mono">
                        {tx.balance_after.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-300 text-xs text-slate-500">
                <div className="text-center min-w-[120px]">
                  <span>توقيع المحاسب</span>
                  <div className="h-10"></div>
                  <span className="block border-t border-slate-300 pt-1">.........................</span>
                </div>
                <div className="text-center min-w-[120px]">
                  <span>توقيع العميل المستلم</span>
                  <div className="h-10"></div>
                  <span className="block border-t border-slate-300 pt-1">.........................</span>
                </div>
                <div className="text-center min-w-[120px]">
                  <span>مصادقة الإدارة</span>
                  <div className="h-10"></div>
                  <span className="block border-t border-slate-300 pt-1">.........................</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* MODAL: Add Customer */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 z-50 no-print">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-100 shadow-xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-1.5">
              <UserPlus className="text-indigo-600" size={18} />
              تسجيل عميل جديد بالمعمل
            </h3>
            
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl mb-4 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">اسم العميل بالكامل *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: شركة النور للأزياء"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">رقم الهاتف الجوال</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="مثال: 777111222"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">العنوان أو موقع الشركة</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="مثال: صنعاء - شارع الستين الغربي"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="أية شروط أو تفاصيل تخص طريقة المحاسبة أو الشغل..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  {loading ? 'جاري الحفظ...' : 'تسجيل العميل'}
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

      {/* MODAL: Add Receipt */}
      {showReceiptModal && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 z-50 no-print">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-100 shadow-xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-slate-800 mb-2 flex items-center gap-1.5">
              <Receipt className="text-amber-500" size={18} />
              سند قبض دفعة مالية جديدة
            </h3>
            <p className="text-slate-400 text-[11px] mb-4">
              إضافة دفعة لتخفيض مديونية العميل: <span className="font-bold text-slate-700">{selectedCustomer.name}</span>
            </p>
            
            {receiptError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl mb-4 font-semibold">
                {receiptError}
              </div>
            )}

            <form onSubmit={handleCreateReceipt} className="space-y-3.5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">المديونية الحالية للعميل:</span>
                <span className="font-extrabold text-rose-600 text-sm">{selectedCustomer.balance.toLocaleString()} ريال</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">المبلغ المقبوض (ريال) *</label>
                <input
                  type="number"
                  required
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                  placeholder="مثال: 50000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ تحرير السند</label>
                <input
                  type="date"
                  required
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">تفاصيل الدفع وملاحظات</label>
                <textarea
                  rows={2}
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  placeholder="مثال: تسليم نقد بطلب المحاسب، أو شيك رقم #302"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-amber-600 transition-all cursor-pointer"
                >
                  {loading ? 'جاري الحفظ...' : 'تثبيت السند والقبض'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
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
