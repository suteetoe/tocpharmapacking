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
})
