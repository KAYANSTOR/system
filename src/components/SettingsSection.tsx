import React, { useState, useEffect } from 'react';
import { CompanySettings, UserRole, CustomUser } from '../types';
import { 
  Settings, Save, CheckCircle, Upload, Building, Clock, 
  Bell, BellRing, Sparkles, AlertTriangle, Users, UserPlus, 
  Trash2, ShieldAlert, CheckSquare, Square, Edit2, ShieldCheck, X
} from 'lucide-react';

interface SettingsSectionProps {
  userRole: UserRole;
  settings: CompanySettings;
  onUpdateSettings: (settings: CompanySettings) => Promise<void>;
  reminderConfig: { enabled: boolean; time: string; };
  onUpdateReminderConfig: (config: { enabled: boolean; time: string; }) => void;
  customUsers: CustomUser[];
  onUpdateCustomUsers: (users: CustomUser[]) => void;
}

export default function SettingsSection({
  userRole,
  settings,
  onUpdateSettings,
  reminderConfig,
  onUpdateReminderConfig,
  customUsers,
  onUpdateCustomUsers
}: SettingsSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'permissions'>('general');

  // General Identity state
  const [compName, setCompName] = useState(settings.company_name);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [logoBase64, setLogoBase64] = useState(settings.logo_base64 || '');

  // Reminder local states
  const [reminderEnabled, setReminderEnabled] = useState(reminderConfig.enabled);
  const [reminderTime, setReminderTime] = useState(reminderConfig.time);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [testSuccess, setTestSuccess] = useState(false);

  // Loading & Alerts
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = userRole === 'admin';

  // Permissions Manager Form State
  const [isEditingUser, setIsEditingUser] = useState<string | null>(null); // user ID or 'new'
  const [formFullName, setFormFullName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formRoleLabel, setFormRoleLabel] = useState('مشرف إنتاج');
  
  const [formPerms, setFormPerms] = useState({
    dashboard: false,
    customers: false,
    fabrics: false,
    sales_invoice: false,
    materials: false,
    production: false,
    employees: false,
    settings: false
  });

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('حجم الصورة كبير جداً! الحد الأقصى المسموح به هو 2 ميجابايت.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName) {
      setError('اسم الشركة/المعمل مطلوب');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await onUpdateSettings({
        company_name: compName,
        phone,
        address,
        logo_base64: logoBase64
      });
      setSuccess('تم حفظ إعدادات وتعديلات المعمل بنجاح! ستظهر التغييرات فوراً على التقارير وكشوف الحساب.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'خطأ أثناء تعديل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  // User Management Handlers
  const handleStartAddUser = () => {
    setIsEditingUser('new');
    setFormFullName('');
    setFormUsername('');
    setFormRoleLabel('مشرف إنتاج ومسؤول حضور');
    setFormPerms({
      dashboard: false,
      customers: false,
      fabrics: true,
      sales_invoice: false,
      materials: true,
      production: true,
      employees: true,
      settings: false
    });
  };

  const handleStartEditUser = (user: CustomUser) => {
    setIsEditingUser(user.id);
    setFormFullName(user.fullName);
    setFormUsername(user.username);
    setFormRoleLabel(user.roleLabel);
    setFormPerms({ ...user.permissions });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName || !formUsername) {
      setError('يرجى ملء الاسم واسم المستخدم');
      return;
    }

    if (isEditingUser === 'new') {
      const newUser: CustomUser = {
        id: 'u_' + Date.now(),
        fullName: formFullName,
        username: formUsername.toLowerCase().trim().replace(/\s+/g, '_'),
        roleLabel: formRoleLabel,
        permissions: { ...formPerms }
      };
      onUpdateCustomUsers([...customUsers, newUser]);
      setSuccess('تم إضافة الموظف الجديد ومنحه الصلاحيات بنجاح!');
    } else {
      const updated = customUsers.map(u => {
        if (u.id === isEditingUser) {
          return {
            ...u,
            fullName: formFullName,
            username: formUsername.toLowerCase().trim().replace(/\s+/g, '_'),
            roleLabel: formRoleLabel,
            permissions: { ...formPerms }
          };
        }
        return u;
      });
      onUpdateCustomUsers(updated);
      setSuccess('تم تعديل وحفظ صلاحيات الموظف بنجاح!');
    }

    setIsEditingUser(null);
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الحساب؟ لن يتمكن من تسجيل الدخول أو ممارسة الصلاحيات.')) {
      const updated = customUsers.filter(u => u.id !== id);
      onUpdateCustomUsers(updated);
      setSuccess('تم حذف الحساب بنجاح.');
      setTimeout(() => setSuccess(''), 4000);
    }
  };

  const togglePermission = (key: keyof typeof formPerms) => {
    setFormPerms(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      
      {/* 1. Header with Sub-Tabs for elegant separation */}
      <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0">
            <Settings size={20} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-800">إعدادات المعمل والموظفين والصلاحيات</h2>
            <p className="text-[10px] text-slate-400">تعديل هوية التقارير، وتعيين صلاحيات مشرف الإنتاج ومخازن الأقمشة والمواد</p>
          </div>
        </div>

        {/* Dynamic sub-navigation tabs */}
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-2xl shrink-0 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('general')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'general'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            الهوية والتنبيهات
          </button>
          <button
            onClick={() => setActiveSubTab('permissions')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'permissions'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            إدارة الصلاحيات (المشرفين) 👥
          </button>
        </div>
      </div>

      {/* Global Toast Messages */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3.5 rounded-2xl font-black flex items-center gap-1.5 shadow-xs animate-fade-in no-print">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-2xl font-black flex items-center gap-1.5 shadow-xs animate-fade-in no-print">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ======================= TAB 1: GENERAL IDENTITY & REMINDERS ======================= */}
      {activeSubTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
              <Building className="text-indigo-600" size={20} />
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-800">ترويسة وهوية المعمل الرسمية</h3>
                <p className="text-[10px] text-slate-400">تظهر هذه الترويسة والشعار في أعلى كشوفات حساب الزبائن وملخصات الحضور المطبوعة</p>
              </div>
            </div>

            {!isAdmin ? (
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl text-center text-slate-500 text-xs">
                قراءة فقط: صلاحية تعديل ترويسة المعمل مقتصرة على المدير العام.
              </div>
            ) : (
              <form onSubmit={handleIdentitySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-600 mb-1">اسم معمل التطريز الرسمي *</label>
                  <input
                    type="text"
                    required
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    placeholder="مثال: معمل الأناقة الحديثة للتطريز"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-600 mb-1">أرقام هواتف التواصل</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="مثال: 777123456"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-600 mb-1">العنوان الجغرافي للمعمل</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="مثال: صنعاء - شارع الستين"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-600 mb-1">شعار المعمل (لوجو)</label>
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 mt-1">
                    {logoBase64 ? (
                      <div className="relative shrink-0">
                        <img 
                          src={logoBase64} 
                          alt="Logo Preview" 
                          className="h-20 w-20 object-contain bg-white border border-slate-200 rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => setLogoBase64('')}
                          className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 transition-all text-[9px] font-bold h-5 w-5 flex items-center justify-center cursor-pointer shadow-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="h-20 w-20 shrink-0 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-300">
                        <Building size={32} />
                      </div>
                    )}

                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-600">اختر صورة الشعار</p>
                      <p className="text-[10px] text-slate-400">يفضل استخدام صور شفافة بخلفية بيضاء لتظهر بشكل رائع عند الطباعة والتصدير.</p>
                      <label className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-all text-[11px] font-bold cursor-pointer mt-1">
                        <Upload size={12} />
                        رفع ملف صورة الشعار
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Save size={14} />
                  {loading ? 'جاري حفظ الإعدادات...' : 'حفظ وتطبيق بيانات ترويسة المعمل'}
                </button>
              </form>
            )}
          </div>

          {/* Daily Shift End Reminder Panel */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
              <BellRing className="text-amber-500" size={20} />
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-800">تنبيه نهاية الوردية اليومي وتنبيه الحضور</h3>
                <p className="text-[10px] text-slate-400">تذكير فوري يومي يتم إرساله لتسجيل وترحيل حضور وغياب الموظفين والمستحقات اليومية</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-700">تفعيل التنبيه اليومي التلقائي</p>
                  <p className="text-[10px] text-slate-400">سيقوم النظام بالتذكير الفوري عند بلوغ الساعة المحددة لضمان الالتزام</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={reminderEnabled} 
                    onChange={(e) => {
                      const val = e.target.checked;
                      setReminderEnabled(val);
                      onUpdateReminderConfig({ enabled: val, time: reminderTime });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:rtl:translate-x-0 rtl:after:left-[2px] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-600 mb-1">تحديد وقت التنبيه (نهاية الوردية)</label>
                  <input
                    type="time"
                    disabled={!reminderEnabled}
                    value={reminderTime}
                    onChange={(e) => {
                      const val = e.target.value;
                      setReminderTime(val);
                      onUpdateReminderConfig({ enabled: reminderEnabled, time: val });
                    }}
                    className="w-full bg-slate-50 disabled:opacity-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-600 mb-1">إشعارات المتصفح الفورية</label>
                  <div className="space-y-1.5">
                    {permissionState === 'granted' ? (
                      <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle size={14} />
                        <span>إشعارات المتصفح نشطة وتعمل ✅</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={!reminderEnabled}
                        onClick={async () => {
                          if ('Notification' in window) {
                            const perm = await Notification.requestPermission();
                            setPermissionState(perm);
                          }
                        }}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Bell size={13} />
                        طلب تفعيل إشعارات المتصفح
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Test Trigger */}
              <div className="border-t border-slate-50 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <Sparkles className="text-amber-500" size={14} />
                    اختبار بانر التنبيه وحالة الحضور
                  </span>
                  <p className="text-[10px] text-slate-400">انقر لتشغيل تنبيه تجريبي ومحاكاة نهاية الوردية فوراً</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTestSuccess(true);
                    setTimeout(() => setTestSuccess(false), 5000);

                    if ('Notification' in window && Notification.permission === 'granted') {
                      new Notification('⏱️ نهاية الوردية (تجريبي)', {
                        body: 'تنبيه تجريبي: حان الوقت لتسجيل حضور وغياب ومستحقات الموظفين اليومية!',
                        icon: settings.logo_base64 || undefined,
                        dir: 'rtl'
                      });
                    }

                    const event = new CustomEvent('trigger-test-reminder');
                    window.dispatchEvent(event);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
                >
                  إطلاق إشعار واختبار التنبيه 🧪
                </button>
              </div>

              {testSuccess && (
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 p-3 rounded-xl text-[10px] font-bold">
                  تم إرسال إشعار تجريبي! يمكنك رؤية بنر تذكير الوردية البرتقالي اللامع في أعلى لوحة التحكم الآن لتجربة التسجيل.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: USER PERMISSIONS MANAGEMENT ======================= */}
      {activeSubTab === 'permissions' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4 gap-2">
            <div className="flex items-center gap-2">
              <Users className="text-indigo-600" size={20} />
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-800">إدارة حسابات وصلاحيات المشرفين والموظفين</h3>
                <p className="text-[10px] text-slate-400">أضف حسابات لمشرفي الصالة والمخازن وخصص صلاحياتهم بدقة لمنع تداخل العمليات المالية والإنتاجية</p>
              </div>
            </div>

            {/* Add User Button */}
            {isAdmin && !isEditingUser && (
              <button
                onClick={handleStartAddUser}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 shadow-xs shrink-0 cursor-pointer"
              >
                <UserPlus size={14} />
                مستخدم جديد
              </button>
            )}
          </div>

          {!isAdmin ? (
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl text-center text-slate-500 text-xs">
              صلاحية تعديل وإضافة الصلاحيات وإدارة الحسابات مقتصرة فقط على حساب المدير العام.
            </div>
          ) : isEditingUser ? (
            /* USER EDITING / ADDITION FORM */
            <form onSubmit={handleSaveUser} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-indigo-600" />
                  {isEditingUser === 'new' ? 'إضافة مستخدم مخصص جديد' : 'تعديل صلاحيات المستخدم'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingUser(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-extrabold cursor-pointer"
                >
                  إلغاء ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-1">الاسم الكامل للموظف</label>
                  <input
                    type="text"
                    required
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="مثال: أحمد مشرف الإنتاج"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-1">اسم المستخدم (لتسجيل الدخول)</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="مثال: ahmad_prod"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-1">المسمى الوظيفي / الدور</label>
                  <input
                    type="text"
                    required
                    value={formRoleLabel}
                    onChange={(e) => setFormRoleLabel(e.target.value)}
                    placeholder="مثال: مشرف الصالة ومسجل حضور"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Capabilities Checklist Matrix */}
              <div className="space-y-3 mt-4">
                <span className="block text-xs font-extrabold text-slate-700">تخصيص شاشات وأقسام النظام المسموحة للموظف:</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'dashboard', label: 'الرئيسية والمؤشرات المالية الكلية', desc: 'إمكانية تصفح الملخص الإجمالي والتقارير المالية والتحليلات' },
                    { key: 'customers', label: 'حسابات الزبائن والليدجر وكشوف الحساب', desc: 'رؤية ديون الزبائن وتنزيل سندات القبض و كشوفات الحساب' },
                    { key: 'fabrics', label: 'مخزن وأقمشة الزبائن والوارد والصادر', desc: 'تسجيل استلام لفات الأقمشة وتعديل المتبقي وفرز الفوارغ' },
                    { key: 'sales_invoice', label: 'إصدار سندات البيع وفواتير الأمتار', desc: 'تسجيل الفواتير وتوليدها بناء على إنتاج المكائن والعمليات' },
                    { key: 'materials', label: 'مستلزمات ومخزن المواد الخام مع حركات التوريد', desc: 'إدخال وصرف مستلزمات المعمل كالخرز، الخيوط، الإبر، وغيرها' },
                    { key: 'production', label: 'مشرف الإنتاج وتشغيل مكائن التطريز والصالة', desc: 'إسناد الموظفين وتسجيل عداد الغرز والبانوهات اليومي للمكائن' },
                    { key: 'employees', label: 'إدارة كشف الحضور والغياب والرواتب (HR) ⏱️', desc: 'تسجيل الحضور والغياب والسلفيات والإضافي والترحيل اليومي' },
                    { key: 'settings', label: 'تعديل الترويسة وهوية المعمل وحسابات الصلاحيات', desc: 'التحكم الكامل والوصول لبيانات النظام الرئيسية وتعديل الشعار' },
                  ].map((item) => {
                    const isChecked = formPerms[item.key as keyof typeof formPerms];
                    return (
                      <button
                        type="button"
                        key={item.key}
                        onClick={() => togglePermission(item.key as keyof typeof formPerms)}
                        className={`flex items-start gap-3 p-3 rounded-xl border text-right transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-950 shadow-2xs'
                            : 'bg-white border-slate-200/60 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0 text-indigo-600">
                          {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                        </div>
                        <div>
                          <span className="text-xs font-black block leading-tight">{item.label}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 leading-normal">{item.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditingUser(null)}
                  className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
                >
                  إلغاء وتراجع
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={13} />
                  حفظ الصلاحيات والمستخدم
                </button>
              </div>
            </form>
          ) : (
            /* STAFF BENTO LIST */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Admin Non-editable Card for display */}
                <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-950 flex flex-col justify-between h-36 shadow-xs relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 h-24 w-24 rounded-full bg-white" />
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-amber-400 font-extrabold block">الحساب الرئيسي الأساسي</span>
                      <h4 className="text-xs font-extrabold text-white mt-1">أبو أحمد (المدير العام)</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">اسم المستخدم الرئيسي: @admin</p>
                    </div>
                    <div className="bg-amber-400 text-slate-950 p-1.5 rounded-lg">
                      <ShieldCheck size={16} />
                    </div>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex flex-wrap gap-1 mt-auto">
                    <span className="text-[9px] bg-white/10 text-white px-1.5 py-0.5 rounded-md font-bold">كل الصلاحيات مفعلة</span>
                    <span className="text-[9px] text-amber-300 font-black">★ لا يمكن حظره أو تعديله لأمان النظام</span>
                  </div>
                </div>

                {/* Custom Users List */}
                {customUsers.map((user) => {
                  const badges = [];
                  const p = user.permissions;
                  if (p.dashboard) badges.push('لوحة التحكم');
                  if (p.customers) badges.push('الزبائن والقبض');
                  if (p.fabrics) badges.push('المخزن والأقمشة');
                  if (p.sales_invoice) badges.push('المبيعات والفواتير');
                  if (p.materials) badges.push('مستلزمات ومواد');
                  if (p.production) badges.push('مشرف إنتاج مكائن');
                  if (p.employees) badges.push('تسجيل الحضور والغياب (HR)');
                  if (p.settings) badges.push('إعدادات المعمل');

                  return (
                    <div 
                      key={user.id} 
                      className="bg-white rounded-2xl p-4 border border-slate-200/70 hover:border-slate-300 transition-all flex flex-col justify-between h-36 shadow-2xs group"
                    >
                      <div className="flex items-start justify-between w-full">
                        <div>
                          <span className="text-[9px] text-indigo-600 font-extrabold block">{user.roleLabel}</span>
                          <h4 className="text-xs font-extrabold text-slate-800 mt-0.5">{user.fullName}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">المستخدم: @{user.username}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleStartEditUser(user)}
                            title="تعديل صلاحيات الحساب"
                            className="bg-slate-50 hover:bg-slate-100 text-slate-500 p-1.5 rounded-lg border border-slate-100 transition-all cursor-pointer"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            title="حذف الحساب"
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-lg border border-rose-100 transition-all cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Display permission chips */}
                      <div className="border-t border-slate-100 pt-2 flex flex-wrap gap-1 mt-auto overflow-hidden max-h-12">
                        {badges.length === 0 ? (
                          <span className="text-[9px] text-rose-500 font-bold">⚠️ لا توجد صلاحيات (حساب معطل حالياً)</span>
                        ) : (
                          badges.map((b, idx) => (
                            <span 
                              key={idx} 
                              className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-bold"
                            >
                              {b}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
