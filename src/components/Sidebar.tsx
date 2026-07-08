import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarProps {
  allowedTabs: {
    id: string;
    label: string;
    icon: LucideIcon;
    perm: string;
  }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function Sidebar({ allowedTabs, activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="md:w-64 luxury-card rounded-3xl p-4.5 shrink-0 h-fit no-print hidden md:block">
      <div className="space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">أقسام وشاشات النظام المتاحة</span>
        </div>

        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {allowedTabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`sidebar-tab-${tab.id}`}
                onClick={() => {
                  onTabChange(tab.id);
                }}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/20 border-amber-500/30'
                    : 'text-slate-500 bg-white border-transparent hover:bg-slate-100 hover:text-indigo-950'
                }`}
              >
                <TabIcon size={16} className={isActive ? 'text-amber-500' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 pt-3 hidden md:block">
          <div className="bg-amber-50/50 rounded-2xl p-3 border border-amber-500/10 text-[10px] text-slate-500 leading-normal space-y-1">
            <span className="font-extrabold block text-amber-800">دليل الصلاحيات الفعال:</span>
            <p className="text-[10px] text-slate-500">تخضع شاشات النظام والميزانيات لرقابة صارمة تضمن عدم تسرب معلومات كشف الرواتب، مسيرات العمال، وصناديق الحسابات لغير المدراء.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
