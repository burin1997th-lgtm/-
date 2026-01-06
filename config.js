/**
 * ไฟล์ตั้งค่าระบบค้นหาแปลงที่ดิน
 */

const CONFIG = {
    // Google Sheets URL
    GOOGLE_SHEETS_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHlqFXL5N8DKNhyg8au_M9eypFk65rXRgXdCna7pO9gadqpHLmtcz8FHKeCaBlxuqGcIY60PxUhyu-/pub?output=csv',
    
    // Google Drive Folder ID สำหรับรูปภาพ
    GOOGLE_DRIVE_FOLDER_ID: '19uH9E6rwE0zpUIxHlAh4CFHflzNRAksG',
    
    // คอลัมน์สำหรับแสดงข้อมูลบางส่วน (แสดงในหน้าแรก)
    SUMMARY_COLUMNS: [
        'พื้นที่', 'เจ้าของ', 'ที่ตั้ง', 'ตำบล', 'อำเภอ', 'จังหวัด',
        'ราคา', 'สถานะ', 'ประเภท', 'การใช้ประโยชน์'
    ],
    
    // คอลัมน์สำหรับค้นหาเลขแปลง
    PARCEL_COLUMNS: [
        'แปลง', 'เลขแปลง', 'หมายเลขแปลง', 'parcel', 'plot', 'lot',
        'เลขที่ดิน', 'ที่ดินเลขที่', 'รหัสแปลง'
    ],
    
    // คอลัมน์สำหรับรูปภาพ
    IMAGE_COLUMNS: [
        'รูปภาพ', 'ภาพ', 'รูป', 'image', 'photo', 'img',
        'ลิงก์รูป', 'ไฟล์รูป'
    ],
    
    // จำนวนแปลงแนะนำที่จะแสดง
    FEATURED_COUNT: 6,
    
    // จำนวนค้นหาล่าสุดที่จะเก็บ
    MAX_RECENT_SEARCHES: 10,
    
    // จำนวนแปลงที่เกี่ยวข้องที่จะแสดง
    RELATED_PARCELS_COUNT: 4,
    
    // การตั้งค่า Google Drive API
    DRIVE_API: {
        FOLDER_VIEW_URL: 'https://drive.google.com/embeddedfolderview?id=',
        FILE_URL_PREFIX: 'https://drive.google.com/uc?export=view&id=',
        THUMBNAIL_URL: 'https://drive.google.com/thumbnail?id='
    },
    
    // ชนิดไฟล์รูปภาพที่รองรับ
    IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
    
    // ข้อมูลสำรองสำหรับรูปภาพ
    FALLBACK_IMAGES: [
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=400&h=300&fit=crop'
    ]
};

// ฟังก์ชันสำหรับดึงเลขแปลงจากข้อมูล
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

// ฟังก์ชันสำหรับดึงรูปภาพจาก Drive
function getDriveImageUrl(fileId, size = null) {
    if (size) {
        return `${CONFIG.DRIVE_API.THUMBNAIL_URL}${fileId}&sz=w${size}`;
    }
    return `${CONFIG.DRIVE_API.FILE_URL_PREFIX}${fileId}`;
}

// ฟังก์ชันสำหรับสร้างรูปแบบการค้นหารูปภาพ
function generateImagePatterns(parcelNumber) {
    const patterns = [];
    const cleanNumber = parcelNumber.replace(/[^\d]/g, '');
    
    // สร้างรูปแบบต่างๆ
    patterns.push(cleanNumber);
    patterns.push(`แปลง${cleanNumber}`);
    patterns.push(`parcel${cleanNumber}`);
    patterns.push(`plot${cleanNumber}`);
    
    if (parcelNumber.includes('-')) {
        const parts = parcelNumber.split('-');
        patterns.push(parts.join(''));
        patterns.push(`แปลง${parts.join('')}`);
    }
    
    return patterns;
}

// ฟังก์ชันตรวจสอบว่าเป็นคอลัมน์เลขแปลงหรือไม่
function isParcelColumn(columnName) {
    if (!columnName) return false;
    const lowerName = columnName.toLowerCase();
    return CONFIG.PARCEL_COLUMNS.some(pattern => 
        lowerName.includes(pattern.toLowerCase())
    );
}

// ฟังก์ชันตรวจสอบว่าเป็นคอลัมน์รูปภาพหรือไม่
function isImageColumn(columnName) {
    if (!columnName) return false;
    const lowerName = columnName.toLowerCase();
    return CONFIG.IMAGE_COLUMNS.some(pattern => 
        lowerName.includes(pattern.toLowerCase())
    );
}

// ฟังก์ชันดึงค่าจากคอลัมน์
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

// ส่งออกตัวแปรและฟังก์ชัน
window.CONFIG = CONFIG;
window.getParcelNumber = getParcelNumber;
window.getDriveImageUrl = getDriveImageUrl;
window.generateImagePatterns = generateImagePatterns;
window.isParcelColumn = isParcelColumn;
window.isImageColumn = isImageColumn;
window.getColumnValue = getColumnValue;
