/**
 * ระบบค้นหาแปลงที่ดิน - Minimal Design
 * ดึงข้อมูลจาก Google Sheets และ Google Drive
 */

// ค่าคงที่
const CONFIG = {
    GOOGLE_SHEETS_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHlqFXL5N8DKNhyg8au_M9eypFk65rXRgXdCna7pO9gadqpHLmtcz8FHKeCaBlxuqGcIY60PxUhyu-/pub?output=csv',
    GOOGLE_DRIVE_FOLDER_ID: '19uH9E6rwE0zpUIxHlAh4CFHflzNRAksG',
    PARCEL_COLUMNS: ['แปลง', 'เลขแปลง', 'หมายเลขแปลง', 'parcel', 'plot'],
    IMAGE_COLUMNS: ['รูปภาพ', 'ภาพ', 'image', 'photo']
};

// ตัวแปร Global
let allData = [];
let allImages = [];
let headers = [];
let todaySearchCount = 0;

// ==================== ฟังก์ชันเริ่มต้น ====================

/**
 * เริ่มต้นระบบ
 */
async function initializeApp() {
    showLoading(true);
    
    try {
        // โหลดข้อมูลจาก Local Storage
        loadLocalData();
        
        // โหลดข้อมูล (ในเวอร์ชันจริงจะดึงจาก Google Sheets)
        await loadMockData();
        
        // แสดงสถิติ
        updateStatistics();
        
        // ซ่อน loading
        showLoading(false);
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showLoading(false);
        alert('ไม่สามารถโหลดข้อมูลได้ กรุณารีเฟรชหน้าเว็บ');
    }
}

/**
 * โหลดข้อมูลจำลอง (สำหรับทดสอบ)
 */
async function loadMockData() {
    // สร้างข้อมูลจำลอง
    allData = [
        {
            'แปลง': '123',
            'พื้นที่': '5 ไร่',
            'เจ้าของ': 'สมชาย ใจดี',
            'ที่ตั้ง': 'ตำบลบ้านนา อำเภอเมือง',
            'จังหวัด': 'นครราชสีมา',
            'ราคา': '2,500,000 บาท',
            'สถานะ': 'ว่าง',
            'ประเภท': 'ที่ดินเกษตร',
            'รูปภาพ': 'parcel123.jpg'
        },
        {
            'แปลง': '456',
            'พื้นที่': '3 ไร่ 2 งาน',
            'เจ้าของ': 'สมหญิง สวยงาม',
            'ที่ตั้ง': 'ตำบลหนองรี อำเภอปากช่อง',
            'จังหวัด': 'นครราชสีมา',
            'ราคา': '1,800,000 บาท',
            'สถานะ': 'ขายแล้ว',
            'ประเภท': 'ที่ดินพาณิชย์',
            'รูปภาพ': 'parcel456.jpg'
        },
        {
            'แปลง': '789',
            'พื้นที่': '10 ไร่',
            'เจ้าของ': 'บริษัท เกษตรพัฒนา',
            'ที่ตั้ง': 'ตำบลโนนสูง อำเภอโนนสูง',
            'จังหวัด': 'นครราชสีมา',
            'ราคา': '5,000,000 บาท',
            'สถานะ': 'ว่าง',
            'ประเภท': 'ที่ดินเกษตร',
            'รูปภาพ': 'parcel789.jpg'
        },
        {
            'แปลง': '1011',
            'พื้นที่': '2 ไร่',
            'เจ้าของ': 'นายดำรงค์ พลเมือง',
            'ที่ตั้ง': 'ตำบลในเมือง อำเภอเมือง',
            'จังหวัด': 'นครราชสีมา',
            'ราคา': '1,200,000 บาท',
            'สถานะ': 'กำลังพิจารณา',
            'ประเภท': 'ที่อยู่อาศัย',
            'รูปภาพ': 'parcel1011.jpg'
        },
        {
            'แปลง': '1213',
            'พื้นที่': '8 ไร่',
            'เจ้าของ': 'นางสาวพรทิพย์ งามเมือง',
            'ที่ตั้ง': 'ตำบลบ้านใหม่ อำเภอสีคิ้ว',
            'จังหวัด': 'นครราชสีมา',
            'ราคา': '3,500,000 บาท',
            'สถานะ': 'ว่าง',
            'ประเภท': 'ที่ดินเกษตร',
            'รูปภาพ': 'parcel1213.jpg'
        },
        {
            'แปลง': '1415',
            'พื้นที่': '6 ไร่',
            'เจ้าของ': 'นายสุทธิ์ ใจกว้าง',
            'ที่ตั้ง': 'ตำบลสูงเนิน อำเภอสูงเนิน',
            'จังหวัด': 'นครราชสีมา',
            'ราคา': '2,800,000 บาท',
            'สถานะ': 'ขายแล้ว',
            'ประเภท': 'ที่ดินพาณิชย์',
            'รูปภาพ': 'parcel1415.jpg'
        }
    ];
    
    // ดึง headers
    headers = Object.keys(allData[0]);
    
    // สร้างรูปภาพจำลอง
    allImages = [
        { id: '1', name: 'parcel123.jpg', parcel: '123' },
        { id: '2', name: 'parcel123_2.jpg', parcel: '123' },
        { id: '3', name: 'parcel456.jpg', parcel: '456' },
        { id: '4', name: 'parcel789.jpg', parcel: '789' },
        { id: '5', name: 'parcel1011.jpg', parcel: '1011' },
        { id: '6', name: 'parcel1213.jpg', parcel: '1213' },
        { id: '7', name: 'parcel1415.jpg', parcel: '1415' }
    ];
    
    console.log('Loaded mock data:', { records: allData.length, images: allImages.length });
}

// ==================== ฟังก์ชันค้นหา ====================

/**
 * ทำการค้นหา
 */
function performSearch(query) {
    // เพิ่มสถิติการค้นหา
    todaySearchCount++;
    saveLocalData();
    
    // ค้นหาข้อมูล
    const results = findParcels(query);
    
    if (results.length === 0) {
        showNoResults(query);
        return;
    }
    
    // แสดงผลลัพธ์
    displayResults(query, results);
}

/**
 * ค้นหาแปลงในข้อมูล
 */
function findParcels(query) {
    const searchTerm = query.toLowerCase().trim();
    const results = [];
    
    allData.forEach(row => {
        // ค้นหาจากเลขแปลง
        const parcelNumber = getParcelNumber(row);
        if (parcelNumber && parcelNumber.toLowerCase().includes(searchTerm)) {
            results.push(row);
            return;
        }
        
        // ค้นหาจากข้อมูลอื่นๆ
        for (const [key, value] of Object.entries(row)) {
            if (value && value.toString().toLowerCase().includes(searchTerm)) {
                results.push(row);
                break;
            }
        }
    });
    
    return results;
}

/**
 * ดึงเลขแปลงจากข้อมูล
 */
function getParcelNumber(row) {
    for (const pattern of CONFIG.PARCEL_COLUMNS) {
        for (const [key, value] of Object.entries(row)) {
            if (key.toLowerCase().includes(pattern.toLowerCase())) {
                if (value && value.trim() !== '') {
                    return value.trim();
                }
            }
        }
    }
    return null;
}

// ==================== ฟังก์ชันแสดงผล ====================

/**
 * แสดงผลลัพธ์การค้นหา
 */
function displayResults(query, results) {
    // ซ่อนส่วนอื่นๆ
    document.getElementById('statsSection').style.display = 'none';
    document.getElementById('noResultsSection').style.display = 'none';
    
    // แสดงส่วนผลลัพธ์
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'block';
    
    // ถ้ามีหลายผลลัพธ์ ให้ใช้ผลลัพธ์แรก
    const result = results[0];
    const parcelNumber = getParcelNumber(result);
    
    // อัพเดตข้อมูล
    document.getElementById('searchTermDisplay').textContent = `ค้นหา: ${query}`;
    document.getElementById('parcelNumberBadge').textContent = `แปลง #${parcelNumber}`;
    document.getElementById('parcelTitle').textContent = `แปลงที่ดิน ${parcelNumber}`;
    
    // แสดงตำแหน่ง
    const location = getColumnValue(result, ['ที่ตั้ง', 'ตำบล', 'อำเภอ', 'จังหวัด']) || 'ไม่ระบุตำแหน่ง';
    document.getElementById('parcelLocation').innerHTML = `
        <i class="fas fa-location-dot"></i> ${location}
    `;
    
    // แสดงข้อมูลบางส่วน
    displayParcelInfo(result);
    
    // แสดงรูปภาพ
    displayParcelImages(parcelNumber);
    
    // แสดงแปลงที่เกี่ยวข้อง
    displayRelatedParcels(parcelNumber);
    
    // อัพเดตสถิติ
    updateStatistics();
}

/**
 * แสดงข้อมูลแปลง
 */
function displayParcelInfo(row) {
    const container = document.getElementById('parcelInfo');
    const importantColumns = ['พื้นที่', 'เจ้าของ', 'จังหวัด', 'ราคา', 'สถานะ', 'ประเภท'];
    
    let html = '';
    
    importantColumns.forEach(column => {
        const value = getColumnValue(row, [column]);
        if (value) {
            html += `
                <div class="info-item">
                    <div class="info-label">${column}</div>
                    <div class="info-value">${value}</div>
                </div>
            `;
        }
    });
    
    container.innerHTML = html || '<div class="col-12 text-center text-muted">ไม่มีข้อมูลเพิ่มเติม</div>';
}

/**
 * แสดงรูปภาพแปลง
 */
function displayParcelImages(parcelNumber) {
    const container = document.getElementById('parcelImages');
    const section = document.getElementById('imageSection');
    
    const images = getParcelImages(parcelNumber);
    
    if (images.length > 0) {
        let html = '';
        
        images.forEach((image, index) => {
            // ใช้รูปภาพจาก Unsplash เป็นตัวอย่าง
            const imageUrl = `https://images.unsplash.com/photo-${index === 0 ? '1542601906990' : '1500382017468'}?w=400&h=300&fit=crop`;
            
            html += `
                <div class="image-item" onclick="viewImage('${imageUrl}')">
                    <img src="${imageUrl}" alt="รูปภาพแปลง ${parcelNumber}">
                    <span class="image-count">${index + 1}</span>
                </div>
            `;
        });
        
        container.innerHTML = html;
        section.style.display = 'block';
    } else {
        section.style.display = 'none';
    }
}

/**
 * แสดงแปลงที่เกี่ยวข้อง
 */
function displayRelatedParcels(mainParcelNumber) {
    const container = document.getElementById('relatedParcels');
    const section = document.getElementById('relatedParcelsSection');
    
    const related = findRelatedParcels(mainParcelNumber);
    
    if (related.length > 0) {
        let html = '';
        
        related.slice(0, 4).forEach(row => {
            const parcelNumber = getParcelNumber(row);
            const area = getColumnValue(row, ['พื้นที่']) || 'ไม่ระบุ';
            
            html += `
                <div class="related-parcel-card" onclick="searchExample('${parcelNumber}')">
                    <div class="related-parcel-number">แปลง ${parcelNumber}</div>
                    <div class="related-parcel-info">${area}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        section.style.display = 'block';
    } else {
        section.style.display = 'none';
    }
}

/**
 * แสดงว่าไม่พบผลลัพธ์
 */
function showNoResults(query) {
    document.getElementById('statsSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    
    const noResultsSection = document.getElementById('noResultsSection');
    noResultsSection.style.display = 'block';
}

// ==================== ฟังก์ชัน Utility ====================

/**
 * ดึงค่าจากคอลัมน์
 */
function getColumnValue(row, columnPatterns) {
    for (const pattern of columnPatterns) {
        for (const [key, value] of Object.entries(row)) {
            if (key.toLowerCase().includes(pattern.toLowerCase())) {
                if (value && value.trim() !== '') {
                    return value;
                }
            }
        }
    }
    return null;
}

/**
 * ดึงรูปภาพของแปลง
 */
function getParcelImages(parcelNumber) {
    if (!parcelNumber) return [];
    
    return allImages.filter(image => 
        image.parcel && image.parcel.toLowerCase() === parcelNumber.toLowerCase()
    );
}

/**
 * หาแปลงที่เกี่ยวข้อง
 */
function findRelatedParcels(mainParcelNumber) {
    const related = [];
    
    // ค้นหาแปลงอื่นๆ (ยกเว้นแปลงปัจจุบัน)
    allData.forEach(row => {
        const parcelNumber = getParcelNumber(row);
        if (parcelNumber && parcelNumber !== mainParcelNumber) {
            related.push(row);
        }
    });
    
    // สุ่มเลือก 4 แปลง
    return related.sort(() => Math.random() - 0.5).slice(0, 4);
}

/**
 * อัพเดตสถิติ
 */
function updateStatistics() {
    document.getElementById('totalParcels').textContent = allData.length;
    document.getElementById('totalImages').textContent = allImages.length;
    document.getElementById('todaySearches').textContent = todaySearchCount;
    document.getElementById('updatedParcels').textContent = allData.length;
    
    // อัพเดต footer
    document.getElementById('footerUpdateTime').textContent = new Date().toLocaleString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * แสดง/ซ่อน loading
 */
function showLoading(show) {
    const loadingElement = document.getElementById('loadingState');
    loadingElement.style.display = show ? 'block' : 'none';
}

/**
 * ดูรูปภาพ
 */
function viewImage(imageUrl) {
    window.open(imageUrl, '_blank');
}

// ==================== ฟังก์ชัน Local Storage ====================

/**
 * โหลดข้อมูลจาก Local Storage
 */
function loadLocalData() {
    try {
        const today = new Date().toDateString();
        const savedStats = localStorage.getItem('parcelSearchStats');
        
        if (savedStats) {
            const stats = JSON.parse(savedStats);
            if (stats.date === today) {
                todaySearchCount = stats.count || 0;
            }
        }
    } catch (error) {
        console.error('Error loading local data:', error);
    }
}

/**
 * บันทึกข้อมูลลง Local Storage
 */
function saveLocalData() {
    try {
        const today = new Date().toDateString();
        localStorage.setItem('parcelSearchStats', JSON.stringify({
            date: today,
            count: todaySearchCount
        }));
    } catch (error) {
        console.error('Error saving local data:', error);
    }
}

// ==================== เปิดเผยฟังก์ชันให้เรียกจาก HTML ====================

// ฟังก์ชันที่จะใช้ใน onclick attributes
window.searchParcel = function() {
    const input = document.getElementById('searchInput');
    const query = input.value.trim();
    
    if (!query) {
        alert('กรุณากรอกเลขแปลงที่ต้องการค้นหา');
        return;
    }
    
    performSearch(query);
};

window.searchExample = function(parcelNumber) {
    document.getElementById('searchInput').value = parcelNumber;
    performSearch(parcelNumber);
};

window.searchAnother = function() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchInput').focus();
    showAllData();
};

window.showAllData = function() {
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('noResultsSection').style.display = 'none';
    document.getElementById('statsSection').style.display = 'grid';
    document.getElementById('searchInput').value = '';
};

window.viewMoreImages = function() {
    alert('ฟีเจอร์ดูรูปภาพทั้งหมดอยู่ในระหว่างการพัฒนา');
};

window.viewImage = function(imageUrl) {
    window.open(imageUrl, '_blank');
};

// เริ่มต้นแอปเมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', function() {
    // ทำให้สามารถกด Enter เพื่อค้นหาได้
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchParcel();
        }
    });
    
    // เริ่มต้นระบบ
    initializeApp();
});
