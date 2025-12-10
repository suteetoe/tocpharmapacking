import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Employee, InvoiceDetails, PackingConfirmationResponse, InvoiceApiResponse, SerialNumberData, SerialNumberResponse } from '../types';
import api from '../api/axios';
import { parseAIDataMatrix } from '../utils/barcode';

export const usePackingStore = defineStore('packing', () => {
    // State
    const currentStep = ref(1);
    const employee = ref<Employee | null>(null);
    const invoice = ref<InvoiceDetails | null>(null);
    const scannedSerials = ref<string[]>([]);
    const scannedItemsDetails = ref<SerialNumberData[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const successMessage = ref<string | null>(null);

    // Getters
    const totalTarget = computed(() => {
        return invoice.value?.items.reduce((sum, item) => {
            if (item.is_serial_number === 1) {
                return sum + item.quantity;
            }
            return sum;
        }, 0) || 0;
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
                    cust_code: response.data.cust_code,
                    trans_flag: response.data.trans_flag,
                    items: response.data.details.map(item => ({
                        product_id: item.item_code,
                        product_name: item.item_name,
                        quantity: parseInt(item.qty, 10) || 0,
                        is_serial_number: item.is_serial_number,
                        doc_line_number: item.line_number ?? item.roworder,
                        trans_flag: item.trans_flag,
                        doc_no: item.doc_no
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
            let response;
            const parsedBarcode = parseAIDataMatrix(serial);

            if (parsedBarcode) {
                response = await api.post<SerialNumberResponse>('/product/serial-by-ic-code', { 
                    ic_code: parsedBarcode.ic_code, 
                    serial_number: parsedBarcode.serial_number 
                });
            } else {
                response = await api.post<SerialNumberResponse>('/product/serial-number', { serial_number: serial });
            }
            
            if (response.data.success && response.data.data) {
                const scannedData = response.data.data;
                // Use ic_code from the wrapper object
                const invoiceItem = invoice.value?.items.find(item => item.product_id === scannedData.ic_code);

                if (!invoiceItem) {
                    throw new Error(`Product ${scannedData.ic_code} is not in this invoice.`);
                }

                if (invoiceItem.is_serial_number !== 1) {
                    throw new Error(`Product ${scannedData.ic_code} does not require serial number scanning.`);
                }

                // Check if this specific serial number has already been scanned (regardless of input format)
                const isSerialAlreadyScanned = scannedItemsDetails.value.some(
                    item => item.ic_code === scannedData.ic_code && item.serial_number === scannedData.serial_number
                );

                if (isSerialAlreadyScanned) {
                     throw new Error(`Serial number ${scannedData.serial_number} for product ${scannedData.ic_code} has already been scanned.`);
                }

                // Check if this specific product has reached its required quantity
                const totalRequiredForProduct = invoice.value?.items
                    .filter(item => item.product_id === scannedData.ic_code)
                    .reduce((sum, item) => sum + item.quantity, 0) || 0;

                const currentScannedForProduct = scannedItemsDetails.value
                    .filter(item => item.ic_code === scannedData.ic_code)
                    .length;

                if (currentScannedForProduct >= totalRequiredForProduct) {
                    throw new Error(`Product ${scannedData.ic_code} is already fully scanned (${currentScannedForProduct}/${totalRequiredForProduct}).`);
                }

                scannedSerials.value.push(serial);
                scannedItemsDetails.value.push(scannedData);
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

            // Clone items to track remaining quantity for assignment
            const remainingItems = invoice.value.items.map(item => ({
                ...item,
                remainingQty: item.quantity
            }));

            const serialsPayload = scannedSerials.value.map((serial, index) => {
                const itemDetail = scannedItemsDetails.value[index];
                
                if (!itemDetail) {
                    throw new Error(`Item details missing for serial ${serial}`);
                }

                // Find the first item with matching product_id and remaining quantity > 0
                const invoiceItemIndex = remainingItems.findIndex(item => 
                    item.product_id === itemDetail.ic_code && item.remainingQty > 0
                );
                
                if (invoiceItemIndex === -1) {
                     throw new Error(`Item details not found or fully scanned for serial ${serial} (Product: ${itemDetail.ic_code})`);
                }

                const invoiceItem = remainingItems[invoiceItemIndex];
                
                // Decrement remaining quantity
                if (invoiceItem) {
                    invoiceItem.remainingQty--;

                    return {
                        doc_no: invoiceItem.doc_no,
                        trans_flag: invoiceItem.trans_flag,
                        doc_line_number: invoiceItem.doc_line_number,
                        ic_code: itemDetail.ic_code,
                        serial_number: serial,
                        cust_code: invoice.value!.cust_code
                    };
                } else {
                    throw new Error(`Unexpected error: Invoice item not found at index ${invoiceItemIndex}`);
                }
            });

            const payload = {
                invoice_no: invoice.value.receipt_number,
                employee_code: employee.value.code,
                serials: serialsPayload
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
            const response = await api.get(`/invoice/packing/${encodeURIComponent(invoiceNo)}`);
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
