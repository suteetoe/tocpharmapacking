# Frontend Development Specification (Web Application)

## 1. Technology Stack & Packages
- **Framework**: Vue.js 3 (Latest Stable)
- **UI Component Library**: PrimeVue
- **CSS Framework**: Tailwind CSS
- **Language**: TypeScript
- **State Management**: Pinia
- **Local Storage**: Browser Storage (LocalStorage, SessionStorage, IndexedDB)
- **Networking**: HTTP Client (Axios)
- **Barcode Scanner**:
  - **Hardware**: Keyboard Event Listener (สำหรับ USB/Bluetooth Scanner)
  - **Camera**: HTML5 Video API / WebRTC (สำหรับกล้องอุปกรณ์)
- **Printing & PDF**: Browser Print API หรือ PDF Generation Library
- **Audio**: HTML5 Audio API

## 2. Project Structure
โครงสร้างโฟลเดอร์ (แนะนำภายใต้ `src/`) ออกแบบตามหลักการ Clean Architecture และ Feature-first

## 3. User Interface Flows & Logic

### 3.0 Global Layout & Navigation
โครงสร้างหน้าจอหลักประกอบด้วยส่วนประกอบพื้นฐานดังนี้:

#### Top Toolbar (Header)
- **ตำแหน่ง**: ด้านบนสุดของหน้าจอ
- **ส่วนประกอบ**:
  - **Logo/Title**: ชื่อระบบหรือโลโก้
  - **User Profile**: แสดงชื่อผู้ใช้งานที่กำลัง Login อยู่ (Avatar + Name)
  - **Status Indicator**: สถานะการเชื่อมต่อ (Online/Offline)

#### Left Sidebar Menu (Navigation)
- **ตำแหน่ง**: ด้านซ้ายของหน้าจอ (สามารถย่อ/ขยาย หรือซ่อนได้ใน Mobile View)
- **เมนูหลัก**:
  - **Dashboard**: หน้าหลัก
  - **Packing**: เมนูจัดสินค้า
  - **Logout**: ออกจากระบบ

### 3.1 Authentication (Login)
- **UI**: หน้าจอระบุชื่อผู้ใช้และรหัสผ่าน
- **Logic**:
  - ตรวจสอบข้อมูลกับ Backend API
  - หากสำเร็จ ให้บันทึก Token ลงใน Secure Storage
  - นำผู้ใช้เข้าสู่หน้าหลัก (Home)
  - หากไม่สำเร็จ ให้แสดงข้อความแจ้งเตือน

### 3.2 Packing Workflow (กระบวนการจัดสินค้า)

#### Step 1: Employee & Invoice Setup
- **การทำงาน**:
  - สแกนหรือกรอกรหัสพนักงาน เพื่อตรวจสอบสิทธิ์และบันทึก Session ผู้ทำงาน
  - สแกนหรือกรอกเลขที่ใบเสร็จ (Invoice No) เพื่อดึงรายการสินค้าที่ต้องจัด
- **State**:
  - โหลดข้อมูลรายการสินค้า (Target List) เก็บไว้ใน Memory
  - แสดงรายละเอียดลูกค้าและจำนวนสินค้าที่ต้องจัดทั้งหมด

#### Step 2: Serial Scanning Operation (หัวใจหลัก)
หน้าจอนี้เน้นความเร็วและความแม่นยำในการทำงาน
- **UI / Display**:
  - **Current Invoice**: แสดงเลขที่ใบเสร็จ (Invoice No) ที่กำลังดำเนินการ
  - **Product List**: แสดงรายการสินค้าที่ต้องจัด (Target) และจำนวนที่จัดแล้ว (Actual/Target)
  - **Scanned Items**: แสดงรายการ Serial ที่สแกนไปแล้ว (Scanned History) เพื่อให้ตรวจสอบย้อนหลังได้
- **การรับค่า**: รองรับการสแกนต่อเนื่อง (Continuous Scanning) ผ่าน Bluetooth Scanner หรือกล้อง
- **Logic การตรวจสอบ (Validation Logic)**:
  1. **Server Validation**: ส่ง Serial ไปตรวจสอบสถานะกับ Server (ตรวจสอบว่ามีจริง, สถานะปกติ, ยังไม่ถูกขาย)
  2. **Local Validation**:
     - ตรวจสอบว่า Serial นี้ซ้ำกับที่เคยสแกนไปแล้วใน Session นี้หรือไม่
     - ตรวจสอบว่าสินค้าชนิดนี้จัดครบตามจำนวนที่กำหนดแล้วหรือไม่
- **Feedback (การตอบสนอง)**:
  - **กรณีผ่าน**: เล่นเสียง Beep สั้น, เพิ่มรายการลงใน Memory List, อัปเดตตัวนับจำนวนบนหน้าจอ
  - **กรณีไม่ผ่าน**: เล่นเสียง Beep ยาว (Error Tone), แสดง Dialog หรือ SnackBar แจ้งเตือนปัญหา (เช่น สินค้าผิด, ซ้ำ, หรือเกินจำนวน)
  - **กรณีจัดครบ**: เล่นเสียงพิเศษ (Complete Tone) และเปิดปุ่มสำหรับยืนยันงาน

#### Step 3: Confirmation (Commit)
- **UI**: แสดงรายการสรุปยอดที่จัดจริงเทียบกับยอดสั่งซื้อ
- **Action**:
  - ส่งรายการ Serial ทั้งหมดที่อยู่ใน Memory ไปยัง Server เพื่อบันทึกผล
  - **กรณีสำเร็จ**: เคลียร์ข้อมูลใน Memory และเปลี่ยนหน้าไปสู่ขั้นตอนการพิมพ์
  - **กรณีล้มเหลว**: แจ้งเตือนรายการที่มีปัญหา เพื่อให้ผู้ใช้งานแก้ไข (ลบหรือเปลี่ยน Serial) แล้วส่งใหม่

### 3.3 Printing (การพิมพ์เอกสาร)
- **UI**: หน้าจอแสดงตัวอย่างเอกสาร (PDF Preview / Print Layout)
- **Logic**:
  - นำข้อมูลการจัดสินค้าที่สำเร็จแล้วมาสร้างเป็นเอกสาร (HTML/PDF)
  - แสดงผลบนหน้าจอ
  - สั่งพิมพ์ผ่าน Browser Print Command (`window.print()`) หรือดาวน์โหลดเป็น PDF

## 4. State Management Strategy

### Authentication State
จัดการสถานะการเข้าสู่ระบบ
- **Actions**: ร้องขอการ Login, ร้องขอการ Logout, ตรวจสอบสถานะ Token เริ่มต้น
- **States**: สถานะเริ่มต้น, กำลังโหลด, เข้าสู่ระบบสำเร็จ, เกิดข้อผิดพลาด (ระบุข้อความ)

### Packing State
จัดการสถานะของการจัดสินค้าทั้งหมด (Complex State)
- **Actions**:
  - สแกนใบเสร็จ (เริ่มงานใหม่)
  - สแกน Serial สินค้า (เพิ่มรายการ)
  - ลบ Serial สินค้า (แก้ไขรายการ)
  - ยืนยันการจัดส่ง (จบงาน)
- **States**:
  - **Initial**: สถานะว่างเปล่า
  - **Loading**: กำลังดึงข้อมูลจาก API
  - **Ready**: มีข้อมูลใบเสร็จพร้อม รอการสแกน
  - **Updated**: รายการสินค้าใน Memory มีการเปลี่ยนแปลง (ใช้สำหรับ Refresh UI List และ Counter)
  - **Complete**: จัดสินค้าครบตามจำนวนแล้ว
  - **Success**: บันทึกข้อมูลลง Server สำเร็จ
  - **Failure**: เกิดข้อผิดพลาด (Network Error หรือ Validation Error)

## 5. Hardware Integration Requirements

### Barcode Scanner
- **Hardware Scanner (USB/Bluetooth)**: ทำงานแบบ Keyboard Wedge (HID) ระบบต้องดักจับ `keydown` / `keypress` events ได้ทั่วทั้งแอป (Global Listener) โดยไม่ต้อง Focus ที่ Input Field
- **Camera Scanner**: ใช้ WebRTC / HTML5 Camera Access สำหรับสแกนผ่านกล้องของอุปกรณ์ (Mobile/Tablet/Laptop)

### Printer
- **Browser Print**: รองรับการสั่งพิมพ์ผ่าน Browser Dialog มาตรฐาน
- **PDF Generation**: สามารถสร้างไฟล์ PDF และสั่งพิมพ์ หรือดาวน์โหลดได้
- **Paper Size**: รองรับ Responsive Layout สำหรับการพิมพ์ทั้ง A4 และ Slip (Thermal Printer)

## 6. Error Handling & UX
- **Network Handling**: ระบบต้องตรวจสอบการเชื่อมต่ออินเทอร์เน็ตก่อนเริ่มการทำงานสำคัญ หากไม่มีสัญญาณให้แจ้งเตือนทันที
- **Audio Feedback**: ใช้เสียงเป็นตัวบ่งชี้สถานะหลัก เพื่อให้พนักงานไม่ต้องมองหน้าจอตลอดเวลา
- **Visual Feedback**: ใช้สี (เขียว/แดง) และ Icon ขนาดใหญ่ เพื่อบ่งบอกสถานะผ่าน