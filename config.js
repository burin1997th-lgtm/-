// ================ CONFIGURATION ================
const CONFIG = {
  SPREADSHEET_ID: '15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw', // แก้ไขเป็น ID ของคุณ
  SHEET_NAME: 'สถานะ', // แก้ไขเป็นชื่อ Sheet ของคุณ
  SEARCH_COLUMN_INDEX: 0, // คอลัมน์ที่ต้องการค้นหา (0 = A, 1 = B, ฯลฯ)
  DEBUG_MODE: true
};

// ================ MAIN SEARCH FUNCTION ================
function searchData(searchValue) {
  console.log('🔍 เริ่มค้นหา:', searchValue);
  
  try {
    // 1. เปิด Spreadsheet
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    if (!ss) {
      console.error('❌ ไม่สามารถเปิด Spreadsheet ได้');
      return createResponse(false, 'ไม่สามารถเชื่อมต่อกับ Google Sheet ได้');
    }
    
    // 2. เปิด Sheet
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      console.error('❌ ไม่พบ Sheet:', CONFIG.SHEET_NAME);
      console.log('Sheets ที่มีอยู่:', ss.getSheets().map(s => s.getName()));
      return createResponse(false, `ไม่พบ Sheet: ${CONFIG.SHEET_NAME}`);
    }
    
    // 3. อ่านข้อมูล
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    console.log(`📊 Sheet: ${CONFIG.SHEET_NAME}`);
    console.log(`📊 ขนาดข้อมูล: ${lastRow} แถว, ${lastCol} คอลัมน์`);
    
    if (lastRow <= 1) {
      console.warn('⚠️  Sheet ว่างเปล่าหรือมีเพียงหัวข้อ');
      return createResponse(false, 'ไม่พบข้อมูลใน Sheet');
    }
    
    // 4. อ่านข้อมูลทั้งหมด
    const dataRange = sheet.getRange(1, 1, lastRow, lastCol);
    const rawData = dataRange.getValues();
    
    // 5. Debug: แสดงตัวอย่างข้อมูล
    if (CONFIG.DEBUG_MODE) {
      console.log('=== DEBUG ข้อมูลดิบ (5 แถวแรก) ===');
      for (let i = 0; i < Math.min(5, rawData.length); i++) {
        console.log(`แถว ${i+1}:`, rawData[i].map(cell => {
          const type = typeof cell;
          const val = String(cell);
          return `${val} (${type})`;
        }));
      }
      console.log('=== END DEBUG ===');
    }
    
    // 6. ทำความสะอาดและเตรียมข้อมูลสำหรับค้นหา
    const searchStr = String(searchValue).trim();
    console.log(`🔍 ค้นหา: "${searchStr}" (ความยาว: ${searchStr.length})`);
    
    // 7. ค้นหาข้อมูล (หลายรูปแบบ)
    let result = null;
    
    // รูปแบบที่ 1: ค้นหาตรง
    result = searchExact(rawData, searchStr);
    if (result) {
      console.log('✅ พบข้อมูลแบบตรงกัน');
      return createResponse(true, 'พบข้อมูล', {
        value: result.value,
        row: result.row + 1,
        column: result.column + 1,
        fullRow: result.fullRow
      });
    }
    
    // รูปแบบที่ 2: ค้นหาแบบไม่สนใจช่องว่าง
    result = searchFlexible(rawData, searchStr);
    if (result) {
      console.log('✅ พบข้อมูลแบบยืดหยุ่น');
      return createResponse(true, 'พบข้อมูล', {
        value: result.value,
        row: result.row + 1,
        column: result.column + 1,
        fullRow: result.fullRow,
        matchType: 'flexible'
      });
    }
    
    // รูปแบบที่ 3: ค้นหาเฉพาะคอลัมน์ที่กำหนด
    if (CONFIG.SEARCH_COLUMN_INDEX >= 0) {
      result = searchInColumn(rawData, searchStr, CONFIG.SEARCH_COLUMN_INDEX);
      if (result) {
        console.log('✅ พบข้อมูลในคอลัมน์ที่กำหนด');
        return createResponse(true, 'พบข้อมูล', {
          value: result.value,
          row: result.row + 1,
          column: result.column + 1,
          fullRow: result.fullRow
        });
      }
    }
    
    // 8. ถ้าไม่พบ ให้แสดงข้อมูลตัวอย่างเพื่อช่วย debug
    console.log('❌ ไม่พบข้อมูลที่ตรงกัน');
    console.log('ตัวอย่างค่าที่มีในคอลัมน์แรก (10 ค่าแรก):');
    const firstColumnValues = rawData.slice(1, 11).map(row => {
      const val = row[0];
      return {
        raw: val,
        string: String(val),
        trimmed: String(val).trim(),
        type: typeof val,
        length: String(val).length
      };
    });
    
    console.table(firstColumnValues);
    
    return createResponse(false, `ไม่พบข้อมูลที่ตรงกับ "${searchStr}"`, {
      suggestions: firstColumnValues.map(v => v.trimmed).filter(v => v)
    });
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาด:', error);
    console.error('Stack trace:', error.stack);
    
    return createResponse(false, 'เกิดข้อผิดพลาดในการค้นหา: ' + error.message);
  }
}

// ================ SEARCH METHODS ================
function searchExact(data, searchStr) {
  console.log('🔎 กำลังค้นหาแบบตรงกัน...');
  
  for (let row = 0; row < data.length; row++) {
    const rowData = data[row];
    
    for (let col = 0; col < rowData.length; col++) {
      const cellValue = rowData[col];
      const cellStr = String(cellValue).trim();
      
      if (cellStr === searchStr) {
        console.log(`   พบที่แถว ${row + 1}, คอลัมน์ ${col + 1}`);
        return {
          value: cellValue,
          rawValue: cellValue,
          row: row,
          column: col,
          fullRow: rowData
        };
      }
    }
  }
  
  return null;
}

function searchFlexible(data, searchStr) {
  console.log('🔎 กำลังค้นหาแบบยืดหยุ่น...');
  
  const searchLower = searchStr.toLowerCase();
  
  for (let row = 0; row < data.length; row++) {
    const rowData = data[row];
    
    for (let col = 0; col < rowData.length; col++) {
      const cellValue = rowData[col];
      const cellStr = String(cellValue).trim();
      const cellLower = cellStr.toLowerCase();
      
      // ลองหลายรูปแบบการ match
      if (cellLower === searchLower) { // exact (case-insensitive)
        console.log(`   พบ (case-insensitive) ที่แถว ${row + 1}, คอลัมน์ ${col + 1}`);
        return {
          value: cellValue,
          row: row,
          column: col,
          fullRow: rowData,
          matchType: 'case-insensitive'
        };
      }
      
      if (cellStr.includes(searchStr)) { // partial match
        console.log(`   พบ (partial) ที่แถว ${row + 1}, คอลัมน์ ${col + 1}`);
        return {
          value: cellValue,
          row: row,
          column: col,
          fullRow: rowData,
          matchType: 'partial'
        };
      }
      
      if (cellLower.includes(searchLower)) { // partial case-insensitive
        console.log(`   พบ (partial case-insensitive) ที่แถว ${row + 1}, คอลัมน์ ${col + 1}`);
        return {
          value: cellValue,
          row: row,
          column: col,
          fullRow: rowData,
          matchType: 'partial-case-insensitive'
        };
      }
      
      // สำหรับตัวเลข: ลองแปลงเป็นตัวเลขแล้วเปรียบเทียบ
      if (!isNaN(searchStr) && !isNaN(cellStr)) {
        const searchNum = Number(searchStr);
        const cellNum = Number(cellStr);
        
        if (searchNum === cellNum) {
          console.log(`   พบ (numeric) ที่แถว ${row + 1}, คอลัมน์ ${col + 1}`);
          return {
            value: cellValue,
            row: row,
            column: col,
            fullRow: rowData,
            matchType: 'numeric'
          };
        }
      }
    }
  }
  
  return null;
}

function searchInColumn(data, searchStr, columnIndex) {
  console.log(`🔎 กำลังค้นหาในคอลัมน์ ${columnIndex + 1}...`);
  
  if (columnIndex >= data[0].length) {
    console.error(`คอลัมน์ ${columnIndex + 1} ไม่มีอยู่`);
    return null;
  }
  
  for (let row = 0; row < data.length; row++) {
    const cellValue = data[row][columnIndex];
    const cellStr = String(cellValue).trim();
    
    if (cellStr === searchStr) {
      console.log(`   พบที่แถว ${row + 1}`);
      return {
        value: cellValue,
        row: row,
        column: columnIndex,
        fullRow: data[row]
      };
    }
  }
  
  return null;
}

// ================ HELPER FUNCTIONS ================
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  if (data) {
    Object.assign(response, data);
  }
  
  console.log('📤 Response:', JSON.stringify(response, null, 2));
  return response;
}

// ================ TEST FUNCTION ================
function testSearch() {
  console.log('🧪 เริ่มทดสอบการค้นหา...');
  
  // ทดสอบหลายรูปแบบ
  const testCases = [
    "1000114511",
    " 1000114511 ",
    "1000114511\n", // มี newline
    "1000114511\t", // มี tab
    1000114511, // ตัวเลข
    "1000114512", // ค่าอื่น
    ""
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\n=== ทดสอบที่ ${index + 1}: "${testCase}" ===`);
    
    const result = searchData(testCase);
    
    if (result.success) {
      console.log(`✅ พบข้อมูลที่แถว ${result.row}`);
      console.log(`   ค่า: ${result.value}`);
    } else {
      console.log(`❌ ${result.message}`);
    }
  });
}

// ================ WEB APP INTEGRATION ================
function doGet(e) {
  // รับค่าจาก URL parameter
  const searchValue = e?.parameter?.q || e?.parameter?.search || '';
  
  if (!searchValue) {
    return createJsonResponse({
      success: false,
      message: 'กรุณาระบุค่าที่ต้องการค้นหา'
    });
  }
  
  // ค้นหาข้อมูล
  const result = searchData(searchValue);
  
  // ส่งผลลัพธ์เป็น JSON
  return createJsonResponse(result);
}

function doPost(e) {
  let searchValue;
  
  // รับค่าจาก POST data
  if (e.postData && e.postData.contents) {
    const data = JSON.parse(e.postData.contents);
    searchValue = data.q || data.search || '';
  } else {
    searchValue = e?.parameter?.q || '';
  }
  
  if (!searchValue) {
    return createJsonResponse({
      success: false,
      message: 'กรุณาระบุค่าที่ต้องการค้นหา'
    });
  }
  
  const result = searchData(searchValue);
  return createJsonResponse(result);
}

function createJsonResponse(data) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify(data, null, 2));
  
  return output;
}

// ================ MANUAL TEST ================
function manualTest() {
  // เรียกใช้ฟังก์ชันนี้เพื่อทดสอบโดยตรง
  const searchValue = "1000114511"; // เปลี่ยนเป็นค่าที่ต้องการทดสอบ
  
  console.clear();
  console.log('🧪 Manual Test Mode');
  console.log('===================');
  
  const result = searchData(searchValue);
  
  if (result.success) {
    console.log('\n🎉 ทดสอบสำเร็จ!');
    console.log(`แถวที่พบ: ${result.row}`);
    console.log(`คอลัมน์ที่พบ: ${result.column}`);
    console.log(`ค่าที่พบ: ${result.value}`);
    
    // แสดงข้อมูลทั้งแถว
    console.log('\nข้อมูลทั้งแถว:');
    console.table(result.fullRow);
  } else {
    console.log('\n😞 ไม่พบข้อมูล');
    console.log(`ข้อความ: ${result.message}`);
    
    if (result.suggestions) {
      console.log('\nค่าที่มีในระบบ:');
      result.suggestions.forEach((suggestion, i) => {
        console.log(`  ${i + 1}. ${suggestion}`);
      });
    }
  }
}

// ================ INITIAL SETUP CHECK ================
function checkSetup() {
  console.log('🔧 ตรวจสอบการตั้งค่า...');
  
  try {
    // 1. ตรวจสอบว่า Spreadsheet ID ถูกต้อง
    if (CONFIG.SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
      throw new Error('กรุณาเปลี่ยน CONFIG.SPREADSHEET_ID เป็น ID ของ Google Sheet ของคุณ');
    }
    
    // 2. ลองเปิด Spreadsheet
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    if (!ss) {
      throw new Error('ไม่สามารถเปิด Spreadsheet ได้ กรุณาตรวจสอบ ID');
    }
    
    // 3. ตรวจสอบ Sheet
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      console.warn(`⚠️  ไม่พบ Sheet: ${CONFIG.SHEET_NAME}`);
      console.log('📋 Sheets ที่มีอยู่:');
      ss.getSheets().forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.getName()} (แถว: ${s.getLastRow()})`);
      });
      throw new Error(`กรุณาเปลี่ยน CONFIG.SHEET_NAME เป็นชื่อ Sheet ที่มีอยู่`);
    }
    
    // 4. ตรวจสอบข้อมูล
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    console.log('✅ การตั้งค่า OK');
    console.log(`📊 Sheet: ${CONFIG.SHEET_NAME}`);
    console.log(`📊 ขนาดข้อมูล: ${lastRow} แถว, ${lastCol} คอลัมน์`);
    
    // แสดงตัวอย่างข้อมูล
    if (lastRow > 1) {
      const sampleData = sheet.getRange(1, 1, Math.min(3, lastRow), Math.min(3, lastCol)).getValues();
      console.log('\nตัวอย่างข้อมูล (3x3):');
      console.table(sampleData);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ ตั้งค่าไม่ถูกต้อง:', error.message);
    return false;
  }
}

// ================ RUN THIS FIRST ================
function initialize() {
  console.log('🚀 เริ่มต้นระบบค้นหา...');
  
  // 1. ตรวจสอบการตั้งค่า
  if (!checkSetup()) {
    console.error('❌ กรุณาแก้ไขการตั้งค่าแล้วลองอีกครั้ง');
    return;
  }
  
  // 2. ทดสอบการค้นหา
  console.log('\n🧪 เริ่มทดสอบ...');
  testSearch();
  
  console.log('\n✅ การเริ่มต้นระบบเสร็จสิ้น');
  console.log('👉 ใช้ฟังก์ชัน manualTest() เพื่อทดสอบด้วยตัวเอง');
}
