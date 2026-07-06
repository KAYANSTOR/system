import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, setLogLevel } from 'firebase/firestore';
import { 
  User, Customer, CustomerFabric, SalesInvoice, Receipt, 
  CustomerTransaction, Material, MaterialTransaction, Machine, 
  MachineAssignment, ProductionRecord, Employee, AttendanceEntry, CompanySettings 
} from '../types';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

// Initialize Firebase JS SDK for server-side persistence
let firestoreDb: any = null;
try {
  setLogLevel('error');
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const app = initializeApp(firebaseConfig);
    firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    console.log("Firebase initialized on the server successfully with database ID:", firebaseConfig.firestoreDatabaseId);
  } else {
    console.warn("firebase-applet-config.json not found, offline-only fallback will be used.");
  }
} catch (e) {
  console.error("Failed to initialize Firebase App:", e);
}

interface DatabaseSchema {
  users: User[];
  customers: Customer[];
  customer_fabrics: CustomerFabric[];
  sales_invoices: SalesInvoice[];
  receipts: Receipt[];
  customer_transactions: CustomerTransaction[];
  materials: Material[];
  material_transactions: MaterialTransaction[];
  machines: Machine[];
  machine_assignments: MachineAssignment[];
  production_records: (ProductionRecord & { attendance_entry_id?: string })[];
  employees: Employee[];
  attendance_entries: AttendanceEntry[];
  company_settings: CompanySettings;
}

const initialSettings: CompanySettings = {
  company_name: "معمل كيان سوفت للتطريز",
  phone: "777123456",
  address: "صنعاء - شارع الستين",
  logo_base64: "" // Start with empty, user can upload
};

// Seed initial users for testing
const initialUsers: User[] = [
  { id: 'u1', full_name: 'أبو أحمد (المدير العام)', username: 'admin', role: 'admin', is_active: true },
  { id: 'u2', full_name: 'علي المحاسب', username: 'sales', role: 'sales', is_active: true },
  { id: 'u3', full_name: 'محمد الخزنوي', username: 'materials', role: 'materials_manager', is_active: true },
  { id: 'u4', full_name: 'خالد مخزن الأقمشة', username: 'fabric', role: 'fabric_manager', is_active: true },
  { id: 'u5', full_name: 'عمر مشرف الصالة', username: 'production', role: 'production_supervisor', is_active: true },
];

const initialCustomers: Customer[] = [
  { id: 'c1', name: 'مؤسسة النخبة للملابس', phone: '771111111', address: 'صنعاء - باب اليمن', notes: 'عميل متميز، يسدد بنظام الدفعات', balance: 150000, created_at: '2026-06-01' },
  { id: 'c2', name: 'بوتيك الياسمين', phone: '772222222', address: 'تعز - شارع جمال', notes: 'تركيز على تطريز العبايات', balance: 0, created_at: '2026-06-05' },
  { id: 'c3', name: 'التاجر عبد الله الحربي', phone: '773333333', address: 'الحديدة - شارع الميناء', notes: 'أقمشة حرير وقطن', balance: 45000, created_at: '2026-06-10' },
];

const initialFabrics: CustomerFabric[] = [
  { id: 'f1', customer_id: 'c1', fabric_type: 'حرير هندي فاخر', rolls_count: 5, total_yards: 500, remaining_yards: 200, is_leftover: false, parent_fabric_id: null, received_date: '2026-06-15', notes: 'استلام الدفعة الأولى' },
  { id: 'f2', customer_id: 'c1', fabric_type: 'قطن مطرز أبيض', rolls_count: 3, total_yards: 300, remaining_yards: 300, is_leftover: false, parent_fabric_id: null, received_date: '2026-06-20', notes: 'لشغل جلابيات رمضان' },
  { id: 'f3', customer_id: 'c3', fabric_type: 'كتان ثقيل أسود', rolls_count: 2, total_yards: 200, remaining_yards: 50, is_leftover: false, parent_fabric_id: null, received_date: '2026-06-22', notes: 'شغل عينات جديدة' },
];

const initialMaterials: Material[] = [
  { id: 'm1', name: 'خرز ذهبي صغير 5 ملم', unit: 'kg', current_quantity: 45.5, min_alert_qty: 10 },
  { id: 'm2', name: 'خيط تطريز بوليستر أحمر', unit: 'piece', current_quantity: 120, min_alert_qty: 30 },
  { id: 'm3', name: 'زيت ماكينة تطريز فائق النقاء', unit: 'piece', current_quantity: 5, min_alert_qty: 2 },
  { id: 'm4', name: 'ترتر فضي لامع مضلع', unit: 'kg', current_quantity: 8.0, min_alert_qty: 15 }, // triggered warning
];

const initialEmployees: Employee[] = [
  { id: 'e1', name: 'أحمد صالح (مشغل ماكينة 1)', monthly_salary: 150000, fixed_departure: 2000, hire_date: '2025-01-01', is_active: true },
  { id: 'e2', name: 'سالم حسن (مساعد مشغل)', monthly_salary: 90000, fixed_departure: 1000, hire_date: '2025-03-15', is_active: true },
  { id: 'e3', name: 'فؤاد المقطري (فني صيانة وتطريز)', monthly_salary: 180000, fixed_departure: 3000, hire_date: '2024-06-01', is_active: true },
];

const initialMachines: Machine[] = [
  { id: 'mach1', name: 'ماكينة تطريز تاجيما اليابانية 20 رأس', code: 'TAJ-01', is_active: true },
  { id: 'mach2', name: 'ماكينة تطريز بارودان الصينية 12 رأس', code: 'BAR-02', is_active: true },
];

const initialAssignments: MachineAssignment[] = [
  { id: 'as1', machine_id: 'mach1', username: 'production', assigned_by: 'admin', assignment_date: '2026-06-01' }
];

const initialDatabase: DatabaseSchema = {
  users: initialUsers,
  customers: initialCustomers,
  customer_fabrics: initialFabrics,
  sales_invoices: [],
  receipts: [],
  customer_transactions: [
    { id: 't1', customer_id: 'c1', type: 'initial_balance', reference_id: 'init', amount: 150000, balance_after: 150000, notes: 'رصيد افتتاحي مستحق', date: '2026-06-01' },
    { id: 't2', customer_id: 'c3', type: 'initial_balance', reference_id: 'init', amount: 45000, balance_after: 45000, notes: 'رصيد افتتاحي مستحق', date: '2026-06-10' },
  ],
  materials: initialMaterials,
  material_transactions: [
    { id: 'mt1', material_id: 'm1', type: 'in', quantity: 50, transaction_date: '2026-06-12', notes: 'توريد كرتون أول', username: 'materials' },
    { id: 'mt2', material_id: 'm1', type: 'out', quantity: 4.5, transaction_date: '2026-06-15', notes: 'صرف لوردية الليل', username: 'materials' },
  ],
  machines: initialMachines,
  machine_assignments: initialAssignments,
  production_records: [],
  employees: initialEmployees,
  attendance_entries: [],
  company_settings: initialSettings
};

export class DatabaseManager {
  private static cachedDb: DatabaseSchema | null = null;
  private static savedHashes: { [key: string]: string } = {};

  private static loadFromFile(): DatabaseSchema {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(initialDatabase, null, 2), 'utf-8');
        return initialDatabase;
      }
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error("Error reading database file, returning initial schema:", e);
      return initialDatabase;
    }
  }

  private static load(): DatabaseSchema {
    if (this.cachedDb) {
      return this.cachedDb;
    }
    this.cachedDb = this.loadFromFile();
    return this.cachedDb;
  }

  private static save(db: DatabaseSchema) {
    this.cachedDb = db;
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (e) {
      console.error("Error saving database backup file:", e);
    }

    if (firestoreDb) {
      try {
        const keys = Object.keys(db) as (keyof DatabaseSchema)[];
        for (const key of keys) {
          const dataStr = JSON.stringify(db[key]);
          if (this.savedHashes[key] !== dataStr) {
            this.savedHashes[key] = dataStr;
            const docRef = doc(firestoreDb, 'erp_tables', key);
            setDoc(docRef, { data: db[key] }).catch((err) => {
              console.error(`Failed to save table ${key} to Firestore:`, err);
            });
          }
        }
      } catch (e) {
        console.error("Error queueing Firestore sync:", e);
      }
    }
  }

  public static async initialize(): Promise<DatabaseSchema> {
    if (this.cachedDb) return this.cachedDb;
    
    console.log("Initializing Database connection and loading from Firestore...");
    if (!firestoreDb) {
      console.warn("Firestore not available, using offline local database.");
      this.cachedDb = this.loadFromFile();
      return this.cachedDb;
    }

    try {
      const dbState: Partial<DatabaseSchema> = {};
      const keys: (keyof DatabaseSchema)[] = [
        'users', 'customers', 'customer_fabrics', 'sales_invoices', 'receipts',
        'customer_transactions', 'materials', 'material_transactions', 'machines',
        'machine_assignments', 'production_records', 'employees', 'attendance_entries',
        'company_settings'
      ];

      console.log(`Loading ${keys.length} ERP tables from Firestore...`);
      const loadPromises = keys.map(async (key) => {
        const docRef = doc(firestoreDb, 'erp_tables', key);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            dbState[key] = docSnap.data().data;
            this.savedHashes[key] = JSON.stringify(dbState[key]);
          } else {
            console.log(`Table '${key}' does not exist in Firestore, preparing seed data.`);
          }
        } catch (e) {
          console.error(`Error loading table '${key}' from Firestore:`, e);
        }
      });

      await Promise.all(loadPromises);

      let needsSave = false;
      const finalDb: DatabaseSchema = { ...initialDatabase };
      for (const key of keys) {
        if (dbState[key] !== undefined) {
          (finalDb as any)[key] = dbState[key];
        } else {
          needsSave = true;
          this.savedHashes[key] = JSON.stringify(initialDatabase[key]);
        }
      }

      this.cachedDb = finalDb;

      if (needsSave) {
        console.log("Saving initial database seed to Firestore...");
        this.save(finalDb);
      }

      console.log("Firestore Database loaded and synchronized successfully!");
      return finalDb;
    } catch (e) {
      console.error("Failed to fetch from Firestore, falling back to local file:", e);
      this.cachedDb = this.loadFromFile();
      return this.cachedDb;
    }
  }

  // --- Users ---
  static getUsers(): User[] {
    return this.load().users;
  }

  static createUser(user: Omit<User, 'id'>): User {
    const db = this.load();
    const newUser: User = {
      ...user,
      id: 'u_' + Date.now() + Math.random().toString(36).substring(2, 5)
    };
    db.users.push(newUser);
    this.save(db);
    return newUser;
  }

  static toggleUserStatus(userId: string): User | null {
    const db = this.load();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;
    db.users[userIndex].is_active = !db.users[userIndex].is_active;
    this.save(db);
    return db.users[userIndex];
  }

  // --- Customers ---
  static getCustomers(): Customer[] {
    return this.load().customers;
  }

  static createCustomer(customer: Omit<Customer, 'id' | 'balance' | 'created_at'>): Customer {
    const db = this.load();
    const newCustomer: Customer = {
      ...customer,
      id: 'c_' + Date.now(),
      balance: 0,
      created_at: new Date().toISOString().split('T')[0]
    };
    db.customers.push(newCustomer);
    this.save(db);
    return newCustomer;
  }

  static getCustomerTransactions(customerId: string): CustomerTransaction[] {
    return this.load().customer_transactions.filter(t => t.customer_id === customerId);
  }

  static getAllCustomerTransactions(): CustomerTransaction[] {
    return this.load().customer_transactions;
  }

  // --- Fabrics ---
  static getFabrics(customerId?: string): CustomerFabric[] {
    const db = this.load();
    if (customerId) {
      return db.customer_fabrics.filter(f => f.customer_id === customerId);
    }
    return db.customer_fabrics;
  }

  static receiveFabric(fabric: Omit<CustomerFabric, 'id' | 'remaining_yards' | 'is_leftover' | 'parent_fabric_id'>): CustomerFabric {
    const db = this.load();
    const newFabric: CustomerFabric = {
      ...fabric,
      id: 'f_' + Date.now(),
      remaining_yards: fabric.total_yards,
      is_leftover: false,
      parent_fabric_id: null
    };
    db.customer_fabrics.push(newFabric);
    this.save(db);
    return newFabric;
  }

  // --- Sales Invoices & "Leftover / Fargha" Logic ---
  static createSalesInvoice(invoice: Omit<SalesInvoice, 'id' | 'invoice_no' | 'total_amount' | 'remaining_amount'>): { invoice: SalesInvoice, leftover: CustomerFabric | null } {
    const db = this.load();
    
    // 1. Fetch fabric record
    const fabric = db.customer_fabrics.find(f => f.id === invoice.fabric_id);
    if (!fabric) {
      throw new Error("قماش العميل غير موجود!");
    }
    if (fabric.remaining_yards < invoice.yards_sold) {
      throw new Error("الكمية المطلوبة أكبر من رصيد القماش المتبقي!");
    }

    // 2. Perform the reduction
    const oldRemaining = fabric.remaining_yards;
    fabric.remaining_yards = oldRemaining - invoice.yards_sold;

    // 3. Leftover Logic ("الوارات المتبقية كفارغة")
    let leftoverFabric: CustomerFabric | null = null;
    if (fabric.remaining_yards > 0) {
      // Create a leftover record with state is_leftover = true (فارغة غير محتسبة)
      leftoverFabric = {
        id: 'f_' + Date.now() + '_left',
        customer_id: invoice.customer_id,
        fabric_type: `${fabric.fabric_type} (متبقي - فارغة)`,
        rolls_count: 1,
        total_yards: fabric.remaining_yards,
        remaining_yards: fabric.remaining_yards,
        is_leftover: true,
        parent_fabric_id: fabric.id,
        received_date: new Date().toISOString().split('T')[0],
        notes: `متبقي فارغ من الفاتورة رقم ${db.sales_invoices.length + 1}`
      };
      
      // Update original fabric remaining_yards to 0 since it is now split/transferred
      fabric.remaining_yards = 0;
      db.customer_fabrics.push(leftoverFabric);
    }

    // 4. Calculate invoice financial elements
    const total_amount = invoice.yards_sold * invoice.price_per_yard;
    const remaining_amount = total_amount - invoice.paid_amount;

    const invoiceNo = `INV-${Date.now().toString().substring(6)}`;
    const newInvoice: SalesInvoice = {
      ...invoice,
      id: 'inv_' + Date.now(),
      invoice_no: invoiceNo,
      total_amount,
      remaining_amount
    };
    db.sales_invoices.push(newInvoice);

    // 5. Update customer financial balance
    const customer = db.customers.find(c => c.id === invoice.customer_id);
    if (customer) {
      customer.balance += remaining_amount; // Remaining unpaid amount goes to debt
      
      // Add Customer Transaction Log
      const transaction: CustomerTransaction = {
        id: 't_' + Date.now(),
        customer_id: customer.id,
        type: 'sale',
        reference_id: newInvoice.id,
        amount: remaining_amount,
        balance_after: customer.balance,
        notes: `إشعار بيع رقم ${invoiceNo} لعدد ${invoice.yards_sold} وار بسعر ${invoice.price_per_yard} ريال. المدفوع ${invoice.paid_amount} ريال. المتبقي آجل.`,
        date: invoice.invoice_date
      };
      db.customer_transactions.push(transaction);
    }

    this.save(db);
    return { invoice: newInvoice, leftover: leftoverFabric };
  }

  // --- Receipts ---
  static createReceipt(receipt: Omit<Receipt, 'id' | 'receipt_no'>): Receipt {
    const db = this.load();

    const receiptNo = `REC-${Date.now().toString().substring(6)}`;
    const newReceipt: Receipt = {
      ...receipt,
      id: 'rec_' + Date.now(),
      receipt_no: receiptNo
    };
    db.receipts.push(newReceipt);

    // Update Customer financial balance
    const customer = db.customers.find(c => c.id === receipt.customer_id);
    if (customer) {
      customer.balance -= receipt.amount; // Deducts debt
      
      // Add Customer Transaction Log
      const transaction: CustomerTransaction = {
        id: 't_' + Date.now(),
        customer_id: customer.id,
        type: 'receipt',
        reference_id: newReceipt.id,
        amount: receipt.amount,
        balance_after: customer.balance,
        notes: `سند قبض رقم ${receiptNo} بمبلغ ${receipt.amount} ريال.`,
        date: receipt.receipt_date
      };
      db.customer_transactions.push(transaction);
    }

    this.save(db);
    return newReceipt;
  }

  // --- Materials ---
  static getMaterials(): Material[] {
    return this.load().materials;
  }

  static createMaterial(material: Omit<Material, 'id' | 'current_quantity'>): Material {
    const db = this.load();
    const newMaterial: Material = {
      ...material,
      id: 'm_' + Date.now(),
      current_quantity: 0
    };
    db.materials.push(newMaterial);
    this.save(db);
    return newMaterial;
  }

  static getMaterialTransactions(materialId?: string): (MaterialTransaction & { material_name?: string })[] {
    const db = this.load();
    const txs = db.material_transactions;
    const enriched = txs.map(tx => {
      const mat = db.materials.find(m => m.id === tx.material_id);
      return {
        ...tx,
        material_name: mat ? mat.name : 'مادة مجهولة'
      };
    });
    if (materialId) {
      return enriched.filter(t => t.material_id === materialId);
    }
    return enriched;
  }

  static recordMaterialIn(tx: Omit<MaterialTransaction, 'id' | 'type'>): MaterialTransaction {
    const db = this.load();
    const material = db.materials.find(m => m.id === tx.material_id);
    if (!material) {
      throw new Error("المادة غير موجودة!");
    }
    material.current_quantity += tx.quantity;

    const newTx: MaterialTransaction = {
      ...tx,
      id: 'mt_' + Date.now(),
      type: 'in'
    };
    db.material_transactions.push(newTx);
    this.save(db);
    return newTx;
  }

  static recordMaterialOut(tx: Omit<MaterialTransaction, 'id' | 'type'>): MaterialTransaction {
    const db = this.load();
    const material = db.materials.find(m => m.id === tx.material_id);
    if (!material) {
      throw new Error("المادة غير موجودة!");
    }
    if (material.current_quantity < tx.quantity) {
      throw new Error("الكمية المتوفرة غير كافية لإتمام الصرف!");
    }
    material.current_quantity -= tx.quantity;

    const newTx: MaterialTransaction = {
      ...tx,
      id: 'mt_' + Date.now(),
      type: 'out'
    };
    db.material_transactions.push(newTx);
    this.save(db);
    return newTx;
  }

  // --- Production & Machine Assignments ---
  static getMachines(): Machine[] {
    return this.load().machines;
  }

  static createMachine(machine: Omit<Machine, 'id' | 'is_active'>): Machine {
    const db = this.load();
    const newMachine: Machine = {
      ...machine,
      id: 'mach_' + Date.now(),
      is_active: true
    };
    db.machines.push(newMachine);
    this.save(db);
    return newMachine;
  }

  static getMachineAssignments(): (MachineAssignment & { machine_name?: string })[] {
    const db = this.load();
    return db.machine_assignments.map(as => {
      const mach = db.machines.find(m => m.id === as.machine_id);
      return {
        ...as,
        machine_name: mach ? mach.name : 'ماكينة مجهولة'
      };
    });
  }

  static assignMachine(assignment: Omit<MachineAssignment, 'id' | 'assignment_date' | 'assigned_by'>, assignedBy: string): MachineAssignment {
    const db = this.load();
    
    // De-assign existing for this machine if any
    db.machine_assignments = db.machine_assignments.filter(as => as.machine_id !== assignment.machine_id);

    const newAs: MachineAssignment = {
      ...assignment,
      id: 'as_' + Date.now(),
      assigned_by: assignedBy,
      assignment_date: new Date().toISOString().split('T')[0]
    };
    db.machine_assignments.push(newAs);
    this.save(db);
    return newAs;
  }

  static getProductionRecords(): (ProductionRecord & { machine_name?: string, employee_name?: string })[] {
    const db = this.load();
    return db.production_records.map(pr => {
      const mach = db.machines.find(m => m.id === pr.machine_id);
      const emp = db.employees.find(e => e.id === pr.employee_id);
      return {
        ...pr,
        machine_name: mach ? mach.name : 'ماكينة مجهولة',
        employee_name: emp ? emp.name : 'موظف مجهول'
      };
    });
  }

  /**
   * Complex Production Logging + Attendance Upsert Linkage
   */
  static recordProduction(record: Omit<ProductionRecord, 'id'>, username: string): ProductionRecord {
    const db = this.load();

    // 1. Verify employee exists and is active
    const employee = db.employees.find(e => e.id === record.employee_id);
    if (!employee) {
      throw new Error("الموظف المحدد غير موجود!");
    }
    if (!employee.is_active) {
      throw new Error("الموظف المحدد غير فعال حالياً!");
    }

    // 2. Find or Create/Update Attendance Entry for this employee on the work_date (UPSERT)
    // Registering production implies actual presence, so if not exists, create with 'present'
    let attendance = db.attendance_entries.find(ae => 
      ae.employee_id === record.employee_id && ae.entry_date === record.work_date
    );

    const formatDayOfWeek = (dateStr: string): string => {
      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      return days[new Date(dateStr).getDay()];
    };

    const prodNote = `تسجيل إنتاج: ${record.stitches_count} غرزة و ${record.panels_count} فرشة في وردية ${record.shift === 'day' ? 'النهار' : 'الليل'}`;

    if (!attendance) {
      attendance = {
        id: 'ae_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        employee_id: record.employee_id,
        entry_date: record.work_date,
        day_of_week: formatDayOfWeek(record.work_date),
        attendance: 'present',
        delay_minutes: 0,
        departure_amount: 0,
        overtime_amount: 0,
        advance_amount: 0,
        note: `تم تسجيل حضور تلقائي: ${prodNote}`
      };
      db.attendance_entries.push(attendance);
    } else {
      // Already exists, we append production note to note
      attendance.note = attendance.note 
        ? `${attendance.note} | ${prodNote}` 
        : `تم تحديث الحضور: ${prodNote}`;
    }

    // 3. Create Production Record linked to the attendance entry id
    const newProductionRecord: ProductionRecord & { attendance_entry_id?: string } = {
      ...record,
      id: 'pr_' + Date.now(),
      attendance_entry_id: attendance.id
    };

    db.production_records.push(newProductionRecord);
    this.save(db);
    return newProductionRecord;
  }

  // --- Employees & HR Attendance / Payroll ---
  static getEmployees(includeInactive = false): Employee[] {
    const db = this.load();
    if (includeInactive) return db.employees;
    return db.employees.filter(e => e.is_active);
  }

  static createEmployee(employee: Omit<Employee, 'id' | 'is_active'>): Employee {
    const db = this.load();
    const newEmp: Employee = {
      ...employee,
      id: 'emp_' + Date.now(),
      is_active: true
    };
    db.employees.push(newEmp);
    this.save(db);
    return newEmp;
  }

  static updateEmployee(id: string, updated: Omit<Employee, 'id'>): Employee | null {
    const db = this.load();
    const idx = db.employees.findIndex(e => e.id === id);
    if (idx === -1) return null;
    db.employees[idx] = { ...updated, id };
    this.save(db);
    return db.employees[idx];
  }

  static toggleEmployeeStatus(id: string): Employee | null {
    const db = this.load();
    const idx = db.employees.findIndex(e => e.id === id);
    if (idx === -1) return null;
    db.employees[idx].is_active = !db.employees[idx].is_active;
    this.save(db);
    return db.employees[idx];
  }

  static getAttendanceEntries(filters?: { employee_id?: string, start_date?: string, end_date?: string }): AttendanceEntry[] {
    const db = this.load();
    let list = db.attendance_entries;
    if (filters?.employee_id) {
      list = list.filter(ae => ae.employee_id === filters.employee_id);
    }
    if (filters?.start_date) {
      list = list.filter(ae => ae.entry_date >= filters.start_date!);
    }
    if (filters?.end_date) {
      list = list.filter(ae => ae.entry_date <= filters.end_date!);
    }
    return list;
  }

  /**
   * Batch Daily Log Upsert (الترحيل اليومي)
   */
  static saveAttendanceBatch(entries: Omit<AttendanceEntry, 'id'>[]): AttendanceEntry[] {
    const db = this.load();
    const saved: AttendanceEntry[] = [];

    for (const entry of entries) {
      // Find existing
      const existingIdx = db.attendance_entries.findIndex(ae => 
        ae.employee_id === entry.employee_id && ae.entry_date === entry.entry_date
      );

      if (existingIdx !== -1) {
        // Update existing
        db.attendance_entries[existingIdx] = {
          ...db.attendance_entries[existingIdx],
          ...entry
        };
        saved.push(db.attendance_entries[existingIdx]);
      } else {
        // Insert new
        const newAe: AttendanceEntry = {
          ...entry,
          id: 'ae_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5)
        };
        db.attendance_entries.push(newAe);
        saved.push(newAe);
      }
    }

    this.save(db);
    return saved;
  }

  // --- Company Settings ---
  static getSettings(): CompanySettings {
    return this.load().company_settings;
  }

  static updateSettings(settings: CompanySettings): CompanySettings {
    const db = this.load();
    db.company_settings = settings;
    this.save(db);
    return db.company_settings;
  }
}
