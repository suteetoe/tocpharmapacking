<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import api from '../../api/axios';
import type { PackingWithSerialsResponse } from '../../types/pickingList';

const toast = useToast();

// State
const packings = ref<PackingWithSerialsResponse[]>([]);
const loading = ref(false);

// Filters
const filters = ref({
    invoiceNo: '',
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    onlyCompleted: true
});

// Computed
const filteredPackings = computed(() => {
    let result = packings.value;

    if (filters.value.invoiceNo) {
        const searchTerm = filters.value.invoiceNo.toLowerCase();
        result = result.filter(p =>
            p.doc_no.toLowerCase().includes(searchTerm)
        );
    }

    return result;
});

// Helper function to download PDF from API with proper browser handling
const downloadPdfFromApi = async (invoiceNo: string): Promise<boolean> => {
    try {
        const response = await api.get(`/invoice/packing/${encodeURIComponent(invoiceNo)}/pdf`, {
            responseType: 'blob'
        });

        // Create blob with explicit MIME type for proper download handling
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);

        // Create hidden download link
        const link = document.createElement('a');
        link.href = url;
        const filename = `Packing_${invoiceNo}_${new Date().toISOString().split('T')[0]}.pdf`;
        link.setAttribute('download', filename);
        link.style.display = 'none';
        document.body.appendChild(link);

        // Trigger download
        link.click();

        // Cleanup after a short delay to ensure download starts
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);

        return true;
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to download PDF',
            life: 3000
        });
        return false;
    }
};

// Methods
const fetchPackings = async () => {
    loading.value = true;
    try {
        const params = new URLSearchParams();

        if (filters.value.dateFrom) {
            params.append('date_from', filters.value.dateFrom.toISOString().split('T')[0]!);
        }
        if (filters.value.dateTo) {
            params.append('date_to', filters.value.dateTo.toISOString().split('T')[0]!);
        }
        if (filters.value.invoiceNo) {
            params.append('invoice_no', filters.value.invoiceNo);
        }
        params.append('only_completed', filters.value.onlyCompleted.toString());

        const response = await api.get(`/invoice/completed-packings?${params.toString()}`);

        if (response.data.success) {
            packings.value = response.data.data;
        }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to fetch packings',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const clearFilters = () => {
    filters.value = {
        invoiceNo: '',
        dateFrom: null,
        dateTo: null,
        onlyCompleted: true
    };
    fetchPackings();
};

const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH');
};

const getStatusSeverity = (isComplete: boolean) => {
    return isComplete ? 'success' : 'warning';
};

const getStatusLabel = (isComplete: boolean) => {
    return isComplete ? 'บันทึกครบถ้วน' : 'รอดำเนินการ';
};

const printSinglePickingList = async (packing: PackingWithSerialsResponse) => {
    await downloadPdfFromApi(packing.doc_no);
};

const downloadSinglePickingList = async (packing: PackingWithSerialsResponse) => {
    await downloadPdfFromApi(packing.doc_no);
};

// Initialize default dates to current month
const initializeDefaultDates = () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    filters.value.dateFrom = firstDayOfMonth;
    filters.value.dateTo = lastDayOfMonth;
};

onMounted(() => {
    initializeDefaultDates();
    fetchPackings();
});
</script>

<template>
    <div class="p-4">
        <Toast />

        <Card>
            <template #title>
                <span>ใบจัดสินค้า (Picking List)</span>
            </template>

            <template #content>
                <!-- Filters -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">เลขที่ Invoice</label>
                        <InputText
                            v-model="filters.invoiceNo"
                            placeholder="ค้นหา invoice..."
                            class="w-full"
                            @keyup.enter="fetchPackings"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-1">วันที่จาก</label>
                        <Calendar
                            v-model="filters.dateFrom"
                            dateFormat="yy-mm-dd"
                            placeholder="YYYY-MM-DD"
                            class="w-full"
                            :showIcon="true"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-1">วันที่ถึง</label>
                        <Calendar
                            v-model="filters.dateTo"
                            dateFormat="yy-mm-dd"
                            placeholder="YYYY-MM-DD"
                            class="w-full"
                            :showIcon="true"
                        />
                    </div>

                    <div class="flex items-end gap-2">
                        <Button
                            label="ค้นหา"
                            icon="pi pi-search"
                            @click="fetchPackings"
                        />
                        <Button
                            label="ล้าง"
                            icon="pi pi-times"
                            severity="secondary"
                            @click="clearFilters"
                        />
                    </div>
                </div>

                <!-- Data Table -->
                <DataTable
                    :value="filteredPackings"
                    :loading="loading"
                    dataKey="doc_no"
                    paginator
                    :rows="10"
                    :rowsPerPageOptions="[10, 25, 50]"
                    stripedRows
                    removableSort
                    class="p-datatable-sm"
                >
                    <template #empty>
                        <div class="text-center py-8 text-gray-500">
                            <i class="pi pi-inbox text-4xl mb-2"></i>
                            <p>ไม่พบรายการ</p>
                        </div>
                    </template>

                    <template #loading>
                        <div class="flex items-center justify-center py-8">
                            <ProgressSpinner style="width: 50px; height: 50px" />
                        </div>
                    </template>

                    <Column field="doc_no" header="เลขที่ Invoice" sortable>
                        <template #body="{ data }">
                            <span class="font-mono font-medium">{{ data.doc_no }}</span>
                        </template>
                    </Column>

                    <Column field="doc_date" header="วันที่" sortable>
                        <template #body="{ data }">
                            {{ formatDate(data.doc_date) }}
                        </template>
                    </Column>

                    <Column field="arCustomer.name_1" header="ลูกค้า" sortable>
                        <template #body="{ data }">
                            <div>
                                <div class="font-medium">{{ data.arCustomer?.name_1 || '-' }}</div>
                                <div class="text-sm text-gray-500">{{ data.cust_code }}</div>
                            </div>
                        </template>
                    </Column>

                    <Column field="isComplete" header="สถานะ" sortable>
                        <template #body="{ data }">
                            <Tag
                                :severity="getStatusSeverity(data.isComplete)"
                                :value="getStatusLabel(data.isComplete)"
                            />
                        </template>
                    </Column>

                    <Column field="scannedCount" header="Serial Numbers" sortable>
                        <template #body="{ data }">
                            <span :class="{ 'text-green-600 font-medium': data.isComplete, 'text-orange-500': !data.isComplete }">
                                {{ data.scannedCount }} / {{ data.requiredCount }}
                            </span>
                        </template>
                    </Column>

                    <Column header="Actions" style="width: 120px">
                        <template #body="{ data }">
                            <div class="flex gap-1">
                                <Button
                                    icon="pi pi-print"
                                    severity="secondary"
                                    text
                                    rounded
                                    size="small"
                                    @click="printSinglePickingList(data)"
                                    tooltip="Print"
                                />
                                <Button
                                    icon="pi pi-download"
                                    severity="secondary"
                                    text
                                    rounded
                                    size="small"
                                    @click="downloadSinglePickingList(data)"
                                    tooltip="Download"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>

                <!-- Summary -->
                <div class="mt-4 p-4 bg-gray-50 rounded-lg">
                    <span class="text-gray-600">รายการทั้งหมด:</span>
                    <span class="font-medium ml-1">{{ filteredPackings.length }}</span>
                </div>
            </template>
        </Card>
    </div>
</template>

<style scoped>
:deep(.p-datatable) {
    font-size: 0.875rem;
}

:deep(.p-datatable-tbody > tr > td) {
    padding: 0.75rem;
}
</style>
