// ฟังก์ชันค้นหาแบบละเอียด (แทนที่ฟังก์ชัน searchData เดิม)
function performDetailSearch(searchTerm) {
    console.log("🔍 เริ่มค้นหา:", searchTerm);
    
    // ถ้าไม่มีข้อมูล
    if (!sheetData || sheetData.length === 0) {
        console.error("❌ ไม่มีข้อมูลในระบบ");
        showMessage('error', 'ไม่มีข้อมูลในระบบ โปรดโหลดข้อมูลก่อน');
        return [];
    }
    
    console.log("📊 ข้อมูลทั้งหมดมี", sheetData.length, "รายการ");
    console.log("ตัวอย่างข้อมูลแรก:", sheetData[0]);
    
    // หาคอลัมน์ที่เกี่ยวข้องกับเลขแปลง
    const possibleLotColumns = findLotNumberColumns();
    console.log("🔎 คอลัมน์ที่อาจเป็นเลขแปลง:", possibleLotColumns);
    
    // ค้นหาแบบละเอียด
    const results = searchInAllFormats(searchTerm, possibleLotColumns);
    
    // แสดงผลลัพธ์
    displaySearchResults(results, searchTerm);
    
    return results;
}

// หาคอลัมน์ที่เกี่ยวข้องกับเลขแปลง
function findLotNumberColumns() {
    if (sheetData.length === 0) return [];
    
    const firstRow = sheetData[0];
    const allColumns = Object.keys(firstRow);
    
    // รายการคำที่เกี่ยวข้องกับเลขแปลง
    const lotKeywords = [
        'แปลง', 'แปลงที่', 'เลขที่แปลง', 'lot', 'number', 'id', 'รหัส',
        'หมายเลข', 'เลข', 'no', 'code', 'แปลงที่ดิน', 'ที่แปลง'
    ];
    
    return allColumns.filter(column => {
        const columnLower = column.toLowerCase();
        return lotKeywords.some(keyword => columnLower.includes(keyword));
    });
}

// ค้นหาในทุกรูปแบบ
function searchInAllFormats(searchTerm, targetColumns) {
    const results = [];
    const searchVariations = generateSearchVariations(searchTerm);
    
    console.log("🔄 รูปแบบการค้นหาที่ใช้:", searchVariations);
    
    sheetData.forEach((row, index) => {
        let found = false;
        let foundInColumn = '';
        let foundValue = '';
        
        // ถ้ามีคอลัมน์เป้าหมาย ให้ค้นหาเฉพาะคอลัมน์เหล่านั้น
        const columnsToCheck = targetColumns.length > 0 ? targetColumns : Object.keys(row);
        
        columnsToCheck.forEach(column => {
            const cellValue = String(row[column] || '').trim();
            
            if (!cellValue) return;
            
            // ตรวจสอบทุกรูปแบบ
            for (const variation of searchVariations) {
                if (cellValue === variation || cellValue.includes(variation)) {
                    found = true;
                    foundInColumn = column;
                    foundValue = cellValue;
                    console.log(`✅ พบในแถว ${index + 1}, คอลัมน์ "${column}": "${cellValue}"`);
                    break;
                }
            }
            
            // ค้นหาแบบไม่สนใจตัวพิมพ์ใหญ่เล็ก
            if (!found && cellValue.toLowerCase().includes(searchTerm.toLowerCase())) {
                found = true;
                foundInColumn = column;
                foundValue = cellValue;
                console.log(`✅ พบ (ไม่สนใจ case) ในแถว ${index + 1}, คอลัมน์ "${column}": "${cellValue}"`);
            }
        });
        
        if (found) {
            results.push({
                ...row,
                _foundInColumn: foundInColumn,
                _foundValue: foundValue,
                _rowIndex: index
            });
        }
    });
    
    return results;
}

// สร้างรูปแบบการค้นหาหลายแบบ
function generateSearchVariations(searchTerm) {
    const variations = new Set();
    
    variations.add(searchTerm);
    variations.add(searchTerm.trim());
    variations.add(searchTerm.replace(/\s/g, ''));
    variations.add(searchTerm.replace(/[^0-9a-zA-Z]/g, ''));
    
    // ถ้าเป็นตัวเลข
    if (/^\d+$/.test(searchTerm)) {
        variations.add(parseInt(searchTerm).toString());
        variations.add(searchTerm.padStart(10, '0'));
    }
    
    // ถ้ามีตัวอักษรผสม
    if (/[a-zA-Z]/.test(searchTerm)) {
        variations.add(searchTerm.toUpperCase());
        variations.add(searchTerm.toLowerCase());
    }
    
    return Array.from(variations);
}

// แสดงผลการค้นหา
function displaySearchResults(results, searchTerm) {
    const resultsContainer = document.getElementById('resultsContainer') || 
                            document.getElementById('resultBox') ||
                            document.querySelector('.result-box');
    
    if (!resultsContainer) {
        console.error("❌ ไม่พบ element สำหรับแสดงผล");
        return;
    }
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-data">
                <h3>❌ ไม่พบข้อมูลที่ตรงกับ "${searchTerm}"</h3>
                <p>ลองค้นหาแบบอื่น:</p>
                <ul>
                    <li>เฉพาะตัวเลข: "${searchTerm.replace(/\D/g, '')}"</li>
                    <li>เฉพาะตัวอักษร: "${searchTerm.replace(/[^a-zA-Z]/g, '')}"</li>
                    <li>ตัวพิมพ์ใหญ่: "${searchTerm.toUpperCase()}"</li>
                    <li>ตัวพิมพ์เล็ก: "${searchTerm.toLowerCase()}"</li>
                </ul>
                <p style="margin-top: 20px; color: #666;">
                    ข้อมูลในระบบมี ${sheetData.length} รายการ<br>
                    ลองตรวจสอบ Console (F12) เพื่อดูข้อมูลทั้งหมด
                </p>
            </div>
        `;
    } else {
        let html = `
            <div style="margin-bottom: 20px; padding: 15px; background: #e8f4f8; border-radius: 8px;">
                <h3 style="color: #1e3c72; margin: 0;">
                    ✅ พบ ${results.length} รายการที่ตรงกับ "${searchTerm}"
                </h3>
            </div>
        `;
        
        results.forEach((result, index) => {
            html += `
                <div class="result-card" style="
                    background: white; 
                    border: 1px solid #ddd; 
                    border-radius: 8px; 
                    padding: 20px; 
                    margin-bottom: 15px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                ">
                    <div style="
                        background: #1e3c72; 
                        color: white; 
                        padding: 10px; 
                        border-radius: 5px;
                        margin-bottom: 15px;
                    ">
                        <strong>ผลการค้นหาที่ ${index + 1}</strong>
                        ${result._foundInColumn ? ` (พบในคอลัมน์: ${result._foundInColumn})` : ''}
                    </div>
            `;
            
            // แสดงข้อมูลทั้งหมด
            Object.keys(result).forEach(key => {
                if (key.startsWith('_')) return; // ข้ามข้อมูลระบบ
                
                const value = result[key] || '';
                const isMatch = value.includes(searchTerm) || 
                              value.toLowerCase().includes(searchTerm.toLowerCase());
                
                html += `
                    <div style="
                        display: flex; 
                        padding: 8px 0; 
                        border-bottom: 1px solid #eee;
                        ${isMatch ? 'background: #fff9c4;' : ''}
                    ">
                        <div style="flex: 1; font-weight: bold; color: #555;">
                            ${key}:
                        </div>
                        <div style="flex: 2; color: #333;">
                            ${value}
                            ${isMatch ? ' 🎯' : ''}
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
        });
        
        resultsContainer.innerHTML = html;
    }
}

// แสดงข้อความ
function showMessage(type, message) {
    alert(`[${type.toUpperCase()}] ${message}`);
}

// ทดสอบค้นหา
function testSearch() {
    console.log("🧪 ทดสอบค้นหา '1000114511'");
    
    // ตรวจสอบข้อมูล
    console.log("📋 ข้อมูลทั้งหมด:", sheetData);
    console.log("🔢 จำนวนข้อมูล:", sheetData.length);
    
    // ค้นหา
    const results = performDetailSearch("1000114511");
    
    // ถ้าไม่เจอ ลองวิธีอื่น
    if (results.length === 0) {
        console.log("🔄 ลองค้นหาแบบอื่น...");
        
        // ค้นหาแบบละเอียดใน Console
        sheetData.forEach((row, index) => {
            console.log(`🔍 ตรวจสอบแถว ${index + 1}:`, row);
            
            // ตรวจสอบทุกคอลัมน์
            Object.keys(row).forEach(column => {
                const value = String(row[column] || '');
                if (value.includes('1000114511') || 
                    value.includes('10001145') ||
                    value.toLowerCase().includes('1000114511')) {
                    console.log(`🎯 พบที่แถว ${index + 1}, คอลัมน์ "${column}":`, value);
                }
            });
        });
    }
}
