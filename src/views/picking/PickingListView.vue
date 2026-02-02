<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import api from '../../api/axios';
import type { PackingWithSerialsResponse } from '../../types/pickingList';
import { generatePickingListPdf, downloadPdf, printPdf } from '../../utils/pickingListPdf';
import type { PickingListOrder, PickingListItem } from '../../types/pickingList';

const toast = useToast();

// State
const packings = ref<PackingWithSerialsResponse[]>([]);
const loading = ref(false);
const selectedPackings = ref<PackingWithSerialsResponse[]>([]);
const previewVisible = ref(false);
const previewUrl = ref('');

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

// Transform API response to PickingListOrder format
const transformToPickingListOrder = (packing: PackingWithSerialsResponse): PickingListOrder => {
  // Group items by SKU
  const itemMap = new Map<string, PickingListItem>();

  packing.details.forEach(detail => {
    const serials = packing.serialnumbers
      .filter(s => s.ic_code === detail.item_code)
      .map(s => s.serial_number);

    if (itemMap.has(detail.item_code)) {
      const existing = itemMap.get(detail.item_code)!;
      existing.quantity += parseInt(detail.qty) || 0;
      existing.serialNumbers.push(...serials);
    } else {
      itemMap.set(detail.item_code, {
        sku: detail.item_code,
        productName: detail.item_name,
        quantity: parseInt(detail.qty) || 0,
        serialNumbers: serials,
        location: '-', // Can be updated if warehouse data is available
        notes: ''
      });
    }
  });

  const items = Array.from(itemMap.values());

  return {
    orderId: packing.doc_no,
    orderNumber: packing.doc_no,
    customerName: packing.arCustomer?.name_1 || '-',
    customerCode: packing.cust_code || '-',
    orderDate: packing.doc_date || '',
    items: items,
    totalItems: items.length,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    isComplete: packing.isComplete
  };
};

const printSinglePickingList = async (packing: PackingWithSerialsResponse) => {
  try {
    const order = transformToPickingListOrder(packing);
    const docDefinition = generatePickingListPdf([order], {
      preparedBy: '',
      checkedBy: '',
      deliveredBy: ''
    });
    printPdf(docDefinition);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to generate picking list',
      life: 3000
    });
  }
};

const downloadSinglePickingList = async (packing: PackingWithSerialsResponse) => {
  try {
    const order = transformToPickingListOrder(packing);
    const docDefinition = generatePickingListPdf([order], {
      preparedBy: '',
      checkedBy: '',
      deliveredBy: ''
    });
    const filename = `PickingList_${packing.doc_no}_${new Date().toISOString().split('T')[0]}.pdf`;
    downloadPdf(docDefinition, filename);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Picking list downloaded successfully',
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to generate picking list',
      life: 3000
    });
  }
};

const printBatchPickingList = async () => {
  if (selectedPackings.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Please select at least one order',
      life: 3000
    });
    return;
  }

  try {
    const orders = selectedPackings.value.map(transformToPickingListOrder);
    const docDefinition = generatePickingListPdf(orders, {
      preparedBy: '',
      checkedBy: '',
      deliveredBy: ''
    });
    printPdf(docDefinition);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to generate batch picking list',
      life: 3000
    });
  }
};

const downloadBatchPickingList = async () => {
  if (selectedPackings.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Please select at least one order',
      life: 3000
    });
    return;
  }

  try {
    const orders = selectedPackings.value.map(transformToPickingListOrder);
    const docDefinition = generatePickingListPdf(orders, {
      preparedBy: '',
      checkedBy: '',
      deliveredBy: ''
    });
    const filename = `PickingList_Batch_${selectedPackings.value.length}Orders_${new Date().toISOString().split('T')[0]}.pdf`;
    downloadPdf(docDefinition, filename);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Batch picking list downloaded successfully',
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to generate batch picking list',
      life: 3000
    });
  }
};

// Initialize default dates to current month
const initializeDefaultDates = () => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
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
        <div class="flex items-center justify-between">
          <span>ใบจัดสินค้า (Picking List)</span>
          <div class="flex gap-2">
            <Button 
              label="Print Selected" 
              icon="pi pi-print" 
              severity="secondary"
              :disabled="selectedPackings.length === 0"
              @click="printBatchPickingList"
            />
            <Button 
              label="Download Selected" 
              icon="pi pi-download" 
              :disabled="selectedPackings.length === 0"
              @click="downloadBatchPickingList"
            />
          </div>
        </div>
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
          v-model:selection="selectedPackings"
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

          <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
          
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
          
          <Column header="Actions" style="width: 150px">
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
          <div class="flex justify-between items-center">
            <div>
              <span class="text-gray-600">รายการทั้งหมด:</span>
              <span class="font-medium ml-1">{{ filteredPackings.length }}</span>
            </div>
            <div>
              <span class="text-gray-600">เลือก:</span>
              <span class="font-medium ml-1">{{ selectedPackings.length }}</span>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- PDF Preview Dialog -->
    <Dialog 
      v-model:visible="previewVisible" 
      header="Picking List Preview" 
      :style="{ width: '90vw', height: '90vh' }"
      maximizable
    >
      <iframe 
        v-if="previewUrl" 
        :src="previewUrl" 
        style="width: 100%; height: 100%; border: none;"
      ></iframe>
    </Dialog>
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
