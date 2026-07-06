import React, { useState } from 'react';
import { Material, MaterialTransaction, UserRole } from '../types';
import { ShoppingBag, Plus, ArrowDownLeft, ArrowUpRight, AlertTriangle, Search, Filter } from 'lucide-react';

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
  const canTransact = userRole === 'admin' || userRole === 'materials_manager';

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

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      
      {/* Action buttons and summary bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="text-emerald-600" size={20} />
            مخزن المواد الخام والمستلزمات
          </h2>
          <p className="text-xs text-slate-400">إدارة الخرز، الإبر، الخيوط، الزيوت وحساب الوارد والمنصرف</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canTransact && (
            <>
              <button
                id="btn-material-in"
                onClick={() => openTxModal('in')}
                className="bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-emerald-700 transition-colors text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                توريد مواد خام (وارد)
              </button>
              <button
                id="btn-material-out"
                onClick={() => openTxModal('out')}
                className="bg-rose-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-rose-700 transition-colors text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
              >
                صرف مواد (منصرف)
              </button>
            </>
          )}
          {isAdmin && (
            <button
              id="btn-define-material"
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-indigo-700 transition-colors text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              تعريف صنف جديد
            </button>
          )}
        </div>
      </div>

      {/* Materials List & Low stock Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Current Inventory with alerts (FR-6.4) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">مستويات المخزون الحالية</h3>
            <div className="relative w-44">
              <Search className="absolute right-2.5 top-1.5 text-slate-400" size={12} />
              <input
                type="text"
                placeholder="ابحث بالصنف..."
                value={matSearch}
                onChange={(e) => setMatSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-7 pl-2 py-1 text-[11px] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredMaterials.map((material) => {
              const isLow = material.current_quantity <= material.min_alert_qty;
              return (
                <div 
                  key={material.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isLow 
                      ? 'bg-rose-50/50 border-rose-200 ring-1 ring-rose-300' 
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-800 text-xs">{material.name}</span>
                    {isLow && (
                      <span className="text-rose-600 animate-pulse flex items-center gap-0.5 text-[10px] font-bold">
                        <AlertTriangle size={12} />
                        نقص مخزون!
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-baseline mt-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block">الكمية الحالية:</span>
                      <span className={`text-base font-black ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>
                        {material.current_quantity.toLocaleString()} <span className="text-xs font-normal text-slate-400">{material.unit === 'kg' ? 'كيلوجرام' : 'حبة'}</span>
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] text-slate-400 block font-bold">حد التنبيه:</span>
                      <span className="text-[10px] text-slate-500 font-bold">{material.min_alert_qty} {material.unit === 'kg' ? 'كجم' : 'حبة'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Material Movements Logs (FR-6.2, FR-6.3, FR-6.6) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">سجل الحركات الأخير</h3>
            <p className="text-[10px] text-slate-400">سجل توريد وصرف المواد الخام مع أسماء المستخدمين المسؤولين</p>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {transactions.length === 0 ? (
              <p className="text-center py-12 text-xs text-slate-400">لا توجد حركات مسجلة حالياً</p>
            ) : (
              transactions
                .slice()
                .reverse()
                .map((tx) => {
                  const isIn = tx.type === 'in';
                  return (
                    <div key={tx.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2.5 text-xs">
                      <div className={`p-1.5 rounded-lg shrink-0 ${isIn ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {isIn ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 truncate block">{tx.material_name}</span>
                          <span className={`font-black ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isIn ? '+' : '-'}{tx.quantity}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{tx.notes || 'لا توجد ملاحظات'}</p>
                        <div className="flex justify-between items-center mt-1.5 text-[9px] text-slate-400 border-t border-slate-200/50 pt-1">
                          <span>بواسطة: <strong className="text-slate-600">{tx.username}</strong></span>
                          <span>التاريخ: {tx.transaction_date}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

      </div>

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
