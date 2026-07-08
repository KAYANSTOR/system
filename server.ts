import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { DatabaseManager } from './src/server/db';
import { UserRole } from './src/types';
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

// Initialize GoogleGenAI client for Antigravity AI Insights
let aiClient: any = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Antigravity Core: Gemini client initialized successfully.");
  } catch (err) {
    console.error("Antigravity Core: Failed to initialize Gemini client:", err);
  }
} else {
  console.warn("Antigravity Core: GEMINI_API_KEY is not defined. AI insights will fallback to offline algorithmic rule-based insights.");
}

app.use(express.json({ limit: '10mb' }));

// --- API ROUTES FIRST ---

// 1. Auth Endpoint (Simplified for demonstration and ease of switching roles)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const users = DatabaseManager.getUsers();
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ error: 'اسم المستخدم غير موجود' });
  }

  // Easy login - password is "123" or same as username for dummy purposes
  if (password !== '123' && password !== username) {
    return res.status(401).json({ error: 'كلمة المرور خاطئة (استخدم 123 للتجربة)' });
  }

  if (!user.is_active) {
    return res.status(403).json({ error: 'هذا الحساب معطل حالياً' });
  }

  // Generate a mock JWT-like token (just base64 encoded user info)
  const token = Buffer.from(JSON.stringify({ id: user.id, username: user.username, role: user.role })).toString('base64');
  res.json({ token, user });
});

// Middleware to extract user from token
const requireAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'غير مصرح - الرجاء تسجيل الدخول' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'انتهت الجلسة أو التوكن غير صالح' });
  }
};

// Middleware for role-based protection
const requireRoles = (allowedRoles: UserRole[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'عذراً، لا تملك الصلاحية للقيام بهذا الإجراء' });
    }
    next();
  };
};

// --- USERS API ---
app.get('/api/users', requireAuth, requireRoles(['admin']), (req, res) => {
  res.json(DatabaseManager.getUsers());
});

app.post('/api/users', requireAuth, requireRoles(['admin']), (req, res) => {
  const { full_name, username, role } = req.body;
  if (!full_name || !username || !role) {
    return res.status(400).json({ error: 'الرجاء ملء جميع الحقول المطلوبة' });
  }
  try {
    const newUser = DatabaseManager.createUser({ full_name, username, role, is_active: true });
    res.status(201).json(newUser);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/users/:id/toggle', requireAuth, requireRoles(['admin']), (req, res) => {
  const updated = DatabaseManager.toggleUserStatus(req.params.id);
  if (!updated) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }
  res.json(updated);
});

// --- CUSTOMERS API ---
app.get('/api/customers', requireAuth, (req, res) => {
  res.json(DatabaseManager.getCustomers());
});

app.post('/api/customers', requireAuth, requireRoles(['admin']), (req, res) => {
  const { name, phone, address, notes } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'اسم العميل مطلوب' });
  }
  const customer = DatabaseManager.createCustomer({ name, phone: phone || '', address: address || '', notes: notes || '' });
  res.status(201).json(customer);
});

app.get('/api/customers/:id/transactions', requireAuth, (req, res) => {
  res.json(DatabaseManager.getCustomerTransactions(req.params.id));
});

// --- FABRICS API ---
app.get('/api/fabrics', requireAuth, (req, res) => {
  const { customerId } = req.query;
  res.json(DatabaseManager.getFabrics(customerId as string));
});

app.post('/api/fabrics', requireAuth, requireRoles(['admin']), (req, res) => {
  const { customer_id, fabric_type, rolls_count, total_yards, received_date, notes } = req.body;
  if (!customer_id || !fabric_type || !rolls_count || !total_yards) {
    return res.status(400).json({ error: 'الرجاء إدخال تفاصيل القماش كاملة' });
  }
  const fabric = DatabaseManager.receiveFabric({
    customer_id,
    fabric_type,
    rolls_count: Number(rolls_count),
    total_yards: Number(total_yards),
    received_date: received_date || new Date().toISOString().split('T')[0],
    notes: notes || ''
  });
  res.status(201).json(fabric);
});

// --- SALES INVOICES API (Leftover / Fargha Logic inside!) ---
app.post('/api/sales/invoice', requireAuth, requireRoles(['admin']), (req, res) => {
  const { customer_id, fabric_id, yards_sold, price_per_yard, paid_amount, payment_type, invoice_date, notes } = req.body;
  
  if (!customer_id || !fabric_id || !yards_sold || !price_per_yard || !payment_type) {
    return res.status(400).json({ error: 'الحقول المطلوبة غير مكتملة لإصدار الفاتورة' });
  }

  try {
    const result = DatabaseManager.createSalesInvoice({
      customer_id,
      fabric_id,
      yards_sold: Number(yards_sold),
      price_per_yard: Number(price_per_yard),
      paid_amount: Number(paid_amount || 0),
      payment_type,
      invoice_date: invoice_date || new Date().toISOString().split('T')[0],
      notes: notes || ''
    });
    res.status(201).json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// --- RECEIPTS API ---
app.post('/api/receipts', requireAuth, requireRoles(['admin']), (req, res) => {
  const { customer_id, amount, receipt_date, notes } = req.body;
  if (!customer_id || !amount) {
    return res.status(400).json({ error: 'الرجاء تحديد العميل والمبلغ' });
  }
  try {
    const receipt = DatabaseManager.createReceipt({
      customer_id,
      amount: Number(amount),
      receipt_date: receipt_date || new Date().toISOString().split('T')[0],
      notes: notes || ''
    });
    res.status(201).json(receipt);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// --- MATERIALS API ---
app.get('/api/materials', requireAuth, (req, res) => {
  res.json(DatabaseManager.getMaterials());
});

app.post('/api/materials', requireAuth, requireRoles(['admin']), (req, res) => {
  const { name, unit, min_alert_qty } = req.body;
  if (!name || !unit) {
    return res.status(400).json({ error: 'الاسم ووحدة القياس مطلوبان' });
  }
  const newMaterial = DatabaseManager.createMaterial({
    name,
    unit,
    min_alert_qty: Number(min_alert_qty || 0)
  });
  res.status(201).json(newMaterial);
});

app.get('/api/materials/movements', requireAuth, requireRoles(['admin', 'materials_manager']), (req, res) => {
  const { materialId } = req.query;
  res.json(DatabaseManager.getMaterialTransactions(materialId as string));
});

app.post('/api/materials/in', requireAuth, requireRoles(['admin']), (req, res) => {
  const { material_id, quantity, transaction_date, notes } = req.body;
  if (!material_id || !quantity) {
    return res.status(400).json({ error: 'الرجاء إدخال المادة والكمية الموردة' });
  }
  try {
    const tx = DatabaseManager.recordMaterialIn({
      material_id,
      quantity: Number(quantity),
      transaction_date: transaction_date || new Date().toISOString().split('T')[0],
      notes: notes || '',
      username: (req as any).user.username
    });
    res.status(201).json(tx);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/materials/out', requireAuth, requireRoles(['admin']), (req, res) => {
  const { material_id, quantity, transaction_date, notes } = req.body;
  if (!material_id || !quantity) {
    return res.status(400).json({ error: 'الرجاء إدخال المادة والكمية المصروفة' });
  }
  try {
    const tx = DatabaseManager.recordMaterialOut({
      material_id,
      quantity: Number(quantity),
      transaction_date: transaction_date || new Date().toISOString().split('T')[0],
      notes: notes || '',
      username: (req as any).user.username
    });
    res.status(201).json(tx);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// --- MACHINES & PRODUCTION API ---
app.get('/api/machines', requireAuth, (req, res) => {
  res.json(DatabaseManager.getMachines());
});

app.post('/api/machines', requireAuth, requireRoles(['admin']), (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: 'الاسم وكود الماكينة مطلوبان' });
  }
  const mach = DatabaseManager.createMachine({ name, code });
  res.status(201).json(mach);
});

app.get('/api/machines/assignments', requireAuth, (req, res) => {
  res.json(DatabaseManager.getMachineAssignments());
});

app.post('/api/machines/assign', requireAuth, requireRoles(['admin']), (req, res) => {
  const { machine_id, username } = req.body;
  if (!machine_id || !username) {
    return res.status(400).json({ error: 'الرجاء تحديد الماكينة والمشرف المسؤول' });
  }
  const assignment = DatabaseManager.assignMachine({ machine_id, username }, (req as any).user.username);
  res.json(assignment);
});

app.get('/api/production/records', requireAuth, (req, res) => {
  res.json(DatabaseManager.getProductionRecords());
});

app.post('/api/production/record', requireAuth, requireRoles(['admin']), (req, res) => {
  const { machine_id, employee_id, receiver_name, stitches_count, panels_count, work_date, shift } = req.body;
  if (!machine_id || !employee_id || !stitches_count || !panels_count || !receiver_name) {
    return res.status(400).json({ error: 'الرجاء تعبئة بيانات إنتاج الوردية بالكامل' });
  }
  try {
    const record = DatabaseManager.recordProduction({
      machine_id,
      employee_id,
      receiver_name,
      stitches_count: Number(stitches_count),
      panels_count: Number(panels_count),
      work_date: work_date || new Date().toISOString().split('T')[0],
      shift: shift || 'day',
      username: (req as any).user.username
    }, (req as any).user.username);
    res.status(201).json(record);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// --- EMPLOYEES API ---
app.get('/api/employees', requireAuth, (req, res) => {
  // Simple list accessible by all authenticated roles, but salary details only to admin/sales
  const list = DatabaseManager.getEmployees(true);
  const userRole = (req as any).user.role;
  if (userRole === 'admin') {
    res.json(list);
  } else {
    // Return simple list with salaries hidden for confidentiality
    res.json(list.map(e => ({ id: e.id, name: e.name, hire_date: e.hire_date, is_active: e.is_active, fixed_departure: 0, monthly_salary: 0 })));
  }
});

app.post('/api/employees', requireAuth, requireRoles(['admin']), (req, res) => {
  const { name, monthly_salary, fixed_departure, hire_date } = req.body;
  if (!name || !monthly_salary) {
    return res.status(400).json({ error: 'الاسم والراتب الشهري مطلوبان' });
  }
  const emp = DatabaseManager.createEmployee({
    name,
    monthly_salary: Number(monthly_salary),
    fixed_departure: Number(fixed_departure || 0),
    hire_date: hire_date || new Date().toISOString().split('T')[0]
  });
  res.status(201).json(emp);
});

app.put('/api/employees/:id', requireAuth, requireRoles(['admin']), (req, res) => {
  const { name, monthly_salary, fixed_departure, hire_date, is_active } = req.body;
  const updated = DatabaseManager.updateEmployee(req.params.id, {
    name,
    monthly_salary: Number(monthly_salary),
    fixed_departure: Number(fixed_departure || 0),
    hire_date,
    is_active
  });
  if (!updated) return res.status(404).json({ error: 'الموظف غير موجود' });
  res.json(updated);
});

app.post('/api/employees/:id/toggle', requireAuth, requireRoles(['admin']), (req, res) => {
  const updated = DatabaseManager.toggleEmployeeStatus(req.params.id);
  if (!updated) return res.status(404).json({ error: 'الموظف غير موجود' });
  res.json(updated);
});

// --- ATTENDANCE & PAYROLL API ---
app.get('/api/attendance', requireAuth, (req, res) => {
  const { employee_id, start_date, end_date } = req.query;
  res.json(DatabaseManager.getAttendanceEntries({
    employee_id: employee_id as string,
    start_date: start_date as string,
    end_date: end_date as string
  }));
});

app.post('/api/attendance/batch', requireAuth, requireRoles(['admin']), (req, res) => {
  const { entries } = req.body;
  if (!entries || !Array.isArray(entries)) {
    return res.status(400).json({ error: 'مصفوفة بيانات الحضور غير صالحة' });
  }
  try {
    const saved = DatabaseManager.saveAttendanceBatch(entries);
    res.json({ success: true, saved_count: saved.length, data: saved });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Endpoint to compute detailed employee payroll report for a date range (monthly statement)
 */
app.get('/api/payroll/statement', requireAuth, requireRoles(['admin']), (req, res) => {
  const { employee_id, month } = req.query; // month in format YYYY-MM
  if (!employee_id || !month) {
    return res.status(400).json({ error: 'يرجى تحديد الموظف والشهر المستهدف' });
  }

  const dbEmployees = DatabaseManager.getEmployees(true);
  const employee = dbEmployees.find(e => e.id === employee_id);
  if (!employee) {
    return res.status(404).json({ error: 'الموظف غير موجود' });
  }

  const startDate = `${month}-01`;
  const endDate = `${month}-31`; // safe bound for filter

  const entries = DatabaseManager.getAttendanceEntries({
    employee_id: employee_id as string,
    start_date: startDate,
    end_date: endDate
  });

  // Calculations:
  const monthlySalary = employee.monthly_salary;
  const dailyWage = monthlySalary / 30;
  const hourlyWage = dailyWage / 12;

  let attendanceDays = 0;
  let totalDelayMinutes = 0;
  let totalOvertimeAmount = 0;
  let totalDepartureAmount = 0; // صرفة
  let totalAdvanceAmount = 0; // سلفة
  let daysPresent = 0;
  let daysAbsent = 0;
  let daysHalfDay = 0;
  let daysHoliday = 0;

  entries.forEach(entry => {
    switch (entry.attendance) {
      case 'present':
        attendanceDays += 1;
        daysPresent += 1;
        break;
      case 'half_day':
        attendanceDays += 0.5;
        daysHalfDay += 1;
        break;
      case 'absent':
        attendanceDays += 0;
        daysAbsent += 1;
        break;
      case 'holiday':
        attendanceDays += 0; // Unpaid holidays according to spec, or modify as needed
        daysHoliday += 1;
        break;
    }
    totalDelayMinutes += entry.delay_minutes || 0;
    totalOvertimeAmount += Number(entry.overtime_amount || 0);
    totalDepartureAmount += Number(entry.departure_amount || 0);
    totalAdvanceAmount += Number(entry.advance_amount || 0);
  });

  const delayDeduction = (totalDelayMinutes / 60) * hourlyWage;
  
  // netSalary = (dailyWage * attendanceDays) + overtime - departure - advance - delayDeduction
  const grossEarned = dailyWage * attendanceDays;
  const netSalary = grossEarned + totalOvertimeAmount - totalDepartureAmount - totalAdvanceAmount - delayDeduction;

  res.json({
    employee: {
      id: employee.id,
      name: employee.name,
      monthly_salary: monthlySalary,
      fixed_departure: employee.fixed_departure
    },
    month,
    summary: {
      days_present: daysPresent,
      days_absent: daysAbsent,
      days_half_day: daysHalfDay,
      days_holiday: daysHoliday,
      attendance_days_credited: attendanceDays,
      total_delay_minutes: totalDelayMinutes,
      total_overtime: totalOvertimeAmount,
      total_departure: totalDepartureAmount,
      total_advance: totalAdvanceAmount,
      delay_deduction: Math.round(delayDeduction),
      gross_earned: Math.round(grossEarned),
      net_salary: Math.round(netSalary)
    },
    entries: entries.sort((a, b) => a.entry_date.localeCompare(b.entry_date))
  });
});

// --- COMPANY SETTINGS API & ALIASES ---
app.get('/api/settings', requireAuth, (req, res) => {
  res.json(DatabaseManager.getSettings());
});

app.put('/api/settings', requireAuth, requireRoles(['admin']), (req, res) => {
  const { company_name, phone, address, logo_base64 } = req.body;
  if (!company_name) {
    return res.status(400).json({ error: 'اسم الشركة مطلوب' });
  }
  const settings = DatabaseManager.updateSettings({ company_name, phone: phone || '', address: address || '', logo_base64: logo_base64 || '' });
  res.json(settings);
});

app.get('/api/company-settings', requireAuth, (req, res) => {
  res.json(DatabaseManager.getSettings());
});

app.post('/api/company-settings', requireAuth, requireRoles(['admin']), (req, res) => {
  const { company_name, phone, address, logo_base64 } = req.body;
  if (!company_name) {
    return res.status(400).json({ error: 'اسم الشركة مطلوب' });
  }
  const settings = DatabaseManager.updateSettings({ company_name, phone: phone || '', address: address || '', logo_base64: logo_base64 || '' });
  res.json(settings);
});

// --- CUSTOMER FABRICS ALIASES ---
app.get('/api/customer-fabrics', requireAuth, (req, res) => {
  const { customerId } = req.query;
  res.json(DatabaseManager.getFabrics(customerId as string));
});

app.post('/api/customer-fabrics', requireAuth, requireRoles(['admin', 'sales', 'fabric_manager']), (req, res) => {
  const { customer_id, fabric_type, rolls_count, total_yards, received_date, notes } = req.body;
  if (!customer_id || !fabric_type || !rolls_count || !total_yards) {
    return res.status(400).json({ error: 'الرجاء إدخال تفاصيل القماش كاملة' });
  }
  const fabric = DatabaseManager.receiveFabric({
    customer_id,
    fabric_type,
    rolls_count: Number(rolls_count),
    total_yards: Number(total_yards),
    received_date: received_date || new Date().toISOString().split('T')[0],
    notes: notes || ''
  });
  res.status(201).json(fabric);
});

// --- MATERIALS TRANSACTIONS ALIASES ---
app.get('/api/materials/transactions', requireAuth, (req, res) => {
  res.json(DatabaseManager.getMaterialTransactions());
});

app.post('/api/materials/transactions', requireAuth, requireRoles(['admin', 'materials_manager']), (req, res) => {
  const { material_id, type, quantity, transaction_date, notes } = req.body;
  if (!material_id || !quantity || !type) {
    return res.status(400).json({ error: 'الرجاء إدخال المادة والكمية ونوع الحركة' });
  }
  try {
    if (type === 'in') {
      const tx = DatabaseManager.recordMaterialIn({
        material_id,
        quantity: Number(quantity),
        transaction_date: transaction_date || new Date().toISOString().split('T')[0],
        notes: notes || '',
        username: (req as any).user.username
      });
      res.status(201).json(tx);
    } else if (type === 'out') {
      const tx = DatabaseManager.recordMaterialOut({
        material_id,
        quantity: Number(quantity),
        transaction_date: transaction_date || new Date().toISOString().split('T')[0],
        notes: notes || '',
        username: (req as any).user.username
      });
      res.status(201).json(tx);
    } else {
      res.status(400).json({ error: 'نوع الحركة غير معروف' });
    }
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// --- PRODUCTION ALIASES ---
app.get('/api/production', requireAuth, (req, res) => {
  res.json(DatabaseManager.getProductionRecords());
});

// --- SALES INVOICE ALIASES ---
app.post('/api/sales', requireAuth, requireRoles(['admin', 'sales']), (req, res) => {
  const { customer_id, fabric_id, yards_sold, price_per_yard, paid_amount, payment_type, invoice_date, notes } = req.body;
  
  if (!customer_id || !fabric_id || !yards_sold || !price_per_yard || !payment_type) {
    return res.status(400).json({ error: 'الحقول المطلوبة غير مكتملة لإصدار الفاتورة' });
  }

  try {
    const result = DatabaseManager.createSalesInvoice({
      customer_id,
      fabric_id,
      yards_sold: Number(yards_sold),
      price_per_yard: Number(price_per_yard),
      paid_amount: Number(paid_amount || 0),
      payment_type,
      invoice_date: invoice_date || new Date().toISOString().split('T')[0],
      notes: notes || ''
    });
    res.status(201).json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/sales/invoices', requireAuth, (req, res) => {
  res.json(DatabaseManager.getSalesInvoices());
});

// --- CUSTOMER FINANCIAL LEDGER TRANSACTIONS ---
app.get('/api/customers/ledger-transactions', requireAuth, (req, res) => {
  res.json(DatabaseManager.getAllCustomerTransactions());
});

// --- ANTIGRAVITY AI INSIGHTS ---
app.get('/api/antigravity/insights', requireAuth, async (req, res) => {
  try {
    const customers = DatabaseManager.getCustomers();
    const materials = DatabaseManager.getMaterials();
    const production = DatabaseManager.getProductionRecords();
    const machines = DatabaseManager.getMachines();

    // 1. Gather stats
    const totalDebt = customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);
    const lowMaterials = materials.filter(m => m.current_quantity <= m.min_alert_qty);
    const productionCount = production.length;
    const totalStitches = production.reduce((sum, p) => sum + p.stitches_count, 0);

    // Prepare metadata
    const erpSummary = {
      total_customers: customers.length,
      total_unpaid_debt: totalDebt,
      low_stock_items: lowMaterials.map(m => ({ name: m.name, qty: m.current_quantity, min: m.min_alert_qty, unit: m.unit })),
      production_logs_count: productionCount,
      total_stitches_embroidered: totalStitches,
      machines_count: machines.length,
    };

    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `يرجى تحليل حالة معمل التطريز الحالية وتوليد التوصيات: ${JSON.stringify(erpSummary)}`,
          config: {
            systemInstruction: "أنت المحرك الذكي الغيميني لمنصة Antigravity المدمجة في نظام كيان سوفت لـ ERP معامل التطريز. تقوم بتحليل بيانات المعمل الفعلية المرفقة وتوليد 3 توصيات ذكية، تنفيذية، وعملية باللغة العربية الفصحى لمساعدة صاحب العمل والمديرين على اتخاذ قرارات دقيقة. ركز على التنبيهات الحرجة مثل المواد التي توشك على النفاذ، تحسين كفاءة الإنتاج، وإدارة ديون العملاء بشكل ودي وحازم. تجنب تماماً العبارات التسويقية والزخارف غير اللازمة. اعرض التوصيات مباشرة بأسلوب مهني باستخدام ماركداون (Markdown).",
          }
        });

        if (response && response.text) {
          return res.json({ source: 'gemini', insights: response.text });
        }
      } catch (geminiError: any) {
        console.error("Failed to query Gemini API, falling back to algorithmic rules:", geminiError);
      }
    }

    // Algorithmic Fallback Insights (in perfect human Arabic, fully functional)
    let fallbackText = `### 💡 تحليلات الذكاء الاصطناعي السريعة (محرك Antigravity الخوارزمي)

1. **إدارة مخزون المواد المستعجلة:**
   `;
    if (lowMaterials.length > 0) {
      fallbackText += `يوجد نقص حرج في المواد التالية: **${lowMaterials.map(m => m.name).join('، ')}**. يُوصى بالتواصل مع الموردين فوراً لتفادي توقف المكائن أو تعطل إنتاج الطلبيات الجارية.`;
    } else {
      fallbackText += `مستويات المخزن آمنة لجميع المواد الأساسية والخيوط ولا يوجد نقص حرج في الوقت الحالي.`;
    }

    fallbackText += `\n\n2. **السيولة وديون العملاء:**\n   `;
    if (totalDebt > 100000) {
      fallbackText += `إجمالي الذمم المدينة المستحقة على العملاء يبلغ **${totalDebt.toLocaleString()} ريال**. يوصى بجدولة الدفعات وتقييد تسليم البضائع الآجلة لعملاء متميزين مثل **${customers.slice(0, 2).map(c => c.name).join(' أو ')}** حتى سداد الأرصدة المتراكمة وتحسين التدفق النقدي بالمعمل.`;
    } else {
      fallbackText += `معدل ديون العملاء تحت نطاق السيطرة والمخاطر منخفضة، مما يشير إلى التزام جيد بالتسديدات وسندات القبض.`;
    }

    fallbackText += `\n\n3. **تحسين أداء صالة الإنتاج:**\n   `;
    if (productionCount > 0) {
      fallbackText += `تم تسجيل **${productionCount} وردية عمل** بإجمالي غرز بلغ **${totalStitches.toLocaleString()} غرزة**. يوصى بمراجعة توزيع الفترات لضمان تحقيق كفاءة تشغيلية كاملة للمكائن الـ **${machines.length}** في المعمل لتخفيف العبء عن مشرف الوردية ومطابقة كشوفات إنتاج الموظفين بدقة مع سجلات الحضور اليومي لضمان حوافز عادلة.`;
    } else {
      fallbackText += `لم يتم تسجيل أي وردية إنتاج في الأيام الأخيرة. يرجى توجيه مشرف الصالة لتسجيل مخرجات المكائن اليومية وتكليفات الموظفين لتفعيل تقارير الكفاءة بشكل حقيقي.`;
    }

    res.json({ source: 'algorithmic', insights: fallbackText });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// --- VITE DEV OR PRODUCTION STATIC SERVER ---

const startServer = async () => {
  // Initialize persistent cloud database before handling client requests
  try {
    await DatabaseManager.initialize();
  } catch (err) {
    console.error("Critical error: Failed to initialize DatabaseManager:", err);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
