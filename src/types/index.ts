export interface User {
  id: string;
  username: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface Employee {
  code: string;
  name: string;
}

export interface ProductItem {
  product_id: string;
  product_name: string;
  quantity: number;
}

export interface InvoiceDetails {
  receipt_number: string;
  customer_name: string;
  items: ProductItem[];
}

export interface InvoiceApiResponse {
  doc_no: string;
  trans_flag: number;
  doc_date: string;
  cust_code: string;
  total_amount: string;
  arCustomer: {
    code: string;
    name_1: string;
  };
  details: {
    roworder: number;
    doc_no: string;
    trans_flag: number;
    item_code: string;
    item_name: string;
    qty: string;
    unit_code: string;
    price: string;
    sum_amount: string;
    icInventory: any;
  }[];
}

export interface ICInventory {
  code: string;
  name_1: string;
  status: number;
  ic_serial_no: number;
  is_pharma_serialization: number;
}

export interface ProductScanResponse {
  success: boolean;
  message: string;
  icInventory?: ICInventory;
}

export interface PackingConfirmationRequest {
  invoice_no: string;
  employee_code: string;
  serials: string[];
}

export interface PackingConfirmationResponse {
  success: boolean;
  packing_id: number;
}
