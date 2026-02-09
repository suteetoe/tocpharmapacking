#!/bin/sh

# ตำแหน่งไฟล์ config ในโฟลเดอร์ dist
CONFIG_FILE="/app/dist/config.js"

INDEX_FILE="/app/dist/index.html"

echo "Applying Runtime Config..."

if [ -z "$VITE_APP_BASE_URL" ]; then
  VITE_APP_BASE_URL="/"
fi
# แทนที่ค่าในไฟล์ config.js ด้วย Environment Variables
# ตัวอย่าง: เปลี่ยน placeholder เป็นค่าจาก docker -e
sed -i "s|VITE_APP_NAME_PLACEHOLDER|${VITE_APP_NAME}|g" $CONFIG_FILE
sed -i "s|VITE_APP_BASE_URL_PLACEHOLDER|${VITE_APP_BASE_URL}|g" $CONFIG_FILE
sed -i "s|VITE_API_URL_PLACEHOLDER|${VITE_API_URL}|g" $CONFIG_FILE

# แทนที่ src ของ config.js ใน index.html ด้วย VITE_APP_BASE_URL
sed -i "s|VITE_APP_BASE_URL_PLACEHOLDER|${VITE_APP_BASE_URL}|g" $INDEX_FILE

echo "Starting serve..."

# รัน serve ต่อ โดยใช้ exec เพื่อให้ Docker จัดการ process ได้ถูกต้อง
exec serve -s dist -l 3000