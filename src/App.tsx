import React, { useState, useEffect } from 'react';
import { 
  UserRole, Customer, CustomerFabric, Material, MaterialTransaction, 
  Machine, MachineAssignment, ProductionRecord, Employee, AttendanceEntry, 
  CompanySettings, CustomerTransaction, CustomUser 
} from './types';

// Importing beautiful sections
import RoleSelector from './components/RoleSelector';
import LoginScreen from './components/LoginScreen';
import DashboardOverview from './components/DashboardOverview';
import CustomersSection from './components/CustomersSection';
import FabricsSection from './components/FabricsSection';
import SalesInvoiceSection from './components/SalesInvoiceSection';
import MaterialsSection from './components/MaterialsSection';
import ProductionSection from './components/ProductionSection';
import EmployeesSection from './components/EmployeesSection';
import SettingsSection from './components/SettingsSection';

// Icons
import { 
  LayoutDashboard, Users, Layers, FileSpreadsheet, ShoppingBag, 
  Activity, UserCheck, Settings as SettingsIcon, AlertCircle, RefreshCw, 
  Printer, Building, BellRing, Clock, Menu, MoreHorizontal, LogOut
} from 'lucide-react';

// Custom fetch helper to automatically inject authorization headers
// based on the current simulated active role. This bridges the simulated client-side role
// with the server's requireAuth and role checking.
const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (typeof input === 'string' && input.startsWith('/api/')) {
    const token = (window as any).__activeToken || btoa(JSON.stringify({ id: 'u_admin', username: 'admin', role: 'admin' }));
    
    const newInit = { ...init } as RequestInit;
    const headers = new Headers(newInit.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    newInit.headers = headers;
    
    return window.fetch(input, newInit);
  }
  return window.fetch(input, init);
};

// Shadow the global fetch inside this module
const fetch = customFetch;

export default function App() {
  // 1. Unified Simulated Custom Users list state
  const [customUsers, setCustomUsers] = useState<CustomUser[]>(() => {
    try {
      const saved = localStorage.getItem('erp_custom_users');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'u_sales',
        fullName: 'علي المحاسب',
        username: 'sales_ali',
        roleLabel: 'المحاسب والمبيعات',
        permissions: {
          dashboard: true,
          customers: true,
          fabrics: true,
          sales_invoice: true,
          materials: false,
          production: false,
          employees: false,
          settings: false
        }
      },
      {
        id: 'u_fabric',
        fullName: 'خالد مسؤول المخزن',
        username: 'fabric_khaled',
        roleLabel: 'مسؤول مخزن الأقمشة',
        permissions: {
          dashboard: false,
          customers: false,
          fabrics: true,
          sales_invoice: false,
          materials: false,
          production: false,
          employees: false,
          settings: false
        }
      },
      {
        id: 'u_materials',
        fullName: 'محمد الخزنوي',
        username: 'materials_mohammad',
        roleLabel: 'مسؤول مخزن المواد',
        permissions: {
          dashboard: false,
          customers: false,
          fabrics: false,
          sales_invoice: false,
          materials: true,
          production: false,
          employees: false,
          settings: false
        }
      },
      {
        id: 'u_production',
        fullName: 'عمر مشرف الصالة',
        username: 'production_omar',
        roleLabel: 'مشرف الإنتاج',
        permissions: {
          dashboard: false,
          customers: false,
          fabrics: false,
          sales_invoice: false,
          materials: false,
          production: true,
          employees: false,
          settings: false
        }
      }
    ];
  });

  // Save custom users list on change
  useEffect(() => {
    localStorage.setItem('erp_custom_users', JSON.stringify(customUsers));
  }, [customUsers]);

  // 0. Login & Session state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('erp_is_logged_in') === 'true';
  });

  const [authToken, setAuthToken] = useState<string>(() => {
    return localStorage.getItem('erp_auth_token') || '';
  });

  const handleLogout = () => {
    localStorage.removeItem('erp_is_logged_in');
    localStorage.removeItem('erp_auth_token');
    localStorage.removeItem('erp_active_user_id');
    setIsLoggedIn(false);
    setAuthToken('');
    setActiveUserId('u_admin');
  };

  // 2. Active User Id State
  const [activeUserId, setActiveUserId] = useState<string>(() => {
    const saved = localStorage.getItem('erp_active_user_id');
    return saved || 'u_admin';
  });

  useEffect(() => {
    localStorage.setItem('erp_active_user_id', activeUserId);
  }, [activeUserId]);

  // Admin user blueprint
  const adminUser: CustomUser = {
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

  const currentUser = activeUserId === 'u_admin' 
    ? adminUser 
    : customUsers.find(u => u.id === activeUserId) || adminUser;

  // Sync simulated credentials to global token interceptor
  useEffect(() => {
    let backendRole: UserRole = 'admin';
    if (currentUser.id === 'u_admin') {
      backendRole = 'admin';
    } else {
      const p = currentUser.permissions;
      if (p.settings || p.employees) {
        backendRole = 'admin';
      } else if (p.sales_invoice || p.customers) {
        backendRole = 'sales';
      } else if (p.fabrics) {
        backendRole = 'fabric_manager';
      } else if (p.materials) {
        backendRole = 'materials_manager';
      } else if (p.production) {
        backendRole = 'production_supervisor';
      }
    }
    const userPayload = { id: currentUser.id, username: currentUser.username, role: backendRole };
    const token = btoa(JSON.stringify(userPayload));
    (window as any).__activeToken = token;
  }, [currentUser]);

  // Map to simple UserRole compatibility for props where required
  const userRole: UserRole = currentUser.id === 'u_admin' ? 'admin' : (
    currentUser.permissions.employees || currentUser.permissions.settings ? 'admin' : (
      currentUser.permissions.sales_invoice || currentUser.permissions.customers ? 'sales' : (
        currentUser.permissions.fabrics ? 'fabric_manager' : (
          currentUser.permissions.materials ? 'materials_manager' : 'production_supervisor'
        )
      )
    )
  );

  // Core Data States
  const [settings, setSettings] = useState<CompanySettings>({
    company_name: 'معمل الأناقة للتطريز الحديث',
    phone: '777-123-456',
    address: 'صنعاء - الجمهورية اليمنية',
    logo_base64: ''
  });
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [fabrics, setFabrics] = useState<CustomerFabric[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsTx, setMaterialsTx] = useState<(MaterialTransaction & { material_name?: string })[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [assignments, setAssignments] = useState<(MachineAssignment & { machine_name?: string })[]>([]);
  const [productionRecords, setProductionRecords] = useState<(ProductionRecord & { machine_name?: string; employee_name?: string })[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);

  // Page Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [prefillInvoice, setPrefillInvoice] = useState<any>(null);

  // Daily Shift-End Reminder State
  interface ShiftReminderConfig {
    enabled: boolean;
    time: string; // "17:00"
    lastTriggeredDate?: string; // "YYYY-MM-DD"
  }
  const [reminderConfig, setReminderConfig] = useState<ShiftReminderConfig>(() => {
    try {
      const saved = localStorage.getItem('erp_shift_reminder');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { enabled: true, time: '17:00' };
  });

  const [activeReminderAlert, setActiveReminderAlert] = useState<boolean>(false);

  // Save reminderConfig on change
  useEffect(() => {
    localStorage.setItem('erp_shift_reminder', JSON.stringify(reminderConfig));
  }, [reminderConfig]);

  // Set up daily shift-end reminder loop
  useEffect(() => {
    // 1. Listen for custom test event from settings
    const handleTestReminder = () => {
      setActiveReminderAlert(true);
    };
    window.addEventListener('trigger-test-reminder', handleTestReminder);

    if (!reminderConfig.enabled) {
      return () => {
        window.removeEventListener('trigger-test-reminder', handleTestReminder);
      };
    }

    const checkInterval = setInterval(() => {
      const now = new Date();
      const currentHoursStr = String(now.getHours()).padStart(2, '0');
      const currentMinutesStr = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHoursStr}:${currentMinutesStr}`;
      const currentDateStr = now.toISOString().split('T')[0];

      if (currentTimeStr === reminderConfig.time && reminderConfig.lastTriggeredDate !== currentDateStr) {
        setReminderConfig(prev => ({
          ...prev,
          lastTriggeredDate: currentDateStr
        }));
        
        // Trigger alert banner
        setActiveReminderAlert(true);

        // Show native Notification if granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('⏱️ نهاية الوردية اليومية', {
            body: 'حان الوقت لتسجيل حضور وغياب ومستحقات الموظفين اليومية في النظام!',
            icon: settings.logo_base64 || undefined,
            dir: 'rtl'
          });
        }
      }
    }, 10000); // check every 10 seconds

    return () => {
      clearInterval(checkInterval);
      window.removeEventListener('trigger-test-reminder', handleTestReminder);
    };
  }, [reminderConfig, settings.logo_base64]);

  // General App States
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // -------------------------------------------------------------
  // Data Fetcher from Express Endpoints
  // -------------------------------------------------------------
  const fetchAllData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Settings
      const setRes = await fetch('/api/company-settings');
      if (setRes.ok) setSettings(await setRes.json());

      // 2. Customers
      const custRes = await fetch('/api/customers');
      if (custRes.ok) setCustomers(await custRes.json());

      // 3. Customer Fabrics
      const fabRes = await fetch('/api/customer-fabrics');
      if (fabRes.ok) setFabrics(await fabRes.json());

      // 4. Materials
      const matRes = await fetch('/api/materials');
      if (matRes.ok) setMaterials(await matRes.json());

      // 5. Materials transactions
      const matTxRes = await fetch('/api/materials/transactions');
      if (matTxRes.ok) setMaterialsTx(await matTxRes.json());

      // 6. Machines
      const macRes = await fetch('/api/machines');
      if (macRes.ok) setMachines(await macRes.json());

      // 7. Assignments
      const assignRes = await fetch('/api/machines/assignments');
      if (assignRes.ok) setAssignments(await assignRes.json());

      // 8. Production records
      const prodRes = await fetch('/api/production');
      if (prodRes.ok) setProductionRecords(await prodRes.json());

      // 9. Employees
      const empRes = await fetch('/api/employees');
      if (empRes.ok) setEmployees(await empRes.json());

      // 10. Attendance
      const attRes = await fetch('/api/attendance');
      if (attRes.ok) setAttendanceEntries(await attRes.json());

      // 11. Customer financial ledger transactions
      const ledgerRes = await fetch('/api/customers/ledger-transactions');
      if (ledgerRes.ok) setTransactions(await ledgerRes.json());

    } catch (err: any) {
      console.error(err);
      setErrorMsg('تعذر الاتصال بـ الخادم السيرفر لتحديث البيانات. يرجى إعادة التشغيل.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchAllData();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  // -------------------------------------------------------------
  // Enforce Role Restriction on Active Tab
  // -------------------------------------------------------------
  useEffect(() => {
    if (userRole === 'materials_manager' && activeTab !== 'materials') {
      setActiveTab('materials');
    } else if (userRole === 'production_supervisor' && activeTab !== 'production') {
      setActiveTab('production');
    } else if (userRole === 'sales' && !['dashboard', 'customers', 'fabrics', 'sales_invoice'].includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [userRole, activeTab]);

  // -------------------------------------------------------------
  // Callbacks for Customer Section
  // -------------------------------------------------------------
  const handleAddCustomer = async (name: string, phone: string, address: string, notes: string) => {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, address, notes, userRole })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطأ في إضافة العميل');
    }
    // Refresh
    await fetchAllData();
  };

  const handleAddReceipt = async (customerId: string, amount: number, notes: string, date: string) => {
    const res = await fetch('/api/receipts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customerId, amount, date: date, notes: notes, userRole, username: userRole })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطأ أثناء تسجيل المقبوضات');
    }
    await fetchAllData();
  };

  // -------------------------------------------------------------
  // Callbacks for Fabric Section
  // -------------------------------------------------------------
  const handleReceiveFabric = async (customerId: string, fabricType: string, rollsCount: number, totalYards: number, date: string, notes: string) => {
    const res = await fetch('/api/customer-fabrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customerId, fabric_type: fabricType, rolls_count: rollsCount, total_yards: totalYards, received_date: date, notes, userRole })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطأ أثناء تسجيل القماش');
    }
    await fetchAllData();
  };

  // -------------------------------------------------------------
  // Callbacks for Sales / Invoicing (Splitting Leftover / Fargha)
  // -------------------------------------------------------------
  const handleIssueInvoice = async (
    customerId: string,
    fabricId: string,
    yardsSold: number,
    pricePerYard: number,
    paidAmount: number,
    paymentType: 'cash' | 'credit' | 'partial',
    invoiceDate: string,
    notes: string
  ) => {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: customerId,
        fabric_id: fabricId,
        yards_sold: yardsSold,
        price_per_yard: pricePerYard,
        paid_amount: paidAmount,
        payment_type: paymentType,
        invoice_date: invoiceDate,
        notes,
        userRole,
        username: userRole
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل إصدار السند');
    }

    const payload = await res.json();
    await fetchAllData();
    return payload; // { invoice, leftover }
  };

  // -------------------------------------------------------------
  // Callbacks for Raw Materials Stock
  // -------------------------------------------------------------
  const handleAddMaterial = async (name: string, unit: 'kg' | 'piece', minAlertQty: number) => {
    const res = await fetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, unit, min_alert_qty: minAlertQty, userRole })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطأ في تعريف الصنف');
    }
    await fetchAllData();
  };

  const handleRecordMaterialTx = async (materialId: string, type: 'in' | 'out', quantity: number, date: string, notes: string) => {
    const res = await fetch('/api/materials/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        material_id: materialId,
        type,
        quantity,
        transaction_date: date,
        notes,
        userRole,
        username: userRole
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل تقييد المعاملة');
    }
    await fetchAllData();
  };

  // -------------------------------------------------------------
  // Callbacks for Production floor
  // -------------------------------------------------------------
  const handleAddMachine = async (name: string, code: string) => {
    const res = await fetch('/api/machines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, code, userRole })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطأ في تخرين الماكينة');
    }
    await fetchAllData();
  };

  const handleAssignMachine = async (machineId: string, username: string) => {
    const res = await fetch('/api/machines/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machine_id: machineId, username, userRole })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطأ في تعيين الماكينة');
    }
    await fetchAllData();
  };

  const handleRecordProduction = async (
    machineId: string,
    employeeId: string,
    receiverName: string,
    stitchesCount: number,
    panelsCount: number,
    workDate: string,
    shift: string
  ) => {
    const res = await fetch('/api/production/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        machine_id: machineId,
        employee_id: employeeId,
        receiver_name: receiverName,
        stitches_count: stitchesCount,
        panels_count: panelsCount,
        work_date: workDate,
        shift,
        userRole,
        username: userRole
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطأ في ترحيل تشغيل الوردية والإنتاج');
    }
    await fetchAllData();
  };

  // -------------------------------------------------------------
  // Callbacks for Employees (HR)
  // -------------------------------------------------------------
  const handleAddEmployee = async (name: string, monthlySalary: number, fixedDeparture: number, hireDate: string) => {
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, monthly_salary: monthlySalary, fixed_departure: fixedDeparture, hire_date: hireDate, userRole })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل تسجيل الموظف');
    }
    await fetchAllData();
  };

  const handleToggleEmployee = async (id: string) => {
    const res = await fetch(`/api/employees/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userRole })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطأ في تغيير تفعيل الحساب');
    }
    await fetchAllData();
  };

  const handleSaveAttendanceBatch = async (entries: Omit<AttendanceEntry, 'id'>[]) => {
    const res = await fetch('/api/attendance/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries, userRole })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطأ أثناء ترحيل حضور الموظفين');
    }
    await fetchAllData();
  };

  const fetchPayrollStatement = async (employeeId: string, month: string) => {
    const res = await fetch(`/api/payroll/statement?employee_id=${employeeId}&month=${month}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'فشل احتساب واسترجاع كشف الحساب والراتب');
    }
    return await res.json();
  };

  // -------------------------------------------------------------
  // Callbacks for Settings Update
  // -------------------------------------------------------------
  const handleUpdateSettings = async (newSettings: CompanySettings) => {
    const res = await fetch('/api/company-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newSettings, userRole })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'خطأ في حفظ الإعدادات');
    }
    await fetchAllData();
  };

  // Helper helper to handle clicking a dashboard metric to jump to tab with prefill
  const handleDashboardNavigate = (tab: string, prefill?: any) => {
    if (prefill) {
      setPrefillInvoice(prefill);
    } else {
      setPrefillInvoice(null);
    }
    setActiveTab(tab);
  };

  // Mobile bottom menu state
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  // -------------------------------------------------------------
  // UI Navigation Sidebar Tabs definitions based on permissions (FR-6.5)
  // -------------------------------------------------------------
  const navTabs = [
    { id: 'dashboard', label: 'الرئيسية والمؤشرات', icon: LayoutDashboard, perm: 'dashboard' },
    { id: 'customers', label: 'حسابات الزبائن والليدجر', icon: Users, perm: 'customers' },
    { id: 'fabrics', label: 'أقمشة الزبائن (المخزن)', icon: Layers, perm: 'fabrics' },
    { id: 'sales_invoice', label: 'إصدار سند بيع (فارغة)', icon: FileSpreadsheet, perm: 'sales_invoice' },
    { id: 'materials', label: 'مخزن المستلزمات والمواد', icon: ShoppingBag, perm: 'materials' },
    { id: 'production', label: 'تشغيل المكائن والصالة', icon: Activity, perm: 'production' },
    { id: 'employees', label: 'الحضور والرواتب (HR)', icon: UserCheck, perm: 'employees' },
    { id: 'settings', label: 'ترویسة وهُوية المعمل', icon: SettingsIcon, perm: 'settings' },
  ];

  const allowedTabs = navTabs.filter(tab => currentUser.permissions[tab.perm as keyof typeof currentUser.permissions]);

  // Handle automatic redirect if active tab becomes disallowed
  useEffect(() => {
    const isAllowed = currentUser.permissions[activeTab as keyof typeof currentUser.permissions] || 
                      (activeTab === 'sales_invoice' && currentUser.permissions.sales_invoice);
    if (!isAllowed) {
      const firstAllowed = navTabs.find(tab => currentUser.permissions[tab.perm as keyof typeof currentUser.permissions]);
      if (firstAllowed) {
        setActiveTab(firstAllowed.id);
      }
    }
  }, [activeUserId, currentUser, activeTab]);

  if (!isLoggedIn) {
    return (
      <LoginScreen 
        customUsers={customUsers} 
        onLoginSuccess={(userId, token) => {
          localStorage.setItem('erp_is_logged_in', 'true');
          localStorage.setItem('erp_auth_token', token);
          localStorage.setItem('erp_active_user_id', userId);
          (window as any).__activeToken = token;
          setActiveUserId(userId);
          setAuthToken(token);
          setIsLoggedIn(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col antialiased text-right" dir="rtl">
      
      {/* 1. Header Topbar Panel */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 shrink-0 no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-3">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            {settings.logo_base64 ? (
              <img 
                src={settings.logo_base64} 
                alt="Logo" 
                className="h-10 w-10 object-contain bg-white rounded-lg p-0.5"
              />
            ) : (
              <div className="h-10 w-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black shadow-xs">
                <Building size={20} />
              </div>
            )}
            <div>
              <h1 className="text-sm font-black tracking-tight">{settings.company_name}</h1>
              <p className="text-[10px] text-slate-400">نظام تخطيط موارد معمل التطريز المتكامل | Embroidery ERP</p>
            </div>
          </div>

          {/* Quick Info & Role Swapper (FR-1) */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="hidden sm:inline bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-bold">
              العنوان: {settings.address || 'اليمن'}
            </span>
            <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-bold">
              الهاتف: {settings.phone || 'غير مسجل'}
            </span>

            {/* Simulated Live Role Status */}
            <div className="flex items-center gap-1.5 bg-indigo-950 text-indigo-300 p-1.5 rounded-xl border border-indigo-800">
              <span className="text-[10px] text-indigo-400 font-bold px-1">الحساب النشط:</span>
              <span className="font-extrabold text-[11px] text-white bg-indigo-600 px-2 py-0.5 rounded-lg">
                {currentUser.fullName} ({currentUser.roleLabel})
              </span>
            </div>

            {/* Quick Refresh */}
            <button
              onClick={fetchAllData}
              title="تحديث البيانات فوراً"
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="تسجيل الخروج"
              className="bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline text-[11px]">خروج</span>
            </button>
          </div>

        </div>
      </header>

      {/* Role Swapper Simulator Tool */}
      {currentUser.id === 'u_admin' && (
        <RoleSelector 
          activeUserId={activeUserId}
          customUsers={customUsers}
          onUserSelect={(userId) => {
            setActiveUserId(userId);
            setMobileMoreOpen(false);
          }}
        />
      )}

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-5 p-4 min-h-0 pb-20 md:pb-4">
        
        {/* Sidebar Left Drawer (no-print) */}
        <aside className="md:w-64 bg-white rounded-3xl border border-slate-100 p-4 shadow-xs shrink-0 h-fit no-print hidden md:block">
          <div className="space-y-4">
            <div className="border-b border-slate-50 pb-2">
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
                      setPrefillInvoice(null);
                      setActiveTab(tab.id);
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <TabIcon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-slate-50 pt-3 hidden md:block">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[10px] text-slate-500 leading-normal space-y-1">
                <span className="font-extrabold block text-slate-700">دليل الصلاحيات الفعال:</span>
                <p>تخضع شاشات النظام والميزانيات لرقابة صارمة تضمن عدم تسرب معلومات كشف الرواتب، مسيرات العمال، وصناديق الحسابات لغير المدراء.</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Workspace Center Content (renders printable pages as full sheets) */}
        <main className="flex-1 min-h-0 bg-transparent print:p-0">
          
          {/* Active Shift-End Reminder Alert Banner */}
          {activeReminderAlert && (
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl p-4 md:p-5 shadow-lg border border-amber-400 mb-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse-short no-print">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 bg-white/20 rounded-xl flex items-center justify-center text-white">
                  <BellRing size={22} className="animate-bounce" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm">⏱️ تنبيه نهاية الوردية اليومية!</h3>
                  <p className="text-[11px] text-amber-50/90 leading-relaxed mt-0.5">
                    لقد انتهت الوردية اليومية للمعمل، حان الوقت لتسجيل حضور وغياب ومستحقات الموظفين اليومية في النظام لضمان حفظ الرواتب.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => {
                    setActiveTab('employees');
                    setActiveReminderAlert(false);
                  }}
                  className="bg-white text-orange-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-orange-50 transition-all shadow-xs cursor-pointer"
                >
                  سجل الحضور والغياب الآن 👈
                </button>
                <button
                  onClick={() => setActiveReminderAlert(false)}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  إغلاق ✕
                </button>
              </div>
            </div>
          )}
          
          {loading && (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500 text-xs border border-slate-100 shadow-xs no-print flex items-center justify-center gap-2">
              <RefreshCw size={16} className="animate-spin text-indigo-600" />
              <span>جاري تحميل بيانات معمل التطريز وحساب المعادلات...</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-bold mb-4 flex items-center gap-1.5 no-print">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          {/* Mount appropriate components */}
          {!loading && (
            <div className="bg-transparent">
              {activeTab === 'dashboard' && (
                <DashboardOverview
                  userRole={userRole}
                  customers={customers}
                  fabrics={fabrics}
                  materials={materials}
                  employees={employees}
                  productionRecords={productionRecords}
                  transactions={transactions}
                  onNavigateToTab={handleDashboardNavigate}
                />
              )}

              {activeTab === 'customers' && (
                <CustomersSection
                  userRole={userRole}
                  customers={customers}
                  fabrics={fabrics}
                  transactions={transactions}
                  companyName={settings.company_name}
                  companyPhone={settings.phone}
                  companyAddress={settings.address}
                  companyLogo={settings.logo_base64}
                  onAddCustomer={handleAddCustomer}
                  onAddReceipt={handleAddReceipt}
                  onNavigateToTab={handleDashboardNavigate}
                />
              )}

              {activeTab === 'fabrics' && (
                <FabricsSection
                  userRole={userRole}
                  customers={customers}
                  fabrics={fabrics}
                  onReceiveFabric={handleReceiveFabric}
                />
              )}

              {activeTab === 'sales_invoice' && (
                <SalesInvoiceSection
                  userRole={userRole}
                  customers={customers}
                  fabrics={fabrics}
                  prefilledInvoiceData={prefillInvoice}
                  onIssueInvoice={handleIssueInvoice}
                />
              )}

              {activeTab === 'materials' && (
                <MaterialsSection
                  userRole={userRole}
                  materials={materials}
                  transactions={materialsTx}
                  onAddMaterial={handleAddMaterial}
                  onRecordTx={handleRecordMaterialTx}
                />
              )}

              {activeTab === 'production' && (
                <ProductionSection
                  userRole={userRole}
                  machines={machines}
                  assignments={assignments}
                  productionRecords={productionRecords}
                  employees={employees}
                  onAddMachine={handleAddMachine}
                  onAssignMachine={handleAssignMachine}
                  onRecordProduction={handleRecordProduction}
                />
              )}

              {activeTab === 'employees' && (
                <EmployeesSection
                  userRole={userRole}
                  employees={employees}
                  attendanceEntries={attendanceEntries}
                  onAddEmployee={handleAddEmployee}
                  onToggleEmployee={handleToggleEmployee}
                  onSaveAttendanceBatch={handleSaveAttendanceBatch}
                  fetchPayrollStatement={fetchPayrollStatement}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsSection
                  userRole={userRole}
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  reminderConfig={reminderConfig}
                  onUpdateReminderConfig={setReminderConfig}
                  customUsers={customUsers}
                  onUpdateCustomUsers={setCustomUsers}
                />
              )}
            </div>
          )}

        </main>

      </div>

      {/* 4. Expert Mobile Bottom Navigation Bar (no-print) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/60 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-safe-bottom no-print">
        <div className="grid grid-flow-col auto-cols-fr h-16 items-center justify-center text-center">
          {(() => {
            const showMoreButton = allowedTabs.length > 4;
            const bottomBarTabs = showMoreButton ? allowedTabs.slice(0, 3) : allowedTabs;
            const overflowTabs = showMoreButton ? allowedTabs.slice(3) : [];
            return (
              <>
                {bottomBarTabs.map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = activeTab === tab.id && !mobileMoreOpen;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setMobileMoreOpen(false);
                        setPrefillInvoice(null);
                        setActiveTab(tab.id);
                      }}
                      className={`flex flex-col items-center justify-center gap-1 h-full w-full transition-all cursor-pointer ${
                        isActive ? 'text-indigo-600 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-indigo-50 text-indigo-600' : ''}`}>
                        <TabIcon size={20} />
                      </div>
                      <span className="text-[10px] truncate max-w-[75px]">{tab.label.split(' ')[0]}</span>
                    </button>
                  );
                })}

                {showMoreButton && (
                  <button
                    onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
                    className={`flex flex-col items-center justify-center gap-1 h-full w-full transition-all cursor-pointer ${
                      mobileMoreOpen ? 'text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <div className={`p-1 rounded-xl transition-all ${mobileMoreOpen ? 'bg-indigo-50 text-indigo-600' : ''}`}>
                      <MoreHorizontal size={20} />
                    </div>
                    <span className="text-[10px]">المزيد</span>
                  </button>
                )}

                {/* 5. Mobile Slide-Up bottom sheet menu (More menu) */}
                {mobileMoreOpen && (
                  <div className="md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity no-print animate-fade-in" onClick={() => setMobileMoreOpen(false)}>
                    <div 
                      className="absolute bottom-16 left-0 right-0 bg-white rounded-t-[32px] p-6 shadow-2xl border-t border-slate-100 animate-slide-up space-y-4 max-h-[70vh] overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <Menu size={16} className="text-indigo-600" />
                          تصفح أقسام المعمل الإضافية
                        </span>
                        <button onClick={() => setMobileMoreOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1">
                          إغلاق ✕
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3.5 pt-2">
                        {overflowTabs.map((overflowTab) => {
                          const OverflowIcon = overflowTab.icon;
                          const isTabActive = activeTab === overflowTab.id;
                          return (
                            <button
                              key={overflowTab.id}
                              onClick={() => {
                                setPrefillInvoice(null);
                                setActiveTab(overflowTab.id);
                                setMobileMoreOpen(false);
                              }}
                              className={`flex flex-col items-start p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                                isTabActive
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-black shadow-2xs'
                                  : 'bg-slate-50/50 border-slate-200/40 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <div className={`p-2 rounded-xl mb-2.5 shrink-0 ${isTabActive ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-100 shadow-2xs'}`}>
                                <OverflowIcon size={18} />
                              </div>
                              <span className="text-[11px] font-bold block">{overflowTab.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* 3. Footer Copyright Panel (no-print) */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-3 px-4 text-center text-[10px] shrink-0 no-print">
        <p>© 2026 {settings.company_name}. جميع الحقوق محفوظة لجهة العمل. نظام تخطيط الموارد الكلي للأقمشة والتطريز.</p>
      </footer>

    </div>
  );
}
