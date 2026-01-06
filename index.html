/**
 * ระบบจัดการข้อมูลแปลงที่ดินจาก Google Sheets
 * สคริปต์หลักสำหรับดึงข้อมูลและจัดการการแสดงผล
 */

// ==================== คอนฟิกเริ่มต้น ====================
const CONFIG = {
    // Google Sheets URL (จากที่คุณให้มา)
    SHEET_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHlqFXL5N8DKNhyg8au_M9eypFk65rXRgXdCna7pO9gadqpHLmtcz8FHKeCaBlxuqGcIY60PxUhyu-/pub?output=csv',
    
    // การตั้งค่า Pagination
    ITEMS_PER_PAGE: 20,
    
    // การตั้งค่า Auto-refresh (นาที)
    AUTO_REFRESH_INTERVAL: 10,
    
    // คอลัมน์ที่อาจเป็นเลขแปลง (ใช้สำหรับตรวจสอบอัตโนมัติ)
    POSSIBLE_PARCEL_COLUMNS: [
        'แปลง', 'เลขแปลง', 'หมายเลขแปลง', 'แปลงที่ดิน', 'parcel', 'plot',
        'ที่ดินแปลง', 'เลขที่ดิน', 'หมายเลขที่ดิน', 'lot', 'ที่ดิน'
    ]
};

// ==================== ตัวแปร Global ====================
let allData = [];                // ข้อมูลทั้งหมด
let filteredData = [];           // ข้อมูลที่ถูกกรองแล้ว
let currentPage = 1;            // หน้าปัจจุบัน
let headers = [];               // หัวคอลัมน์ทั้งหมด
let currentParcelData = null;   // ข้อมูลแปลงปัจจุบันที่กำลังดู

// ==================== ฟังก์ชันหลัก ====================

/**
 * โหลดข้อมูลจาก Google Sheets
 */
async function loadData() {
    showLoading(true);
    
    try {
        console.log('กำลังโหลดข้อมูลจาก:', CONFIG.SHEET_URL);
        
        // ดึงข้อมูล CSV
        const response = await fetch(CONFIG.SHEET_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        
        const csvText = await response.text();
        
        if (!csvText || csvText.trim() === '') {
            throw new Error('ไม่พบข้อมูลใน Google Sheets');
        }
        
        console.log('ได้ข้อมูล CSV ขนาด:', csvText.length, 'ตัวอักษร');
        
        // แปลง CSV เป็น JSON
        allData = parseCSV(csvText);
        
        if (allData.length === 0) {
            throw new Error('ข้อมูลว่างเปล่า');
        }
        
        // ดึง headers
        headers = Object.keys(allData[0]);
        
        console.log('โหลดข้อมูลสำเร็จ:', allData.length, 'แถว,', headers.length, 'คอลัมน์');
        
        // แสดงข้อมูล
        displayAllData();
        updateStatistics();
        updatePopularParcels();
        updateLastUpdated();
        
        showLoading(false);
        
    } catch (error) {
        console.error('เกิดข้อผิดพลาด:', error);
        showError(error.message);
        showLoading(false);
    }
}

/**
 * แปลง CSV เป็น JSON
 */
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) return [];
    
    // แยก headers (บรรทัดแรก)
    const headers = parseCSVLine(lines[0]);
    
    // สร้าง array ของ objects
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row = {};
        
        // กำหนดค่าให้แต่ละคอลัมน์
        for (let j = 0; j < headers.length; j++) {
            const header = headers[j].trim();
            const value = values[j] ? values[j].trim() : '';
            row[header] = value;
        }
        
        data.push(row);
    }
    
    return data;
}

/**
 * แยกค่าจาก CSV line (รองรับค่าที่มี comma ภายใน)
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

/**
 * แสดงข้อมูลทั้งหมดในตารางหลัก
 */
function displayAllData() {
    filteredData = [...allData];
    currentPage = 1;
    
    displayTable(filteredData);
    setupPagination(filteredData.length);
    updateStatistics();
    populateFilterColumns();
    
    // ซ่อนรายละเอียดแปลงถ้าอยู่ในโหมดแสดง
    closeParcelDetails();
}

/**
 * แสดงข้อมูลในตาราง
 */
function displayTable(data) {
    const tableBody = document.getElementById('mainTableBody');
    const tableHeader = document.getElementById('mainTableHeader');
    const emptyState = document.getElementById('emptyState');
    
    // ตรวจสอบว่ามีข้อมูลหรือไม่
    if (data.length === 0) {
        tableBody.innerHTML = '';
        emptyState.style.display = 'block';
        document.getElementById('paginationSection').style.display = 'none';
        document.getElementById('mainDataTable').style.display = 'none';
        return;
    }
    
    // แสดงตาราง
    emptyState.style.display = 'none';
    document.getElementById('paginationSection').style.display = 'block';
    document.getElementById('mainDataTable').style.display = 'table';
    
    // สร้าง header
    const headerKeys = Object.keys(data[0]);
    let headerHTML = '<tr>';
    headerHTML += '<th>#</th>';
    
    headerKeys.forEach(header => {
        headerHTML += `<th>${header}</th>`;
    });
    
    headerHTML += '<th>จัดการ</th>';
    headerHTML += '</tr>';
    
    tableHeader.innerHTML = headerHTML;
    
    // คำนวณขอบเขตข้อมูลที่จะแสดง (pagination)
    const startIndex = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + CONFIG.ITEMS_PER_PAGE, data.length);
    const pageData = data.slice(startIndex, endIndex);
    
    // สร้างแถวข้อมูล
    let bodyHTML = '';
    
    pageData.forEach((row, index) => {
        const rowIndex = startIndex + index + 1;
        bodyHTML += '<tr>';
        bodyHTML += `<td>${rowIndex}</td>`;
        
        headerKeys.forEach(header => {
            const value = row[header] || '';
            
            // ตรวจสอบว่าเป็นเลขแปลงหรือไม่
            if (isParcelColumn(header) && isParcelNumber(value)) {
                bodyHTML += `<td>
                    <span class="badge bg-primary parcel-badge me-2" 
                          onclick="showParcelData('${value}')" 
                          title="คลิกเพื่อดูข้อมูลแปลง">
                        ${value}
                    </span>
                </td>`;
            } else if (value.startsWith('http')) {
                bodyHTML += `<td>
                    <a href="${value}" target="_blank" class="text-primary text-decoration-none">
                        <i class="fas fa-external-link-alt me-1"></i>ลิงก์
                    </a>
                </td>`;
            } else {
                bodyHTML += `<td>${value}</td>`;
            }
        });
        
        // ปุ่มจัดการ
        bodyHTML += `<td>
            <button class="btn btn-sm btn-outline-primary me-1" 
                    onclick="showRowDetails(${rowIndex - 1})"
                    title="ดูรายละเอียด">
                <i class="fas fa-eye"></i>
            </button>
        </td>`;
        
        bodyHTML += '</tr>';
    });
    
    tableBody.innerHTML = bodyHTML;
    
    // อัปเดต pagination
    updatePaginationControls(data.length);
}

// ==================== ฟังก์ชันค้นหาแปลง ====================

/**
 * ค้นหาแปลงที่ดิน
 */
function searchParcel() {
    const input = document.getElementById('parcelSearchInput');
    const parcelNumber = input.value.trim();
    
    if (!parcelNumber) {
        alert('กรุณาป้อนเลขแปลงที่ต้องการค้นหา');
        return;
    }
    
    showParcelData(parcelNumber);
}

/**
 * แสดงข้อมูลแปลง
 */
function showParcelData(parcelNumber) {
    // ค้นหาข้อมูลทั้งหมดที่เกี่ยวข้องกับเลขแปลงนี้
    const parcelRecords = findParcelRecords(parcelNumber);
    
    if (parcelRecords.length === 0) {
        alert(`ไม่พบข้อมูลสำหรับแปลงหมายเลข: ${parcelNumber}`);
        return;
    }
    
    currentParcelData = {
        parcelNumber: parcelNumber,
        records: parcelRecords,
        totalRecords: parcelRecords.length
    };
    
    displayParcelDetails(parcelNumber, parcelRecords);
}

/**
 * ค้นหาข้อมูลที่เกี่ยวข้องกับเลขแปลง
 */
function findParcelRecords(parcelNumber) {
    return allData.filter(row => {
        // ค้นหาในทุกคอลัมน์
        return Object.values(row).some(value => {
            if (!value || typeof value !== 'string') return false;
            
            // แยกค่าออกเป็นส่วนๆ (รองรับรูปแบบเช่น "123-45")
            const valueParts = value.split(/[,\s-]+/);
            
            // ตรวจสอบแต่ละส่วน
            return valueParts.some(part => {
                const cleanPart = part.replace(/[^\d]/g, '');
                const cleanParcel = parcelNumber.replace(/[^\d]/g, '');
                
                // ตรวจสอบว่าเป็นเลขเดียวกันหรือมีส่วนที่ตรงกัน
                return cleanPart.includes(cleanParcel) || cleanParcel.includes(cleanPart);
            });
        });
    });
}

/**
 * แสดงรายละเอียดแปลง
 */
function displayParcelDetails(parcelNumber, records) {
    // แสดง section
    const section = document.getElementById('parcelDetailsSection');
    section.style.display = 'block';
    
    // อัปเดตหัวข้อ
    document.getElementById('currentParcelNumber').textContent = parcelNumber;
    
    // แสดงสรุป
    displayParcelSummary(parcelNumber, records);
    
    // แสดงตารางรายละเอียด
    displayParcelTable(records);
    
    // แสดงแปลงที่เกี่ยวข้อง
    showRelatedParcels(parcelNumber, records);
    
    // เลื่อนไปที่ส่วนนี้
    section.scrollIntoView({ behavior: 'smooth' });
    
    // ไฮไลท์แถวในตารางหลัก
    highlightParcelRows(parcelNumber);
}

/**
 * แสดงสรุปข้อมูลแปลง
 */
function displayParcelSummary(parcelNumber, records) {
    const summaryDiv = document.getElementById('parcelSummary');
    
    // วิเคราะห์ข้อมูล
    const analysis = analyzeParcelData(records);
    
    let summaryHTML = `
        <div class="col-md-3 mb-3">
            <div class="stat-card info-card">
                <div class="stat-number">${records.length}</div>
                <div class="stat-label">จำนวนรายการ</div>
            </div>
        </div>
    `;
    
    // เพิ่มการ์ดสำหรับคอลัมน์สำคัญ
    const importantColumns = headers.filter(header => 
        !CONFIG.POSSIBLE_PARCEL_COLUMNS.some(p => 
            header.toLowerCase().includes(p.toLowerCase())
        )
    ).slice(0, 3);
    
    importantColumns.forEach(column => {
        const values = records.map(r => r[column]).filter(v => v && v.trim() !== '');
        const uniqueValues = [...new Set(values)];
        
        summaryHTML += `
            <div class="col-md-3 mb-3">
                <div class="stat-card">
                    <div class="stat-number">${uniqueValues.length}</div>
                    <div class="stat-label">${column}</div>
                    ${uniqueValues.length > 0 ? `
                        <small class="text-muted mt-2 d-block">
                            ${uniqueValues.slice(0, 2).join(', ')}
                            ${uniqueValues.length > 2 ? '...' : ''}
                        </small>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    summaryDiv.innerHTML = `<div class="row">${summaryHTML}</div>`;
}

/**
 * แสดงตารางรายละเอียดแปลง
 */
function displayParcelTable(records) {
    const tableHeader = document.getElementById('parcelTableHeader');
    const tableBody = document.getElementById('parcelTableBody');
    
    // อัปเดตจำนวน
    document.getElementById('parcelItemsCount').textContent = records.length;
    
    // สร้าง header
    const headerKeys = headers;
    let headerHTML = '<tr><th>#</th>';
    
    headerKeys.forEach(header => {
        headerHTML += `<th>${header}</th>`;
    });
    
    headerHTML += '</tr>';
    tableHeader.innerHTML = headerHTML;
    
    // สร้างแถวข้อมูล
    let bodyHTML = '';
    
    records.forEach((row, index) => {
        bodyHTML += '<tr>';
        bodyHTML += `<td>${index + 1}</td>`;
        
        headerKeys.forEach(header => {
            const value = row[header] || '';
            
            // ไฮไลท์ข้อมูลที่เป็นเลขแปลง
            if (isParcelColumn(header) && isParcelNumber(value)) {
                bodyHTML += `<td class="bg-warning bg-opacity-25 fw-bold">${value}</td>`;
            } else if (value.startsWith('http')) {
                bodyHTML += `<td>
                    <a href="${value}" target="_blank" class="text-primary">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                </td>`;
            } else {
                bodyHTML += `<td>${value}</td>`;
            }
        });
        
        bodyHTML += '</tr>';
    });
    
    tableBody.innerHTML = bodyHTML;
}

/**
 * แสดงแปลงที่เกี่ยวข้อง
 */
function showRelatedParcels(mainParcel, records) {
    const relatedParcels = findRelatedParcels(mainParcel, records);
    
    if (relatedParcels.length === 0) {
        document.getElementById('relatedParcelsSection').style.display = 'none';
        return;
    }
    
    const container = document.getElementById('relatedParcels');
    let html = '';
    
    relatedParcels.forEach(parcel => {
        html += `
            <span class="badge bg-secondary p-2 cursor-pointer"
                  onclick="showParcelData('${parcel}')">
                <i class="fas fa-map-marker-alt me-1"></i>แปลง ${parcel}
            </span>
        `;
    });
    
    container.innerHTML = html;
    document.getElementById('relatedParcelsSection').style.display = 'block';
}

/**
 * หาแปลงที่เกี่ยวข้อง
 */
function findRelatedParcels(mainParcel, records) {
    const related = new Set();
    
    // ดูจากข้อมูลอื่นๆ ในแถวเดียวกัน
    records.forEach(record => {
        Object.entries(record).forEach(([key, value]) => {
            if (isParcelColumn(key) && isParcelNumber(value) && value !== mainParcel) {
                related.add(value);
            }
        });
    });
    
    return Array.from(related).slice(0, 10); // จำกัดที่ 10 แปลง
}

// ==================== ฟังก์ชันค้นหาทั่วไป ====================

/**
 * ค้นหาทั่วไป
 */
function searchGeneral() {
    const input = document.getElementById('generalSearchInput');
    const searchTerm = input.value.trim().toLowerCase();
    
    if (!searchTerm) {
        displayAllData();
        return;
    }
    
    // กรองข้อมูล
    filteredData = allData.filter(row => {
        return Object.values(row).some(value => {
            if (!value) return false;
            return value.toString().toLowerCase().includes(searchTerm);
        });
    });
    
    currentPage = 1;
    displayTable(filteredData);
    setupPagination(filteredData.length);
}

// ==================== ฟังก์ชันตัวกรอง ====================

/**
 * แสดง/ซ่อนตัวกรอง
 */
function toggleFilters() {
    const section = document.getElementById('filterSection');
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
}

/**
 * เติมคอลัมน์ให้ตัวกรอง
 */
function populateFilterColumns() {
    const select = document.getElementById('filterColumn');
    select.innerHTML = '<option value="">เลือกคอลัมน์...</option>';
    
    headers.forEach(header => {
        select.innerHTML += `<option value="${header}">${header}</option>`;
    });
}

/**
 * ใช้ตัวกรอง
 */
function applyFilter() {
    const column = document.getElementById('filterColumn').value;
    const value = document.getElementById('filterValue').value.trim();
    
    if (!column) {
        alert('กรุณาเลือกคอลัมน์ที่ต้องการกรอง');
        return;
    }
    
    if (!value) {
        clearFilters();
        return;
    }
    
    filteredData = allData.filter(row => {
        const cellValue = row[column] || '';
        return cellValue.toString().toLowerCase().includes(value.toLowerCase());
    });
    
    currentPage = 1;
    displayTable(filteredData);
    setupPagination(filteredData.length);
}

/**
 * ล้างตัวกรอง
 */
function clearFilters() {
    document.getElementById('filterColumn').value = '';
    document.getElementById('filterValue').value = '';
    displayAllData();
}

// ==================== ฟังก์ชัน Pagination ====================

/**
 * ตั้งค่า Pagination
 */
function setupPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / CONFIG.ITEMS_PER_PAGE);
    
    document.getElementById('totalFilteredRecords').textContent = totalItems;
    document.getElementById('currentPage').textContent = currentPage;
    
    // อัพเดตปุ่ม
    document.getElementById('prevBtn').disabled = currentPage <= 1;
    document.getElementById('nextBtn').disabled = currentPage >= totalPages;
    
    // อัพเดตแสดงผล
    const start = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE + 1;
    const end = Math.min(currentPage * CONFIG.ITEMS_PER_PAGE, totalItems);
    
    document.getElementById('startRecord').textContent = start;
    document.getElementById('endRecord').textContent = end;
}

/**
 * หน้าถัดไป
 */
function nextPage() {
    const totalPages = Math.ceil(filteredData.length / CONFIG.ITEMS_PER_PAGE);
    
    if (currentPage < totalPages) {
        currentPage++;
        displayTable(filteredData);
        setupPagination(filteredData.length);
    }
}

/**
 * หน้าก่อนหน้า
 */
function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayTable(filteredData);
        setupPagination(filteredData.length);
    }
}

/**
 * อัพเดตปุ่ม Pagination
 */
function updatePaginationControls(totalItems) {
    const totalPages = Math.ceil(totalItems / CONFIG.ITEMS_PER_PAGE);
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    
    document.getElementById('startRecord').textContent = 
        Math.min((currentPage - 1) * CONFIG.ITEMS_PER_PAGE + 1, totalItems);
    document.getElementById('endRecord').textContent = 
        Math.min(currentPage * CONFIG.ITEMS_PER_PAGE, totalItems);
    document.getElementById('totalFilteredRecords').textContent = totalItems;
    document.getElementById('currentPage').textContent = currentPage;
}

// ==================== ฟังก์ชันอัพเดต UI ====================

/**
 * อัพเดตสถิติ
 */
function updateStatistics() {
    const container = document.getElementById('statisticsCards');
    
    const totalRecords = allData.length;
    const totalColumns = headers.length;
    
    // หาจำนวนแปลงที่ต่างกัน
    const parcelNumbers = new Set();
    allData.forEach(row => {
        headers.forEach(header => {
            if (isParcelColumn(header) && isParcelNumber(row[header])) {
                parcelNumbers.add(row[header]);
            }
        });
    });
    
    // หาคอลัมน์ที่มีข้อมูลมากที่สุด
    let mostFilledColumn = '';
    let mostFilledCount = 0;
    
    headers.forEach(header => {
        const filledCount = allData.filter(row => row[header] && row[header].trim() !== '').length;
        if (filledCount > mostFilledCount) {
            mostFilledCount = filledCount;
            mostFilledColumn = header;
        }
    });
    
    container.innerHTML = `
        <div class="col-md-3 col-6">
            <div class="stat-card">
                <div class="stat-number">${totalRecords}</div>
                <div class="stat-label">รายการทั้งหมด</div>
            </div>
        </div>
        <div class="col-md-3 col-6">
            <div class="stat-card">
                <div class="stat-number">${parcelNumbers.size}</div>
                <div class="stat-label">แปลงที่ดิน</div>
            </div>
        </div>
        <div class="col-md-3 col-6">
            <div class="stat-card">
                <div class="stat-number">${totalColumns}</div>
                <div class="stat-label">คอลัมน์ข้อมูล</div>
            </div>
        </div>
        <div class="col-md-3 col-6">
            <div class="stat-card">
                <div class="stat-number">${Math.round((mostFilledCount / totalRecords) * 100)}%</div>
                <div class="stat-label">${mostFilledColumn}</div>
            </div>
        </div>
    `;
}

/**
 * อัพเดตแปลงยอดนิยม
 */
function updatePopularParcels() {
    const container = document.getElementById('popularParcels');
    
    // หาเลขแปลงที่พบบ่อย
    const parcelCounts = {};
    
    allData.forEach(row => {
        headers.forEach(header => {
            if (isParcelColumn(header)) {
                const value = row[header];
                if (isParcelNumber(value)) {
                    parcelCounts[value] = (parcelCounts[value] || 0) + 1;
                }
            }
        });
    });
    
    // เรียงลำดับและเลือก 8 อันดับแรก
    const popularParcels = Object.entries(parcelCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([parcel]) => parcel);
    
    let html = '';
    popularParcels.forEach(parcel => {
        html += `
            <span class="badge bg-light text-dark p-2 cursor-pointer"
                  onclick="showParcelData('${parcel}')">
                <i class="fas fa-hashtag me-1"></i>${parcel}
            </span>
        `;
    });
    
    container.innerHTML = html || '<span class="text-muted">ไม่พบข้อมูลแปลง</span>';
}

/**
 * อัพเดตเวลาล่าสุด
 */
function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    document.getElementById('lastUpdateTime').textContent = timeString;
    document.getElementById('footerUpdateTime').textContent = timeString;
}

// ==================== ฟังก์ชัน Utility ====================

/**
 * ตรวจสอบว่าคอลัมน์นี้เป็นคอลัมน์เลขแปลงหรือไม่
 */
function isParcelColumn(columnName) {
    const lowerName = columnName.toLowerCase();
    return CONFIG.POSSIBLE_PARCEL_COLUMNS.some(keyword => 
        lowerName.includes(keyword.toLowerCase())
    );
}

/**
 * ตรวจสอบว่าค่านี้เป็นเลขแปลงหรือไม่
 */
function isParcelNumber(value) {
    if (!value || typeof value !== 'string') return false;
    
    // ตรวจสอบว่ามีตัวเลขหรือไม่ (อย่างน้อย 1 ตัว)
    return /\d/.test(value);
}

/**
 * วิเคราะห์ข้อมูลแปลง
 */
function analyzeParcelData(records) {
    const analysis = {
        totalRecords: records.length,
        columns: {}
    };
    
    headers.forEach(header => {
        const values = records.map(r => r[header]).filter(v => v && v.trim() !== '');
        analysis.columns[header] = {
            filled: values.length,
            unique: [...new Set(values)].length,
            sample: values.slice(0, 3)
        };
    });
    
    return analysis;
}

/**
 * ไฮไลท์แถวในตารางหลัก
 */
function highlightParcelRows(parcelNumber) {
    const rows = document.querySelectorAll('#mainTableBody tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let shouldHighlight = false;
        
        cells.forEach(cell => {
            if (cell.textContent.includes(parcelNumber)) {
                shouldHighlight = true;
            }
        });
        
        if (shouldHighlight) {
            row.classList.add('highlight');
            setTimeout(() => row.classList.remove('highlight'), 1500);
        }
    });
}

/**
 * แสดงรายละเอียดแถว
 */
function showRowDetails(rowIndex) {
    const row = allData[rowIndex];
    let details = 'รายละเอียดข้อมูล:\n\n';
    
    Object.entries(row).forEach(([key, value]) => {
        details += `${key}: ${value || '(ว่าง)'}\n`;
    });
    
    alert(details);
}

/**
 * ปิดรายละเอียดแปลง
 */
function closeParcelDetails() {
    document.getElementById('parcelDetailsSection').style.display = 'none';
    currentParcelData = null;
}

/**
 * แสดงข้อมูลทั้งหมด (รีเซ็ต)
 */
function showAllData() {
    closeParcelDetails();
    displayAllData();
}

/**
 * แสดงสถานะ loading
 */
function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    loadingState.style.display = show ? 'block' : 'none';
}

/**
 * แสดงข้อผิดพลาด
 */
function showError(message) {
    const emptyState = document.getElementById('emptyState');
    emptyState.innerHTML = `
        <i class="fas fa-exclamation-triangle fa-4x text-danger mb-3"></i>
        <h4 class="text-danger">เกิดข้อผิดพลาด</h4>
        <p class="text-muted">${message}</p>
        <button class="btn btn-primary mt-3" onclick="loadData()">
            <i class="fas fa-redo me-1"></i>ลองอีกครั้ง
        </button>
    `;
    emptyState.style.display = 'block';
}

// ==================== ฟังก์ชัน Export ====================

/**
 * ดาวน์โหลด CSV
 */
function downloadCSV() {
    if (allData.length === 0) {
        alert('ไม่มีข้อมูลให้ดาวน์โหลด');
        return;
    }
    
    // สร้าง CSV
    let csvContent = headers.join(',') + '\n';
    
    allData.forEach(row => {
        const rowValues = headers.map(header => {
            const value = row[header] || '';
            // Escape quotes and commas
            return `"${value.toString().replace(/"/g, '""')}"`;
        });
        csvContent += rowValues.join(',') + '\n';
    });
    
    // สร้าง Blob และดาวน์โหลด
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.href = url;
    link.download = `parcel-data-${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
}

/**
 * Export เป็น JSON
 */
function exportToJSON() {
    if (allData.length === 0) {
        alert('ไม่มีข้อมูลให้ export');
        return;
    }
    
    const jsonString = JSON.stringify(allData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.href = url;
    link.download = `parcel-data-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

/**
 * แสดง Raw Data
 */
function showRawData() {
    const modal = new bootstrap.Modal(document.getElementById('rawDataModal'));
    const content = document.getElementById('rawDataContent');
    
    content.textContent = JSON.stringify(allData, null, 2);
    modal.show();
}

/**
 * รีเฟรชข้อมูล
 */
function refreshData() {
    loadData();
}

// ==================== การเริ่มต้นระบบ ====================

// เมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', function() {
    // โหลดข้อมูล
    loadData();
    
    // ตั้งค่า Auto-refresh
    setInterval(refreshData, CONFIG.AUTO_REFRESH_INTERVAL * 60 * 1000);
    
    // ตั้งค่า Event Listeners
    document.getElementById('parcelSearchInput').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            searchParcel();
        }
    });
    
    document.getElementById('generalSearchInput').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            searchGeneral();
        }
    });
    
    // ตรวจสอบ URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const parcelParam = urlParams.get('parcel');
    
    if (parcelParam) {
        setTimeout(() => {
            document.getElementById('parcelSearchInput').value = parcelParam;
            showParcelData(parcelParam);
        }, 1000);
    }
});

// เปิดเผยฟังก์ชันสำคัญให้เรียกจาก HTML ได้
window.searchParcel = searchParcel;
window.searchGeneral = searchGeneral;
window.showParcelData = showParcelData;
window.closeParcelDetails = closeParcelDetails;
window.showAllData = showAllData;
window.refreshData = refreshData;
window.nextPage = nextPage;
window.prevPage = prevPage;
window.toggleFilters = toggleFilters;
window.applyFilter = applyFilter;
window.clearFilters = clearFilters;
window.downloadCSV = downloadCSV;
window.exportToJSON = exportToJSON;
window.showRawData = showRawData;
window.showRowDetails = showRowDetails;
