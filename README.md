# JTK QA Checklist Dashboard

เว็บแอปพลิเคชันแสดงข้อมูลจาก Google Sheets บน GitHub Pages

## คุณสมบัติ
- ✅ ดึงข้อมูลจาก Google Sheets แบบอัตโนมัติ
- ✅ แสดงข้อมูลในรูปแบบตารางที่สวยงาม
- ✅ มีระบบกรองข้อมูล (สาขา, พนักงาน, ผู้ประเมิน)
- ✅ สรุปสถิติแบบเรียลไทม์
- ✅ ส่งออกข้อมูลเป็น CSV
- ✅ รองรับภาษาไทย
- ✅ Responsive Design

## การติดตั้งบน GitHub Pages
1. สร้าง repository ใหม่บน GitHub
2. อัพโหลดไฟล์ทั้งหมด (index.html, styles.css, script.js, README.md)
3. ไปที่ Settings > Pages
4. เลือก Branch เป็น main และ /root
5. รอไม่กี่นาที เว็บไซต์จะพร้อมใช้งานที่: `https://username.github.io/repository-name`

## การปรับแต่ง
- แก้ไข `SHEET_URL` ในไฟล์ `script.js` บรรทัดที่ 2 เพื่อเปลี่ยนแหล่งข้อมูล
- ปรับแต่งสไตล์ในไฟล์ `styles.css`
- ปรับการตั้งค่า DataTables ในฟังก์ชัน `renderTable()`

## เทคโนโลยีที่ใช้
- HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 5
- jQuery & DataTables
- PapaParse (สำหรับอ่าน CSV)
- GitHub Pages

## หมายเหตุ
- Google Sheets ต้องตั้งค่าเป็น "เผยแพร่สู่เว็บ" ก่อน
- ข้อมูลจะอัพเดทอัตโนมัติทุกครั้งที่รีเฟรชหน้าเว็บ
