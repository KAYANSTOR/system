/**
 * Shared Type Definitions for the Embroidery ERP and Employee Management system
 */

export type UserRole = 'admin' | 'sales' | 'materials_manager' | 'fabric_manager' | 'production_supervisor';

export interface User {
  id: string;
  full_name: string;
  username: string;
  role: UserRole;
  is_active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  balance: number; // positive means they owe money
  created_at: string;
}

export interface CustomerFabric {
  id: string;
  customer_id: string;
  fabric_type: string;
  rolls_count: number;
  total_yards: number;
  remaining_yards: number;
  is_leftover: boolean; // "fargha"
  parent_fabric_id: string | null;
  received_date: string;
  notes: string;
}

export interface SalesInvoice {
  id: string;
  invoice_no: string;
  customer_id: string;
  fabric_id: string;
  yards_sold: number;
  price_per_yard: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_type: 'cash' | 'credit' | 'partial';
  invoice_date: string;
  notes: string;
}

export interface Receipt {
  id: string;
  receipt_no: string;
  customer_id: string;
  amount: number;
  receipt_date: string;
  notes: string;
}

export interface CustomerTransaction {
  id: string;
  customer_id: string;
  type: 'sale' | 'receipt' | 'initial_balance';
  reference_id: string;
  amount: number;
  balance_after: number;
  notes: string;
  date: string;
}

export interface Material {
  id: string;
  name: string;
  unit: 'kg' | 'piece';
  current_quantity: number;
  min_alert_qty: number;
}

export interface MaterialTransaction {
  id: string;
  material_id: string;
  type: 'in' | 'out';
  quantity: number;
  transaction_date: string;
  notes: string;
  username: string; // user who performed this
}

export interface Machine {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export interface MachineAssignment {
  id: string;
  machine_id: string;
  username: string;
  assigned_by: string;
  assignment_date: string;
}

export interface ProductionRecord {
  id: string;
  machine_id: string;
  employee_id: string; // operator who worked
  receiver_name: string; // receiver of machine
  stitches_count: number;
  panels_count: number;
  work_date: string;
  shift: string;
  username: string; // logged by
}

export interface Employee {
  id: string;
  name: string;
  monthly_salary: number;
  fixed_departure: number; // default starting fixed deduction
  hire_date: string;
  is_active: boolean;
}

export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'holiday';

export interface AttendanceEntry {
  id: string;
  employee_id: string;
  entry_date: string; // YYYY-MM-DD
  day_of_week: string;
  attendance: AttendanceStatus;
  delay_minutes: number;
  departure_amount: number; // money taken during day (صرفة)
  overtime_amount: number; // Overtime bonus (إضافي)
  advance_amount: number; // Advance (سلفة)
  note: string;
  is_locked?: boolean;
}

export interface CompanySettings {
  company_name: string;
  phone: string;
  address: string;
  logo_base64: string; // raw base64 data URL
}

export interface CustomUser {
  id: string;
  fullName: string;
  username: string;
  roleLabel: string;
  permissions: {
    dashboard: boolean;
    customers: boolean;
    fabrics: boolean;
    sales_invoice: boolean;
    materials: boolean;
    production: boolean;
    employees: boolean;
    settings: boolean;
  };
}

