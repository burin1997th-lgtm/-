// ⚙️ CONFIGURATION - ต้องแก้ไขก่อนใช้งาน
const CONFIG = {
  SPREADSHEET_ID: '15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw', // แก้ไขเป็น ID ของคุณ
  SHEET_NAME: 'สถานะ',
  DEFAULT_SEARCH_VALUE: '10001145I1'
};

// 🔍 MAIN SEARCH FUNCTION - เวอร์ชันที่ง่ายและตรงไปตรงมา
function advancedSearch(searchValue) {
  console.log('🚀 === เริ่มค้นหาขั้นสูง ===');
  console.log('🔍 ค่าที่ค้นหา:', JSON.stringify(searchValue));
  console.log('📊 Spreadsheet ID:', CONFIG.SPREADSHEET_ID);
  
  try {
    // 1. เปิด Spreadsheet
    console.log('📂 กำลังเปิด Spreadsheet...');
    let ss;
    try {
      ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    } catch (e) {
      console.error('❌ เปิด Spreadsheet ไม่ได้:', e.message);
      return {
        success: false,
        error: 'ไม่สามารถเปิด Google Sheet ได้',
        details: e.toString()
      };
    }
    
    if (!ss) {
      return { success: false, error: 'Spreadsheet เป็น null' };
    }
    
    // 2. เปิด Sheet
    console.log('📄 กำลังเปิด Sheet:', CONFIG.SHEET_NAME);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) {
      console.error('❌ ไม่พบ Sheet:', CONFIG.SHEET_NAME);
      console.log('📋 Sheet ที่มีอยู่ทั้งหมด:');
      const allSheets = ss.getSheets();
      allSheets.forEach((s, i) => {
        console.log(`${i + 1}. "${s.getName()}" (Index: ${s.getIndex()})`);
      });
      
      return {
        success: false,
        error: `ไม่พบ Sheet: "${CONFIG.SHEET_NAME}"`,
        availableSheets: allSheets.map(s => s.getName())
      };
    }
    
    // 3. ตรวจสอบขนาดข้อมูล
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    console.log(`📈 ขนาดข้อมูล: ${lastRow} แถว, ${lastCol} คอลัมน์`);
    
    if (lastRow <= 1) {
      console.warn('⚠️  ข้อมูลว่างเปล่าหรือมีเฉพาะหัวข้อ');
      return {
        success: false,
        error: 'ไม่มีข้อมูลใน Sheet',
        sheetName: CONFIG.SHEET_NAME,
        dimensions: { rows: lastRow, cols: lastCol }
      };
    }
    
    // 4. อ่านข้อมูลทั้งหมด
    console.log('📖 กำลังอ่านข้อมูล...');
    const dataRange = sheet.getRange(1, 1, lastRow, lastCol);
    const rawData = dataRange.getValues();
    
    console.log(`✅ อ่านข้อมูลสำเร็จ: ${rawData.length} แถว`);
    
    // 5. DEBUG: แสดงข้อมูลตัวอย่าง
    console.log('\n🔬 === DEBUG ข้อมูลดิบ ===');
    console.log('แถวที่ 1-5 (แสดงทุกคอลัมน์):');
    
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
      const row = rawData[i];
      console.log(`\n📝 แถว ${i + 1}:`);
      
      row.forEach((cell, colIndex) => {
        const colLetter = String.fromCharCode(65 + colIndex); // A, B, C, ...
        const cellAddress = `${colLetter}${i + 1}`;
        
        let displayValue = cell;
        let type = typeof cell;
        
        if (cell === null || cell === undefined) {
          displayValue = '[NULL/UNDEFINED]';
        } else if (cell === '') {
          displayValue = '[EMPTY STRING]';
        } else if (typeof cell === 'string') {
          displayValue = `"${cell}"`;
          
          // แสดงอักขระพิเศษ
          const hasWhitespace = /^\s|\s$/.test(cell);
          const hasSpecialChars = /[\n\r\t]/.test(cell);
          
          if (hasWhitespace || hasSpecialChars) {
            const escaped = cell
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t');
            console.log(`  ${cellAddress}: "${escaped}" (มีช่องว่าง/อักขระพิเศษ)`);
            return;
          }
        }
        
        console.log(`  ${cellAddress}: ${displayValue} (${type})`);
      });
    }
    
    // 6. เตรียมค่าที่ค้นหา
    const searchStr = String(searchValue || '').trim();
    console.log('\n🎯 === เริ่มค้นหา ===');
    console.log(`🔍 ค่าที่ค้นหา (หลัง trim): "${searchStr}"`);
    console.log(`📏 ความยาว: ${searchStr.length} อักขระ`);
    
    if (!searchStr) {
      return {
        success: false,
        error: 'กรุณาระบุค่าที่ต้องการค้นหา'
      };
    }
    
    // 7. ค้นหาแบบละเอียดทุกคอลัมน์
    console.log('\n🔎 === กำลังสแกนข้อมูล ===');
    
    const matches = [];
    
    // สแกนทุกเซลล์
    for (let rowIdx = 0; rowIdx < rawData.length; rowIdx++) {
      const row = rawData[rowIdx];
      
      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const cellValue = row[colIdx];
        const cellStr = String(cellValue || '').trim();
        
        // ลองทุกวิธีการเปรียบเทียบ
        const comparisonMethods = [
          { name: 'exact', match: cellStr === searchStr },
          { name: 'case-insensitive', match: cellStr.toLowerCase() === searchStr.toLowerCase() },
          { name: 'includes', match: cellStr.includes(searchStr) },
          { name: 'includes-case-insensitive', match: cellStr.toLowerCase().includes(searchStr.toLowerCase()) }
        ];
        
        // ตรวจสอบว่าเป็นตัวเลข
        if (!isNaN(searchStr) && !isNaN(cellStr)) {
          const numMatch = Number(cellStr) === Number(searchStr);
          comparisonMethods.push({ name: 'numeric', match: numMatch });
        }
        
        // หา method ที่ match
        const matchedMethod = comparisonMethods.find(method => method.match);
        
        if (matchedMethod) {
          console.log(`✅ พบที่ ${String.fromCharCode(65 + colIdx)}${rowIdx + 1} (${matchedMethod.name})`);
          
          matches.push({
            row: rowIdx + 1,
            column: colIdx + 1,
            columnLetter: String.fromCharCode(65 + colIdx),
            value: cellValue,
            displayValue: cellStr,
            matchType: matchedMethod.name,
            fullRow: row
          });
        }
      }
    }
    
    // 8. ประมวลผลผลลัพธ์
    console.log('\n📊 === สรุปผลการค้นหา ===');
    console.log(`พบทั้งหมด: ${matches.length} ที่`);
    
    if (matches.length > 0) {
      matches.forEach((match, index) => {
        console.log(`\n📌 ตำแหน่งที่ ${index + 1}:`);
        console.log(`   เซลล์: ${match.columnLetter}${match.row}`);
        console.log(`   ค่า: ${match.displayValue}`);
        console.log(`   ประเภทการ match: ${match.matchType}`);
        
        // แสดงข้อมูลในแถวเดียวกัน
        console.log(`   ข้อมูลแถว ${match.row}:`);
        match.fullRow.forEach((cell, idx) => {
          const colLetter = String.fromCharCode(65 + idx);
          console.log(`     ${colLetter}: ${cell}`);
        });
      });
      
      return {
        success: true,
        message: `พบข้อมูล ${matches.length} ตำแหน่ง`,
        matches: matches,
        count: matches.length,
        searchValue: searchStr
      };
      
    } else {
      // ถ้าไม่พบ ให้แสดงข้อมูลตัวอย่างจากคอลัมน์แรก
      console.log('\n🔍 === วิเคราะห์ข้อมูลที่มี ===');
      
      // รวบรวมค่าจากคอลัมน์แรก (คอลัมน์ A)
      const firstColumnValues = [];
      for (let i = 0; i < Math.min(20, rawData.length); i++) {
        const val = rawData[i][0];
        if (val !== undefined && val !== null && val !== '') {
          firstColumnValues.push({
            row: i + 1,
            raw: val,
            string: String(val),
            trimmed: String(val).trim(),
            length: String(val).length,
            type: typeof val
          });
        }
      }
      
      console.log('ตัวอย่างค่าจากคอลัมน์ A (20 ค่าแรก):');
      console.table(firstColumnValues);
      
      // เปรียบเทียบ byte-by-byte
      console.log('\n🔬 === เปรียบเทียบแบบละเอียด ===');
      console.log(`ค่าที่ค้นหา: "${searchStr}"`);
      console.log('Bytes:', Array.from(searchStr).map(c => c.charCodeAt(0)));
      
      if (firstColumnValues.length > 0) {
        const sampleValue = firstColumnValues[0].trimmed;
        console.log(`ตัวอย่างใน Sheet: "${sampleValue}"`);
        console.log('Bytes:', Array.from(sampleValue).map(c => c.charCodeAt(0)));
        
        // ตรวจสอบความเหมือน/ต่าง
        console.log('\n📐 การเปรียบเทียบ:');
        console.log('ความยาวเท่ากัน?', searchStr.length === sampleValue.length);
        console.log('เหมือนกันทุกตัวอักษร?', searchStr === sampleValue);
        console.log('เหมือนกัน (ไม่สนใจตัวพิมพ์)?', searchStr.toLowerCase() === sampleValue.toLowerCase());
      }
      
      return {
        success: false,
        message: `ไม่พบข้อมูลที่ตรงกับ "${searchStr}"`,
        debug: {
          totalRows: rawData.length,
          sampleValues: firstColumnValues.slice(0, 5),
          searchValue: searchStr,
          searchValueLength: searchStr.length,
          searchValueBytes: Array.from(searchStr).map(c => c.charCodeAt(0))
        },
        suggestions: firstColumnValues.map(v => v.trimmed).filter(v => v)
      };
    }
    
  } catch (error) {
    console.error('💥 === เกิดข้อผิดพลาดร้ายแรง ===');
    console.error('ข้อความ:', error.message);
    console.error('Stack:', error.stack);
    
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการค้นหา',
      details: error.toString(),
      stack: error.stack
    };
  }
}

// 🌐 WEB APP FUNCTION
function doGet(e) {
  console.log('🌐 Web App ถูกเรียกใช้');
  
  // รับค่าจาก URL
  const params = e?.parameter || {};
  const searchValue = params.q || params.search || CONFIG.DEFAULT_SEARCH_VALUE;
  
  console.log('📝 Parameters:', params);
  console.log('🔍 Search value:', searchValue);
  
  // เรียกฟังก์ชันค้นหา
  const result = advancedSearch(searchValue);
  
  // สร้าง HTML response ที่สวยงาม
  return createHtmlResponse(result);
}

function doPost(e) {
  console.log('📨 Web App (POST) ถูกเรียกใช้');
  
  let searchValue = CONFIG.DEFAULT_SEARCH_VALUE;
  
  if (e.postData && e.postData.contents) {
    try {
      const data = JSON.parse(e.postData.contents);
      searchValue = data.q || data.search || searchValue;
    } catch (parseError) {
      // ถ้าไม่ใช่ JSON ลองอ่านเป็น form data
      const params = e.parameter;
      searchValue = params?.q || params?.search || searchValue;
    }
  }
  
  const result = advancedSearch(searchValue);
  
  // ส่งเป็น JSON สำหรับ API
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify(result, null, 2));
  
  return output;
}

// 🎨 CREATE HTML RESPONSE
function createHtmlResponse(result) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ระบบค้นหา IN-TECH</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    body {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      width: 100%;
      max-width: 800px;
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    
    .header h1 i {
      font-size: 32px;
    }
    
    .header p {
      opacity: 0.9;
      font-size: 16px;
    }
    
    .content {
      padding: 30px;
    }
    
    .search-box {
      background: #f8fafc;
      border-radius: 15px;
      padding: 25px;
      margin-bottom: 25px;
      border: 2px solid #e2e8f0;
    }
    
    .search-form {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .search-input {
      flex: 1;
      padding: 15px 20px;
      border: 2px solid #cbd5e1;
      border-radius: 12px;
      font-size: 16px;
      transition: all 0.3s;
    }
    
    .search-input:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }
    
    .search-button {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      border: none;
      border-radius: 12px;
      padding: 0 30px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .search-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(79, 70, 229, 0.2);
    }
    
    .result-section {
      background: white;
      border-radius: 15px;
      padding: 25px;
      border: 2px solid #e2e8f0;
    }
    
    .result-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .success {
      color: #10b981;
    }
    
    .error {
      color: #ef4444;
    }
    
    .result-content {
      background: #f8fafc;
      border-radius: 10px;
      padding: 20px;
      margin-top: 15px;
    }
    
    .result-item {
      background: white;
      border-radius: 10px;
      padding: 15px;
      margin-bottom: 15px;
      border-left: 4px solid #4f46e5;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    
    .result-item:last-child {
      margin-bottom: 0;
    }
    
    .match-location {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    
    .cell-badge {
      background: #4f46e5;
      color: white;
      padding: 5px 12px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
    }
    
    .match-type {
      background: #dbeafe;
      color: #1d4ed8;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .value-display {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin: 10px 0;
    }
    
    .no-data {
      text-align: center;
      padding: 40px 20px;
      color: #64748b;
    }
    
    .no-data i {
      font-size: 48px;
      margin-bottom: 15px;
      opacity: 0.5;
    }
    
    .debug-info {
      background: #0f172a;
      color: #94a3b8;
      border-radius: 10px;
      padding: 15px;
      margin-top: 20px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      overflow-x: auto;
      white-space: pre-wrap;
    }
    
    .loading {
      text-align: center;
      padding: 30px;
    }
    
    .loading-spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #4f46e5;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .footer {
      text-align: center;
      padding: 20px;
      color: #64748b;
      font-size: 14px;
      border-top: 1px solid #e2e8f0;
    }
    
    @media (max-width: 640px) {
      .header {
        padding: 20px;
      }
      
      .content {
        padding: 20px;
      }
      
      .search-form {
        flex-direction: column;
      }
      
      .search-button {
        padding: 15px;
      }
    }
  </style>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
  <div class="container">
    <div class="header">
      <h1><i class="fas fa-search"></i> ระบบค้นหาเลขแปลง IN-TECH</h1>
      <p>ค้นหาข้อมูลจาก Google Sheet โครงการผ่ากล</p>
    </div>
    
    <div class="content">
      <div class="search-box">
        <form id="searchForm" onsubmit="handleSearch(event)">
          <div class="search-form">
            <input 
              type="text" 
              id="searchInput" 
              class="search-input" 
              placeholder="กรอกเลขแปลงที่ต้องการค้นหา..." 
              value="${result?.searchValue || CONFIG.DEFAULT_SEARCH_VALUE}"
              autocomplete="off"
            >
            <button type="submit" class="search-button">
              <i class="fas fa-search"></i> ค้นหา
            </button>
          </div>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button type="button" onclick="testSearch('1000114511')" class="search-button" style="background: #10b981;">
              ทดสอบ 1000114511
            </button>
            <button type="button" onclick="testSearch('1000114512')" class="search-button" style="background: #f59e0b;">
              ทดสอบ 1000114512
            </button>
          </div>
        </form>
      </div>
      
      <div class="result-section">
        <div class="result-title ${result?.success ? 'success' : 'error'}">
          <i class="fas ${result?.success ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
          ${result?.success ? 'พบข้อมูล' : 'ไม่พบข้อมูล'}
        </div>
        
        <div class="result-content">
          ${result?.success ? 
            result.matches.map(match => `
              <div class="result-item">
                <div class="match-location">
                  <span class="cell-badge">${match.columnLetter}${match.row}</span>
                  <span class="match-type">${match.matchType}</span>
                </div>
                <div class="value-display">${match.displayValue}</div>
                <div style="font-size: 14px; color: #64748b;">
                  <i class="fas fa-database"></i> ค่าดิบ: ${match.value}
                </div>
              </div>
            `).join('') : 
            `
            <div class="no-data">
              <i class="fas fa-database"></i>
              <h3>${result?.message || 'ไม่พบข้อมูล'}</h3>
              ${result?.suggestions && result.suggestions.length > 0 ? `
                <p style="margin-top: 15px; color: #475569;">ตัวอย่างค่าที่มีในระบบ:</p>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; justify-content: center;">
                  ${result.suggestions.slice(0, 10).map(val => 
                    `<span style="background: #e2e8f0; padding: 5px 12px; border-radius: 12px; font-size: 12px;">${val}</span>`
                  ).join('')}
                </div>
              ` : ''}
            </div>
            `
          }
        </div>
        
        ${result?.debug ? `
          <div class="debug-info">
            <strong>Debug Information:</strong><br>
            Total Rows: ${result.debug.totalRows}<br>
            Search Value: "${result.debug.searchValue}"<br>
            Length: ${result.debug.searchValueLength}<br>
            Sample Values: ${JSON.stringify(result.debug.sampleValues, null, 2)}
          </div>
        ` : ''}
      </div>
    </div>
    
    <div class="footer">
      <p>ระบบค้นหาข้อมูลจาก Google Sheet | โครงการผ่ากล</p>
      <p style="margin-top: 5px; font-size: 12px; opacity: 0.7;">
        <i class="fas fa-sync-alt"></i> อัปเดตล่าสุด: ${new Date().toLocaleString('th-TH')}
      </p>
    </div>
  </div>
  
  <script>
    function handleSearch(event) {
      event.preventDefault();
      const searchInput = document.getElementById('searchInput');
      const value = searchInput.value.trim();
      
      if (!value) {
        alert('กรุณากรอกค่าที่ต้องการค้นหา');
        return;
      }
      
      // Show loading
      document.querySelector('.result-content').innerHTML = \`
        <div class="loading">
          <div class="loading-spinner"></div>
          <p>กำลังค้นหา "\${value}"...</p>
        </div>
      \`;
      
      // Redirect to search
      window.location.href = \`?q=\${encodeURIComponent(value)}\`;
    }
    
    function testSearch(value) {
      document.getElementById('searchInput').value = value;
      document.getElementById('searchForm').submit();
    }
    
    // Auto focus on input
    document.getElementById('searchInput').focus();
  </script>
</body>
</html>
  `;
  
  return HtmlService.createHtmlOutput(html)
    .setTitle('ระบบค้นหา IN-TECH')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// 🧪 TEST FUNCTIONS
function runTest() {
  console.clear();
  console.log('🧪 === เริ่มทดสอบระบบค้นหา ===\n');
  
  // ทดสอบกับหลายๆ ค่า
  const testCases = [
    CONFIG.DEFAULT_SEARCH_VALUE,
    '1000114511',
    ' 1000114511 ',
    'test',
    ''
  ];
  
  testCases.forEach((testValue, index) => {
    console.log(`\n📝 Test ${index + 1}/${testCases.length}: "${testValue}"`);
    console.log('='.repeat(50));
    
    const result = advancedSearch(testValue);
    
    if (result.success) {
      console.log(`✅ SUCCESS: Found ${result.count} match(es)`);
      result.matches.forEach(match => {
        console.log(`   📍 ${match.columnLetter}${match.row}: ${match.displayValue}`);
      });
    } else {
      console.log(`❌ FAILED: ${result.message || result.error}`);
      if (result.debug) {
        console.log('   🔍 Debug info available');
      }
    }
  });
  
  console.log('\n🧪 === การทดสอบเสร็จสิ้น ===');
}

function quickTest() {
  console.log('⚡ ทดสอบด่วน');
  const result = advancedSearch(CONFIG.DEFAULT_SEARCH_VALUE);
  console.log(JSON.stringify(result, null, 2));
  return result;
}

// 🚀 DEPLOYMENT HELPER
function deployWebApp() {
  console.log('🚀 เตรียม Deploy Web App...');
  
  // ตรวจสอบการตั้งค่า
  const check = advancedSearch(CONFIG.DEFAULT_SEARCH_VALUE);
  
  if (check.success) {
    console.log('✅ ระบบพร้อมสำหรับการ Deploy');
    console.log('\n📋 ขั้นตอนการ Deploy:');
    console.log('1. ไปที่เมนู Deploy → New Deployment');
    console.log('2. เลือก Type: Web App');
    console.log('3. Execute as: Me');
    console.log('4. Who has access: Anyone');
    console.log('5. กด Deploy');
    console.log('\n🔗 URL จะปรากฏหลังจาก Deploy สำเร็จ');
  } else {
    console.log('❌ ระบบมีปัญหา กรุณาแก้ไขก่อน Deploy');
    console.log('ข้อผิดพลาด:', check.error || check.message);
  }
}

// 📊 CHECK SHEET INFO
function getSheetInfo() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    
    const info = {
      spreadsheetId: CONFIG.SPREADSHEET_ID,
      spreadsheetName: ss.getName(),
      sheetName: sheet.getName(),
      sheetIndex: sheet.getIndex(),
      lastRow: sheet.getLastRow(),
      lastColumn: sheet.getLastColumn(),
      url: ss.getUrl(),
      allSheets: ss.getSheets().map(s => ({
        name: s.getName(),
        index: s.getIndex(),
        rows: s.getLastRow(),
        cols: s.getLastColumn()
      }))
    };
    
    console.log('📊 Sheet Information:');
    console.log(JSON.stringify(info, null, 2));
    
    return info;
  } catch (error) {
    console.error('❌ ผิดพลาด:', error);
    return { error: error.toString() };
  }
}

// 🎯 INITIALIZE AND RUN
function initialize() {
  console.log('🚀 เริ่มต้นระบบค้นหา IN-TECH');
  console.log('='.repeat(50));
  
  // 1. ตรวจสอบข้อมูล Sheet
  console.log('\n1. 📋 ตรวจสอบข้อมูล Sheet...');
  const sheetInfo = getSheetInfo();
  
  if (sheetInfo.error) {
    console.error('❌ ไม่สามารถเข้าถึง Sheet ได้');
    console.error('แก้ไข CONFIG.SPREADSHEET_ID และ CONFIG.SHEET_NAME');
    return;
  }
  
  // 2. ทดสอบการค้นหา
  console.log('\n2. 🧪 ทดสอบการค้นหา...');
  runTest();
  
  // 3. แสดงข้อมูลสำหรับ Deploy
  console.log('\n3. 🌐 เตรียมการสำหรับ Web App...');
  deployWebApp();
  
  console.log('\n✅ การเริ่มต้นระบบเสร็จสิ้น');
  console.log('👉 ใช้ฟังก์ชัน quickTest() สำหรับทดสอบด่วน');
  console.log('👉 ใช้ฟังก์ชัน doGet() สำหรับ Web App');
}
