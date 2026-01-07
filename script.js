function getGoogleDriveImageUrl(fileId) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

function getImageFromGoogleDrive(fieldValue) {
    if (!fieldValue || fieldValue === '') return null;
    
    // ถ้าเป็น Google Drive file ID
    if (fieldValue.match(/^[a-zA-Z0-9_-]{33}$/)) {
        return getGoogleDriveImageUrl(fieldValue);
    }
    
    // ถ้าเป็น Google Drive URL
    const driveUrlMatch = fieldValue.match(/\/d\/([^\/]+)/);
    if (driveUrlMatch) {
        return getGoogleDriveImageUrl(driveUrlMatch[1]);
    }
    
    // ถ้าเป็นชื่อไฟล์รูปภาพ
    if (isImageFile(fieldValue)) {
        return fieldValue;
    }
    
    return null;
}

// ตรวจสอบว่าเป็นไฟล์รูปภาพหรือไม่
function isImageFile(filename) {
    if (!filename) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.JPG', '.JPEG', '.PNG'];
    const lowerFilename = filename.toLowerCase();
    return imageExtensions.some(ext => lowerFilename.endsWith(ext));
}

// สร้าง HTML สำหรับแสดงรูปภาพ
function createImagePreview(imageValue, columnName = '') {
    if (!imageValue || imageValue === '') {
        return '<span class="text-muted">-</span>';
    }
    
    // แปลง URL Google Drive ถ้าจำเป็น
    let imageUrl = getImageFromGoogleDrive(imageValue);
    
    // ถ้า getImageFromGoogleDrive คืนค่า null ให้ใช้ค่าเดิม
    if (!imageUrl) {
        imageUrl = imageValue;
    }
    
    // ถ้ายังเป็นชื่อไฟล์อย่างเดียว (ไม่ใช่ URL) และเป็นไฟล์รูปภาพ
    if (!imageUrl.includes('://') && isImageFile(imageUrl)) {
        imageUrl = 'สถานะ_Images/' + imageUrl;
    }
    
    const filename = imageUrl.split('/').pop().split('\\').pop();
    const isImageColumn = CONFIG.IMAGE_COLUMNS && CONFIG.IMAGE_COLUMNS.some(col => columnName.includes(col));
    
    return `
        <div class="image-preview" style="text-align: center;">
            <img src="${imageUrl}" 
                 alt="${filename}" 
                 class="img-thumbnail preview-image" 
                 style="max-width: 80px; max-height: 80px; cursor: pointer; object-fit: cover;"
                 onclick="showFullImage('${imageUrl}', '${filename}')"
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/80x80/cccccc/666666?text=No+Image'">
            <div class="image-filename small text-muted mt-1" style="word-break: break-all; font-size: 0.7rem;">${isImageColumn ? filename.substring(0, 20) + (filename.length > 20 ? '...' : '') : ''}</div>
        </div>
    `;
}

// แสดงรูปภาพเต็มขนาด
function showFullImage(imageUrl, filename) {
    // สำหรับ Google Drive URL ให้แปลงเป็นรูปแบบ preview
    let displayUrl = imageUrl;
    if (imageUrl.includes('drive.google.com/uc?')) {
        displayUrl = imageUrl;
    } else if (imageUrl.includes('drive.google.com/file/d/')) {
        const fileId = imageUrl.match(/\/d\/([^\/]+)/)[1];
        displayUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    
    const fullImageUrl = imageUrl.includes('drive.google.com') ? 
        imageUrl.replace('uc?export=view&id=', 'file/d/').replace('?export=view', '') + '/view' : 
        imageUrl;
    
    const modalHtml = `
        <div class="modal fade" id="imageModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-image me-2"></i>รูปภาพผ่ากอ
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <div class="mb-3">
                            <img src="${displayUrl}" 
                                 alt="${filename}" 
                                 class="img-fluid rounded"
                                 style="max-height: 70vh; max-width: 100%;"
                                 onerror="this.onerror=null; this.src='https://via.placeholder.com/800x600/cccccc/666666?text=ไม่พบรูปภาพ'">
                        </div>
                        <p class="text-muted mb-0"><small>${filename}</small></p>
                    </div>
                    <div class="modal-footer">
                        <a href="${fullImageUrl}" class="btn btn-primary" target="_blank">
                            <i class="fas fa-external-link-alt me-1"></i> เปิดในแท็บใหม่
                        </a>
                        <a href="${displayUrl}" class="btn btn-success" target="_blank" download="${filename}">
                            <i class="fas fa-download me-1"></i> ดาวน์โหลด
                        </a>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i> ปิด
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('body').append(modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('imageModal'));
    modal.show();
    
    $('#imageModal').on('hidden.bs.modal', function() {
        $(this).remove();
    });
}

// ============================================
// ระบบค้นหาเลขแปลง IN-TECH - โครงการผ่ากอ
// ============================================

const CONFIG = {
    SHEET_ID: '15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw',
    SHEET_NAME: 'สถานะ',
    PROJECT_NAME: 'ผ่ากอ',
    
    // URL Methods for fetching data
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
        }
    ],
    
    // Columns for IN-TECH number search
    INTECH_SEARCH_COLUMNS: ['เลขแปลงและยกั', 'เลขโครงขา้', 'ชื่อราคาไฟ'],
    
    // Columns for image display - เพิ่มคอลัมน์รูปภาพที่นี่
    IMAGE_COLUMNS: ['รูปถ่ายตอนผ่ากอ', 'รูปภาพผ่ากอ', 'ภาพผ่ากอ', 'รูปภาพ', 'ภาพถ่าย'],
    
    // Pagination
    ITEMS_PER_PAGE: 15,
    
    // Cache settings
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

// Global variables
let allData = [];
let currentSearchResults = null;
let currentSearchTerm = '';
let currentPage = 1;
let currentMethodIndex = 0;
let searchHistory = [];

// เมื่อหน้าเว็บโหลด
$(document).ready(function() {
    console.log('🚀 เริ่มต้นระบบค้นหาเลขแปลง IN-TECH - โครงการ' + CONFIG.PROJECT_NAME);
    
    initializeEventListeners();
    loadInitialData();
    
    // Load search history from localStorage
    loadSearchHistory();
});

// ตั้งค่า Event Listeners
function initializeEventListeners() {
    // ปุ่มค้นหาเลขแปลง IN-TECH
    $('#searchIntechBtn').click(searchIntech);
    
    // ปุ่มค้นหาทั่วไป
    $('#searchGeneralBtn').click(searchGeneral);
    
    // ปุ่มโหลดข้อมูลใหม่
    $('#loadDataBtn').click(function() {
        loadData(true);
        $(this).html('<i class="fas fa-spinner fa-spin me-1"></i> กำลังโหลด...');
        setTimeout(() => {
            $(this).html('<i class="fas fa-sync-alt me-1"></i> โหลดข้อมูลใหม่');
        }, 2000);
    });
    
    // ปุ่มล้างค้นหา
    $('#clearSearchBtn').click(clearSearch);
    
    // ปุ่มทดสอบการเชื่อมต่อ
    $('#testConnectionBtn').click(testConnection);
    
    // ปุ่มดูข้อมูลดิบ
    $('#viewRawDataBtn').click(viewRawData);
    
    // ปุ่มดูประวัติการค้นหา
    $('#viewHistoryBtn').click(showSearchHistory);
    
    // ปุ่มดาวน์โหลด CSV
    $('#exportDataBtn').click(exportData);
    
    // ค้นหาเมื่อกด Enter ในช่องค้นหา
    $('#searchIntechInput, #searchGeneralInput').keypress(function(e) {
        if (e.which === 13) {
            if ($(this).attr('id') === 'searchIntechInput') {
                searchIntech();
            } else {
                searchGeneral();
            }
        }
    });
}

// โหลดข้อมูลเริ่มต้น
function loadInitialData() {
    showLoading(true);
    
    // ตรวจสอบแคชก่อน
    const cachedData = getCachedData();
    if (cachedData) {
        allData = cachedData;
        displayData(allData);
        updateStatistics();
        updateDataTitle('ข้อมูลทั้งหมด');
        showMessage('โหลดข้อมูลจากแคชสำเร็จ', 'success');
        showLoading(false);
        return;
    }
    
    // ถ้าไม่มีแคช ให้โหลดใหม่
    loadData();
}

// โหลดข้อมูลจาก Google Sheet
function loadData(forceRefresh = false) {
    console.log('📥 กำลังโหลดข้อมูลจาก Google Sheet...');
    
    if (forceRefresh) {
        // ล้างแคช
        clearCache();
    }
    
    showLoading(true);
    showMessage('กำลังเชื่อมต่อกับ Google Sheet...', 'info');
    
    // ลองโหลดด้วยวิธีปัจจุบัน
    tryLoadMethod(currentMethodIndex);
}

function tryLoadMethod(index) {
    if (index >= CONFIG.URL_METHODS.length) {
        showError('ไม่สามารถเชื่อมต่อกับ Google Sheet ได้');
        showLoading(false);
        currentMethodIndex = 0; // รีเซ็ตกลับไปใช้วิธีแรก
        return;
    }
    
    const method = CONFIG.URL_METHODS[index];
    console.log(`🔄 ลองโหลดด้วยวิธี: ${method.name}`);
    
    if (method.type === 'json') {
        // ใช้ JSON (opensheet)
        $.ajax({
            url: method.url,
            method: 'GET',
            dataType: 'json',
            timeout: 15000,
            success: function(data) {
                handleDataSuccess(data, method.name);
            },
            error: function(xhr, status, error) {
                console.error(`❌ ${method.name} ล้มเหลว:`, error);
                tryLoadMethod(index + 1);
            }
        });
    } else {
        // ใช้ CSV
        Papa.parse(method.url, {
            download: true,
            header: true,
            skipEmptyLines: true,
            encoding: 'UTF-8',
            complete: function(results) {
                if (results.data && results.data.length > 0) {
                    handleDataSuccess(results.data, method.name);
                } else {
                    console.log(`❌ ${method.name} ไม่มีข้อมูล`);
                    tryLoadMethod(index + 1);
                }
            },
            error: function(error) {
                console.error(`❌ ${method.name} ล้มเหลว:`, error);
                tryLoadMethod(index + 1);
            }
        });
    }
}

function handleDataSuccess(data, methodName) {
    console.log(`✅ ${methodName} สำเร็จ: ${data.length} รายการ`);
    
    allData = data;
    currentSearchResults = null;
    currentSearchTerm = '';
    currentPage = 1;
    
    // แคชข้อมูล
    cacheData(allData);
    
    // แสดงข้อมูล
    displayData(allData);
    
    // อัปเดตสถิติ
    updateStatistics();
    
    // อัปเดตหัวข้อ
    updateDataTitle('ข้อมูลทั้งหมด');
    
    // ตรวจสอบคอลัมน์ที่มี
    checkAvailableColumns();
    
    // แสดงข้อความสำเร็จ
    showSuccess(`โหลดข้อมูลสำเร็จ ${data.length} รายการ (ใช้ ${methodName})`);
    
    showLoading(false);
    
    // บันทึก method ที่ใช้งานได้
    currentMethodIndex = CONFIG.URL_METHODS.findIndex(m => m.name === methodName);
}

// ============================================
// ฟังก์ชันค้นหาเลขแปลง IN-TECH
// ============================================

function searchIntech() {
    const searchValue = $('#searchIntechInput').val().trim();
    
    if (!searchValue) {
        showWarning('กรุณากรอกเลขแปลงที่ต้องการค้นหา');
        $('#searchIntechInput').focus();
        return;
    }
    
    if (allData.length === 0) {
        showWarning('ยังไม่มีข้อมูล โปรดโหลดข้อมูลก่อน');
        return;
    }
    
    console.log(`🔍 ค้นหาเลขแปลง IN-TECH: "${searchValue}"`);
    
    // ค้นหาในคอลัมน์ที่กำหนด
    const results = [];
    const searchLower = searchValue.toLowerCase();
    
    allData.forEach((row, index) => {
        let found = false;
        
        CONFIG.INTECH_SEARCH_COLUMNS.forEach(column => {
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
                _rowIndex: index,
                _searchMatch: true
            });
        }
    });
    
    if (results.length === 0) {
        showWarning(`ไม่พบเลขแปลง "${searchValue}" ในระบบ`);
        return;
    }
    
    // บันทึกประวัติการค้นหา
    saveToSearchHistory({
        type: 'เลขแปลง IN-TECH',
        keyword: searchValue,
        results: results.length,
        timestamp: new Date().toISOString(),
        columns: CONFIG.INTECH_SEARCH_COLUMNS
    });
    
    // เก็บผลการค้นหา
    currentSearchResults = results;
    currentSearchTerm = searchValue;
    currentPage = 1;
    
    // แสดงผลการค้นหา
    displaySearchResults(results, searchValue, 'intech');
    
    // แสดงข้อความสำเร็จ
    showSuccess(`พบ ${results.length} รายการที่ตรงกับเลขแปลง "${searchValue}"`);
    
    // Scroll to results
    $('html, body').animate({
        scrollTop: $('#searchResults').offset().top - 100
    }, 500);
}

function searchGeneral() {
    const searchValue = $('#searchGeneralInput').val().trim();
    
    if (!searchValue) {
        showWarning('กรุณากรอกคำค้นหา');
        $('#searchGeneralInput').focus();
        return;
    }
    
    if (allData.length === 0) {
        showWarning('ยังไม่มีข้อมูล โปรดโหลดข้อมูลก่อน');
        return;
    }
    
    console.log(`🔍 ค้นหาทั่วไป: "${searchValue}"`);
    
    // ค้นหาในทุกคอลัมน์
    const results = [];
    const searchLower = searchValue.toLowerCase();
    
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
                _rowIndex: index,
                _searchMatch: true
            });
        }
    });
    
    if (results.length === 0) {
        showWarning(`ไม่พบ "${searchValue}" ในระบบ`);
        return;
    }
    
    // บันทึกประวัติการค้นหา
    saveToSearchHistory({
        type: 'ค้นหาทั่วไป',
        keyword: searchValue,
        results: results.length,
        timestamp: new Date().toISOString(),
        columns: 'ทั้งหมด'
    });
    
    // เก็บผลการค้นหา
    currentSearchResults = results;
    currentSearchTerm = searchValue;
    currentPage = 1;
    
    // แสดงผลการค้นหา
    displaySearchResults(results, searchValue, 'general');
    
    // แสดงข้อความสำเร็จ
    showSuccess(`พบ ${results.length} รายการที่ตรงกับ "${searchValue}"`);
    
    // Scroll to results
    $('html, body').animate({
        scrollTop: $('#searchResults').offset().top - 100
    }, 500);
}

function displaySearchResults(results, searchTerm, searchType) {
    const searchTypeText = searchType === 'intech' ? 'เลขแปลง IN-TECH' : 'ทั่วไป';
    
    let html = `
        <div class="card border-primary mb-3 fade-in">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">
                    <i class="fas fa-search me-2"></i>
                    ผลการค้นหา${searchType === 'intech' ? 'เลขแปลง' : ''}: "${searchTerm}"
                    <span class="badge bg-light text-primary ms-2">${results.length} รายการ</span>
                </h5>
            </div>
            <div class="card-body">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    ค้นหาประเภท: <strong>${searchTypeText}</strong> | 
                    พบทั้งหมด <strong>${results.length}</strong> รายการ
                </div>
    `;
    
    // แสดงข้อมูลในตาราง
    html += createResultsTable(results, searchTerm, searchType);
    
    html += `
            </div>
            <div class="card-footer">
                <div class="d-flex flex-wrap gap-2">
                    <button class="btn btn-sm btn-primary" onclick="exportSearchResults()">
                        <i class="fas fa-download me-1"></i> ดาวน์โหลดผลการค้นหา
                    </button>
                    <button class="btn btn-sm btn-outline-primary" onclick="printSearchResults()">
                        <i class="fas fa-print me-1"></i> พิมพ์ผลการค้นหา
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="clearSearch()">
                        <i class="fas fa-times me-1"></i> ล้างการค้นหา
                    </button>
                </div>
            </div>
        </div>
    `;
    
    $('#searchResults').html(html);
    
    // แสดงข้อมูลในตารางหลัก
    displayData(results);
    
    // อัปเดตหัวข้อ
    updateDataTitle(`ผลการค้นหา: "${searchTerm}"`);
}

function createResultsTable(results, searchTerm, searchType) {
    if (results.length === 0) return '<p class="text-center text-muted">ไม่พบข้อมูล</p>';
    
    // ใช้ headers จากข้อมูล
    const headers = Object.keys(results[0]).filter(h => !h.startsWith('_'));
    const importantColumns = ['เลขแปลงและยกั', 'ชื่อมโยงเกษตร', 'เขต', 'พันธุ์', 'วันที่รอ้ มปลอด'];
    
    const startIdx = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const endIdx = Math.min(startIdx + CONFIG.ITEMS_PER_PAGE, results.length);
    const totalPages = Math.ceil(results.length / CONFIG.ITEMS_PER_PAGE);
    
    let html = `
        <div class="table-responsive">
            <table class="table table-sm table-hover">
                <thead>
                    <tr>
                        <th width="50">#</th>
    `;
    
    // แสดงคอลัมน์สำคัญ
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
                let value = row[col] || '';
                let displayValue = String(value);
                
                // ไฮไลต์ข้อความที่ค้นหา
                if (searchTerm && displayValue.toLowerCase().includes(searchTerm.toLowerCase())) {
                    const regex = new RegExp(`(${searchTerm})`, 'gi');
                    displayValue = displayValue.replace(regex, '<span class="search-highlight">$1</span>');
                }
                
                html += `<td>${displayValue}</td>`;
            }
        });
        
        html += `</tr>`;
    }
    
    html += `</tbody></table></div>`;
    
    // Pagination
    if (totalPages > 1) {
        html += createPagination(totalPages, 'search');
    }
    
    return html;
}

function displayData(dataToShow = allData) {
    if (!dataToShow || dataToShow.length === 0) {
        $('#dataTable').html(`
            <div class="text-center py-5">
                <i class="fas fa-database fa-3x text-muted mb-3"></i>
                <h5>ไม่พบข้อมูล</h5>
                <p class="text-muted">ไม่สามารถโหลดข้อมูลได้</p>
            </div>
        `);
        $('#dataCount').text('0');
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
        const originalIndex = row._rowIndex !== undefined ? row._rowIndex : i;
        
        html += `<tr onclick="showRowDetail(${originalIndex})" style="cursor: pointer;">`;
        html += `<td class="text-center fw-bold">${i + 1}</td>`;
        
        headers.forEach(header => {
            let value = row[header] || '';
            let displayValue = formatValue(value, header); // เปลี่ยนเป็นส่งชื่อคอลัมน์ไปด้วย
            
            // ไฮไลต์ถ้าเป็นผลการค้นหา (เฉพาะข้อความ ไม่ใช่รูปภาพ)
            if (currentSearchTerm && currentSearchResults && 
                !isImageFile(String(value)) && 
                String(value).toLowerCase().includes(currentSearchTerm.toLowerCase())) {
                displayValue = displayValue.replace(
                    new RegExp(`(${currentSearchTerm})`, 'gi'),
                    '<span class="highlight">$1</span>'
                );
            }
            
            html += `<td>${displayValue}</td>`;
        });
        
        html += `</tr>`;
    }
    
    html += `</tbody></table></div>`;
    
    // Pagination
    if (totalPages > 1) {
        html += createPagination(totalPages, 'data');
    }
    
    $('#dataTable').html(html);
    $('#dataInfo').html(`
        แสดง <strong>${startIdx + 1}-${endIdx}</strong> จากทั้งหมด <strong>${dataToShow.length}</strong> รายการ
    `);
    $('#dataCount').text(dataToShow.length.toLocaleString());
}

function createPagination(totalPages, type) {
    let html = `
        <nav aria-label="Page navigation" class="mt-3">
            <ul class="pagination justify-content-center">
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${currentPage - 1}, '${type}')">
                        <i class="fas fa-chevron-left"></i>
                    </a>
                </li>
    `;
    
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}, '${type}')">${i}</a>
            </li>
        `;
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

function changePage(page, type) {
    if (page < 1 || page > Math.ceil((currentSearchResults || allData).length / CONFIG.ITEMS_PER_PAGE)) {
        return;
    }
    
    currentPage = page;
    
    if (type === 'search' && currentSearchResults) {
        displaySearchResults(currentSearchResults, currentSearchTerm, 'intech');
    } else {
        displayData(currentSearchResults || allData);
    }
    
    $('html, body').animate({ scrollTop: $('#dataTable').offset().top - 100 }, 300);
}

// ============================================
// ฟังก์ชัน Utility
// ============================================

function clearSearch() {
    currentSearchResults = null;
    currentSearchTerm = '';
    currentPage = 1;
    
    $('#searchIntechInput').val('');
    $('#searchGeneralInput').val('');
    $('#searchResults').html('');
    
    displayData(allData);
    updateDataTitle('ข้อมูลทั้งหมด');
    updateStatistics();
    
    showInfo('ล้างการค้นหาเรียบร้อยแล้ว');
    $('#searchIntechInput').focus();
}

function updateDataTitle(title) {
    $('#dataTitle').text(title);
}

function updateStatistics() {
    const total = allData.length;
    const showing = currentSearchResults ? currentSearchResults.length : total;
    const columns = allData.length > 0 ? Object.keys(allData[0]).length : 0;
    
    const statsHtml = `
        <div class="col-md-4">
            <div class="stats-card stats-primary">
                <div class="stats-icon text-primary">
                    <i class="fas fa-database"></i>
                </div>
                <div class="stats-value">${total.toLocaleString()}</div>
                <div class="stats-label">ข้อมูลทั้งหมด</div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="stats-card stats-success">
                <div class="stats-icon text-success">
                    <i class="fas fa-eye"></i>
                </div>
                <div class="stats-value">${showing.toLocaleString()}</div>
                <div class="stats-label">กำลังแสดง</div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="stats-card stats-info">
                <div class="stats-icon text-info">
                    <i class="fas fa-columns"></i>
                </div>
                <div class="stats-value">${columns}</div>
                <div class="stats-label">จำนวนคอลัมน์</div>
            </div>
        </div>
    `;
    
    $('#stats').html(statsHtml);
}

function checkAvailableColumns() {
    if (allData.length === 0) return;
    
    const headers = Object.keys(allData[0]);
    const intechColumns = CONFIG.INTECH_SEARCH_COLUMNS.filter(col => headers.includes(col));
    const imageColumns = CONFIG.IMAGE_COLUMNS ? CONFIG.IMAGE_COLUMNS.filter(col => headers.includes(col)) : [];
    
    let html = `
        <div class="card">
            <div class="card-header">
                <i class="fas fa-columns me-2"></i>คอลัมน์ที่มีในข้อมูล
            </div>
            <div class="card-body">
                <p class="mb-2"><strong>คอลัมน์สำหรับค้นหาเลขแปลง:</strong></p>
                <div class="mb-3">
                    ${intechColumns.map(col => 
                        `<span class="badge bg-primary me-1 mb-1">${col}</span>`
                    ).join('')}
                </div>
                ${imageColumns.length > 0 ? `
                <p class="mb-2"><strong>คอลัมน์รูปภาพ:</strong></p>
                <div class="mb-3">
                    ${imageColumns.map(col => 
                        `<span class="badge bg-success me-1 mb-1"><i class="fas fa-image me-1"></i>${col}</span>`
                    ).join('')}
                </div>
                ` : ''}
                <p class="mb-2"><strong>คอลัมน์ทั้งหมด (${headers.length} คอลัมน์):</strong></p>
                <div>
                    ${headers.map(col => 
                        `<span class="badge bg-secondary me-1 mb-1">${col}</span>`
                    ).join('')}
                </div>
            </div>
        </div>
    `;
    
    $('#availableColumns').html(html);
}

function showRowDetail(rowIndex) {
    const row = allData[rowIndex];
    const headers = Object.keys(row).filter(h => !h.startsWith('_'));
    
    // หารูปภาพหลัก (ถ้ามี)
    let mainImage = null;
    let mainImageColumn = '';
    let mainImageFilename = '';
    
    if (CONFIG.IMAGE_COLUMNS) {
        CONFIG.IMAGE_COLUMNS.forEach(col => {
            if (row[col] && row[col].trim() !== '' && !mainImage) {
                const imageUrl = getImageFromGoogleDrive(row[col]) || row[col];
                if (imageUrl) {
                    mainImage = imageUrl;
                    mainImageColumn = col;
                    mainImageFilename = mainImage.split('/').pop().split('\\').pop();
                }
            }
        });
    }
    
    let detailHtml = `
        <div class="modal fade" id="detailModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-info-circle me-2"></i>
                            รายละเอียดข้อมูล (แถวที่ ${rowIndex + 1})
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
    `;
    
    // แสดงรูปภาพหลักใหญ่ (ถ้ามี)
    if (mainImage) {
        detailHtml += `
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card border-primary">
                        <div class="card-header bg-primary text-white">
                            <i class="fas fa-image me-2"></i>รูปภาพผ่ากอ
                        </div>
                        <div class="card-body text-center">
                            <img src="${mainImage}" 
                                 alt="${mainImageFilename}" 
                                 class="img-fluid rounded" 
                                 style="max-height: 300px; cursor: pointer; object-fit: contain;"
                                 onclick="showFullImage('${mainImage}', '${mainImageFilename}')"
                                 onerror="this.onerror=null; this.src='https://via.placeholder.com/800x400/cccccc/666666?text=ไม่พบรูปภาพ'">
                            <p class="mt-2 text-muted"><small>${mainImageFilename}</small></p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    detailHtml += `<div class="row">`;
    
    headers.forEach((key, index) => {
        const value = row[key] || '-';
        const isIntechColumn = CONFIG.INTECH_SEARCH_COLUMNS.includes(key);
        const isImageColumn = CONFIG.IMAGE_COLUMNS ? CONFIG.IMAGE_COLUMNS.includes(key) : false;
        
        // ข้ามคอลัมน์รูปภาพหลักถ้าได้แสดงแล้ว
        if (isImageColumn && key === mainImageColumn) {
            return;
        }
        
        detailHtml += `
            <div class="col-md-${isImageColumn ? '12' : '6'} mb-3">
                <label class="form-label ${isIntechColumn ? 'fw-bold text-primary' : isImageColumn ? 'fw-bold text-success' : 'text-muted'} small">
                    ${formatHeader(key)}
                    ${isIntechColumn ? '<i class="fas fa-search ms-1 small"></i>' : ''}
                    ${isImageColumn ? '<i class="fas fa-image ms-1 small"></i>' : ''}
                </label>
                <div class="${isImageColumn ? 'image-container p-3 text-center' : 'form-control bg-light'}" style="${isImageColumn ? '' : 'min-height: 38px;'}">
                    ${formatValue(value, key)}
                </div>
            </div>
        `;
    });
    
    detailHtml += `
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i> ปิด
                        </button>
                        <button type="button" class="btn btn-primary" onclick="copyRowData(${rowIndex})">
                            <i class="fas fa-copy me-1"></i> คัดลอกข้อมูล
                        </button>
                        ${mainImage ? `
                        <a href="${mainImage}" class="btn btn-success" target="_blank" download="${mainImageFilename}">
                            <i class="fas fa-download me-1"></i> ดาวน์โหลดรูปภาพ
                        </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('body').append(detailHtml);
    const modal = new bootstrap.Modal(document.getElementById('detailModal'));
    modal.show();
    
    $('#detailModal').on('hidden.bs.modal', function() {
        $(this).remove();
    });
}

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
        bootstrap.Modal.getInstance(document.getElementById('detailModal')).hide();
    }).catch(err => {
        showError('ไม่สามารถคัดลอกได้: ' + err.message);
    });
}

function testConnection() {
    showMessage('กำลังทดสอบการเชื่อมต่อ...', 'info');
    
    const testUrl = CONFIG.URL_METHODS[0].url;
    console.log('🧪 ทดสอบการเชื่อมต่อกับ:', testUrl);
    
    fetch(testUrl)
        .then(response => {
            if (response.ok) {
                showSuccess('การเชื่อมต่อกับ Google Sheet ทำงานปกติ');
            } else {
                showWarning('การเชื่อมต่อมีปัญหา (Status: ' + response.status + ')');
            }
        })
        .catch(error => {
            showError('ไม่สามารถเชื่อมต่อได้: ' + error.message);
        });
}

function viewRawData() {
    if (allData.length === 0) {
        showWarning('ยังไม่มีข้อมูล');
        return;
    }
    
    const firstRow = allData[0];
    const headers = Object.keys(firstRow).filter(h => !h.startsWith('_'));
    
    let rawHtml = `
        <div class="modal fade" id="rawDataModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-dark text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-code me-2"></i>
                            ข้อมูลดิบ (5 แถวแรก)
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <pre style="max-height: 500px; overflow: auto; background: #f8f9fa; padding: 15px; border-radius: 5px;">
    `;
    
    // แสดง 5 แถวแรก
    for (let i = 0; i < Math.min(5, allData.length); i++) {
        const row = allData[i];
        rawHtml += `\n=== แถวที่ ${i + 1} ===\n`;
        
        headers.forEach(header => {
            rawHtml += `${header}: ${JSON.stringify(row[header] || '')}\n`;
        });
    }
    
    rawHtml += `
                        </pre>
                        <div class="mt-3">
                            <p><strong>สรุป:</strong></p>
                            <ul>
                                <li>จำนวนแถวทั้งหมด: ${allData.length}</li>
                                <li>จำนวนคอลัมน์: ${headers.length}</li>
                                <li>คอลัมน์แรก: ${headers[0] || 'ไม่มี'}</li>
                                ${CONFIG.IMAGE_COLUMNS ? `<li>คอลัมน์รูปภาพ: ${CONFIG.IMAGE_COLUMNS.filter(col => headers.includes(col)).join(', ')}</li>` : ''}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('body').append(rawHtml);
    const modal = new bootstrap.Modal(document.getElementById('rawDataModal'));
    modal.show();
    
    $('#rawDataModal').on('hidden.bs.modal', function() {
        $(this).remove();
    });
}

function exportData() {
    if (allData.length === 0) {
        showWarning('ไม่มีข้อมูลที่จะส่งออก');
        return;
    }
    
    const dataToExport = currentSearchResults || allData;
    const headers = Object.keys(dataToExport[0]).filter(h => !h.startsWith('_'));
    
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    dataToExport.forEach(row => {
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
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = currentSearchResults ? 
        `IN-TECH_Search_${currentSearchTerm}_${timestamp}.csv` : 
        `IN-TECH_Data_${timestamp}.csv`;
    
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showSuccess('ดาวน์โหลดข้อมูลเรียบร้อยแล้ว: ' + filename);
}

function exportSearchResults() {
    exportData();
}

function printSearchResults() {
    window.print();
}

// ============================================
// ฟังก์ชันจัดการแคช
// ============================================

function cacheData(data) {
    try {
        const cacheData = {
            data: data,
            timestamp: Date.now(),
            method: CONFIG.URL_METHODS[currentMethodIndex].name
        };
        localStorage.setItem('intechDataCache', JSON.stringify(cacheData));
        console.log('💾 แคชข้อมูลเรียบร้อยแล้ว');
    } catch (e) {
        console.warn('⚠️ ไม่สามารถแคชข้อมูลได้:', e);
    }
}

function getCachedData() {
    try {
        const cached = localStorage.getItem('intechDataCache');
        if (!cached) return null;
        
        const cacheData = JSON.parse(cached);
        const age = Date.now() - cacheData.timestamp;
        
        if (age < CONFIG.CACHE_DURATION) {
            console.log('📂 โหลดข้อมูลจากแคช (อายุ: ' + Math.round(age/1000) + ' วินาที)');
            return cacheData.data;
        } else {
            console.log('🗑️ แคชหมดอายุแล้ว');
            return null;
        }
    } catch (e) {
        console.warn('⚠️ ปัญหาในการอ่านแคช:', e);
        return null;
    }
}

function clearCache() {
    localStorage.removeItem('intechDataCache');
    console.log('🧹 ล้างแคชเรียบร้อยแล้ว');
}

// ============================================
// ฟังก์ชันจัดการประวัติการค้นหา
// ============================================

function saveToSearchHistory(searchData) {
    searchHistory.unshift(searchData);
    
    // เก็บเฉพาะ 10 รายการล่าสุด
    if (searchHistory.length > 10) {
        searchHistory = searchHistory.slice(0, 10);
    }
    
    localStorage.setItem('intechSearchHistory', JSON.stringify(searchHistory));
}

function loadSearchHistory() {
    try {
        const saved = localStorage.getItem('intechSearchHistory');
        if (saved) {
            searchHistory = JSON.parse(saved);
        }
    } catch (e) {
        console.warn('⚠️ ปัญหาในการโหลดประวัติ:', e);
    }
}

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
                        <span class="badge ${item.type.includes('IN-TECH') ? 'bg-primary' : item.type.includes('รูปภาพ') ? 'bg-success' : 'bg-secondary'} me-2">
                            ${item.type}
                        </span>
                        "${item.keyword}"
                    </h6>
                    <small>${time}</small>
                </div>
                <p class="mb-1 small">พบ ${item.results} รายการ</p>
                <button class="btn btn-sm btn-outline-primary mt-1" onclick="reSearchFromHistory('${item.keyword}')">
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

function reSearchFromHistory(keyword) {
    $('#searchIntechInput').val(keyword);
    searchIntech();
    bootstrap.Modal.getInstance(document.getElementById('historyModal')).hide();
}

function clearSearchHistory() {
    searchHistory = [];
    localStorage.removeItem('intechSearchHistory');
    showSuccess('ล้างประวัติการค้นหาเรียบร้อยแล้ว');
    bootstrap.Modal.getInstance(document.getElementById('historyModal')).hide();
}

// ============================================
// Helper Functions
// ============================================

function showLoading(show) {
    if (show) {
        $('#loading').show();
        $('#dataSection').hide();
        $('#statsContainer').hide();
        $('#availableColumns').hide();
    } else {
        $('#loading').hide();
        $('#dataSection').show();
        $('#statsContainer').show();
        $('#availableColumns').show();
    }
}

function showMessage(text, type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    const html = `
        <div class="alert alert-${type} alert-dismissible fade show">
            <i class="fas fa-${icons[type]} me-2"></i>
            ${text}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    $('#messages').html(html);
    
    // อัตโนมัติปิดหลังจาก 5 วินาที
    setTimeout(() => {
        $('.alert').alert('close');
    }, 5000);
}

function showSuccess(text) { showMessage(text, 'success'); }
function showError(text) { showMessage(text, 'danger'); }
function showWarning(text) { showMessage(text, 'warning'); }
function showInfo(text) { showMessage(text, 'info'); }

function formatHeader(header) {
    if (header.length > 20) {
        return header.substring(0, 17) + '...';
    }
    return header;
}

function formatValue(value, columnName = '') {
    if (value === null || value === undefined || value === '') {
        return '<span class="text-muted">-</span>';
    }
    
    const str = String(value).trim();
    
    // ตรวจสอบว่าเป็นคอลัมน์รูปภาพหรือมีชื่อไฟล์รูปภาพ
    const isImageColumn = CONFIG.IMAGE_COLUMNS ? CONFIG.IMAGE_COLUMNS.some(col => columnName.includes(col)) : false;
    if (isImageColumn || isImageFile(str)) {
        return createImagePreview(str, columnName);
    }
    
    // ถ้าเป็นตัวเลข
    if (!isNaN(str) && str !== '' && !str.includes('/')) {
        const num = Number(str);
        return num.toLocaleString('th-TH');
    }
    
    // ถ้าเป็นวันที่ไทย (รูปแบบ dd/mm/yyyy)
    const thaiDateRegex = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
    if (thaiDateRegex.test(str)) {
        return str;
    }
    
    // ตรวจสอบว่าเป็น Google Drive URL
    if (str.includes('drive.google.com')) {
        const imageUrl = getImageFromGoogleDrive(str);
        if (imageUrl) {
            return createImagePreview(str, columnName);
        }
    }
    
    // ข้อความธรรมดา
    return str.replace(/\n/g, '<br>');
}

// Initialize when page loads
console.log('✅ ระบบค้นหาเลขแปลง IN-TECH พร้อมใช้งาน');
console.log('📊 โครงการ:', CONFIG.PROJECT_NAME);
console.log('🔗 Sheet ID:', CONFIG.SHEET_ID);
console.log('🖼️ คอลัมน์รูปภาพ:', CONFIG.IMAGE_COLUMNS ? CONFIG.IMAGE_COLUMNS.join(', ') : 'ไม่มี');
