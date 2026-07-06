import React, { useState } from 'react';
import { Shield, User, Lock, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { CustomUser } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (userId: string, token: string) => void;
  customUsers: CustomUser[];
}

export default function LoginScreen({ onLoginSuccess, customUsers }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Backend user templates for quick-prefill
  const demoAccounts = [
    { name: 'المدير العام', username: 'admin', role: 'مدير النظام', desc: 'صلاحيات كاملة', icon: Shield, color: 'bg-amber-50 border-amber-200 text-amber-800' },
    { name: 'علي المحاسب', username: 'sales', role: 'مبيعات ومحاسبة', desc: 'الفواتير والزبائن', icon: User, color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    { name: 'خالد المخزنجي', username: 'fabric', role: 'أقمشة ومستودع', desc: 'مخزن الأقمشة', icon: User, color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
    { name: 'محمد الخزنوي', username: 'materials', role: 'مستلزمات ومواد', desc: 'مخزن المواد والمشتريات', icon: User, color: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
    { name: 'عمر مشرف الصالة', username: 'production', role: 'مشرف الصالة والإنتاج', desc: 'المكائن وتشغيل الوردية', icon: User, color: 'bg-rose-50 border-rose-200 text-rose-800' },
  ];

  const handlePrefill = (user: string) => {
    setUsername(user);
    setPassword('123');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('الرجاء كتابة اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await window.fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل تسجيل الدخول. يرجى التحقق من المدخلات.');
      }

      setSuccess(true);
      setTimeout(() => {
        // Map backend username to frontend custom user ID
        let matchedUserId = 'u_admin';
        if (username === 'sales') matchedUserId = 'u_sales';
        else if (username === 'fabric') matchedUserId = 'u_fabric';
        else if (username === 'materials') matchedUserId = 'u_materials';
        else if (username === 'production') matchedUserId = 'u_production';

        onLoginSuccess(matchedUserId, data.token);
      }, 800);

    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ غير متوقع أثناء الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-4 font-sans" dir="rtl">
      
      {/* Decorative ambient background spots */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 bg-white rounded-[32px] border border-slate-100 shadow-2xl overflow-hidden relative z-10">
        
        {/* Left column (Visual/Branding panel) */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
          
          <div className="relative z-10">
            <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md mb-6 border border-white/20">
              <Shield className="text-indigo-400" size={28} />
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-2">معمل كيان سوفت</h1>
            <p className="text-slate-400 text-xs leading-relaxed">
              النظام السحابي المتكامل للتخطيط الشامل وإدارة مستودعات الأقمشة، تشغيل صالة المكائن والإنتاج، وتتبع حضور ورواتب الموظفين.
            </p>
          </div>

          <div className="relative z-10 pt-12 md:pt-0">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-300 font-medium">قاعدة بيانات سحابية حقيقية ومزامنة فورية</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-300 font-medium">تحديد تلقائي للصلاحيات وحماية العمليات</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-300 font-medium">سندات القبض وفواتير الفارغة وتقارير المبيعات</span>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-800 pt-4 flex items-center justify-between text-[10px] text-slate-500">
              <span>الإصدار v3.4.2</span>
              <span>نظام محمي ومشفر © 2026</span>
            </div>
          </div>
        </div>

        {/* Right column (Login Form & Presets) */}
        <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-slate-800 mb-1.5">تسجيل الدخول للموظفين</h2>
            <p className="text-xs text-slate-400">الرجاء إدخال اسم المستخدم وكلمة المرور الخاصة بك أو اختيار حساب تجريبي أدناه.</p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-5 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2.5 animate-shake">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success State */}
          {success && (
            <div className="mb-5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>تم التحقق بنجاح! جاري تحويلك لوحة التحكم...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المستخدم</label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 pointer-events-none">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  placeholder="مثال: admin أو sales"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading || success}
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400 bg-slate-50/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور</label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 pointer-events-none">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="أدخل كلمة المرور (التجريبية: 123)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || success}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400 bg-slate-50/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className={`w-full py-3 rounded-2xl text-xs font-extrabold text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                loading || success
                  ? 'bg-slate-400 shadow-none cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98 shadow-indigo-600/10'
              }`}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري التحقق من الصلاحيات...</span>
                </>
              ) : (
                <>
                  <KeyRound size={16} />
                  <span>تسجيل الدخول للنظام</span>
                </>
              )}
            </button>
          </form>

          {/* Presets Grid */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-3">
              اختصارات الحسابات التجريبية (للاختبار السريع ⏱️)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {demoAccounts.map((acc, i) => {
                const AccIcon = acc.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handlePrefill(acc.username)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-right transition-all hover:shadow-2xs active:scale-95 cursor-pointer ${acc.color}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 w-full">
                      <AccIcon size={12} className="shrink-0 opacity-70" />
                      <span className="text-[10px] font-black truncate">{acc.name}</span>
                    </div>
                    <span className="text-[9px] opacity-75 truncate max-w-full">اسم المستخدم: {acc.username}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
