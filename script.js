// ============================================
// CONFIG ที่ใช้งานได้จริง (Recommended)
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
    
    // ตั้งค่าสำหรับภาษาไทย
    CSV_CONFIG: {
        delimiter: ',',
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8'
    },
    
    ITEMS_PER_PAGE: 10,
    CURRENT_METHOD_INDEX: 0
};

// ฟังก์ชันทดสอบง่ายๆ
function testConfig() {
    console.log('🔍 ตรวจสอบ CONFIG...');
    console.log('Sheet ID:', CONFIG.SHEET_ID);
    console.log('Sheet Name:', CONFIG.SHEET_NAME);
    console.log('Number of URL methods:', CONFIG.URL_METHODS.length);
    
    CONFIG.URL_METHODS.forEach((method, i) => {
        console.log(`${i + 1}. ${method.name}: ${method.url}`);
    });
    
    return '✅ CONFIG ถูกต้อง (แต่ต้องทดสอบ URL ว่าทำงานได้จริงไหม)';
}

// รันการตรวจสอบ
console.log(testConfig());
