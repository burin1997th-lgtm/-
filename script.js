function searchInSheet() {
  try {
    // 1. เปิด Spreadsheet และ Sheet ที่ต้องการ
    const spreadsheetId = '15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw'; // แทนที่ด้วย ID ของ Google Sheet ของคุณ
    const sheetName = 'สถานะ'; // แทนที่ด้วยชื่อ Sheet ที่ต้องการ
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      console.error('ไม่พบ Sheet: ' + sheetName);
      return null;
    }
    
    // 2. ค่าที่ต้องการค้นหา (จาก input)
    const searchValue = "10001145I1".toString().trim();
    console.log('กำลังค้นหา: "' + searchValue + '"');
    
    // 3. อ่านข้อมูลทั้งหมดจาก Sheet (พร้อม trim และแปลงเป็น string)
    const data = getTrimmedDataFromSheet(sheet);
    
    // 4. ค้นหาข้อมูล
    const result = findData(data, searchValue);
    
    // 5. แสดงผลลัพธ์
    if (result) {
      console.log('✅ พบข้อมูล!');
      console.log('ข้อมูลทั้งหมดในแถวที่พบ:', result.rowData);
      console.log('แถวที่:', result.rowIndex + 1); // +1 เพราะ index เริ่มที่ 0
      console.log('คอลัมน์ที่:', result.colIndex + 1);
      
      return {
        found: true,
        row: result.rowIndex + 1,
        column: result.colIndex + 1,
        value: result.value,
        fullRow: result.rowData
      };
    } else {
      console.log('❌ ไม่พบข้อมูล: "' + searchValue + '"');
      console.log('ตัวอย่างข้อมูลที่อ่านมา (5 แถวแรก):');
      console.log(data.slice(0, 5));
      
      return {
        found: false,
        message: 'ไม่พบข้อมูลที่ตรงกับ "' + searchValue + '"'
      };
    }
    
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error.toString());
    return {
      error: true,
      message: error.toString()
    };
  }
}

// ฟังก์ชันอ่านข้อมูลจาก Sheet พร้อม trim และแปลงเป็น string
function getTrimmedDataFromSheet(sheet) {
  // อ่านข้อมูลทั้งหมด
  const range = sheet.getDataRange();
  const values = range.getValues();
  
  console.log('📊 อ่านข้อมูลจาก Sheet ได้ทั้งหมด ' + values.length + ' แถว');
  
  // Trim และแปลงทุกค่าเป็น string
  const trimmedData = values.map((row, rowIndex) => {
    return row.map((cell, colIndex) => {
      // แปลงเป็น string และ trim
      const trimmedValue = String(cell || '').trim();
      return trimmedValue;
    });
  });
  
  // แสดงตัวอย่างข้อมูล (5 แถวแรก)
  console.log('ตัวอย่างข้อมูลหลัง trim (5 แถวแรก):');
  for (let i = 0; i < Math.min(5, trimmedData.length); i++) {
    console.log('แถว ' + (i + 1) + ':', trimmedData[i]);
  }
  
  return trimmedData;
}

// ฟังก์ชันค้นหาข้อมูล
function findData(data, searchValue) {
  // แปลงค่าที่ค้นหาเป็น string และ trim
  const searchStr = String(searchValue).trim();
  
  // ค้นหาแบบ Case-insensitive และ trim ทั้งสองฝั่ง
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cellValue = row[colIndex];
      
      // เปรียบเทียบหลังจาก trim ทั้งคู่
      if (cellValue === searchStr) {
        return {
          rowIndex: rowIndex,
          colIndex: colIndex,
          value: cellValue,
          rowData: row
        };
      }
    }
  }
  
  return null;
}

// ฟังก์ชันค้นหาแบบยืดหยุ่น (partial match, ไม่สนใจตัวพิมพ์ใหญ่เล็ก)
function findDataFlexible(data, searchValue) {
  const searchStr = String(searchValue).trim().toLowerCase();
  
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cellValue = String(row[colIndex] || '').trim().toLowerCase();
      
      // แบบ partial match
      if (cellValue.includes(searchStr)) {
        console.log(`🔍 พบข้อมูลแบบ partial match: "${row[colIndex]}"`);
        return {
          rowIndex: rowIndex,
          colIndex: colIndex,
          value: row[colIndex],
          rowData: row,
          matchType: 'partial'
        };
      }
      
      // แบบ exact match (case-insensitive)
      if (cellValue === searchStr) {
        return {
          rowIndex: rowIndex,
          colIndex: colIndex,
          value: row[colIndex],
          rowData: row,
          matchType: 'exact'
        };
      }
    }
  }
  
  return null;
}

// ฟังก์ชันค้นหาทั้งหมดที่ตรง (อาจมีหลายตำแหน่ง)
function findAllMatches(data, searchValue) {
  const searchStr = String(searchValue).trim();
  const matches = [];
  
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cellValue = row[colIndex];
      
      if (cellValue === searchStr) {
        matches.push({
          row: rowIndex + 1,
          column: colIndex + 1,
          value: cellValue,
          rowData: row
        });
      }
    }
  }
  
  return matches;
}

// ฟังก์ชันสำหรับทดสอบ (Test Function)
function testSearch() {
  console.log('🧪 เริ่มทดสอบการค้นหา...');
  
  // ทดสอบกับค่าใน Sheet
  const testCases = [
    "1000114511",
    " 1000114511 ", // มีช่องว่าง
    1000114511, // เป็นตัวเลข
    "ไม่พบข้อมูลนี้" // ค่าที่ไม่มีจริง
  ];
  
  testCases.forEach(testValue => {
    console.log('\n--- ทดสอบค้นหา: "' + testValue + '" ---');
    
    const result = searchInSheetCustom(testValue);
    
    if (result.found) {
      console.log('✅ พบที่แถว:', result.row, 'คอลัมน์:', result.column);
    } else {
      console.log('❌ ไม่พบข้อมูล');
    }
  });
}

// ฟังก์ชันค้นหาแบบปรับแต่งได้
function searchInSheetCustom(searchInput, options = {}) {
  const defaultOptions = {
    spreadsheetId: 'YOUR_SPREADSHEET_ID',
    sheetName: 'Sheet1',
    exactMatch: true,
    caseSensitive: false
  };
  
  const config = { ...defaultOptions, ...options };
  
  try {
    const spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
    const sheet = spreadsheet.getSheetByName(config.sheetName);
    
    if (!sheet) {
      return { error: 'Sheet not found' };
    }
    
    const data = getTrimmedDataFromSheet(sheet);
    const searchStr = String(searchInput).trim();
    
    let result = null;
    
    if (config.exactMatch) {
      result = findData(data, searchStr);
    } else {
      result = findDataFlexible(data, searchStr);
    }
    
    if (result) {
      return {
        found: true,
        row: result.rowIndex + 1,
        column: result.colIndex + 1,
        value: result.value,
        fullRow: result.rowData
      };
    } else {
      return {
        found: false,
        message: `ไม่พบ "${searchInput}" ใน ${config.sheetName}`
      };
    }
    
  } catch (error) {
    return {
      error: true,
      message: error.toString()
    };
  }
}

// ฟังก์ชันหลักสำหรับใช้งานกับ Web App
function doGet(e) {
  const searchValue = e?.parameter?.q || "";
  
  const result = searchInSheetCustom(searchValue, {
    exactMatch: false // ค้นหาแบบยืดหยุ่น
  });
  
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify(result));
  
  return output;
}
