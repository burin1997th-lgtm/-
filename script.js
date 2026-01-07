// ============================================
// ระบบดึงข้อมูลจาก Google Sheet โดยตรง
// ============================================

const CONFIG = {
    // ใช้ URL นี้สำหรับดึงข้อมูลเป็น CSV
    CSV_URL: 'https://docs.google.com/spreadsheets/d/15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw/gviz/tq?tqx=out:csv',
    
    // หรือใช้ URL ที่คุณให้มา (Published HTML)
    PUBLISHED_HTML_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHlqFXL5N8DKNhyg8au_M9eypFk65rXRgXdCna7pO9gadqpHLmtcz8FHKeCaBlxuqGcIY60PxUhyu-/pubhtml',
    
    SHEET_NAME: 'สถานะ',
    ITEMS_PER_PAGE: 20,
    CACHE_DURATION: 300000 // 5 นาที
};

let allData = [];
let currentPage = 1;

// เมื่อหน้าเว็บโหลด
$(document).ready(function() {
    console.log('🚀 กำลังเริ่มต้นระบบ...');
    
    // โหลดข้อมูลทันที
    loadDataFromGoogleSheet();
    
    // ตั้งค่า event listeners
    $('#showAllBtn').click(function() {
        loadDataFromGoogleSheet(true);
    });
    
    $('#refreshBtn').click(function() {
        loadDataFromGoogleSheet(true);
        $(this).addClass('refreshing');
        setTimeout(() => $(this).removeClass('refreshing'), 1000);
    });
    
    $('#searchBtn').click(performSearch);
    
    // Enter key สำหรับค้นหา
    $('#searchInput').keypress(function(e) {
        if (e.which === 13) {
            performSearch();
        }
    });
});

// ดึงข้อมูลจาก Google Sheet
function loadDataFromGoogleSheet(forceRefresh = false) {
    console.log('📥 กำลังดึงข้อมูลจาก Google Sheet...');
    
    showLoading(true);
    
    // ลองวิธีที่ 1: ใช้ CSV URL
    const csvUrl = CONFIG.CSV_URL;
    
    console.log('🔗 ใช้ URL:', csvUrl);
    
    Papa.parse(csvUrl, {
        download: true,
        header: true, // ใช้แถวแรกเป็น header
        skipEmptyLines: true,
        complete: function(results) {
            console.log('✅ ดึงข้อมูลสำเร็จ');
            console.log('📊 ข้อมูลที่ได้:', results.data.length, 'แถว');
            
            if (results.data && results.data.length > 0) {
                allData = results.data;
                displayAllData();
                updateStatistics();
                showMessage('โหลดข้อมูลสำเร็จ ' + results.data.length + ' รายการ', 'success');
                
                // แคชข้อมูล
                localStorage.setItem('sheetDataCache', JSON.stringify(allData));
                localStorage.setItem('sheetCacheTime', Date.now().toString());
            } else {
                showMessage('ไม่พบข้อมูลใน Sheet', 'warning');
            }
            showLoading(false);
        },
        error: function(error) {
            console.error('❌ ผิดพลาด:', error);
            
            // ลองวิธีที่ 2: ใช้วิธีอื่น
            tryAlternativeMethod();
            
            showLoading(false);
        }
    });
}

// วิธีสำรอง
function tryAlternativeMethod() {
    console.log('🔄 ลองวิธีสำรอง...');
    
    // ลองใช้ Sheet API ผ่าน proxy
    const apiUrl = `https://opensheet.elk.sh/15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw/${CONFIG.SHEET_NAME}`;
    
    $.ajax({
        url: apiUrl,
        method: 'GET',
        success: function(data) {
            console.log('✅ สำรองสำเร็จ:', data.length, 'แถว');
            allData = data;
            displayAllData();
            updateStatistics();
            showMessage('โหลดข้อมูลสำเร็จ (ใช้วิธีสำรอง)', 'info');
        },
        error: function() {
            // วิธีที่ 3: ใช้ Google Sheets API v4
            tryGoogleSheetsAPI();
        }
    });
}

// ใช้ Google Sheets API
function tryGoogleSheetsAPI() {
    // ต้องใช้ API Key สำหรับวิธีนี้
    const apiKey = 'AIzaSyB8pZtF1qYh3q5YQ6rQ1qWwQ5rQ1qWwQ5rQ';
    const range = 'A:Z'; // หรือระบุ range ที่ชัดเจน
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw/values/${CONFIG.SHEET_NAME}!${range}?key=${apiKey}`;
    
    $.ajax({
        url: url,
        method: 'GET',
        success: function(response) {
            if (response.values) {
                // แปลง array of arrays เป็น array of objects
                const headers = response.values[0];
                const rows = response.values.slice(1);
                
                allData = rows.map(row => {
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = row[index] || '';
                    });
                    return obj;
                });
                
                displayAllData();
                updateStatistics();
                showMessage('โหลดข้อมูลสำเร็จ (ใช้ Google Sheets API)', 'success');
            }
        },
        error: function() {
            showMessage('ไม่สามารถเชื่อมต่อกับ Google Sheet ได้', 'danger');
        }
    });
}

// แสดงข้อมูลทั้งหมด
function displayAllData() {
    if (!allData || allData.length === 0) {
        $('#dataContainer').html(`
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i> ไม่พบข้อมูล
            </div>
        `);
        return;
    }
    
    const headers = Object.keys(allData[0]);
    
    // สร้างตาราง HTML
    let html = `
        <div class="table-responsive">
            <table class="table table-hover table-bordered">
                <thead class="table-dark">
                    <tr>
                        <th>#</th>
    `;
    
    // เพิ่มหัวข้อ
    headers.forEach(header => {
        html += `<th>${header}</th>`;
    });
    
    html += `</tr></thead><tbody>`;
    
    // เพิ่มข้อมูล
    const startIndex = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + CONFIG.ITEMS_PER_PAGE, allData.length);
    
    for (let i = startIndex; i < endIndex; i++) {
        const row = allData[i];
        html += `<tr><td class="fw-bold">${i + 1}</td>`;
        
        headers.forEach(header => {
            const value = row[header] || '';
            html += `<td>${escapeHtml(value.toString())}</td>`;
        });
        
        html += `</tr>`;
    }
    
    html += `</tbody></table></div>`;
    
    // เพิ่ม pagination
    const totalPages = Math.ceil(allData.length / CONFIG.ITEMS_PER_PAGE);
    
    if (totalPages > 1) {
        html += `<nav><ul class="pagination justify-content-center">`;
        
        // ปุ่มก่อนหน้า
        if (currentPage > 1) {
            html += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${currentPage - 1})">ก่อนหน้า</a></li>`;
        }
        
        // หมายเลขหน้า
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                            <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                         </li>`;
            }
        }
        
        // ปุ่มถัดไป
        if (currentPage < totalPages) {
            html += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${currentPage + 1})">ถัดไป</a></li>`;
        }
        
        html += `</ul></nav>`;
    }
    
    // แสดงข้อมูล
    $('#dataContainer').html(html);
    
    // แสดงข้อมูลสรุป
    $('#dataInfo').html(`
        แสดง <strong>${startIndex + 1}</strong> ถึง <strong>${endIndex}</strong> 
        จากทั้งหมด <strong>${allData.length}</strong> รายการ
    `);
}

// เปลี่ยนหน้า
function changePage(page) {
    currentPage = page;
    displayAllData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ค้นหาข้อมูล
function performSearch() {
    const searchTerm = $('#searchInput').val().trim();
    
    if (!searchTerm) {
        showMessage('กรุณากรอกคำค้นหา', 'warning');
        return;
    }
    
    if (!allData || allData.length === 0) {
        showMessage('ไม่มีข้อมูลสำหรับค้นหา', 'warning');
        return;
    }
    
    const searchLower = searchTerm.toLowerCase();
    const results = allData.filter(row => {
        return Object.values(row).some(value => 
            value.toString().toLowerCase().includes(searchLower)
        );
    });
    
    if (results.length === 0) {
        showMessage(`ไม่พบผลลัพธ์สำหรับ "${searchTerm}"`, 'info');
        return;
    }
    
    // แสดงผลการค้นหา
    const tempData = allData;
    allData = results;
    currentPage = 1;
    displayAllData();
    
    // แสดงแถบค้นหา
    $('#dataContainer').prepend(`
        <div class="alert alert-info alert-dismissible fade show">
            <i class="fas fa-search me-2"></i>
            พบ <strong>${results.length}</strong> รายการที่ตรงกับ "<strong>${searchTerm}</strong>"
            <button type="button" class="btn-close" onclick="clearSearch()"></button>
        </div>
    `);
    
    // เก็บข้อมูลเดิมไว้
    window.originalData = tempData;
    window.searchTerm = searchTerm;
    
    showMessage(`พบ ${results.length} รายการ`, 'success');
}

// ล้างการค้นหา
function clearSearch() {
    if (window.originalData) {
        allData = window.originalData;
        currentPage = 1;
        displayAllData();
        $('#searchInput').val('');
        showMessage('แสดงข้อมูลทั้งหมดแล้ว', 'info');
    }
}

// อัปเดตสถิติ
function updateStatistics() {
    $('#totalRecords').text(allData.length.toLocaleString());
    $('#lastUpdate').text(new Date().toLocaleTimeString('th-TH'));
    
    if (allData.length > 0) {
        $('#columnCount').text(Object.keys(allData[0]).length);
    }
}

// แสดงข้อความ
function showMessage(message, type = 'info') {
    const alert = $(`
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);
    
    $('#messageContainer').html(alert);
    
    // หายไปเองหลังจาก 5 วินาที
    setTimeout(() => alert.alert('close'), 5000);
}

// แสดง/ซ่อน loading
function showLoading(show) {
    if (show) {
        $('#loading').show();
        $('#dataContainer').hide();
    } else {
        $('#loading').hide();
        $('#dataContainer').show();
    }
}

// Escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
