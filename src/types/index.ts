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
  is_serial_number: number;
  doc_line_number: number;
  trans_flag: number;
  doc_no: string;
}

export interface InvoiceDetails {
  receipt_number: string;
  customer_name: string;
  cust_code: string;
  trans_flag: number;
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
    line_number: number;
    item_code: string;
    item_name: string;
    qty: string;
    unit_code: string;
    price: string;
    discount: string;
    sum_amount: string;
    is_serial_number: number;
    icInventory: {
      code: string;
      name_1: string;
      ic_serial_no: number;
      is_pharma_serialization: number;
    };
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

export interface SerialNumberData {
  ic_code: string;
  serial_number: string;
  status: number;
  wh_code: string;
  shelf_code: string;
  icInventory: ICInventory;
}

export interface SerialNumberResponse {
  success: boolean;
  message: string;
  data: SerialNumberData;
}

export interface PackingConfirmationItem {
  doc_no: string;
  trans_flag: number;
  doc_line_number: number;
  ic_code: string;
  serial_number: string;
  cust_code: string;
}

export interface PackingConfirmationRequest {
  invoice_no: string;
  employee_code: string;
  serials: PackingConfirmationItem[];
}

export interface PackingConfirmationResponse {
  success: boolean;
  packing_id: number;
}
