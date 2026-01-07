// ============================================
// Google Sheet Viewer - Fixed Version
// ============================================

const CONFIG = {
    SHEET_ID: '15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw',
    SHEET_NAME: 'สถานะ',
    
    // ใช้ CORS Proxy เพื่อแก้ปัญหา CORS
    USE_PROXY: true,
    
    // ลองหลายๆ URL
    CSV_URLS: [
        // วิธีหลัก (ใช้ Proxy ถ้าต้องการ)
        'https://docs.google.com/spreadsheets/d/15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw/gviz/tq?tqx=out:csv',
        
        // วิธีสำรอง 1: Export format
        'https://docs.google.com/spreadsheets/d/15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw/export?format=csv',
        
        // วิธีสำรอง 2: ใช้ opensheet
        'https://opensheet.elk.sh/15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw/สถานะ'
    ],
    
    ITEMS_PER_PAGE: 20
};

let allData = [];
let currentPage = 1;

// เมื่อหน้าเว็บโหลด
$(document).ready(function() {
    console.log('🚀 เริ่มต้นระบบ...');
    
    // ตั้งค่า UI
    setupUI();
    
    // ดึงข้อมูลทันที
    loadData();
});

function setupUI() {
    // ปุ่มต่างๆ
    $('#loadBtn').click(() => loadData(true));
    $('#testBtn').click(testConnection);
    $('#debugBtn').click(showDebugInfo);
    
    // ค้นหา
    $('#searchBtn').click(performSearch);
    $('#searchInput').keypress(e => e.which === 13 && performSearch());
}

// ดึงข้อมูลหลัก
function loadData(force = false) {
    showLoading(true);
    showMessage('กำลังดึงข้อมูล...', 'info');
    
    // ลองทั้ง 3 วิธี
    tryMethod(0);
}

function tryMethod(index) {
    if (index >= CONFIG.CSV_URLS.length) {
        showMessage('ทุกวิธีล้มเหลว!', 'danger');
        showLoading(false);
        return;
    }
    
    const url = CONFIG.USE_PROXY ? 
        `https://corsproxy.io/?${encodeURIComponent(CONFIG.CSV_URLS[index])}` :
        CONFIG.CSV_URLS[index];
    
    console.log(`🔄 ลองวิธีที่ ${index + 1}:`, url);
    $('#status').html(`<small>กำลังลองวิธีที่ ${index + 1}...</small>`);
    
    // ใช้ Fetch API แทน PapaParse เพื่อ debug
    fetch(url)
        .then(response => {
            console.log('📥 Response:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return response.text();
        })
        .then(csvText => {
            console.log('✅ ได้รับข้อมูล CSV');
            console.log('📏 ความยาว:', csvText.length);
            console.log('📝 ตัวอย่าง:', csvText.substring(0, 200));
            
            // Parse ด้วย PapaParse
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    console.log('📊 Parse สำเร็จ');
                    console.log('จำนวนแถว:', results.data.length);
                    console.log('ข้อผิดพลาด:', results.errors);
                    
                    if (results.data.length > 0) {
                        allData = results.data;
                        displayData();
                        updateStats();
                        showMessage(`โหลดสำเร็จ ${results.data.length} รายการ`, 'success');
                        showLoading(false);
                    } else {
                        console.log('⚠️ ไม่มีข้อมูล, ลองวิธีต่อไป...');
                        tryMethod(index + 1);
                    }
                },
                error: function(error) {
                    console.error('❌ Parse error:', error);
                    tryMethod(index + 1);
                }
            });
        })
        .catch(error => {
            console.error(`❌ วิธีที่ ${index + 1} ล้มเหลว:`, error);
            tryMethod(index + 1);
        });
}

// แสดงข้อมูล
function displayData() {
    if (!allData || allData.length === 0) {
        $('#dataTable').html(`
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i> ไม่พบข้อมูล
            </div>
        `);
        return;
    }
    
    console.log('📋 Headers:', Object.keys(allData[0]));
    
    const headers = Object.keys(allData[0]);
    const startIdx = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const endIdx = Math.min(startIdx + CONFIG.ITEMS_PER_PAGE, allData.length);
    
    // สร้างตาราง
    let html = `
        <table class="table table-sm table-striped">
            <thead>
                <tr>
                    <th>#</th>
    `;
    
    headers.forEach(h => html += `<th>${h}</th>`);
    html += `</tr></thead><tbody>`;
    
    for (let i = startIdx; i < endIdx; i++) {
        html += `<tr><td>${i + 1}</td>`;
        headers.forEach(h => {
            html += `<td>${allData[i][h] || ''}</td>`;
        });
        html += `</tr>`;
    }
    
    html += `</tbody></table>`;
    
    $('#dataTable').html(html);
    $('#info').text(`แสดง ${startIdx + 1}-${endIdx} จาก ${allData.length} รายการ`);
}

// ทดสอบการเชื่อมต่อ
function testConnection() {
    console.clear();
    console.log('🧪 ทดสอบการเชื่อมต่อ...');
    
    const testUrls = [
        'https://docs.google.com/spreadsheets/d/15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw/gviz/tq?tqx=out:csv',
        'https://docs.google.com/spreadsheets/d/15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw/export?format=csv'
    ];
    
    testUrls.forEach((url, i) => {
        console.log(`\n🔗 ทดสอบ URL ${i + 1}:`, url);
        
        fetch(url)
            .then(r => {
                console.log(`✅ Status: ${r.status} ${r.statusText}`);
                return r.text();
            })
            .then(text => {
                console.log(`📏 Length: ${text.length} chars`);
                console.log(`📝 Preview: ${text.substring(0, 100)}...`);
            })
            .catch(e => console.error(`❌ Error:`, e));
    });
}

// แสดงข้อมูล Debug
function showDebugInfo() {
    console.log('🐛 Debug Information:');
    console.log('All Data:', allData);
    console.log('Data Length:', allData.length);
    
    if (allData.length > 0) {
        console.log('First Row:', allData[0]);
        console.log('Headers:', Object.keys(allData[0]));
    }
    
    alert(`ข้อมูล Debug:\nจำนวนแถว: ${allData.length}\nดูรายละเอียดใน Console (F12)`);
}

// Helper functions
function showLoading(show) {
    $('#loading').toggle(show);
    $('#dataTable').toggle(!show);
}

function showMessage(text, type) {
    const msg = $(`<div class="alert alert-${type}">${text}</div>`);
    $('#messages').html(msg);
    setTimeout(() => msg.alert('close'), 3000);
}

function updateStats() {
    $('#stats').html(`
        <div class="badge bg-primary">แถว: ${allData.length}</div>
        <div class="badge bg-success">คอลัมน์: ${allData.length > 0 ? Object.keys(allData[0]).length : 0}</div>
    `);
}

function performSearch() {
    const term = $('#searchInput').val().trim();
    if (!term) return;
    
    const results = allData.filter(row => 
        Object.values(row).some(val => 
            String(val).toLowerCase().includes(term.toLowerCase())
        )
    );
    
    if (results.length === 0) {
        showMessage('ไม่พบผลลัพธ์', 'warning');
        return;
    }
    
    allData = results;
    currentPage = 1;
    displayData();
    showMessage(`พบ ${results.length} รายการ`, 'success');
}
