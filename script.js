// ตัวอย่าง Google Sheets URL (เปลี่ยนเป็นของคุณ)
const DEFAULT_SHEET_ID = '1XyZAbcDefGhIjKlMnOpQrStUvWxYz1234567890';
const DEFAULT_SHEET_NAME = 'Sheet1';

// ฟังก์ชันโหลดข้อมูลจาก Google Sheets
async function loadData() {
    const sheetUrlInput = document.getElementById('sheetUrl').value;
    const sheetIdInput = document.getElementById('sheetId').value;
    
    let csvUrl;
    
    if (sheetUrlInput) {
        // ใช้ URL ที่ผู้ใช้ใส่
        csvUrl = sheetUrlInput;
    } else if (sheetIdInput) {
        // สร้าง URL จาก Sheet ID
        csvUrl = `https://docs.google.com/spreadsheets/d/${sheetIdInput}/gviz/tq?tqx=out:csv&sheet=${DEFAULT_SHEET_NAME}`;
    } else {
        // ใช้ค่า default
        csvUrl = `https://docs.google.com/spreadsheets/d/${DEFAULT_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${DEFAULT_SHEET_NAME}`;
    }
    
    // แสดง loading
    document.getElementById('loading').classList.remove('d-none');
    
    try {
        // ดึงข้อมูล CSV
        const response = await fetch(csvUrl);
        const csvText = await response.text();
        
        // แปลง CSV เป็น array
        const data = parseCSV(csvText);
        
        // แสดงข้อมูลในตาราง
        displayData(data);
        
        // อัปเดตเวลาล่าสุด
        document.getElementById('updateTime').textContent = new Date().toLocaleString('th-TH');
        
    } catch (error) {
        console.error('Error loading data:', error);
        alert('ไม่สามารถโหลดข้อมูลได้: ' + error.message);
    } finally {
        // ซ่อน loading
        document.getElementById('loading').classList.add('d-none');
    }
}

// ฟังก์ชันแปลง CSV เป็น array
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const result = [];
    
    // กำหนด headers (บรรทัดแรก)
    const headers = lines[0].split(',').map(header => header.trim());
    
    // วนลูปแต่ละบรรทัด (เริ่มจากบรรทัดที่ 2)
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const obj = {};
        const currentLine = lines[i].split(',');
        
        // กำหนดค่าให้แต่ละคอลัมน์
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentLine[j] ? currentLine[j].trim() : '';
        }
        
        result.push(obj);
    }
    
    return result;
}

// ฟังก์ชันแสดงข้อมูลในตาราง
function displayData(data) {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    
    // ล้างข้อมูลเก่า
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center text-muted py-4">
                    <i class="fas fa-database fa-2x mb-3"></i><br>
                    ไม่พบข้อมูล
                </td>
            </tr>
        `;
        return;
    }
    
    // สร้าง header
    const headers = Object.keys(data[0]);
    let headerHTML = '<tr><th>#</th>';
    
    headers.forEach(header => {
        headerHTML += `<th>${header}</th>`;
    });
    
    headerHTML += '</tr>';
    tableHeader.innerHTML = headerHTML;
    
    // สร้างแถวข้อมูล
    let bodyHTML = '';
    
    data.forEach((row, index) => {
        bodyHTML += `<tr><td>${index + 1}</td>`;
        
        headers.forEach(header => {
            bodyHTML += `<td>${row[header] || ''}</td>`;
        });
        
        bodyHTML += '</tr>';
    });
    
    tableBody.innerHTML = bodyHTML;
}

// ฟังก์ชันรีเฟรชข้อมูล
function refreshData() {
    loadData();
}

// โหลดข้อมูลเมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    
    // ออปชันสำหรับใช้ SheetDB.io (ถ้าต้องการ)
    document.getElementById('sheetUrl').placeholder = 
        "ตัวอย่าง: https://docs.google.com/spreadsheets/d/1XyZ.../export?format=csv";
});

// วิธีทางเลือก: ใช้ SheetDB.io API
async function loadDataFromSheetDB() {
    // ลงทะเบียนที่ sheetdb.io และใช้ API ของคุณ
    const sheetDbApi = 'https://sheetdb.io/api/v1/YOUR_API_ID';
    
    try {
        const response = await fetch(sheetDbApi);
        const data = await response.json();
        displayJSONData(data);
    } catch (error) {
        console.error('Error:', error);
    }
}

// สำหรับข้อมูล JSON จาก SheetDB
function displayJSONData(data) {
    // ปรับโค้ดตามโครงสร้าง JSON ที่ได้
    console.log(data);
}
