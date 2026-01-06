/**
 * ไฟล์ตั้งค่าระบบ
 * แก้ไขค่าในไฟล์นี้ตามต้องการ
 */

const CONFIG = {
    // Google Sheets URL สำหรับข้อมูลแปลงที่ดิน
    GOOGLE_SHEETS_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHlqFXL5N8DKNhyg8au_M9eypFk65rXRgXdCna7pO9gadqpHLmtcz8FHKeCaBlxuqGcIY60PxUhyu-/pub?output=csv',
    
    // Google Drive Folder URL สำหรับรูปภาพ
    GOOGLE_DRIVE_FOLDER_URL: 'https://drive.google.com/drive/folders/19uH9E6rwE0zpUIxHlAh4CFHflzNRAksG',
    
    // Google Drive Folder ID
    GOOGLE_DRIVE_FOLDER_ID: '19uH9E6rwE0zpUIxHlAh4CFHflzNRAksG',
    
    // คอลัมน์ที่ใช้สำหรับค้นหาเลขแปลง
    PARCEL_COLUMNS: [
        'แปลง', 'เลขแปลง', 'หมายเลขแปลง', 'parcel', 'plot', 'lot',
        'ที่ดิน', 'เลขที่', 'หมายเลข', 'no', 'number', 'รหัส', 'code'
    ],
    
    // คอลัมน์ที่อาจเป็นชื่อรูปภาพใน Google Drive
    IMAGE_COLUMNS: [
        'รูปภาพ', 'ภาพ', 'รูป', 'image', 'photo', 'img',
        'ไฟล์', 'file', 'ลิงก์', 'link', 'url', 'รูปถ่าย'
    ],
    
    // รูปแบบชื่อไฟล์รูปภาพใน Google Drive (ใช้สำหรับจับคู่)
    IMAGE_NAME_PATTERNS: [
        '{parcel}', 'แปลง{parcel}', 'parcel{parcel}', 'plot{parcel}',
        'ที่ดิน{parcel}', 'land{parcel}', '{parcel}_', '_{parcel}'
    ],
    
    // ชนิดไฟล์รูปภาพที่รองรับ
    IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.JPG', '.JPEG', '.PNG'],
    
    // Google Drive API ตั้งค่า (ใช้สำหรับดึงรูปภาพ)
    DRIVE_API: {
        // ใช้ Google Drive Folder Viewer (public access)
        FOLDER_VIEW_URL: 'https://drive.google.com/embeddedfolderview?id=',
        
        // ใช้สำหรับดึงไฟล์รูปภาพ
        FILE_URL_PREFIX: 'https://drive.google.com/uc?export=view&id='
    },
    
    // การตั้งค่าอื่นๆ
    SETTINGS: {
        ITEMS_PER_PAGE: 20,
        AUTO_REFRESH_MINUTES: 30,
        ENABLE_CACHE: true,
        SHOW_IMAGE_THUMBNAILS: true,
        MAX_IMAGES_PER_PARCEL: 20
    },
    
    // ข้อมูลสำรองสำหรับแสดงผล
    FALLBACK_IMAGES: [
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&h=600&fit=crop'
    ],
    
    // สีธีม
    COLORS: {
        primary: '#2c3e50',
        secondary: '#3498db',
        success: '#2ecc71',
        warning: '#f39c12',
        danger: '#e74c3c'
    }
};

// ฟังก์ชันสำหรับแปลงเลขแปลงเป็นรูปแบบต่างๆ สำหรับค้นหารูปภาพ
function generateImageSearchPatterns(parcelNumber) {
    const patterns = [];
    const cleanParcel = parcelNumber.replace(/[^\d]/g, '');
    
    // สร้างรูปแบบต่างๆ สำหรับค้นหารูปภาพ
    patterns.push(cleanParcel); // 123
    patterns.push(`แปลง${cleanParcel}`); // แปลง123
    patterns.push(`parcel${cleanParcel}`); // parcel123
    patterns.push(`ที่ดิน${cleanParcel}`); // ที่ดิน123
    patterns.push(`land${cleanParcel}`); // land123
    
    // ถ้า parcel number มีรูปแบบพิเศษ
    if (parcelNumber.includes('-')) {
        const parts = parcelNumber.split('-');
        patterns.push(parts.join('')); // 123-45 -> 12345
        patterns.push(`แปลง${parts.join('')}`);
    }
    
    return patterns;
}

// ฟังก์ชันสำหรับสร้าง URL รูปภาพจาก Google Drive
function getDriveImageUrl(fileId) {
    return `${CONFIG.DRIVE_API.FILE_URL_PREFIX}${fileId}`;
}

// ฟังก์ชันสำหรับสร้าง thumbnail URL
function getDriveThumbnailUrl(fileId, size = '200') {
    return `${CONFIG.DRIVE_API.FILE_URL_PREFIX}${fileId}&sz=w${size}`;
}

// ฟังก์ชันสำหรับตรวจสอบว่าเป็น URL รูปภาพหรือไม่
function isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    const trimmedUrl = url.trim();
    if (trimmedUrl === '') return false;
    
    // ตรวจสอบว่าเป็น URL Google Drive หรือไม่
    if (trimmedUrl.includes('drive.google.com')) {
        return true;
    }
    
    // ตรวจสอบนามสกุลไฟล์รูปภาพ
    const imageExtensions = CONFIG.IMAGE_EXTENSIONS;
    return imageExtensions.some(ext => trimmedUrl.toLowerCase().endsWith(ext));
}

// แปลง Google Drive sharing link เป็น direct link
function convertDriveLink(shareLink) {
    if (!shareLink || !shareLink.includes('drive.google.com')) {
        return shareLink;
    }
    
    // แปลงจาก share link เป็น direct link
    const fileIdMatch = shareLink.match(/[-\w]{25,}/);
    if (fileIdMatch) {
        return getDriveImageUrl(fileIdMatch[0]);
    }
    
    return shareLink;
}

// ตรวจสอบว่าคอลัมน์นี้เป็นคอลัมน์เลขแปลงหรือไม่
function isParcelColumn(columnName) {
    if (!columnName) return false;
    const lowerName = columnName.toLowerCase();
    return CONFIG.PARCEL_COLUMNS.some(keyword => 
        lowerName.includes(keyword.toLowerCase())
    );
}

// ตรวจสอบว่าคอลัมน์นี้เป็นคอลัมน์รูปภาพหรือไม่
function isImageColumn(columnName) {
    if (!columnName) return false;
    const lowerName = columnName.toLowerCase();
    return CONFIG.IMAGE_COLUMNS.some(keyword => 
        lowerName.includes(keyword.toLowerCase())
    );
}

// ดึงเลขแปลงจากแถวข้อมูล
function extractParcelNumber(row) {
    for (const columnPattern of CONFIG.PARCEL_COLUMNS) {
        for (const [key, value] of Object.entries(row)) {
            if (key.toLowerCase().includes(columnPattern.toLowerCase())) {
                if (value && value.trim() !== '') {
                    return value.trim();
                }
            }
        }
    }
    return null;
}

// ส่งออกตัวแปรและฟังก์ชันให้ไฟล์อื่นใช้
window.CONFIG = CONFIG;
window.generateImageSearchPatterns = generateImageSearchPatterns;
window.getDriveImageUrl = getDriveImageUrl;
window.getDriveThumbnailUrl = getDriveThumbnailUrl;
window.isValidImageUrl = isValidImageUrl;
window.convertDriveLink = convertDriveLink;
window.isParcelColumn = isParcelColumn;
window.isImageColumn = isImageColumn;
window.extractParcelNumber = extractParcelNumber;
