// ============================================
// Google Sheet Viewer with IN-TECH Search
// ============================================

const CONFIG = {
    SHEET_ID: '15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw',
    SHEET_NAME: 'สถานะ',
    
    // ลองทีละวิธี (ระบบจะลองเองอัตโนมัติ)
    URL_METHODS: [
        {
            name: 'Published CSV',
            url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHlqFXL5N8DKNhyg8au_M9eypFk65rXRgXdCna7pO9gadqpHLmtcz8FHKeCaBlxuqGcIY60PxUhyu-/pub?gid=980262450&single=true&output=csv',
            type: 'csv'
        },
        {
            name: 'Opensheet',
            url: 'https://opensheet.elk.sh/15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw/สถานะ',
            type: 'json'
        },
        {
            name: 'Export CSV',
            url: 'https://docs.google.com/spreadsheets/d/15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw/export?format=csv',
            type: 'csv'
        },
        {
            name: 'gviz/tq CSV',
            url: 'https://docs.google.com/spreadsheets/d/15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw/gviz/tq?tqx=out:csv',
            type: 'csv'
        }
    ],
    
    // คอลัมน์ที่ใช้ค้นหาเลขแปลง (ปรับตามข้อมูลจริง)
    SEARCH_COLUMNS: ['เลขแปลงและยกั', 'เลขโครงขา้', 'ชื่อราคาไฟ', 'ชื่อมโยงเกษตร'],
    
    ITEMS_PER_PAGE: 10,
    CURRENT_METHOD_INDEX: 0
};

let allData = [];
let currentPage = 1;
let currentSearchResults = null;
let searchHistory = [];

// เมื่อหน้าเว็บโหลด
$(document).ready(function() {
    console.log('🚀 ระบบค้นหาเลขแปลง IN-TECH');
    
    initializeUI();
    loadData();
    
    // โหลดประวัติการค้นหาจาก localStorage
    loadSearchHistory();
});

function initializeUI() {
    // ปุ่มโหลดข้อมูล
    $('#loadDataBtn').click(function() {
        loadData(true);
        $(this).html('<i class="fas fa-spinner fa-spin"></i> โหลด...');
        setTimeout(() => $(this).html('<i class="fas fa-sync"></i> โหลดข้อมูล'), 1000);
    });
    
    // ปุ่มค้นหาเลขแปลง
    $('#searchIntechBtn').click(searchIntech);
    
    // ปุ่มค้นหาทั่วไป
    $('#searchGeneralBtn').click(searchGeneral);
    
    // ปุ่มล้างค้นหา
    $('#clearSearchBtn').click(clearSearch);
    
    // ปุ่มดูประวัติ
    $('#viewHistoryBtn').click(showSearchHistory);
    
    // ค้นหาเมื่อกด Enter
    $('#searchInput').keypress(function(e) {
        if (e.which === 13) {
            searchIntech();
        }
    });
    
    // ค้นหาทั่วไปเมื่อกด Enter
    $('#generalSearchInput').keypress(function(e) {
        if (e.which === 13) {
            searchGeneral();
        }
    });
}

// โหลดข้อมูล
function loadData(forceRefresh = false) {
    showLoading(true);
    $('#status').html('<div class="alert alert-info">กำลังโหลดข้อมูล...</div>');
    
    // ลองวิธีแรก
    tryMethod(0, forceRefresh);
}

function tryMethod(index, forceRefresh) {
    if (index >= CONFIG.URL_METHODS.length) {
        showError('ไม่สามารถเชื่อมต่อกับ Google Sheet ได้');
        showLoading(false);
        return;
    }
    
    const method = CONFIG.URL_METHODS[index];
    console.log(`🔄 ลองวิธี: ${method.name}`);
    
    if (method.type === 'json') {
        // ใช้ opensheet (JSON)
        $.ajax({
            url: method.url,
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                handleDataSuccess(data, method.name);
            },
            error: function() {
                console.log(`❌ ${method.name} ล้มเหลว`);
                tryMethod(index + 1, forceRefresh);
            }
        });
    } else {
        // ใช้ CSV
        Papa.parse(method.url, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                if (results.data && results.data.length > 0) {
                    handleDataSuccess(results.data, method.name);
                } else {
                    console.log(`❌ ${method.name} ไม่มีข้อมูล`);
                    tryMethod(index + 1, forceRefresh);
                }
            },
            error: function() {
                console.log(`❌ ${method.name} ล้มเหลว`);
                tryMethod(index + 1, forceRefresh);
            }
        });
    }
}

function handleDataSuccess(data, methodName) {
    console.log(`✅ ${methodName} สำเร็จ: ${data.length} รายการ`);
    
    allData = data;
    currentSearchResults = null;
    
    // แสดงข้อมูล
    displayData(allData);
    
    // อัปเดตสถิติ
    updateStats();
    
    // แสดงข้อความสำเร็จ
    showSuccess(`โหลดข้อมูลสำเร็จ ${data.length} รายการ (ใช้ ${methodName})`);
    
    showLoading(false);
    
    // ตรวจสอบคอลัมน์ที่มี
    checkAvailableColumns();
}

// ============================================
// ฟังก์ชันค้นหาเลขแปลง IN-TECH
// ============================================

// ฟังก์ชันค้นหาเลขแปลง (เฉพาะ IN-TECH)
function searchIntech() {
    const searchValue = $('#searchInput').val().trim();
    
    if (!searchValue) {
        showWarning('กรุณากรอกเลขแปลงที่ต้องการค้นหา');
        return;
    }
    
    if (allData.length === 0) {
        showWarning('ยังไม่มีข้อมูล โปรดโหลดข้อมูลก่อน');
        return;
    }
    
    console.log(`🔍 ค้นหาเลขแปลง: "${searchValue}"`);
    
    // ค้นหาในคอลัมน์ที่กำหนด
    const results = searchInColumns(searchValue, CONFIG.SEARCH_COLUMNS);
    
    if (results.length === 0) {
        showWarning(`ไม่พบเลขแปลง "${searchValue}"`);
        return;
    }
    
    // บันทึกประวัติการค้นหา
    saveToSearchHistory({
        type: 'เลขแปลง',
        keyword: searchValue,
        results: results.length,
        timestamp: new Date().toISOString()
    });
    
    // แสดงผลการค้นหา
    displaySearchResults(results, searchValue);
    
    // แสดงข้อความสำเร็จ
    showSuccess(`พบ ${results.length} รายการที่ตรงกับ "${searchValue}"`);
}

// ฟังก์ชันค้นหาทั่วไป
function searchGeneral() {
    const searchValue = $('#generalSearchInput').val().trim();
    
    if (!searchValue) {
        showWarning('กรุณากรอกคำค้นหา');
        return;
    }
    
    if (allData.length === 0) {
        showWarning('ยังไม่มีข้อมูล โปรดโหลดข้อมูลก่อน');
        return;
    }
    
    console.log(`🔍 ค้นหาทั่วไป: "${searchValue}"`);
    
    // ค้นหาในทุกคอลัมน์
    const results = searchInAllColumns(searchValue);
    
    if (results.length === 0) {
        showWarning(`ไม่พบ "${searchValue}"`);
        return;
    }
    
    // บันทึกประวัติการค้นหา
    saveToSearchHistory({
        type: 'ทั่วไป',
        keyword: searchValue,
        results: results.length,
        timestamp: new Date().toISOString()
    });
    
    // แสดงผลการค้นหา
    displaySearchResults(results, searchValue);
    
    // แสดงข้อความสำเร็จ
    showSuccess(`พบ ${results.length} รายการที่ตรงกับ "${searchValue}"`);
}

// ค้นหาในคอลัมน์ที่กำหนด
function searchInColumns(searchValue, columns) {
    const searchLower = searchValue.toLowerCase();
    const results = [];
    
    allData.forEach((row, index) => {
        let found = false;
        
        columns.forEach(column => {
            if (row[column]) {
                const cellValue = String(row[column]).toLowerCase();
                if (cellValue.includes(searchLower)) {
                    found = true;
                }
            }
        });
        
        if (found) {
            results.push({
                ...row,
                _rowIndex: index
            });
        }
    });
    
    return results;
}

// ค้นหาในทุกคอลัมน์
function searchInAllColumns(searchValue) {
    const searchLower = searchValue.toLowerCase();
    const results = [];
    
    allData.forEach((row, index) => {
        let found = false;
        
        Object.keys(row).forEach(column => {
            if (row[column]) {
                const cellValue = String(row[column]).toLowerCase();
                if (cellValue.includes(searchLower)) {
                    found = true;
                }
            }
        });
        
        if (found) {
            results.push({
                ...row,
                _rowIndex: index
            });
        }
    });
    
    return results;
}

// แสดงผลการค้นหา
function displaySearchResults(results, searchTerm) {
    currentSearchResults = results;
    currentPage = 1;
    
    // สร้าง HTML สำหรับผลการค้นหา
    let html = `
        <div class="card mb-3 border-primary">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">
                    <i class="fas fa-search me-2"></i>
                    ผลการค้นหา: "${searchTerm}"
                    <span class="badge bg-light text-primary ms-2">${results.length} รายการ</span>
                </h5>
            </div>
            <div class="card-body">
    `;
    
    if (results.length > 0) {
        // แสดงข้อมูลในตาราง
        html += createResultsTable(results);
    }
    
    html += `
            </div>
            <div class="card-footer">
                <button class="btn btn-sm btn-outline-primary" onclick="exportSearchResults()">
                    <i class="fas fa-download me-1"></i> ดาวน์โหลดผลการค้นหา
                </button>
                <button class="btn btn-sm btn-outline-secondary ms-2" onclick="clearSearch()">
                    <i class="fas fa-times me-1"></i> ล้างการค้นหา
                </button>
            </div>
        </div>
    `;
    
    $('#searchResults').html(html);
    
    // แสดงข้อมูลในตารางหลักด้วย
    displayData(results);
}

// สร้างตารางผลการค้นหา
function createResultsTable(results) {
    if (results.length === 0) return '';
    
    const headers = Object.keys(results[0]).filter(h => !h.startsWith('_'));
    const startIdx = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const endIdx = Math.min(startIdx + CONFIG.ITEMS_PER_PAGE, results.length);
    
    let html = `
        <div class="table-responsive">
            <table class="table table-sm table-hover">
                <thead>
                    <tr>
                        <th width="50">#</th>
    `;
    
    // แสดงเฉพาะคอลัมน์สำคัญบางคอลัมน์
    const importantColumns = ['เลขแปลงและยกั', 'ชื่อมโยงเกษตร', 'เขต', 'พันธุ์', 'วันที่รอ้ มปลอด'];
    importantColumns.forEach(col => {
        if (headers.includes(col)) {
            html += `<th>${col}</th>`;
        }
    });
    
    html += `</tr></thead><tbody>`;
    
    for (let i = startIdx; i < endIdx; i++) {
        const row = results[i];
        html += `<tr onclick="showRowDetail(${row._rowIndex})" style="cursor: pointer;">`;
        html += `<td class="fw-bold">${i + 1}</td>`;
        
        importantColumns.forEach(col => {
            if (headers.includes(col)) {
                const value = row[col] || '';
                // ไฮไลต์ข้อความที่ค้นหา
                let displayValue = String(value);
                if (displayValue.toLowerCase().includes($('#searchInput').val().toLowerCase())) {
                    displayValue = `<span class="bg-warning px-1 rounded">${displayValue}</span>`;
                }
                html += `<td>${displayValue}</td>`;
            }
        });
        
        html += `</tr>`;
    }
    
    html += `</tbody></table></div>`;
    
    // Pagination
    const totalPages = Math.ceil(results.length / CONFIG.ITEMS_PER_PAGE);
    if (totalPages > 1) {
        html += createPagination(totalPages, 'search');
    }
    
    return html;
}

// แสดงข้อมูลทั้งหมดหรือผลการค้นหา
function displayData(dataToShow = allData) {
    if (!dataToShow || dataToShow.length === 0) {
        $('#dataTable').html(`
            <div class="alert alert-light text-center">
                <i class="fas fa-database fa-3x text-muted mb-3"></i>
                <h5>ยังไม่มีข้อมูล</h5>
                <p>กดปุ่ม "โหลดข้อมูล" เพื่อเริ่มต้น</p>
            </div>
        `);
        return;
    }
    
    const headers = Object.keys(dataToShow[0]).filter(h => !h.startsWith('_'));
    const startIdx = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const endIdx = Math.min(startIdx + CONFIG.ITEMS_PER_PAGE, dataToShow.length);
    const totalPages = Math.ceil(dataToShow.length / CONFIG.ITEMS_PER_PAGE);
    
    let html = `
        <div class="table-responsive">
            <table class="table table-bordered table-hover">
                <thead class="table-dark">
                    <tr>
                        <th width="50">#</th>
    `;
    
    // แสดงคอลัมน์ทั้งหมด
    headers.forEach(header => {
        html += `<th>${formatHeader(header)}</th>`;
    });
    
    html += `</tr></thead><tbody>`;
    
    for (let i = startIdx; i < endIdx; i++) {
        const row = dataToShow[i];
        html += `<tr onclick="showRowDetail(${row._rowIndex || i})" style="cursor: pointer;">`;
        html += `<td class="text-center fw-bold">${i + 1}</td>`;
        
        headers.forEach(header => {
            const value = row[header] || '';
            html += `<td>${formatValue(value)}</td>`;
        });
        
        html += `</tr>`;
    }
    
    html += `</tbody></table></div>`;
    
    // Pagination
    if (totalPages > 1) {
        html += createPagination(totalPages);
    }
    
    $('#dataTable').html(html);
    $('#dataInfo').html(`
        <small class="text-muted">
            แสดง ${startIdx + 1}-${endIdx} จาก ${dataToShow.length} รายการ | 
            หน้า ${currentPage}/${totalPages}
        </small>
    `);
}

// สร้าง Pagination
function createPagination(totalPages, type = 'normal') {
    let html = `
        <nav aria-label="Page navigation">
            <ul class="pagination pagination-sm justify-content-center">
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${currentPage - 1}, '${type}')">
                        <i class="fas fa-chevron-left"></i>
                    </a>
                </li>
    `;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i}, '${type}')">${i}</a>
                </li>
            `;
        } else if (Math.abs(i - currentPage) === 3) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    html += `
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${currentPage + 1}, '${type}')">
                        <i class="fas fa-chevron-right"></i>
                    </a>
                </li>
            </ul>
        </nav>
    `;
    
    return html;
}

// เปลี่ยนหน้า
function changePage(page, type = 'normal') {
    if (page < 1 || page > Math.ceil((currentSearchResults || allData).length / CONFIG.ITEMS_PER_PAGE)) {
        return;
    }
    
    currentPage = page;
    
    if (type === 'search' && currentSearchResults) {
        displaySearchResults(currentSearchResults, $('#searchInput').val());
    } else {
        displayData(currentSearchResults || allData);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// แสดงรายละเอียดแถว
function showRowDetail(rowIndex) {
    const row = allData[rowIndex];
    
    let detailHtml = `
        <div class="modal fade" id="detailModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-info-circle me-2"></i>
                            รายละเอียดข้อมูล
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
    `;
    
    Object.keys(row).forEach((key, index) => {
        if (!key.startsWith('_')) {
            const value = row[key] || '-';
            detailHtml += `
                <div class="col-md-6 mb-3">
                    <label class="form-label text-muted small">${formatHeader(key)}</label>
                    <div class="form-control bg-light">${formatValue(value)}</div>
                </div>
            `;
        }
    });
    
    detailHtml += `
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ปิด</button>
                        <button type="button" class="btn btn-primary" onclick="copyRowData(${rowIndex})">
                            <i class="fas fa-copy me-1"></i> คัดลอกข้อมูล
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // เพิ่ม modal ไปยัง body
    $('body').append(detailHtml);
    
    // แสดง modal
    const modal = new bootstrap.Modal(document.getElementById('detailModal'));
    modal.show();
    
    // ลบ modal เมื่อปิด
    $('#detailModal').on('hidden.bs.modal', function() {
        $(this).remove();
    });
}

// คัดลอกข้อมูลแถว
function copyRowData(rowIndex) {
    const row = allData[rowIndex];
    let text = '';
    
    Object.keys(row).forEach(key => {
        if (!key.startsWith('_')) {
            text += `${formatHeader(key)}: ${row[key] || ''}\n`;
        }
    });
    
    navigator.clipboard.writeText(text).then(() => {
        showSuccess('คัดลอกข้อมูลเรียบร้อยแล้ว');
    });
}

// ล้างการค้นหา
function clearSearch() {
    currentSearchResults = null;
    currentPage = 1;
    $('#searchInput').val('');
    $('#generalSearchInput').val('');
    $('#searchResults').html('');
    displayData(allData);
    showInfo('ล้างการค้นหาเรียบร้อยแล้ว');
}

// ส่งออกผลการค้นหา
function exportSearchResults() {
    if (!currentSearchResults || currentSearchResults.length === 0) {
        showWarning('ไม่มีผลการค้นหาที่จะส่งออก');
        return;
    }
    
    const headers = Object.keys(currentSearchResults[0]).filter(h => !h.startsWith('_'));
    const csvRows = [];
    
    // Header
    csvRows.push(headers.join(','));
    
    // Data
    currentSearchResults.forEach(row => {
        const values = headers.map(header => {
            const val = row[header] || '';
            return `"${String(val).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    });
    
    const csv = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `IN-TECH_Search_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showSuccess('ดาวน์โหลดผลการค้นหาเรียบร้อยแล้ว');
}

// ============================================
// ฟังก์ชันจัดการประวัติการค้นหา
// ============================================

// บันทึกประวัติการค้นหา
function saveToSearchHistory(searchData) {
    searchHistory.unshift(searchData);
    
    // เก็บเฉพาะ 20 รายการล่าสุด
    if (searchHistory.length > 20) {
        searchHistory = searchHistory.slice(0, 20);
    }
    
    // บันทึกลง localStorage
    localStorage.setItem('intechSearchHistory', JSON.stringify(searchHistory));
}

// โหลดประวัติการค้นหา
function loadSearchHistory() {
    const saved = localStorage.getItem('intechSearchHistory');
    if (saved) {
        searchHistory = JSON.parse(saved);
    }
}

// แสดงประวัติการค้นหา
function showSearchHistory() {
    if (searchHistory.length === 0) {
        showInfo('ยังไม่มีประวัติการค้นหา');
        return;
    }
    
    let historyHtml = `
        <div class="modal fade" id="historyModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-history me-2"></i>
                            ประวัติการค้นหา
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="list-group">
    `;
    
    searchHistory.forEach((item, index) => {
        const time = new Date(item.timestamp).toLocaleString('th-TH');
        historyHtml += `
            <div class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">
                        <span class="badge bg-${item.type === 'เลขแปลง' ? 'primary' : 'secondary'} me-2">
                            ${item.type}
                        </span>
                        "${item.keyword}"
                    </h6>
                    <small>${time}</small>
                </div>
                <p class="mb-1">พบ ${item.results} รายการ</p>
                <button class="btn btn-sm btn-outline-primary mt-2" onclick="reSearch('${item.keyword}')">
                    <i class="fas fa-redo me-1"></i> ค้นหาอีกครั้ง
                </button>
            </div>
        `;
    });
    
    historyHtml += `
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ปิด</button>
                        <button type="button" class="btn btn-danger" onclick="clearSearchHistory()">
                            <i class="fas fa-trash me-1"></i> ล้างประวัติ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('body').append(historyHtml);
    const modal = new bootstrap.Modal(document.getElementById('historyModal'));
    modal.show();
    
    $('#historyModal').on('hidden.bs.modal', function() {
        $(this).remove();
    });
}

// ค้นหาอีกครั้งจากประวัติ
function reSearch(keyword) {
    $('#searchInput').val(keyword);
    searchIntech();
    
    // ปิด modal
    bootstrap.Modal.getInstance(document.getElementById('historyModal')).hide();
}

// ล้างประวัติการค้นหา
function clearSearchHistory() {
    searchHistory = [];
    localStorage.removeItem('intechSearchHistory');
    showSuccess('ล้างประวัติการค้นหาเรียบร้อยแล้ว');
    
    // ปิด modal
    bootstrap.Modal.getInstance(document.getElementById('historyModal')).hide();
}

// ============================================
// ฟังก์ชัน Utility
// ============================================

// ตรวจสอบคอลัมน์ที่มี
function checkAvailableColumns() {
    if (allData.length === 0) return;
    
    const headers = Object.keys(allData[0]);
    console.log('📋 คอลัมน์ที่มี:', headers);
    
    // แสดงคอลัมน์ที่มี
    $('#availableColumns').html(`
        <div class="alert alert-light">
            <h6><i class="fas fa-columns"></i> คอลัมน์ที่มีในข้อมูล:</h6>
            <div class="mt-2">${headers.map(h => `<span class="badge bg-secondary me-1 mb-1">${h}</span>`).join('')}</div>
        </div>
    `);
}

// แสดง Loading
function showLoading(show) {
    if (show) {
        $('#loading').show();
        $('#dataTable').hide();
    } else {
        $('#loading').hide();
        $('#dataTable').show();
    }
}

// อัปเดตสถิติ
function updateStats() {
    const total = allData.length;
    const showing = currentSearchResults ? currentSearchResults.length : total;
    
    $('#stats').html(`
        <div class="row text-center">
            <div class="col-md-4">
                <div class="card bg-light">
                    <div class="card-body">
                        <h6 class="text-muted">ข้อมูลทั้งหมด</h6>
                        <h3 class="text-primary">${total}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card bg-light">
                    <div class="card-body">
                        <h6 class="text-muted">กำลังแสดง</h6>
                        <h3 class="text-success">${showing}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card bg-light">
                    <div class="card-body">
                        <h6 class="text-muted">คอลัมน์</h6>
                        <h3 class="text-info">${allData.length > 0 ? Object.keys(allData[0]).length : 0}</h3>
                    </div>
                </div>
            </div>
        </div>
    `);
}

// Helper functions
function formatHeader(header) {
    if (header.length > 15) {
        return header.substring(0, 12) + '...';
    }
    return header;
}

function formatValue(value) {
    if (value === null || value === undefined || value === '') {
        return '<span class="text-muted">-</span>';
    }
    
    const str = String(value).trim();
    
    // ถ้าเป็นตัวเลข
    if (!isNaN(str) && str !== '') {
        const num = Number(str);
        return num.toLocaleString('th-TH');
    }
    
    return str;
}

// ฟังก์ชันแสดงข้อความ
function showMessage(text, type) {
    const icon = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    }[type];
    
    const html = `
        <div class="alert alert-${type} alert-dismissible fade show">
            <i class="fas fa-${icon} me-2"></i>
            ${text}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    $('#messages').html(html);
    setTimeout(() => $('.alert').alert('close'), 5000);
}

function showSuccess(text) { showMessage(text, 'success'); }
function showError(text) { showMessage(text, 'danger'); }
function showWarning(text) { showMessage(text, 'warning'); }
function showInfo(text) { showMessage(text, 'info'); }
