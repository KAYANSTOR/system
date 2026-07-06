import React from 'react';
import { CustomUser } from '../types';
import { Shield, User, Landmark, ShoppingBag, Settings, PenTool, Layers, UserCheck, LayoutDashboard } from 'lucide-react';

interface RoleSelectorProps {
  activeUserId: string;
  customUsers: CustomUser[];
  onUserSelect: (userId: string) => void;
}

export default function RoleSelector({ activeUserId, customUsers, onUserSelect }: RoleSelectorProps) {
  const adminUser = {
    id: 'u_admin',
    fullName: 'أبو أحمد (المدير العام)',
    username: 'admin',
    roleLabel: 'المدير العام',
    permissions: {
      dashboard: true,
      customers: true,
      fabrics: true,
      sales_invoice: true,
      materials: true,
      production: true,
      employees: true,
      settings: true
    }
  };

  const allUsers = [adminUser, ...customUsers];
  const activeUser = allUsers.find(u => u.id === activeUserId) || adminUser;

  // Helper to get mini badges for permissions
  const getPermissionBadges = (perms: typeof adminUser.permissions) => {
    const badges = [];
    if (perms.dashboard) badges.push({ text: 'المؤشرات', color: 'bg-slate-100 text-slate-700' });
    if (perms.customers) badges.push({ text: 'الحسابات', color: 'bg-emerald-50 text-emerald-700' });
    if (perms.fabrics) badges.push({ text: 'الأقمشة', color: 'bg-indigo-50 text-indigo-700' });
    if (perms.sales_invoice) badges.push({ text: 'الفواتير', color: 'bg-blue-50 text-blue-700' });
    if (perms.materials) badges.push({ text: 'المواد', color: 'bg-cyan-50 text-cyan-700' });
    if (perms.production) badges.push({ text: 'الإنتاج', color: 'bg-amber-50 text-amber-700' });
    if (perms.employees) badges.push({ text: 'الرواتب/الحضور', color: 'bg-purple-50 text-purple-700' });
    if (perms.settings) badges.push({ text: 'الإعدادات', color: 'bg-rose-50 text-rose-700' });
    return badges;
  };

  return (
    <div className="bg-white border-b border-slate-100 p-4 no-print shadow-xs">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 mb-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              بوابة محاكاة المستخدمين والصلاحيات النشطة 👥
            </h2>
            <p className="text-xs text-slate-400">
              اختر أي حساب أدناه لرؤية كيف يتغير النظام والصلاحيات والشاشات فوراً وفقاً لما يحدده المدير:
            </p>
          </div>
          <div className="text-xs font-bold bg-indigo-50 border border-indigo-100 text-indigo-800 px-3 py-2 rounded-xl self-start lg:self-auto flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-indigo-600 text-white flex items-center justify-center font-black">
              {activeUser.fullName.charAt(0)}
            </div>
            <span>
              الحساب النشط حالياً: <span className="font-extrabold text-indigo-950">{activeUser.fullName}</span> ({activeUser.roleLabel})
            </span>
          </div>
        </div>

        {/* Beautiful Horizontal scrolling account cards */}
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-thin">
          {allUsers.map((user) => {
            const isSelected = user.id === activeUserId;
            const isAdmin = user.id === 'u_admin';
            const badges = getPermissionBadges(user.permissions);

            return (
              <button
                key={user.id}
                onClick={() => onUserSelect(user.id)}
                className={`relative min-w-[240px] sm:min-w-[260px] snap-start flex flex-col p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-slate-950 shadow-md transform scale-[1.02]'
                    : 'bg-slate-50/70 hover:bg-slate-50 text-slate-700 border-slate-200/80'
                }`}
              >
                {/* Upper row: icon & title */}
                <div className="flex items-start justify-between w-full mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-black ${
                      isSelected 
                        ? (isAdmin ? 'bg-amber-500 text-slate-950' : 'bg-indigo-600 text-white')
                        : (isAdmin ? 'bg-red-50 text-red-600' : 'bg-slate-200 text-slate-700')
                    }`}>
                      {isAdmin ? <Shield size={16} /> : <User size={16} />}
                    </div>
                    <div>
                      <span className={`text-xs font-black block leading-none ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                        {user.fullName}
                      </span>
                      <span className={`text-[9px] block mt-1 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        اسم المستخدم: @{user.username}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg font-extrabold ${
                    isSelected ? 'bg-white/10 text-white' : 'bg-slate-200/60 text-slate-600'
                  }`}>
                    {user.roleLabel}
                  </span>
                </div>

                {/* Permissions tag row */}
                <div className="flex flex-wrap gap-1 mt-2 border-t pt-2 w-full border-dashed border-slate-200/30">
                  {isAdmin ? (
                    <span className="text-[10px] text-amber-500 font-extrabold">★ صلاحيات كاملة وشاملة للمدير</span>
                  ) : badges.length === 0 ? (
                    <span className="text-[10px] text-rose-500 font-bold">⚠️ لا توجد أي صلاحيات مفعلة</span>
                  ) : (
                    badges.map((b, i) => (
                      <span
                        key={i}
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                          isSelected ? 'bg-white/15 text-slate-100' : b.color
                        }`}
                      >
                        {b.text}
                      </span>
                    ))
                  )}
                </div>

                {/* Selected Ring Tick */}
                {isSelected && (
                  <span className="absolute top-2 left-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
