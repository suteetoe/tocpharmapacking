import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePackingStore } from '../packing'
import api from '../../api/axios'

// Mock the api module
vi.mock('../../api/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn()
  }
}))

describe('Packing Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with correct default values', () => {
    const store = usePackingStore()
    expect(store.currentStep).toBe(1)
    expect(store.employee).toBeNull()
    expect(store.invoice).toBeNull()
    expect(store.scannedSerials).toEqual([])
  })

  it('validates employee successfully', async () => {
    const store = usePackingStore()
    const mockEmployee = { id: '1', code: 'EMP001', name: 'John Doe' }
    
    // Setup mock response
    ;(api.post as any).mockResolvedValue({
      data: { success: true, employee: mockEmployee }
    })

    const result = await store.validateEmployee('EMP001')
    
    expect(result).toBe(true)
    expect(store.employee).toEqual(mockEmployee)
    expect(api.post).toHaveBeenCalledWith('/employee/validate-employee', { employee_id: 'EMP001' })
  })

  it('handles employee validation failure', async () => {
    const store = usePackingStore()
    
    // Setup mock response for failure
    ;(api.post as any).mockRejectedValue({
      response: { data: { message: 'Employee not found' } }
    })

    const result = await store.validateEmployee('INVALID')
    
    expect(result).toBe(false)
    expect(store.employee).toBeNull()
    expect(store.error).toBe('Employee not found')
  })

  it('confirms packing with correct payload mapping', async () => {
    const store = usePackingStore()
    
    // 1. Setup Mock Data for Invoice API Response (matching Swagger/Spec)
    const mockInvoiceApiResponse = {
        doc_no: 'INV-001',
        trans_flag: 1,
        doc_date: '2023-11-26',
        cust_code: 'CUST001',
        total_amount: '1000',
        arCustomer: {
            code: 'CUST001',
            name_1: 'Test Customer'
        },
        details: [
            {
                roworder: 1,
                doc_no: 'INV-001',
                trans_flag: 1,
                line_number: 10,
                item_code: 'PROD-A',
                item_name: 'Product A',
                qty: '1.00',
                unit_code: 'PCS',
                price: '100',
                discount: '0',
                sum_amount: '100',
                is_serial_number: 1,
                icInventory: {
                    code: 'PROD-A',
                    name_1: 'Product A',
                    ic_serial_no: 1,
                    is_pharma_serialization: 1
                }
            },
            {
                roworder: 2,
                doc_no: 'INV-001',
                trans_flag: 1,
                line_number: 20,
                item_code: 'PROD-B',
                item_name: 'Product B',
                qty: '1.00',
                unit_code: 'PCS',
                price: '100',
                discount: '0',
                sum_amount: '100',
                is_serial_number: 1,
                icInventory: {
                    code: 'PROD-B',
                    name_1: 'Product B',
                    ic_serial_no: 1,
                    is_pharma_serialization: 1
                }
            }
        ]
    }

    // Mock Employee
    store.employee = { code: 'EMP001', name: 'John Doe' } as any

    // Mock API responses
    ;(api.post as any).mockImplementation(async (url: string, _data: any) => {
        if (url === '/invoice/get-invoice-details') {
            return { data: mockInvoiceApiResponse }
        }
        if (url === '/invoice/shipment-confirm') {
            return { data: { success: true } }
        }
        return { data: {} }
    })

    // 2. Execute getInvoiceDetails to populate store state from API response
    await store.getInvoiceDetails('INV-001')

    // 3. Simulate Scanned Items (Manually setting state to skip scanProduct logic for this test)
    store.scannedSerials = ['SN-A-001', 'SN-B-001']
    store.scannedItemsDetails = [
        { ic_code: 'PROD-A', serial_number: 'SN-A-001' } as any,
        { ic_code: 'PROD-B', serial_number: 'SN-B-001' } as any
    ]

    // 4. Execute confirmPacking
    const result = await store.confirmPacking()

    // 5. Verify Result
    expect(result).toBe(true)
    expect(store.successMessage).toBe('Packing confirmed successfully!')
    
    // 6. Verify Payload Mapping logic
    const expectedPayload = {
        invoice_no: 'INV-001',
        employee_code: 'EMP001',
        serials: [
            {
                doc_no: 'INV-001',
                trans_flag: 1,
                doc_line_number: 10,
                ic_code: 'PROD-A',
                serial_number: 'SN-A-001',
                cust_code: 'CUST001'
            },
            {
                doc_no: 'INV-001',
                trans_flag: 1,
                doc_line_number: 20,
                ic_code: 'PROD-B',
                serial_number: 'SN-B-001',
                cust_code: 'CUST001'
            }
        ]
    }

    expect(api.post).toHaveBeenCalledWith('/invoice/shipment-confirm', expectedPayload)
  })

  it('handles same product in multiple lines correctly', async () => {
    const store = usePackingStore()
    
    const mockInvoiceApiResponse = {
        doc_no: 'INV-002',
        trans_flag: 1,
        doc_date: '2023-11-26',
        cust_code: 'CUST001',
        total_amount: '200',
        arCustomer: { code: 'CUST001', name_1: 'Test Customer' },
        details: [
            {
                roworder: 1,
                doc_no: 'INV-002',
                trans_flag: 1,
                line_number: 10,
                item_code: 'PROD-A',
                item_name: 'Product A',
                qty: '1.00',
                unit_code: 'PCS',
                price: '100',
                discount: '0',
                sum_amount: '100',
                is_serial_number: 1,
                icInventory: { code: 'PROD-A', name_1: 'Product A', ic_serial_no: 1, is_pharma_serialization: 1 }
            },
            {
                roworder: 2,
                doc_no: 'INV-002',
                trans_flag: 1,
                line_number: 20,
                item_code: 'PROD-A', // Same Product
                item_name: 'Product A',
                qty: '1.00',
                unit_code: 'PCS',
                price: '100',
                discount: '0',
                sum_amount: '100',
                is_serial_number: 1,
                icInventory: { code: 'PROD-A', name_1: 'Product A', ic_serial_no: 1, is_pharma_serialization: 1 }
            }
        ]
    }

    store.employee = { code: 'EMP001', name: 'John Doe' } as any

    ;(api.post as any).mockImplementation(async (url: string, _data: any) => {
        if (url === '/invoice/get-invoice-details') return { data: mockInvoiceApiResponse }
        if (url === '/invoice/shipment-confirm') return { data: { success: true } }
        return { data: {} }
    })

    await store.getInvoiceDetails('INV-002')

    // Scan 2 serials for PROD-A
    store.scannedSerials = ['SN-A-1', 'SN-A-2']
    store.scannedItemsDetails = [
        { ic_code: 'PROD-A', serial_number: 'SN-A-1' } as any,
        { ic_code: 'PROD-A', serial_number: 'SN-A-2' } as any
    ]

    await store.confirmPacking()

    const callArgs = (api.post as any).mock.calls.find((call: any[]) => call[0] === '/invoice/shipment-confirm')[1]
    const serials = callArgs.serials
    
    // Expect serials to be distributed across lines 10 and 20
    const lineNumbers = serials.map((s: any) => s.doc_line_number)
    expect(lineNumbers).toContain(10)
    expect(lineNumbers).toContain(20)
  })

  it('prevents scanning more items than required for a specific product (over-scanning)', async () => {
    const store = usePackingStore()
    
    const mockInvoiceApiResponse = {
        doc_no: 'INV-003',
        trans_flag: 1,
        doc_date: '2023-11-26',
        cust_code: 'CUST001',
        total_amount: '500',
        arCustomer: { code: 'CUST001', name_1: 'Test Customer' },
        details: [
            {
                roworder: 1,
                doc_no: 'INV-003',
                trans_flag: 1,
                line_number: 10,
                item_code: 'PROD-A',
                item_name: 'Product A',
                qty: '2.00',
                unit_code: 'PCS',
                price: '100',
                discount: '0',
                sum_amount: '200',
                is_serial_number: 1,
                icInventory: { code: 'PROD-A', name_1: 'Product A', ic_serial_no: 1, is_pharma_serialization: 1 }
            },
            {
                roworder: 2,
                doc_no: 'INV-003',
                trans_flag: 1,
                line_number: 20,
                item_code: 'PROD-B',
                item_name: 'Product B',
                qty: '3.00',
                unit_code: 'PCS',
                price: '100',
                discount: '0',
                sum_amount: '300',
                is_serial_number: 1,
                icInventory: { code: 'PROD-B', name_1: 'Product B', ic_serial_no: 1, is_pharma_serialization: 1 }
            }
        ]
    }

    store.employee = { code: 'EMP001', name: 'John Doe' } as any

    ;(api.post as any).mockImplementation(async (url: string, data: any) => {
        if (url === '/invoice/get-invoice-details') return { data: mockInvoiceApiResponse }
        if (url === '/product/serial-number') {
            // Mock response for serial number scan
            // We need to return data that matches the product we are scanning
            const serial = data.serial_number;
            let ic_code = 'PROD-B'; // Default to B for this test
            if (serial.includes('A')) ic_code = 'PROD-A';
            
            return {
                data: {
                    success: true,
                    data: {
                        ic_code: ic_code,
                        serial_number: serial,
                        status: 1,
                        wh_code: 'WH1',
                        shelf_code: 'S1',
                        icInventory: { code: ic_code, name_1: 'Product ' + ic_code.split('-')[1], ic_serial_no: 1, is_pharma_serialization: 1 }
                    }
                }
            }
        }
        return { data: {} }
    })

    await store.getInvoiceDetails('INV-003')

    // Scan PROD-B 3 times (Allowed)
    expect(await store.scanProduct('SN-B-1')).toBe(true)
    expect(await store.scanProduct('SN-B-2')).toBe(true)
    expect(await store.scanProduct('SN-B-3')).toBe(true)

    // Try to scan 4th PROD-B (Should fail)
    expect(await store.scanProduct('SN-B-4')).toBe(false)
    expect(store.error).toMatch(/already fully scanned/)
    
    // Verify state
    expect(store.scannedSerials.length).toBe(3)
  })

  it('fetches print data with encoded invoice number', async () => {
    const store = usePackingStore()
    const invoiceNo = 'R6811/80003'
    const mockPrintData = { invoice_no: invoiceNo, items: [] }

    ;(api.get as any).mockResolvedValue({
      data: mockPrintData
    })

    const result = await store.getPackingPrintData(invoiceNo)

    expect(result).toEqual(mockPrintData)
    expect(api.get).toHaveBeenCalledWith(`/invoice/packing/${encodeURIComponent(invoiceNo)}`)
  })
})
