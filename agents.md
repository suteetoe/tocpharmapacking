# TOC Pharma Packing System - Agent Documentation

## Project Overview

This is a **Vue 3 + TypeScript** warehouse management system for pharmaceutical packing operations. The application manages picking and packing workflows with serial number tracking for pharmaceutical products.

### Key Features
- **Authentication**: Login system with JWT token management
- **Packing Workflow**: 3-step process (Employee Setup → Serial Scanning → Confirmation)
- **Picking List Management**: View and print historical packing records
- **Barcode Parsing**: Parse AI Data Matrix barcodes (pharmaceutical serialization standard)
- **PDF Generation**: Generate packing slips and picking lists using pdfmake

---

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | Vue.js 3 (Composition API) |
| Language | TypeScript |
| Build Tool | Vite 7.x |
| State Management | Pinia 3.x |
| UI Components | PrimeVue 4.x |
| Styling | Tailwind CSS 3.x |
| HTTP Client | Axios |
| Testing | Vitest |
| PDF Generation | pdfmake |

### Package Manager
This project uses **pnpm** as the package manager.

---

## Project Structure

```
tocpharmapacking/
├── src/
│   ├── api/                    # API configuration
│   │   └── axios.ts            # Axios instance with interceptors
│   ├── assets/
│   │   └── fonts/              # Thai font (Sarabun) for PDF
│   ├── components/             # Reusable Vue components
│   ├── layouts/
│   │   └── MainLayout.vue      # Main app layout with sidebar
│   ├── router/
│   │   └── index.ts            # Vue Router configuration
│   ├── stores/                 # Pinia stores
│   │   ├── auth.ts             # Authentication state
│   │   ├── packing.ts          # Packing workflow state
│   │   └── __tests__/          # Store tests
│   ├── types/
│   │   ├── index.ts            # Core TypeScript interfaces
│   │   └── pickingList.ts      # Picking list types
│   ├── utils/
│   │   ├── barcode.ts          # Barcode/AI Data Matrix parser
│   │   ├── pickingListPdf.ts   # PDF generation utilities
│   │   └── __tests__/          # Utility tests
│   └── views/
│       ├── LoginView.vue       # Login page
│       ├── DashboardView.vue   # Dashboard
│       ├── picking/
│       │   └── PickingListView.vue    # Picking list management
│       └── packing/
│           ├── PackingView.vue        # Main packing container
│           ├── Step1Setup.vue         # Employee & invoice setup
│           ├── Step2Scanning.vue      # Serial number scanning
│           └── Step3Confirm.vue       # Confirmation & printing
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## Running the Application

### Install Dependencies
```bash
pnpm install
```

### Development Server
```bash
pnpm dev
```
Runs on `http://localhost:8080`

### Build for Production
```bash
pnpm build
```

### Run Tests
```bash
pnpm test
```

---

## Core Features

### 1. Authentication ([`src/stores/auth.ts`](src/stores/auth.ts))

Manages user login/logout with JWT token storage in localStorage.

**Key Functions:**
- `login(username, password)` - Authenticate user
- `logout()` - Clear session and redirect to login

### 2. Packing Workflow ([`src/stores/packing.ts`](src/stores/packing.ts))

The main store managing the 3-step packing process.

**Steps:**
1. **Step 1** - Validate employee and fetch invoice details
2. **Step 2** - Scan serial numbers with validation
3. **Step 3** - Confirm shipment and generate PDFs

**Key State:**
```typescript
currentStep: number          // 1, 2, or 3
employee: Employee | null   // Verified employee
invoice: InvoiceDetails     // Current invoice data
scannedSerials: string[]    // List of scanned serial numbers
scannedItemsDetails: SerialNumberData[]  // Detailed scan data
```

**Key Functions:**
- `validateEmployee(code)` - Verify employee ID
- `getInvoiceDetails(invoiceNo)` - Fetch invoice from API
- `scanProduct(serial)` - Scan and validate serial number
- `confirmPacking()` - Submit packed items to API
- `downloadPackingPdf(invoiceNo)` - Generate packing slip PDF

### 3. Barcode Parsing ([`src/utils/barcode.ts`](src/utils/barcode.ts))

Parses pharmaceutical AI Data Matrix barcodes in various formats:
- `(01)GTIN(21)SN` - With parentheses
- `01GTIN21SN` - Without parentheses
- Supports Group Separator (GS) characters

### 4. PDF Generation ([`src/utils/pickingListPdf.ts`](src/utils/pickingListPdf.ts))

Uses pdfmake to generate Thai-language PDF documents with:
- Picking List (ใบจัดสินค้า)
- Packing Slip
- Support for Sarabun Thai font

---

## API Integration

### Base Configuration ([`src/config.ts`](src/config.ts))

Environment variables:
- `VITE_API_URL` - Backend API base URL
- `VITE_APP_BASE_URL` - Application base path
- `VITE_APP_NAME` - Application name

### API Endpoints ([`src/api/axios.ts`](src/api/axios.ts))

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | User authentication |
| `/employee/validate-employee` | POST | Validate employee ID |
| `/invoice/get-invoice-details` | POST | Fetch invoice data |
| `/product/serial-number` | POST | Validate serial number |
| `/invoice/shipment-confirm` | POST | Confirm packing |
| `/invoice/completed-packings` | GET | Fetch packing history |
| `/invoice/packing/:invoiceNo/pdf` | GET | Generate packing PDF |

### Request Interceptors
- Automatically adds `Authorization: Bearer <token>` header
- Handles 401 responses by logging out user

---

## Type Definitions

### Core Types ([`src/types/index.ts`](src/types/index.ts))

```typescript
interface User {
  id: string;
  username: string;
  role: string;
}

interface InvoiceDetails {
  receipt_number: string;
  customer_name: string;
  cust_code: string;
  trans_flag: number;
  items: ProductItem[];
}

interface ProductItem {
  product_id: string;
  product_name: string;
  quantity: number;
  is_serial_number: number;
  doc_line_number: number;
  trans_flag: number;
  doc_no: string;
}
```

### Picking List Types ([`src/types/pickingList.ts`](src/types/pickingList.ts))

```typescript
interface PickingListOrder {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerCode: string;
  orderDate: string;
  items: PickingListItem[];
  totalItems: number;
  totalQuantity: number;
  isComplete: boolean;
  employeeCode?: string;
  employeeName?: string;
}
```

---

## Testing

### Test Files Location
- [`src/stores/__tests__/packing.spec.ts`](src/stores/__tests__/packing.spec.ts) - Store unit tests
- [`src/utils/__tests__/barcode.spec.ts`](src/utils/__tests__/barcode.spec.ts) - Utility tests

### Running Tests
```bash
pnpm test
```

### Test Coverage
```bash
pnpm test --coverage
```

---

## Important Implementation Notes

### Serial Number Scanning Flow
1. User scans barcode (supports AI Data Matrix format)
2. System validates serial against API
3. Checks for duplicates in current session
4. Verifies product is in current invoice
5. Validates quantity limits per product
6. Plays audio feedback (success/error tone)

### PDF Generation
- Uses Thai Sarabun font loaded from [`src/assets/fonts/vfs_fonts_th.ts`](src/assets/fonts/vfs_fonts_th.ts)
- Supports both A4 and thermal printer layouts
- Includes signature sections for warehouse workflows

### Dark Mode Support
- Toggle via sidebar button in [`src/layouts/MainLayout.vue`](src/layouts/MainLayout.vue)
- Uses CSS class `.app-dark` on HTML element

---

## Development Guidelines

### Adding New Features
1. Create new views in `src/views/`
2. Add store logic in `src/stores/` if state needed
3. Add TypeScript types in `src/types/`
4. Update router in `src/router/index.ts`

### API Changes
1. Update types in `src/types/index.ts`
2. Add API methods in `src/api/axios.ts`
3. Document new endpoints in swagger.json

### Testing Requirements
1. Write tests for new store actions
2. Test barcode parsing edge cases
3. Ensure PDF generation works with Thai characters

---

## Troubleshooting

### Common Issues

**Barcode not being parsed:**
- Check if barcode format matches supported patterns in [`src/utils/barcode.ts`](src/utils/barcode.ts)
- Verify Group Separator (GS) character handling

**PDF not displaying Thai characters:**
- Ensure Sarabun font is properly loaded
- Check [`src/utils/pickingListPdf.ts`](src/utils/pickingListPdf.ts) font configuration

**API calls returning 401:**
- Verify token is stored in localStorage
- Check interceptor in [`src/api/axios.ts`](src/api/axios.ts)

**Tests failing:**
- Ensure `vitest` is properly configured
- Check mock implementations match actual API responses
