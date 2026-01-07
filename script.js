// ดึงข้อมูลจาก Google Sheet
async function loadRealData() {
    try {
        const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHlqFXL5N8DKNhyg8au_M9eypFk65rXRgXdCna7pO9gadqpHLmtcz8FHKeCaBlxuqGcIY60PxUhyu-/pubhtml?gid=980262450&single=true';
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const response = await fetch(proxyUrl + encodeURIComponent(url));
        const data = await response.json();
        
        // แปลง HTML เป็นข้อมูล
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        const table = doc.querySelector('table');
        
        // ดึงข้อมูลจากตาราง
        const rows = table.querySelectorAll('tr');
        const headers = [...rows[0].querySelectorAll('td, th')].map(cell => cell.textContent.trim());
        
        sheetData.length = 0; // ล้างข้อมูลเก่า
        
        for (let i = 1; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('td, th');
            const rowData = {};
            
            headers.forEach((header, index) => {
                rowData[header] = index < cells.length ? cells[index].textContent.trim() : '';
            });
            
            if (Object.values(rowData).some(v => v !== '')) {
                sheetData.push(rowData);
            }
        }
        
        console.log('โหลดข้อมูลจาก Google Sheet สำเร็จ:', sheetData);
        alert(`โหลดข้อมูลสำเร็จ! ${sheetData.length} รายการ`);
        
    } catch (error) {
        console.error('โหลดข้อมูลไม่สำเร็จ:', error);
        alert('ใช้ข้อมูลตัวอย่างแทน');
    }
}

// ใช้ปุ่มโหลดข้อมูล
document.addEventListener('DOMContentLoaded', function() {
    const loadBtn = document.createElement('button');
    loadBtn.textContent = 'โหลดข้อมูลจริง';
    loadBtn.style.cssText = 'background: #2ecc71; color: white; padding: 10px; margin-top: 10px; width: 100%;';
    loadBtn.onclick = loadRealData;
    
    document.querySelector('.buttons').appendChild(loadBtn);
});
