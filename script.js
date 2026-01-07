/**
 * ระบบค้นหาแปลงที่ดิน - แก้ไขให้ใช้งานได้จริง
 */

// ข้อมูลตัวอย่าง (ใช้สำหรับทดสอบ)
const SAMPLE_DATA = [
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

// ตัวแปร Global
let allData = [];
let searchCount = 0;

// ฟังก์ชันเริ่มต้น
function initializeApp() {
    showLoading(true);
    
    // ใช้ข้อมูลตัวอย่าง
    allData = SAMPLE_DATA;
    
    // อัพเดตสถิติ
    updateStatistics();
    
    // ซ่อน loading
    setTimeout(() => {
        showLoading(false);
        document.getElementById('statsSection').style.display = 'grid';
    }, 500);
    
    // อัพเดต footer
    updateFooter();
}

// ฟังก์ชันค้นหาแปลง
function searchParcel() {
    const input = document.getElementById('searchInput');
    const query = input.value.trim();
    
    if (!query) {
        alert('กรุณากรอกเลขแปลงที่ต้องการค้นหา');
        return;
    }
    
    // เพิ่มจำนวนการค้นหา
    searchCount++;
    updateStatistics();
    
    // ค้นหาข้อมูล
    const results = findParcels(query);
    
    if (results.length === 0) {
        showNoResults();
        return;
    }
    
    // แสดงผลลัพธ์
    displayResults(results[0], query);
}

// ค้นหาแปลงในข้อมูล
function findParcels(query) {
    const searchTerm = query.toLowerCase();
    const results = [];
    
    allData.forEach(item => {
        // ค้นหาจากเลขแปลง
        if (item['แปลง'] && item['แปลง'].toString().toLowerCase().includes(searchTerm)) {
            results.push(item);
            return;
        }
        
        // ค้นหาจากข้อมูลอื่นๆ
        for (const key in item) {
            if (item[key] && item[key].toString().toLowerCase().includes(searchTerm)) {
                results.push(item);
                break;
            }
        }
    });
    
    return results;
}

// แสดงผลลัพธ์
function displayResults(parcelData, query) {
    // ซ่อนส่วนอื่น
    document.getElementById('statsSection').style.display = 'none';
    document.getElementById('noResultsSection').style.display = 'none';
    
    // แสดงส่วนผลลัพธ์
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'block';
    
    // อัพเดตข้อมูลแปลง
    const parcelNumber = parcelData['แปลง'] || 'ไม่ระบุ';
    document.getElementById('parcelTitle').textContent = `แปลงที่ดิน ${parcelNumber}`;
    
    // อัพเดตตำแหน่ง
    const location = parcelData['ที่ตั้ง'] || 'ไม่ระบุตำแหน่ง';
    document.getElementById('parcelLocation').innerHTML = `<i class="fas fa-location-dot"></i> ${location}`;
    
    // แสดงข้อมูล
    displayParcelInfo(parcelData);
    
    // แสดงรูปภาพ
    displayParcelImages(parcelNumber);
    
    // แสดงแปลงที่เกี่ยวข้อง
    displayRelatedParcels(parcelNumber);
}

// แสดงข้อมูลแปลง
function displayParcelInfo(parcelData) {
    const container = document.getElementById('parcelInfo');
    
    // ข้อมูลที่ต้องการแสดง
    const displayFields = [
        { label: 'พื้นที่', key: 'พื้นที่' },
        { label: 'เจ้าของ', key: 'เจ้าของ' },
        { label: 'จังหวัด', key: 'จังหวัด' },
        { label: 'ราคา', key: 'ราคา' },
        { label: 'สถานะ', key: 'สถานะ' },
        { label: 'ประเภท', key: 'ประเภท' }
    ];
    
    let html = '';
    
    displayFields.forEach(field => {
        if (parcelData[field.key]) {
            html += `
                <div class="info-item">
                    <div class="info-label">${field.label}</div>
                    <div class="info-value">${parcelData[field.key]}</div>
                </div>
            `;
        }
    });
    
    container.innerHTML = html || '<div class="col-12 text-center text-muted">ไม่มีข้อมูลเพิ่มเติม</div>';
}

// แสดงรูปภาพ
function displayParcelImages(parcelNumber) {
    const container = document.getElementById('parcelImages');
    const section = document.getElementById('imageSection');
    
    // ใช้รูปภาพจาก Unsplash เป็นตัวอย่าง
    const imageUrls = [
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=400&h=300&fit=crop'
    ];
    
    let html = '';
    imageUrls.forEach((url, index) => {
        html += `
            <div class="image-item" onclick="viewImage('${url}')">
                <img src="${url}" alt="รูปภาพแปลง ${parcelNumber}">
                <span class="image-count">${index + 1}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
    section.style.display = 'block';
}

// แสดงแปลงที่เกี่ยวข้อง
function displayRelatedParcels(currentParcelNumber) {
    const container = document.getElementById('relatedParcels');
    const section = document.getElementById('relatedParcelsSection');
    
    // หาแปลงอื่นๆ (ยกเว้นแปลงปัจจุบัน)
    const relatedParcels = allData.filter(parcel => 
        parcel['แปลง'] !== currentParcelNumber
    ).slice(0, 4);
    
    if (relatedParcels.length > 0) {
        let html = '';
        
        relatedParcels.forEach(parcel => {
            const parcelNumber = parcel['แปลง'];
            const area = parcel['พื้นที่'] || 'ไม่ระบุ';
            
            html += `
                <div class="related-card" onclick="searchExample('${parcelNumber}')">
                    <div class="related-number">แปลง ${parcelNumber}</div>
                    <div class="text-muted">${area}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        section.style.display = 'block';
    } else {
        section.style.display = 'none';
    }
}

// ฟังก์ชันค้นหาจากตัวอย่าง
function searchExample(parcelNumber) {
    document.getElementById('searchInput').value = parcelNumber;
    searchParcel();
}

// ฟังก์ชันค้นหาแปลงอื่น
function searchAnother() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchInput').focus();
    showAllData();
}

// กลับหน้าหลัก
function showAllData() {
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('noResultsSection').style.display = 'none';
    document.getElementById('statsSection').style.display = 'grid';
    document.getElementById('searchInput').value = '';
}

// แสดงว่าไม่พบผลลัพธ์
function showNoResults() {
    document.getElementById('statsSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('noResultsSection').style.display = 'block';
}

// อัพเดตสถิติ
function updateStatistics() {
    document.getElementById('totalParcels').textContent = allData.length;
    document.getElementById('totalImages').textContent = allData.length * 3; // ตัวอย่าง
    document.getElementById('todaySearches').textContent = searchCount;
    document.getElementById('updatedParcels').textContent = allData.length;
}

// อัพเดต footer
function updateFooter() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('th-TH', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    document.getElementById('footerUpdateTime').textContent = timeStr;
}

// แสดง/ซ่อน loading
function showLoading(show) {
    document.getElementById('loadingState').style.display = show ? 'block' : 'none';
}

// ดูรูปภาพ
function viewImage(url) {
    window.open(url, '_blank');
}

// เริ่มต้นแอป
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});
