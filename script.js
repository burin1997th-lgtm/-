// ============================================
// Google Sheet Viewer - Thai Language Fix
// ============================================

const CONFIG = {
    SHEET_ID: '15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw',
    SHEET_NAME: 'สถานะ',
    
    // ใช้ URL นี้โดยเฉพาะสำหรับ Google Sheet ภาษาไทย
    CSV_URL: 'https://docs.google.com/spreadsheets/d/15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw/export?format=csv&gid=0',
    
    // หรือใช้ opensheet ซึ่งรองรับภาษาไทยดีกว่า
    OPENSHEET_URL: 'https://opensheet.elk.sh/15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw/สถานะ',
    
    ITEMS_PER_PAGE: 10,
    
    // ตั้งค่า CSV parsing สำหรับภาษาไทย
    CSV_CONFIG: {
        delimiter: ',',      // ลองเปลี่ยนเป็น ',' หรือ ';' หรือ '\t'
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        transform: function(value) {
            // แก้ไขปัญหาพิเศษสำหรับภาษาไทย
            return value ? value.toString().trim() : '';
        }
    }
};

let allData = [];
let currentPage = 1;

// เมื่อหน้าเว็บโหลด
$(document).ready(function() {
    console.log('🚀 เริ่มระบบดูข้อมูล Google Sheet ภาษาไทย');
    
    setupUI();
    loadData();
});

function setupUI() {
    $('#loadDataBtn').click(() => loadData(true));
    $('#testThaiBtn').click(testThaiData);
    $('#viewRawBtn').click(viewRawData);
}

// โหลดข้อมูล
function loadData(force = false) {
    showLoading(true);
    $('#message').html('<div class="alert alert-info">กำลังโหลดข้อมูลภาษาไทย...</div>');
    
    // ลองทั้งสองวิธี
    loadWithOpensheet();
}

// วิธีที่ 1: ใช้ opensheet (ดีที่สุดสำหรับภาษาไทย)
function loadWithOpensheet() {
    console.log('📥 กำลังโหลดด้วย opensheet...');
    
    const url = CONFIG.OPENSHEET_URL;
    
    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'json',
        timeout: 15000,
        success: function(data) {
            console.log('✅ ได้รับข้อมูลจาก opensheet');
            console.log('จำนวนแถว:', data.length);
            
            if (data && data.length > 0) {
                allData = data;
                displayData();
                updateStats();
                showMessage(`โหลดข้อมูลสำเร็จ ${data.length} รายการ`, 'success');
            } else {
                console.log('⚠️ opensheet ว่างเปล่า, ลองใช้ CSV...');
                loadWithCSV();
            }
            showLoading(false);
        },
        error: function(xhr, status, error) {
            console.error('❌ opensheet ล้มเหลว:', error);
            loadWithCSV();
        }
    });
}

// วิธีที่ 2: ใช้ CSV (สำรอง)
function loadWithCSV() {
    console.log('📥 กำลังโหลดด้วย CSV...');
    
    const url = CONFIG.CSV_URL;
    
    // ใช้ PapaParse แต่ตั้งค่าพิเศษสำหรับภาษาไทย
    Papa.parse(url, {
        download: true,
        delimiter: ',',
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: function(results) {
            console.log('✅ CSV parse สำเร็จ');
            console.log('จำนวนแถว:', results.data.length);
            console.log('ข้อผิดพลาด:', results.errors);
            console.log('ตัวอย่างข้อมูลแถวแรก:', results.data[0]);
            
            if (results.data.length > 0) {
                allData = results.data;
                
                // ทำความสะอาดข้อมูลภาษาไทย
                cleanThaiData();
                
                displayData();
                updateStats();
                showMessage(`โหลดข้อมูลสำเร็จ ${results.data.length} รายการ`, 'success');
            } else {
                showMessage('ไม่พบข้อมูลใน CSV', 'warning');
            }
            showLoading(false);
        },
        error: function(error) {
            console.error('❌ CSV parse error:', error);
            
            // ลอง delimiter อื่นๆ
            tryDifferentDelimiters(url);
        }
    });
}

// ลอง delimiter อื่นๆ
function tryDifferentDelimiters(url) {
    const delimiters = [',', ';', '\t', '|'];
    let currentIndex = 0;
    
    function tryNext() {
        if (currentIndex >= delimiters.length) {
            showMessage('ไม่สามารถอ่านข้อมูลได้', 'danger');
            showLoading(false);
            return;
        }
        
        const delimiter = delimiters[currentIndex];
        console.log(`🔧 ลอง delimiter: "${delimiter}" (${delimiter.charCodeAt(0)})`);
        
        Papa.parse(url, {
            download: true,
            delimiter: delimiter,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                if (results.data.length > 0 && !results.errors.length) {
                    console.log(`✅ พบ delimiter ที่ถูกต้อง: "${delimiter}"`);
                    allData = results.data;
                    cleanThaiData();
                    displayData();
                    updateStats();
                    showMessage(`โหลดสำเร็จ (ใช้ ${delimiter} เป็นตัวแบ่ง)`, 'success');
                    showLoading(false);
                } else {
                    console.log(`❌ Delimiter "${delimiter}" ไม่ทำงาน`);
                    currentIndex++;
                    tryNext();
                }
            },
            error: function() {
                currentIndex++;
                tryNext();
            }
        });
    }
    
    tryNext();
}

// ทำความสะอาดข้อมูลภาษาไทย
function cleanThaiData() {
    console.log('🧹 ทำความสะอาดข้อมูลภาษาไทย...');
    
    if (allData.length === 0) return;
    
    // ดูคอลัมน์ทั้งหมด
    const firstRow = allData[0];
    console.log('คอลัมน์ดั้งเดิม:', Object.keys(firstRow));
    
    // แก้ไขชื่อคอลัมน์ภาษาไทยที่อาจมีปัญหา
    allData = allData.map(row => {
        const newRow = {};
        
        Object.keys(row).forEach(key => {
            // ทำความสะอาดชื่อคอลัมน์
            const cleanKey = key
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // ลบ control characters
                .trim();
            
            // ทำความสะอาดค่า
            let value = row[key];
            if (typeof value === 'string') {
                value = value.trim();
            }
            
            newRow[cleanKey] = value || '';
        });
        
        return newRow;
    });
    
    console.log('คอลัมน์หลังทำความสะอาด:', Object.keys(allData[0]));
}

// แสดงข้อมูล
function displayData() {
    if (!allData || allData.length === 0) {
        $('#dataTable').html(`
            <div class="alert alert-warning">
                <i class="fas fa-database"></i> ไม่พบข้อมูล
            </div>
        `);
        return;
    }
    
    console.log('แสดงข้อมูล:', allData.length, 'แถว');
    
    // เอาชื่อคอลัมน์จากแถวแรก
    const headers = Object.keys(allData[0]);
    console.log('หัวตาราง:', headers);
    
    const startIdx = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const endIdx = Math.min(startIdx + CONFIG.ITEMS_PER_PAGE, allData.length);
    const totalPages = Math.ceil(allData.length / CONFIG.ITEMS_PER_PAGE);
    
    // สร้างตาราง HTML
    let html = `
        <div class="table-responsive">
            <table class="table table-bordered table-hover table-sm">
                <thead class="table-dark">
                    <tr>
                        <th width="50">#</th>
    `;
    
    // หัวตาราง
    headers.forEach(header => {
        html += `<th>${formatHeader(header)}</th>`;
    });
    
    html += `</tr></thead><tbody>`;
    
    // ข้อมูลแถว
    for (let i = startIdx; i < endIdx; i++) {
        const row = allData[i];
        html += `<tr><td class="text-center">${i + 1}</td>`;
        
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
            แสดง ${startIdx + 1}-${endIdx} จาก ${allData.length} รายการ | 
            หน้า ${currentPage}/${totalPages}
        </small>
    `);
}

// สร้าง pagination
function createPagination(totalPages) {
    let html = `
        <nav aria-label="Page navigation">
            <ul class="pagination pagination-sm justify-content-center">
    `;
    
    // Previous
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
        } else if (Math.abs(i - currentPage) === 3) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    // Next
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
    
    html += `</ul></nav>`;
    return html;
}

// เปลี่ยนหน้า
function changePage(page) {
    if (page < 1 || page > Math.ceil(allData.length / CONFIG.ITEMS_PER_PAGE)) return;
    currentPage = page;
    displayData();
    window.scrollTo(0, 0);
}

// ทดสอบข้อมูลภาษาไทย
function testThaiData() {
    console.clear();
    console.log('🧪 ทดสอบข้อมูลภาษาไทย...');
    
    // ทดสอบ URL ต่างๆ
    const testUrls = [
        {
            name: 'Opensheet',
            url: CONFIG.OPENSHEET_URL,
            type: 'json'
        },
        {
            name: 'CSV Export',
            url: CONFIG.CSV_URL,
            type: 'csv'
        },
        {
            name: 'CSV gviz',
            url: 'https://docs.google.com/spreadsheets/d/15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw/gviz/tq?tqx=out:csv',
            type: 'csv'
        }
    ];
    
    testUrls.forEach(test => {
        console.log(`\n🔍 ทดสอบ: ${test.name}`);
        console.log(`🔗 URL: ${test.url}`);
        
        if (test.type === 'json') {
            $.ajax({
                url: test.url,
                method: 'GET',
                success: function(data) {
                    console.log(`✅ สำเร็จ! จำนวนแถว: ${data.length}`);
                    if (data.length > 0) {
                        console.log('ตัวอย่างแถวแรก:', data[0]);
                    }
                },
                error: function(xhr, status, error) {
                    console.error(`❌ ล้มเหลว: ${error}`);
                }
            });
        } else {
            // ทดสอบ CSV
            Papa.parse(test.url, {
                download: true,
                header: false, // ดู raw data ก่อน
                complete: function(results) {
                    console.log(`✅ ได้รับข้อมูล ${results.data.length} แถว`);
                    console.log('ตัวอย่าง 2 แถวแรก:', results.data.slice(0, 2));
                    
                    // ลอง parse แบบมี header
                    Papa.parse(test.url, {
                        download: true,
                        header: true,
                        complete: function(results2) {
                            console.log(`📊 Parse แบบมี header: ${results2.data.length} แถว`);
                            console.log('Header:', results2.meta.fields);
                        }
                    });
                }
            });
        }
    });
}

// ดูข้อมูลดิบ
function viewRawData() {
    if (allData.length === 0) {
        alert('ยังไม่มีข้อมูล');
        return;
    }
    
    const headers = Object.keys(allData[0]);
    let rawHtml = `
        <div class="card">
            <div class="card-header">ข้อมูลดิบ (แถวที่ 1-5)</div>
            <div class="card-body">
                <pre><code>
    `;
    
    // แสดง 5 แถวแรก
    for (let i = 0; i < Math.min(5, allData.length); i++) {
        rawHtml += `\nแถวที่ ${i + 1}:\n`;
        const row = allData[i];
        
        headers.forEach(header => {
            rawHtml += `  ${header}: "${row[header] || ''}"\n`;
        });
    }
    
    rawHtml += `
                </code></pre>
                <p>จำนวนคอลัมน์: ${headers.length}</p>
                <p>ชื่อคอลัมน์: ${headers.join(', ')}</p>
            </div>
        </div>
    `;
    
    $('#dataTable').html(rawHtml);
}

// Helper functions
function formatHeader(header) {
    // ตัดข้อความที่ยาวเกินไป
    if (header.length > 20) {
        return header.substring(0, 17) + '...';
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
        if (Number.isInteger(num)) {
            return num.toLocaleString('th-TH');
        } else {
            return num.toFixed(2);
        }
    }
    
    // ถ้าเป็นวันที่ (รูปแบบไทย)
    const thaiDateMatch = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (thaiDateMatch) {
        return str;
    }
    
    // ข้อความธรรมดา
    return str;
}

function showLoading(show) {
    if (show) {
        $('#loading').show();
        $('#dataTable').hide();
    } else {
        $('#loading').hide();
        $('#dataTable').show();
    }
}

function showMessage(text, type) {
    $('#message').html(`
        <div class="alert alert-${type} alert-dismissible fade show">
            ${text}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);
    setTimeout(() => $('.alert').alert('close'), 5000);
}

function updateStats() {
    $('#stats').html(`
        <div class="row">
            <div class="col">
                <span class="badge bg-primary">
                    <i class="fas fa-table"></i> ${allData.length} แถว
                </span>
            </div>
            <div class="col">
                <span class="badge bg-success">
                    <i class="fas fa-columns"></i> ${allData.length > 0 ? Object.keys(allData[0]).length : 0} คอลัมน์
                </span>
            </div>
            <div class="col">
                <span class="badge bg-info">
                    <i class="fas fa-clock"></i> ${new Date().toLocaleTimeString('th-TH')}
                </span>
            </div>
        </div>
    `);
}
