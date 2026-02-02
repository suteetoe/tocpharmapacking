// Types for Picking List (ใบจัดสินค้า)

export interface PickingListItem {
  sku: string;
  productName: string;
  quantity: number;
  serialNumbers: string[];
  location: string;
  notes?: string;
}

export interface PickingListOrder {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerCode: string;
  orderDate: string;
  items: PickingListItem[];
  totalItems: number;
  totalQuantity: number;
  isComplete: boolean; // บันทึก serial number ครบถ้วนแล้ว
}

export interface PickingListData {
  orders: PickingListOrder[];
  generatedAt: string;
  generatedBy: string;
  filterDateFrom?: string;
  filterDateTo?: string;
}

export interface PickingListPrintOptions {
  title?: string;
  subtitle?: string;
  showSignatureSection?: boolean;
  preparedBy?: string;
  checkedBy?: string;
  deliveredBy?: string;
}

// API Response types
export interface PickingListApiResponse {
  success: boolean;
  data: PickingListOrder[];
  message?: string;
}

export interface PackingWithSerialsResponse {
  doc_no: string;
  trans_flag: number;
  doc_date: string | null;
  cust_code: string;
  total_amount: string;
  arCustomer: {
    code: string;
    name_1: string;
  };
  details: {
    roworder: number;
    item_code: string;
    item_name: string;
    qty: string;
    unit_code: string;
    is_serial_number: number;
    wh_code?: string;
    shelf_code?: string;
  }[];
  serialnumbers: {
    ic_code: string;
    serial_number: string;
    line_number: number;
    doc_line_number: number;
    wh_code?: string;
    shelf_code?: string;
  }[];
  isComplete: boolean;
  scannedCount: number;
  requiredCount: number;
}
