// Google Sheets URL ของคุณ
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHlqFXL5N8DKNhyg8au_M9eypFk65rXRgXdCna7pO9gadqpHLmtcz8FHKeCaBlxuqGcIY60PxUhyu-/pub?output=csv';

// ตัวแปรเก็บข้อมูล
let allData = [];
let currentData = [];
let allHeaders = [];

// ฟังก์ชันหลักโหลดข้อมูล
async function loadData() {
    showLoading(true);
    
    try {
        // ดึงข้อมูลจาก Google Sheets
        const response = await fetch(SHEET_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        
        // ตรวจสอบว่าได้ข้อมูลมาหรือไม่
        if (!csvText || csvText.trim() === '') {
            throw new Error('ไม่พบข้อมูลใน Google Sheets');
        }
        
        // แปลง CSV เป็น JSON
        const jsonData = parseCSVToJSON(csvText);
        
        if (jsonData.length === 0) {
            throw new Error('ข้อมูลว่างเปล่า');
        }
        
        // เก็บข้อมูล
        allData = jsonData;
        currentData = [...jsonData];
        
        // แสดงข้อมูล
        displayData(jsonData);
        updateStatistics(jsonData);
        createFilterButtons(jsonData);
        updateJSONViewer(jsonData);
        
        // อัปเดตเวลาล่าสุด
        updateLastUpdated();
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error loading data:', error);
        showError(error.message);
        showLoading(false);
    }
}

// ฟังก์ชันแปลง CSV เป็น JSON
function parseCSVToJSON(csv) {
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) return [];
    
    // ดึง headers
    const headers = parseCSVLine(lines[0]);
    allHeaders = headers;
    
    // สร้าง array ของ objects
    const jsonData = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row = {};
        
        for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = values[j] || '';
        }
        
        jsonData.push(row);
    }
    
    return jsonData;
}

// ฟังก์ชันแยกค่า CSV (รองรับค่าที่มี comma ภายใน)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

// ฟังก์ชันแสดงข้อมูลในตาราง
function displayData(data) {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    const noDataMessage = document.getElementById('noDataMessage');
    const rowCountElement = document.getElementById('rowCount');
    
    // อัปเดตจำนวนแถว
    rowCountElement.textContent = `${data.length} รายการ`;
    
    // ตรวจสอบว่ามีข้อมูลหรือไม่
    if (data.length === 0) {
        tableHeader.innerHTML = '';
        tableBody.innerHTML = '';
        document.getElementById('dataTable').classList.add('d-none');
        noDataMessage.classList.remove('d-none');
        return;
    }
    
    // แสดงตาราง
    document.getElementById('dataTable').classList.remove('d-none');
    noDataMessage.classList.add('d-none');
    
    // ดึง headers
    const headers = Object.keys(data[0]);
    
    // สร้าง header row
    let headerHTML = '<tr>';
    headerHTML += '<th>#</th>';
    
    headers.forEach(header => {
        headerHTML += `<th>${header}</th>`;
    });
    
    headerHTML += '</tr>';
    tableHeader.innerHTML = headerHTML;
    
    // สร้าง data rows
    let bodyHTML = '';
    
    data.forEach((row, index) => {
        bodyHTML += '<tr>';
        bodyHTML += `<td>${index + 1}</td>`;
        
        headers.forEach(header => {
            const value = row[header] || '';
            // ตรวจสอบว่าเป็น URL หรือไม่
            if (value.startsWith('http')) {
                bodyHTML += `<td><a href="${value}" target="_blank">${value}</a></td>`;
            } else {
                bodyHTML += `<td>${value}</td>`;
            }
        });
        
        bodyHTML += '</tr>';
    });
    
    tableBody.innerHTML = bodyHTML;
}

// ฟังก์ชันอัปเดตสถิติ
function updateStatistics(data) {
    const statsSection = document.getElementById('statsSection');
    
    if (data.length === 0) {
        statsSection.innerHTML = '';
        return;
    }
    
    const headers = Object.keys(data[0]);
    let statsHTML = '';
    
    // สถิติ 1: จำนวนรายการทั้งหมด
    statsHTML += `
        <div class="col-md-3 mb-3">
            <div class="stat-card">
                <div class="stat-number">${data.length}</div>
                <div class="stat-label">รายการทั้งหมด</div>
            </div>
        </div>
    `;
    
    // สถิติ 2: จำนวนคอลัมน์
    statsHTML += `
        <div class="col-md-3 mb-3">
            <div class="stat-card">
                <div class="stat-number">${headers.length}</div>
                <div class="stat-label">จำนวนคอลัมน์</div>
            </div>
        </div>
    `;
    
    // สถิติ 3: ตัวอย่างข้อมูลจากคอลัมน์แรก
    if (headers.length > 0) {
        const firstColumn = headers[0];
        const uniqueValues = [...new Set(data.map(row => row[firstColumn]))];
        
        statsHTML += `
            <div class="col-md-3 mb-3">
                <div class="stat-card">
                    <div class="stat-number">${uniqueValues.length}</div>
                    <div class="stat-label">${firstColumn} ที่ไม่ซ้ำ</div>
                </div>
            </div>
        `;
    }
    
    // สถิติ 4: อัปเดตล่าสุด
    statsHTML += `
        <div class="col-md-3 mb-3">
            <div class="stat-card">
                <div class="stat-number"><i class="fas fa-check-circle text-success"></i></div>
                <div class="stat-label">เชื่อมต่อสำเร็จ</div>
            </div>
        </div>
    `;
    
    statsSection.innerHTML = statsHTML;
}

// ฟังก์ชันสร้างปุ่มกรองข้อมูล
function createFilterButtons(data) {
    const filterButtons = document.getElementById('filterButtons');
    
    if (data.length === 0 || allHeaders.length === 0) {
        filterButtons.innerHTML = '';
        return;
    }
    
    let buttonsHTML = '<button class="btn btn-outline-primary btn-sm" onclick="resetFilter()">ทั้งหมด</button>';
    
    // สร้างปุ่มกรองสำหรับแต่ละคอลัมน์
    allHeaders.forEach(header => {
        // ดึงค่าที่ไม่ซ้ำกัน (จำกัดที่ 10 ค่าแรก)
        const uniqueValues = [...new Set(data.map(row => row[header]))]
            .filter(value => value && value.trim() !== '')
            .slice(0, 10);
        
        if (uniqueValues.length > 0) {
            buttonsHTML += `
                <div class="dropdown">
                    <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                            data-bs-toggle="dropdown">
                        ${header}
                    </button>
                    <ul class="dropdown-menu">
                        ${uniqueValues.map(value => 
                            `<li><a class="dropdown-item" href="#" onclick="filterData('${header}', '${value.replace(/'/g, "\\'")}')">${value}</a></li>`
                        ).join('')}
                    </ul>
                </div>
            `;
        }
    });
    
    filterButtons.innerHTML = buttonsHTML;
}

// ฟังก์ชันกรองข้อมูล
function filterData(column, value) {
    const filteredData = allData.filter(row => 
        row[column] && row[column].toString().includes(value)
    );
    
    currentData = filteredData;
    displayData(filteredData);
    updateStatistics(filteredData);
    
    // อัปเดตปุ่มกรอง
    const buttons = document.querySelectorAll('#filterButtons button');
    buttons.forEach(btn => btn.classList.remove('active'));
}

// ฟังก์ชันรีเซ็ตการกรอง
function resetFilter() {
    currentData = [...allData];
    displayData(allData);
    updateStatistics(allData);
    
    // อัปเดตปุ่มกรอง
    const buttons = document.querySelectorAll('#filterButtons button');
    buttons.forEach(btn => btn.classList.remove('active'));
    buttons[0].classList.add('active');
}

// ฟังก์ชันค้นหาข้อมูล
function searchData() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        currentData = [...allData];
    } else {
        currentData = allData.filter(row => {
            return Object.values(row).some(value => 
                value && value.toString().toLowerCase().includes(searchTerm)
            );
        });
    }
    
    displayData(currentData);
    updateStatistics(currentData);
}

// ฟังก์ชันแสดง JSON Data
function updateJSONViewer(data) {
    const jsonOutput = document.getElementById('jsonOutput');
    jsonOutput.textContent = JSON.stringify(data, null, 2);
}

// ฟังก์ชันอัปเดตเวลาล่าสุด
function updateLastUpdated() {
    const now = new Date();
    const formattedDate = now.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    document.getElementById('lastUpdated').textContent = formattedDate;
}

// ฟังก์ชันรีเฟรชข้อมูล
function refreshData() {
    loadData();
}

// ฟังก์ชันแสดง Loading
function showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const dataTable = document.getElementById('dataTable');
    const noDataMessage = document.getElementById('noDataMessage');
    
    if (show) {
        loadingSpinner.style.display = 'block';
        dataTable.classList.add('d-none');
        noDataMessage.classList.add('d-none');
    } else {
        loadingSpinner.style.display = 'none';
    }
}

// ฟังก์ชันแสดงข้อผิดพลาด
function showError(message) {
    const tableBody = document.getElementById('tableBody');
    const noDataMessage = document.getElementById('noDataMessage');
    
    tableBody.innerHTML = '';
    noDataMessage.classList.remove('d-none');
    noDataMessage.innerHTML = `
        <div class="py-5">
            <i class="fas fa-exclamation-triangle fa-4x text-danger mb-3"></i>
            <h4 class="text-danger">เกิดข้อผิดพลาด</h4>
            <p>${message}</p>
            <button class="btn btn-custom mt-2" onclick="refreshData()">
                <i class="fas fa-redo me-2"></i>ลองอีกครั้ง
            </button>
        </div>
    `;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // โหลดข้อมูลครั้งแรก
    loadData();
    
    // ตั้งค่าค้นหาข้อมูลเมื่อพิมพ์
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keyup', searchData);
    
    // รีเฟรชข้อมูลทุก 5 นาที
    setInterval(refreshData, 5 * 60 * 1000);
});

// ฟังก์ชันดาวน์โหลดข้อมูลเป็น CSV
function downloadCSV() {
    if (allData.length === 0) return;
    
    const headers = allHeaders;
    const csvRows = [];
    
    // เพิ่ม header
    csvRows.push(headers.join(','));
    
    // เพิ่มข้อมูล
    allData.forEach(row => {
        const values = headers.map(header => {
            const value = row[header] || '';
            // Escape quotes and commas
            return `"${value.toString().replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    });
    
    // สร้างไฟล์ CSV
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = 'google-sheets-data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
