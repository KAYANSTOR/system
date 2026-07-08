import React, { useState } from 'react';
import { Material, MaterialTransaction, UserRole } from '../types';
import { ShoppingBag, Plus, ArrowDownLeft, ArrowUpRight, AlertTriangle, Search, Filter, History, ClipboardList, SlidersHorizontal, Layers, Archive } from 'lucide-react';

interface MaterialsSectionProps {
  userRole: UserRole;
  materials: Material[];
  transactions: (MaterialTransaction & { material_name?: string })[];
  onAddMaterial: (name: string, unit: 'kg' | 'piece', minAlertQty: number) => Promise<void>;
  onRecordTx: (materialId: string, type: 'in' | 'out', quantity: number, date: string, notes: string) => Promise<void>;
}

export default function MaterialsSection({
  userRole,
  materials,
  transactions,
  onAddMaterial,
  onRecordTx
}: MaterialsSectionProps) {
  const [subTab, setSubTab] = useState<'stock' | 'transactions' | 'actions'>('stock');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<'in' | 'out'>('in');

  // New Material form state
  const [matName, setMatName] = useState('');
  const [matUnit, setMatUnit] = useState<'kg' | 'piece'>('kg');
  const [matMinAlert, setMatMinAlert] = useState('');
  const [addError, setAddError] = useState('');

  // Transaction form state
  const [selectedMatId, setSelectedMatId] = useState('');
  const [txQty, setTxQty] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txNotes, setTxNotes] = useState('');
  const [txError, setTxError] = useState('');

  const [loading, setLoading] = useState(false);
  const [matSearch, setMatSearch] = useState('');

  const isAdmin = userRole === 'admin';
  const canTransact = userRole === 'admin';

  // Filters
  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(matSearch.toLowerCase())
  );

  const selectedMaterial = materials.find(m => m.id === selectedMatId);

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matName) return;
    setLoading(true);
    setAddError('');
    try {
      await onAddMaterial(matName, matUnit, Number(matMinAlert || 0));
      setMatName('');
      setMatMinAlert('');
      setShowAddModal(false);
    } catch (err: any) {
      setAddError(err.message || 'خطأ أثناء تسجيل المادة');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatId || !txQty || Number(txQty) <= 0) {
      setTxError('الرجاء اختيار المادة والكمية الصحيحة');
      return;
    }

    if (txType === 'out' && selectedMaterial && selectedMaterial.current_quantity < Number(txQty)) {
      setTxError(`الكمية المطلوبة للصرف (${txQty} ${selectedMaterial.unit === 'kg' ? 'كيلو' : 'حبة'}) أكبر من الرصيد المتوفر حالياً (${selectedMaterial.current_quantity})!`);
      return;
    }

    setLoading(true);
    setTxError('');
    try {
      await onRecordTx(selectedMatId, txType, Number(txQty), txDate, txNotes);
      setTxQty('');
      setTxNotes('');
      setShowTxModal(false);
    } catch (err: any) {
      setTxError(err.message || 'حدث خطأ أثناء تقييد الحركة');
    } finally {
      setLoading(false);
    }
  };

  const openTxModal = (type: 'in' | 'out') => {
    setTxType(type);
    setTxError('');
    setShowTxModal(true);
  };

  // Calculate quick metrics
  const totalItemsCount = materials.length;
  const lowStockItemsCount = materials.filter(m => m.current_quantity <= m.min_alert_qty).length;

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      
      {/* Action buttons and summary bar */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="text-emerald-600" size={22} />
            مستودع المواد ومستلزمات الإنتاج
          </h2>
          <p className="text-xs text-slate-400">تتبع مخزون الخرز، الإبر، خيوط التطريز، والزيوت التشغيلية في معمل كيان سوفت</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canTransact && (
            <>
              <button
                id="btn-material-in"
                onClick={() => openTxModal('in')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                توريد مواد خام (وارد)
              </button>
              <button
                id="btn-material-out"
                onClick={() => openTxModal('out')}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                صرف مواد (منصرف)
              </button>
            </>
          )}
          {isAdmin && (
            <button
              id="btn-define-material"
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              تعريف صنف جديد
            </button>
          )}
        </div>
      </div>

      {/* Sub-navigation bar */}
      <div className="bg-white border border-slate-200/50 p-1.5 rounded-2xl shadow-xs flex flex-wrap gap-1">
        <button
          onClick={() => setSubTab('stock')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'stock'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Layers size={16} />
          <span>مستويات وجرد المخزن الحالية</span>
          {lowStockItemsCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
              {lowStockItemsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('transactions')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'transactions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <History size={16} />
          <span>أرشيف وسجل حركات المستودع</span>
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
          <span>لوحة العمليات والطلبات السريعة</span>
        </button>
      </div>

      {/* SUBTAB 1: STOCK INVENTORY */}
      {subTab === 'stock' && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Stats banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-center">
              <div>
                <span className="text-slate-400 block text-xs font-bold">إجمالي أصناف المواد المعرّفة</span>
                <span className="font-black text-slate-800 text-lg block mt-1">{totalItemsCount} أصناف مختلفة</span>
              </div>
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                <Archive size={20} />
              </div>
            </div>

            <div className={`p-5 rounded-2xl border shadow-xs flex justify-between items-center transition-all ${
              lowStockItemsCount > 0 ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-100'
            }`}>
              <div>
                <span className="text-slate-400 block text-xs font-bold">المواد تحت حد نقص المخزون الحرجة</span>
                <span className={`font-black text-lg block mt-1 ${lowStockItemsCount > 0 ? 'text-rose-600 font-extrabold animate-pulse' : 'text-slate-700'}`}>
                  {lowStockItemsCount} أصناف تحتاج للتوريد
                </span>
              </div>
              <div className={`p-3 rounded-xl ${lowStockItemsCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                <AlertTriangle size={20} />
              </div>
            </div>
          </div>

          {/* Current Inventory with alerts (FR-6.4) */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">مستويات وجرد المخزون الحالي للقطع والغرز والمواد</h3>
                <p className="text-xs text-slate-400 mt-1">توضح المواد المتاحة وحدود الطلب والتنبيهات الخاصة بنفاذ المخزون</p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute right-3 top-2.5 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="البحث بالاسم أو نوع الصنف..."
                  value={matSearch}
                  onChange={(e) => setMatSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-400 text-xs">
                  لا توجد أصناف تطابق شرط البحث الحالي.
                </div>
              ) : (
                filteredMaterials.map((material) => {
                  const isLow = material.current_quantity <= material.min_alert_qty;
                  return (
                    <div 
                      key={material.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isLow 
                          ? 'bg-rose-50/50 border-rose-200 ring-1 ring-rose-300' 
                          : 'bg-white border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-black text-slate-800 text-xs truncate block">{material.name}</span>
                        {isLow && (
                          <span className="text-rose-600 animate-pulse flex items-center gap-0.5 text-[10px] font-bold shrink-0">
                            <AlertTriangle size={12} />
                            نقص!
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-end mt-5">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">الرصيد المتاح بالمخزن:</span>
                          <span className={`text-lg font-black ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>
                            {material.current_quantity.toLocaleString()} <span className="text-xs font-normal text-slate-400">{material.unit === 'kg' ? 'كيلوجرام' : 'حبة'}</span>
                          </span>
                        </div>
                        <div className="text-left">
                          <span className="text-[9px] text-slate-400 block font-bold">حد الطلب:</span>
                          <span className="text-[11px] text-slate-500 font-extrabold">{material.min_alert_qty} {material.unit === 'kg' ? 'كجم' : 'حبة'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: DETAILED MOVEMENTS TRANSACTION LOG */}
      {subTab === 'transactions' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5 animate-fade-in">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">أرشيف وحركات توريد وصرف مخزن المواد</h3>
            <p className="text-xs text-slate-400 mt-1">تتبع الحركات المقيدة وارد وصرف مع معرفة المستخدم وتفاصيل وتواريخ الاستلام الفعلي</p>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                  <th className="p-3.5">نوع المعاملة</th>
                  <th className="p-3.5">المادة الخام / المستلزم</th>
                  <th className="p-3.5 text-center">الكمية المسجلة</th>
                  <th className="p-3.5">البيان وملاحظات الحركة</th>
                  <th className="p-3.5 text-center">المسؤول عن الحركة</th>
                  <th className="p-3.5 text-left">تاريخ التقييد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                      لا توجد حركات مخزن مقيدة بعد.
                    </td>
                  </tr>
                ) : (
                  transactions
                    .slice()
                    .reverse()
                    .map((tx) => {
                      const isIn = tx.type === 'in';
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="p-3.5">
                            {isIn ? (
                              <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-black text-[10px] inline-flex items-center gap-1">
                                <ArrowDownLeft size={12} />
                                توريد (وارد)
                              </span>
                            ) : (
                              <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg font-black text-[10px] inline-flex items-center gap-1">
                                <ArrowUpRight size={12} />
                                صرف (منصرف)
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 font-bold text-slate-800">
                            {tx.material_name}
                          </td>
                          <td className={`p-3.5 text-center font-black text-xs ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isIn ? '+' : '-'}{tx.quantity.toLocaleString()}
                          </td>
                          <td className="p-3.5 text-slate-500">
                            {tx.notes || '---'}
                          </td>
                          <td className="p-3.5 text-center font-bold text-slate-600">
                            {tx.username}
                          </td>
                          <td className="p-3.5 text-left font-mono text-slate-400">
                            {tx.transaction_date}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: QUICK OPERATIONS ACTIONS PANEL */}
      {subTab === 'actions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* Quick shortcuts for inbound and outbound operations */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
              <ClipboardList className="text-indigo-600" size={18} />
              عمليات التوريد والصرف السريعة
            </h3>
            <p className="text-xs text-slate-400">يمكنك القيام بعمليات التوريد والصرف المباشر من خلال الضغط على الأزرار الموجودة في أعلى شريط التحكم، أو استخدام الأزرار أدناه لتوجيه تدفق العمل:</p>

            <div className="grid grid-cols-1 gap-2.5 pt-2">
              <button
                onClick={() => openTxModal('in')}
                className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-2xl text-xs font-black text-right flex justify-between items-center hover:bg-emerald-100/50 transition-all cursor-pointer"
              >
                <span>القيام بعملية توريد مواد خام جديدة (وارد للمستودع)</span>
                <ArrowDownLeft size={16} />
              </button>

              <button
                onClick={() => openTxModal('out')}
                className="w-full bg-rose-50 text-rose-700 border border-rose-200 p-4 rounded-2xl text-xs font-black text-right flex justify-between items-center hover:bg-rose-100/50 transition-all cursor-pointer"
              >
                <span>القيام بعملية صرف مواد لخط صالة الإنتاج (منصرف)</span>
                <ArrowUpRight size={16} />
              </button>

              {isAdmin && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full bg-indigo-50 text-indigo-700 border border-indigo-200 p-4 rounded-2xl text-xs font-black text-right flex justify-between items-center hover:bg-indigo-100/50 transition-all cursor-pointer"
                >
                  <span>تعريف صنف ومادة خام جديدة بالكامل في مخزن المعمل</span>
                  <Plus size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Guidelines info */}
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 text-slate-600 space-y-3 text-xs leading-relaxed">
            <h4 className="font-extrabold text-slate-800">💡 تعليمات مخزن ومستلزمات "كيان سوفت"</h4>
            <p>1. <strong>تتبع مخزون الإبر والخيوط:</strong> يسهم في استمرارية تشغيل المكائن وصالة التطريز دون توقف مفاجئ.</p>
            <p>2. <strong>حدود الطلب والتنبيهات:</strong> يقوم النظام بإرسال إشارة حمراء نابضة بمجرد نزول كمية المادة عن الحد الأدنى المعين للتنبيه، وذلك لإشعار أمين المستودع بضرورة التوريد والشراء العاجل.</p>
            <p>3. <strong>مسؤولية العمليات:</strong> يتم توثيق اسم الحساب البرمجي الفعلي الذي قام بالصرف أو التوريد لضمان الشفافية والمحاسبة المخزنية التامة.</p>
          </div>
        </div>
      )}

      {/* MODAL: Define new Material */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 border border-slate-100 shadow-xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-1.5">
              <ShoppingBag className="text-indigo-600" size={18} />
              تعريف صنف ومادة خام جديدة
            </h3>
            
            {addError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl mb-4 font-semibold">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddMaterial} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">اسم المادة الخام *</label>
                <input
                  type="text"
                  required
                  value={matName}
                  onChange={(e) => setMatName(e.target.value)}
                  placeholder="مثال: قصب تركي مذهب عريض"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">وحدة القياس *</label>
                <select
                  value={matUnit}
                  onChange={(e) => setMatUnit(e.target.value as 'kg' | 'piece')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                >
                  <option value="kg">كيلوجرام (كجم)</option>
                  <option value="piece">حبة (عدد)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">الحد الأدنى للتنبيه بنقص المخزون</label>
                <input
                  type="number"
                  min={0}
                  value={matMinAlert}
                  onChange={(e) => setMatMinAlert(e.target.value)}
                  placeholder="مثال: 10"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                />
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ الصنف'}
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

      {/* MODAL: Record Transaction (In/Out) */}
      {showTxModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 border border-slate-100 shadow-xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-slate-800 mb-1 flex items-center gap-1.5">
              {txType === 'in' ? (
                <>
                  <ArrowDownLeft className="text-emerald-600" size={18} />
                  تسجيل توريد مواد خام (وارد للمخزن)
                </>
              ) : (
                <>
                  <ArrowUpRight className="text-rose-600" size={18} />
                  تسجيل صرف مواد خام (منصرف لخط الإنتاج)
                </>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">تقييد الحركة لحساب مخزون المعمل والمتابعة</p>
            
            {txError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl mb-4 font-semibold">
                {txError}
              </div>
            )}

            <form onSubmit={handleRecordTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">المادة الخام المستهدفة *</label>
                <select
                  required
                  value={selectedMatId}
                  onChange={(e) => setSelectedMatId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                >
                  <option value="">-- اختر الصنف --</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} (المتوفر: {m.current_quantity} {m.unit === 'kg' ? 'كجم' : 'حبة'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  الكمية بالـ {selectedMaterial ? (selectedMaterial.unit === 'kg' ? 'كيلوجرام' : 'حبة') : 'وحدة'} *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={txQty}
                  onChange={(e) => setTxQty(e.target.value)}
                  placeholder="مثال: 15"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ تحرير المعاملة</label>
                <input
                  type="date"
                  required
                  value={txDate}
                  onChange={(e) => setTranslateDate(e)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ملاحظات الحركة (الغرض أو المورّد)</label>
                <textarea
                  rows={2}
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  placeholder={txType === 'in' ? 'اسم المورّد أو رقم السند...' : 'شغل نقشة عبايات فلان أو رقم الماكينة...'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full text-white py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    txType === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {loading ? 'جاري التقييد...' : (txType === 'in' ? 'تأكيد التوريد' : 'تأكيد الصرف')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
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

  function setTranslateDate(e: React.ChangeEvent<HTMLInputElement>) {
    setTxDate(e.target.value);
  }
}
