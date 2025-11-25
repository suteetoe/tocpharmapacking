import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Employee, InvoiceDetails, ICInventory, ProductScanResponse, PackingConfirmationResponse, InvoiceApiResponse } from '../types';
import api from '../api/axios';

export const usePackingStore = defineStore('packing', () => {
    // State
    const currentStep = ref(1);
    const employee = ref<Employee | null>(null);
    const invoice = ref<InvoiceDetails | null>(null);
    const scannedSerials = ref<string[]>([]);
    const scannedItemsDetails = ref<ICInventory[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const successMessage = ref<string | null>(null);

    // Getters
    const totalTarget = computed(() => {
        return invoice.value?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
    });

    const totalScanned = computed(() => scannedSerials.value.length);

    const isComplete = computed(() => {
        return totalScanned.value === totalTarget.value && totalTarget.value > 0;
    });

    // Actions
    async function validateEmployee(code: string) {
        loading.value = true;
        error.value = null;
        try {
            const response = await api.post<{ success: boolean, employee: Employee }>('/employee/validate-employee', { employee_id: code });
            
            if (response.data.success && response.data.employee) {
                employee.value = response.data.employee;
                return true;
            } else {
                throw new Error('Employee not found');
            }
        } catch (e: any) {
            error.value = e.response?.data?.message || e.message || 'Error validating employee';
            return false;
        } finally {
            loading.value = false;
        }
    }

    async function getInvoiceDetails(invoiceNo: string) {
        loading.value = true;
        error.value = null;
        try {
            const response = await api.post<InvoiceApiResponse>('/invoice/get-invoice-details', { invoice_no: invoiceNo });
            
            if (response.data && response.data.doc_no) {
                // Map API response to internal state
                invoice.value = {
                    receipt_number: response.data.doc_no,
                    customer_name: response.data.arCustomer?.name_1 || 'Unknown Customer',
                    items: response.data.details.map(item => ({
                        product_id: item.item_code,
                        product_name: item.item_name,
                        quantity: parseInt(item.qty, 10) || 0
                    }))
                };
                return true;
            } else {
                throw new Error('Invoice not found');
            }
        } catch (e: any) {
            error.value = e.response?.data?.message || e.message || 'Error fetching invoice';
            return false;
        } finally {
            loading.value = false;
        }
    }

    async function scanProduct(serial: string) {
        if (scannedSerials.value.includes(serial)) {
            error.value = `Serial ${serial} already scanned.`;
            return false;
        }
        
        if (totalScanned.value >= totalTarget.value) {
            error.value = 'All items have been scanned.';
            return false;
        }

        loading.value = true;
        error.value = null;
        try {
            const response = await api.post<ProductScanResponse>('/product/get-product-by-serial', { serial_number: serial });
            
            if (response.data.success && response.data.icInventory) {
                scannedSerials.value.push(serial);
                scannedItemsDetails.value.push(response.data.icInventory);
                return true;
            } else {
                throw new Error(response.data.message || 'Invalid Serial');
            }
        } catch (e: any) {
            error.value = e.response?.data?.message || e.message || 'Error scanning product';
            return false;
        } finally {
            loading.value = false;
        }
    }

    function removeSerial(serial: string) {
        const index = scannedSerials.value.indexOf(serial);
        if (index > -1) {
            scannedSerials.value.splice(index, 1);
            scannedItemsDetails.value.splice(index, 1);
        }
    }

    async function confirmPacking() {
        loading.value = true;
        try {
            if (!invoice.value || !employee.value) {
                throw new Error('Missing invoice or employee information');
            }

            const payload = {
                invoice_no: invoice.value.receipt_number,
                employee_code: employee.value.code,
                serials: scannedSerials.value
            };

            const response = await api.post<PackingConfirmationResponse>('/invoice/shipment-confirm', payload);
            
            if (response.data.success) {
                successMessage.value = 'Packing confirmed successfully!';
                return true;
            } else {
                throw new Error('Confirmation failed');
            }
        } catch (e: any) {
            error.value = e.response?.data?.message || e.message || 'Error confirming packing';
            return false;
        } finally {
            loading.value = false;
        }
    }

    async function getPackingPrintData(invoiceNo: string) {
        loading.value = true;
        error.value = null;
        try {
            const response = await api.get(`/invoice/packing/${invoiceNo}`);
            return response.data;
        } catch (e: any) {
            error.value = e.response?.data?.message || e.message || 'Error fetching print data';
            return null;
        } finally {
            loading.value = false;
        }
    }

    function reset() {
        currentStep.value = 1;
        employee.value = null;
        invoice.value = null;
        scannedSerials.value = [];
        scannedItemsDetails.value = [];
        error.value = null;
        successMessage.value = null;
    }

    function resetScanning() {
        scannedSerials.value = [];
        scannedItemsDetails.value = [];
        error.value = null;
        successMessage.value = null;
    }

    function changeInvoice() {
        currentStep.value = 1;
        invoice.value = null;
        scannedSerials.value = [];
        scannedItemsDetails.value = [];
        error.value = null;
        successMessage.value = null;
        // Employee is kept
    }

    return {
        currentStep,
        employee,
        invoice,
        scannedSerials,
        scannedItemsDetails,
        loading,
        error,
        successMessage,
        totalTarget,
        totalScanned,
        isComplete,
        validateEmployee,
        getInvoiceDetails,
        scanProduct,
        removeSerial,
        confirmPacking,
        getPackingPrintData,
        reset,
        resetScanning,
        changeInvoice
    };
});
