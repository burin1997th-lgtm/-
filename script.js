/**
 * ระบบค้นหาแปลงที่ดิน - แสดงบางข้อมูล + ค้นหาแปลงอื่น
 */

// ตัวแปร Global
let allData = [];
let allImages = [];
let headers = [];
let recentSearches = [];
let searchHistory = [];
let todaySearchCount = 0;

// ==================== ฟังก์ชันเริ่มต้นระบบ ====================

/**
 * เริ่มต้นระบบเมื่อหน้าเว็บโหลด
 */
async function initializeApp() {
    showLoading(true);
    
    try {
        console.log('กำลังเริ่มต้นระบบ...');
        
        // โหลดข้อมูลจาก Local Storage
        loadLocalData();
        
        // โหลดข้อมูลจาก Google Sheets และ Google Drive พร้อมกัน
        await Promise.all([
            loadGoogleSheetsData(),
            loadDriveImages()
        ]);
        
        console.log('โหลดข้อมูลสำเร็จ:', {
            records: allData.length,
            images: allImages.length
        });
        
        // แสดงเนื้อหาหลัก
        showMainContent();
        
        // อัพเดตสถิติ
        updateStatistics();
        
        // แสดงแปลงแนะนำ
        displayFeaturedParcels();
        
        // แสดงค้นหาล่าสุด
        updateRecentSearches();
        
        // แสดงตัวอย่างการค้นหา
        displayQuickSearchSuggestions();
        
        showLoading(false);
        
    } catch (error) {
        console.error('เกิดข้อผิดพลาด:', error);
        showError('ไม่สามารถโหลดข้อมูลได้: ' + error.message);
        showLoading(false);
    }
}

/**
 * โหลดข้อมูลจาก Google Sheets
 */
async function loadGoogleSheetsData() {
    try {
        const response = await fetch(CONFIG.GOOGLE_SHEETS_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        
        const csvText = await response.text();
        
        if (!csvText || csvText.trim() === '') {
            throw new Error('ไม่พบข้อมูลใน Google Sheets');
        }
        
        // แปลง CSV เป็น JSON
        allData = parseCSV(csvText);
        
        if (allData.length === 0) {
            throw new Error('ข้อมูลว่างเปล่า');
        }
        
        // ดึง headers
        headers = Object.keys(allData[0]);
        
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการโหลด Google Sheets:', error);
        throw error;
    }
}

/**
 * โหลดรูปภาพจาก Google Drive
 */
async function loadDriveImages() {
    try {
        // ใช้ Google Drive API ดึงไฟล์
        const files = await fetchDriveFiles(CONFIG.GOOGLE_DRIVE_FOLDER_ID);
        
        if (files && files.length > 0) {
            // กรองเฉพาะไฟล์รูปภาพ
            allImages = files.filter(file => 
                CONFIG.IMAGE_EXTENSIONS.some(ext => 
                    file.name.toLowerCase().endsWith(ext.toLowerCase())
                )
            );
        }
        
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการโหลดรูปภาพ:', error);
        allImages = [];
    }
}

/**
 * ดึงไฟล์จาก Google Drive
 */
async function fetchDriveFiles(folderId) {
    try {
        // ใช้ Google Drive API (จำเป็นต้องมี API Key)
        const apiKey = 'AIzaSyB4M2-d7tNqgRgoPql7Sq1r0w6dV6RHB34';
        const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&key=${apiKey}&fields=files(id,name,mimeType,thumbnailLink,webViewLink)`;
        
        const response = await fetch(apiUrl);
        
        if (response.ok) {
            const data = await response.json();
            return data.files || [];
        }
        
        // Fallback: ใช้ web scraping
        return await fetchDriveFilesViaWeb(folderId);
        
    } catch (error) {
        console.error('Error fetching drive files:', error);
        return [];
    }
}

/**
 * ดึงไฟล์จาก Google Drive ผ่านเว็บ (fallback)
 */
async function fetchDriveFilesViaWeb(folderId) {
    try {
        const viewerUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}`;
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(viewerUrl)}`;
        
        const response = await fetch(proxyUrl);
        
        if (response.ok) {
            const data = await response.json();
            const html = data.contents;
            
            // สร้าง DOM parser
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const files = [];
            const links = doc.querySelectorAll('a[href*="/file/d/"]');
            
            links.forEach(link => {
                const href = link.getAttribute('href') || '';
                const match = href.match(/\/file\/d\/([^\/]+)/);
                
                if (match) {
                    files.push({
                        id: match[1],
                        name: link.textContent.trim() || 'unnamed.jpg',
                        mimeType: 'image/jpeg',
                        thumbnailLink: getDriveImageUrl(match[1], '200'),
                        webViewLink: `https://drive.google.com/file/d/${match[1]}/view`
                    });
                }
            });
            
            return files;
        }
        
        return [];
        
    } catch (error) {
        console.error('Error fetching via web:', error);
        return [];
    }
}

// ==================== ฟังก์ชันค้นหาแปลง ====================

/**
 * ค้นหาแปลงจาก input หลัก
 */
function searchParcel() {
    const searchInput = document.getElementById('mainSearchInput');
    const query = searchInput.value.trim();
    
    if (!query) {
        alert('กรุณากรอกเลขแปลงที่ต้องการค้นหา');
        return;
    }
    
    performSearch(query);
}

/**
 * ทำการค้นหา
 */
function performSearch(query) {
    // เพิ่มลงในประวัติการค้นหา
    addToSearchHistory(query);
    
    // อัพเดตสถิติการค้นหาวันนี้
    updateTodaySearchCount();
    
    // ค้นหาข้อมูล
    const results = findParcels(query);
    
    if (results.length === 0) {
        showNoResults(query);
        return;
    }
    
    // แสดงผลการค้นหา
    displaySearchResults(query, results);
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

// ==================== ฟังก์ชันแสดงผล ====================

/**
 * แสดงผลการค้นหา
 */
function displaySearchResults(query, results) {
    // ซ่อนส่วนอื่นๆ
    hideSections(['featuredParcelsSection']);
    
    // แสดงส่วนผลการค้นหา
    const section = document.getElementById('searchResultsSection');
    section.style.display = 'block';
    
    // อัพเดตข้อความค้นหา
    document.getElementById('currentSearchTerm').textContent = query;
    
    if (results.length === 1) {
        // ถ้ามีผลลัพธ์เดียว
        displaySingleParcelResult(results[0]);
    } else {
        // ถ้ามีหลายผลลัพธ์
        displayMultipleResults(results);
    }
    
    // แสดงแปลงที่เกี่ยวข้อง
    displayRelatedParcels(results[0]);
}

/**
 * แสดงผลลัพธ์เดียว
 */
function displaySingleParcelResult(row) {
    const parcelNumber = getParcelNumber(row) || 'ไม่ระบุ';
    
    // แสดงส่วนผลลัพธ์เดียว
    document.getElementById('singleParcelResult').style.display = 'block';
    document.getElementById('multipleResults').style.display = 'none';
    
    // อัพเดตข้อมูล
    document.getElementById('resultParcelNumber').textContent = parcelNumber;
    
    // แสดงตำแหน่ง
    const location = getColumnValue(row, ['ที่ตั้ง', 'ตำบล', 'อำเภอ', 'จังหวัด']) || 'ไม่ระบุตำแหน่ง';
    document.getElementById('resultParcelLocation').innerHTML = `
        <i class="fas fa-location-dot me-1"></i>${location}
    `;
    
    // แสดงรูปภาพหลัก
    displayParcelMainImage(parcelNumber, 'resultMainImage');
    
    // แสดงข้อมูลบางส่วน
    displayParcelQuickInfo(row, 'resultQuickInfo');
    
    // บันทึกข้อมูลแปลงปัจจุบัน
    window.currentParcel = row;
}

/**
 * แสดงผลลัพธ์หลายรายการ
 */
function displayMultipleResults(results) {
    // แสดงส่วนผลลัพธ์หลายรายการ
    document.getElementById('singleParcelResult').style.display = 'none';
    document.getElementById('multipleResults').style.display = 'block';
    
    // อัพเดตจำนวนผลลัพธ์
    document.getElementById('resultsCount').textContent = results.length;
    
    // แสดงผลลัพธ์ทั้งหมด
    const container = document.getElementById('multipleResultsGrid');
    let html = '';
    
    results.slice(0, 12).forEach(row => {
        const parcelNumber = getParcelNumber(row) || 'ไม่ระบุ';
        const images = getParcelImages(parcelNumber);
        const imageUrl = images.length > 0 ? getDriveImageUrl(images[0].id, '400') : CONFIG.FALLBACK_IMAGES[0];
        const area = getColumnValue(row, ['พื้นที่', 'size']) || 'ไม่ระบุ';
        const owner = getColumnValue(row, ['เจ้าของ', 'owner']) || 'ไม่ระบุ';
        
        html += `
            <div class="col-md-4 col-sm-6 mb-4">
                <div class="card h-100 cursor-pointer" onclick="viewParcelFromMultiple('${parcelNumber}')">
                    <div class="position-relative">
                        <img src="${imageUrl}" 
                             class="card-img-top" 
                             style="height: 150px; object-fit: cover;"
                             alt="แปลง ${parcelNumber}"
                             onerror="this.src='${CONFIG.FALLBACK_IMAGES[0]}'">
                        <div class="position-absolute top-0 end-0 m-2">
                            <span class="badge bg-primary">
                                <i class="fas fa-image me-1"></i>${images.length}
                            </span>
                        </div>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">
                            <i class="fas fa-hashtag me-2 text-primary"></i>
                            แปลง ${parcelNumber}
                        </h5>
                        <div class="row g-2 mb-2">
                            <div class="col-6">
                                <small class="text-muted d-block">พื้นที่</small>
                                <strong>${area}</strong>
                            </div>
                            <div class="col-6">
                                <small class="text-muted d-block">เจ้าของ</small>
                                <strong>${owner}</strong>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-primary w-100 mt-2" 
                                onclick="event.stopPropagation(); viewParcelFromMultiple('${parcelNumber}')">
                            <i class="fas fa-eye me-1"></i>ดูรายละเอียด
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * แสดงแปลงที่เกี่ยวข้อง
 */
function displayRelatedParcels(mainParcel) {
    const parcelNumber = getParcelNumber(mainParcel);
    if (!parcelNumber) return;
    
    // ค้นหาแปลงที่เกี่ยวข้อง (ยกเว้นแปลงปัจจุบัน)
    const related = findRelatedParcels(parcelNumber);
    
    if (related.length === 0) {
        document.getElementById('relatedParcelsSection').style.display = 'none';
        return;
    }
    
    const container = document.getElementById('relatedParcelsGrid');
    let html = '';
    
    related.slice(0, CONFIG.RELATED_PARCELS_COUNT).forEach(row => {
        const relatedNumber = getParcelNumber(row);
        const images = getParcelImages(relatedNumber);
        const imageUrl = images.length > 0 ? getDriveImageUrl(images[0].id, '200') : CONFIG.FALLBACK_IMAGES[1];
        
        html += `
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="related-parcel-card" onclick="searchSpecificParcel('${relatedNumber}')">
                    <img src="${imageUrl}" 
                         class="rounded mb-2" 
                         style="width: 100%; height: 100px; object-fit: cover;"
                         alt="แปลง ${relatedNumber}"
                         onerror="this.src='${CONFIG.FALLBACK_IMAGES[1]}'">
                    <h6 class="mb-0">แปลง ${relatedNumber}</h6>
                    <small class="text-muted">คลิกเพื่อดูข้อมูล</small>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    document.getElementById('relatedParcelsSection').style.display = 'block';
}

/**
 * แสดงแปลงแนะนำ
 */
function displayFeaturedParcels() {
    const container = document.getElementById('featuredParcelsGrid');
    
    // เลือกแปลงที่มีข้อมูลครบถ้วนและมีรูปภาพ
    const featuredParcels = allData.filter(row => {
        const parcelNumber = getParcelNumber(row);
        if (!parcelNumber) return false;
        
        const images = getParcelImages(parcelNumber);
        if (images.length === 0) return false;
        
        // ตรวจสอบว่ามีข้อมูลครบถ้วนพอสมควร
        const hasArea = getColumnValue(row, ['พื้นที่', 'size']);
        const hasOwner = getColumnValue(row, ['เจ้าของ', 'owner']);
        const hasLocation = getColumnValue(row, ['ที่ตั้ง', 'ตำบล', 'อำเภอ']);
        
        return hasArea && hasOwner && hasLocation;
    }).slice(0, CONFIG.FEATURED_COUNT);
    
    let html = '';
    
    featuredParcels.forEach(row => {
        const parcelNumber = getParcelNumber(row);
        const images = getParcelImages(parcelNumber);
        const imageUrl = images.length > 0 ? getDriveImageUrl(images[0].id, '400') : CONFIG.FALLBACK_IMAGES[0];
        const area = getColumnValue(row, ['พื้นที่', 'size']) || 'ไม่ระบุ';
        const owner = getColumnValue(row, ['เจ้าของ', 'owner']) || 'ไม่ระบุ';
        
        html += `
            <div class="col-md-4 col-sm-6 mb-4">
                <div class="card h-100 cursor-pointer" onclick="searchSpecificParcel('${parcelNumber}')">
                    <div class="position-relative">
                        <img src="${imageUrl}" 
                             class="card-img-top" 
                             style="height: 180px; object-fit: cover;"
                             alt="แปลง ${parcelNumber}"
                             onerror="this.src='${CONFIG.FALLBACK_IMAGES[0]}'">
                        <div class="position-absolute top-0 end-0 m-2">
                            <span class="badge bg-warning">
                                <i class="fas fa-star me-1"></i>แนะนำ
                            </span>
                        </div>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">
                            <i class="fas fa-map-marker-alt me-2 text-primary"></i>
                            แปลง ${parcelNumber}
                        </h5>
                        <div class="row g-2 mb-3">
                            <div class="col-6">
                                <small class="text-muted d-block">พื้นที่</small>
                                <strong>${area}</strong>
                            </div>
                            <div class="col-6">
                                <small class="text-muted d-block">เจ้าของ</small>
                                <strong>${owner}</strong>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-outline-primary w-100" 
                                onclick="event.stopPropagation(); searchSpecificParcel('${parcelNumber}')">
                            <i class="fas fa-search me-1"></i>ดูข้อมูล
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ==================== ฟังก์ชันแสดงข้อมูลแปลง ====================

/**
 * ดูรายละเอียดแปลง
 */
function viewParcelDetails() {
    if (!window.currentParcel) return;
    
    const row = window.currentParcel;
    const parcelNumber = getParcelNumber(row) || 'ไม่ระบุ';
    
    // อัพเดต Modal
    document.getElementById('modalParcelNumber').textContent = parcelNumber;
    
    // แสดงรูปภาพหลัก
    displayParcelMainImage(parcelNumber, 'modalMainImage');
    
    // แสดงข้อมูลทั้งหมด
    displayParcelAllInfo(row, 'modalAllInfo');
    
    // แสดงรูปภาพทั้งหมด
    displayParcelAllImages(parcelNumber, 'modalImagesGallery');
    
    // แสดง Modal
    const modal = new bootstrap.Modal(document.getElementById('parcelDetailsModal'));
    modal.show();
}

/**
 * แสดงรูปภาพหลัก
 */
function displayParcelMainImage(parcelNumber, elementId) {
    const images = getParcelImages(parcelNumber);
    const container = document.getElementById(elementId);
    
    if (images.length > 0) {
        container.innerHTML = `
            <img src="${getDriveImageUrl(images[0].id, '800')}" 
                 class="img-fluid rounded"
                 alt="แปลง ${parcelNumber}"
                 style="max-height: 300px; object-fit: cover;"
                 onerror="this.src='${CONFIG.FALLBACK_IMAGES[0]}'">
        `;
    } else {
        container.innerHTML = `
            <div class="no-image-placeholder rounded d-flex align-items-center justify-content-center" 
                 style="height: 300px; background: #f8f9fa;">
                <div class="text-center">
                    <i class="fas fa-image fa-3x text-muted mb-3"></i>
                    <p class="text-muted">ไม่มีรูปภาพ</p>
                </div>
            </div>
        `;
    }
}

/**
 * แสดงข้อมูลบางส่วน
 */
function displayParcelQuickInfo(row, elementId) {
    const container = document.getElementById(elementId);
    let html = '';
    
    // แสดงข้อมูลสำคัญ 4 รายการแรก
    const importantColumns = CONFIG.SUMMARY_COLUMNS.slice(0, 4);
    
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
 * แสดงข้อมูลทั้งหมด
 */
function displayParcelAllInfo(row, elementId) {
    const container = document.getElementById(elementId);
    let html = '';
    
    // แสดงข้อมูลสำคัญทั้งหมด
    CONFIG.SUMMARY_COLUMNS.forEach(column => {
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
 * แสดงรูปภาพทั้งหมด
 */
function displayParcelAllImages(parcelNumber, elementId) {
    const images = getParcelImages(parcelNumber);
    const container = document.getElementById(elementId);
    const section = document.getElementById('modalImagesSection');
    
    if (images.length > 0) {
        let html = '';
        
        images.forEach((image, index) => {
            html += `
                <img src="${getDriveImageUrl(image.id, '200')}" 
                     class="image-thumbnail"
                     onclick="openImageInModal('${image.id}')"
                     alt="รูปภาพ ${index + 1}"
                     loading="lazy">
            `;
        });
        
        container.innerHTML = html;
        section.style.display = 'block';
    } else {
        section.style.display = 'none';
    }
}

// ==================== ฟังก์ชันค้นหาแปลงอื่น ====================

/**
 * ค้นหาแปลงอื่น
 */
function searchAnother() {
    const modal = new bootstrap.Modal(document.getElementById('searchAnotherModal'));
    
    // ล้าง input
    document.getElementById('newSearchInput').value = '';
    
    // แสดง suggestions
    displayQuickSuggestions();
    
    modal.show();
}

/**
 * ทำการค้นหาใหม่
 */
function performNewSearch() {
    const input = document.getElementById('newSearchInput');
    const query = input.value.trim();
    
    if (!query) {
        alert('กรุณากรอกเลขแปลงที่ต้องการค้นหา');
        return;
    }
    
    // ปิด Modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('searchAnotherModal'));
    modal.hide();
    
    // ค้นหา
    performSearch(query);
}

/**
 * ค้นหาแปลงเฉพาะ
 */
function searchSpecificParcel(parcelNumber) {
    document.getElementById('mainSearchInput').value = parcelNumber;
    performSearch(parcelNumber);
}

/**
 * ดูแปลงจากผลลัพธ์หลายรายการ
 */
function viewParcelFromMultiple(parcelNumber) {
    const row = findParcelByNumber(parcelNumber);
    if (row) {
        window.currentParcel = row;
        displaySingleParcelResult(row);
    }
}

// ==================== ฟังก์ชัน Utility ====================

/**
 * แปลง CSV เป็น JSON
 */
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        
        data.push(row);
    }
    
    return data;
}

/**
 * ดึงรูปภาพของแปลง
 */
function getParcelImages(parcelNumber) {
    if (!parcelNumber || allImages.length === 0) return [];
    
    const patterns = generateImagePatterns(parcelNumber);
    const matchedImages = [];
    
    allImages.forEach(image => {
        const fileName = image.name.toLowerCase();
        
        // ตรวจสอบว่าชื่อไฟล์ตรงกับรูปแบบใดรูปแบบหนึ่ง
        const matches = patterns.some(pattern => 
            fileName.includes(pattern.toLowerCase())
        );
        
        if (matches) {
            matchedImages.push(image);
        }
    });
    
    return matchedImages;
}

/**
 * หาแปลงที่เกี่ยวข้อง
 */
function findRelatedParcels(mainParcelNumber) {
    const related = [];
    const mainRow = findParcelByNumber(mainParcelNumber);
    
    if (!mainRow) return related;
    
    // ค้นหาแปลงที่มีข้อมูลใกล้เคียง
    allData.forEach(row => {
        if (row === mainRow) return;
        
        const parcelNumber = getParcelNumber(row);
        if (!parcelNumber || parcelNumber === mainParcelNumber) return;
        
        // ตรวจสอบความใกล้เคียงของเลขแปลง
        const mainNum = mainParcelNumber.replace(/[^\d]/g, '');
        const currentNum = parcelNumber.replace(/[^\d]/g, '');
        
        if (currentNum.startsWith(mainNum.substring(0, 3)) || 
            mainNum.startsWith(currentNum.substring(0, 3))) {
            related.push(row);
        }
    });
    
    return related;
}

/**
 * หาแปลงตามเลขแปลง
 */
function findParcelByNumber(parcelNumber) {
    return allData.find(row => {
        const rowParcelNumber = getParcelNumber(row);
        return rowParcelNumber && rowParcelNumber === parcelNumber;
    });
}

// ==================== ฟังก์ชันจัดการ Local Storage ====================

/**
 * โหลดข้อมูลจาก Local Storage
 */
function loadLocalData() {
    try {
        // โหลดประวัติการค้นหา
        const savedSearches = localStorage.getItem('parcelRecentSearches');
        if (savedSearches) {
            recentSearches = JSON.parse(savedSearches);
        }
        
        // โหลดสถิติการค้นหาวันนี้
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
        // บันทึกประวัติการค้นหา
        localStorage.setItem('parcelRecentSearches', JSON.stringify(recentSearches));
        
        // บันทึกสถิติการค้นหาวันนี้
        const today = new Date().toDateString();
        localStorage.setItem('parcelSearchStats', JSON.stringify({
            date: today,
            count: todaySearchCount
        }));
        
    } catch (error) {
        console.error('Error saving local data:', error);
    }
}

/**
 * เพิ่มลงในประวัติการค้นหา
 */
function addToSearchHistory(query) {
    if (!query) return;
    
    // เอา query ออกถ้ามีอยู่แล้ว
    recentSearches = recentSearches.filter(item => item !== query);
    
    // เพิ่มเข้าไปด้านหน้า
    recentSearches.unshift(query);
    
    // จำกัดจำนวน
    if (recentSearches.length > CONFIG.MAX_RECENT_SEARCHES) {
        recentSearches.pop();
    }
    
    // บันทึกและอัพเดต
    saveLocalData();
    updateRecentSearches();
}

/**
 * อัพเดตสถิติการค้นหาวันนี้
 */
function updateTodaySearchCount() {
    todaySearchCount++;
    saveLocalData();
    updateStatistics();
}

/**
 * อัพเดตการค้นหาล่าสุด
 */
function updateRecentSearches() {
    const container = document.getElementById('recentSearchesList');
    
    if (recentSearches.length === 0) {
        container.innerHTML = '<p class="text-muted">ยังไม่มีประวัติการค้นหา</p>';
        return;
    }
    
    let html = '';
    recentSearches.forEach(query => {
        html += `
            <span class="recent-search" onclick="searchSpecificParcel('${query}')">
                <i class="fas fa-history me-1"></i>${query}
            </span>
        `;
    });
    
    container.innerHTML = html;
}

// ==================== ฟังก์ชันอัพเดต UI ====================

/**
 * แสดงเนื้อหาหลัก
 */
function showMainContent() {
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('noDataState').style.display = 'none';
}

/**
 * แสดงตัวอย่างการค้นหา
 */
function displayQuickSearchSuggestions() {
    const container = document.getElementById('quickSearchSuggestions');
    
    // ดึงเลขแปลงที่เป็นตัวอย่าง (4 ตัวอย่างแรก)
    const sampleParcels = [];
    allData.slice(0, 8).forEach(row => {
        const parcelNumber = getParcelNumber(row);
        if (parcelNumber && !sampleParcels.includes(parcelNumber)) {
            sampleParcels.push(parcelNumber);
        }
    });
    
    let html = '';
    sampleParcels.slice(0, 4).forEach(parcelNumber => {
        html += `
            <button class="quick-search-btn" onclick="searchSpecificParcel('${parcelNumber}')">
                แปลง ${parcelNumber}
            </button>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * แสดง suggestions ใน Modal
 */
function displayQuickSuggestions() {
    const container = document.getElementById('modalQuickSuggestions');
    const currentParcelNumber = getParcelNumber(window.currentParcel);
    
    if (!currentParcelNumber) {
        container.innerHTML = '<p class="text-muted">ไม่มีข้อเสนอแนะ</p>';
        return;
    }
    
    const related = findRelatedParcels(currentParcelNumber);
    let html = '';
    
    related.slice(0, 4).forEach(row => {
        const parcelNumber = getParcelNumber(row);
        html += `
            <button class="btn btn-sm btn-outline-secondary w-100 mb-2" 
                    onclick="searchSpecificParcel('${parcelNumber}')">
                แปลง ${parcelNumber}
            </button>
        `;
    });
    
    container.innerHTML = html || '<p class="text-muted">ไม่มีแปลงที่เกี่ยวข้อง</p>';
}

/**
 * อัพเดตสถิติ
 */
function updateStatistics() {
    // อัพเดตสถิติในหน้า
    document.getElementById('statsTotalParcels').querySelector('.stat-number').textContent = allData.length;
    document.getElementById('statsWithImages').querySelector('.stat-number').textContent = 
        allData.filter(row => getParcelImages(getParcelNumber(row)).length > 0).length;
    document.getElementById('statsTodaySearches').querySelector('.stat-number').textContent = todaySearchCount;
    document.getElementById('statsTotalImages').querySelector('.stat-number').textContent = allImages.length;
    
    // อัพเดต footer
    document.getElementById('footerTotalParcels').textContent = allData.length;
    document.getElementById('footerUpdateTime').textContent = new Date().toLocaleString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * แสดงข้อมูลทั้งหมด
 */
function showAllData() {
    // ซ่อนผลการค้นหา
    document.getElementById('searchResultsSection').style.display = 'none';
    
    // แสดงแปลงแนะนำ
    document.getElementById('featuredParcelsSection').style.display = 'block';
    
    // ล้าง input
    document.getElementById('mainSearchInput').value = '';
}

/**
 * แสดงค้นหาล่าสุด
 */
function showRecentSearches() {
    const searchInput = document.getElementById('mainSearchInput');
    if (recentSearches.length > 0) {
        searchInput.value = recentSearches[0];
        performSearch(recentSearches[0]);
    }
}

// ==================== ฟังก์ชัน Helper ====================

/**
 * ซ่อน sections
 */
function hideSections(sectionIds) {
    sectionIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    });
}

/**
 * แสดงสถานะ loading
 */
function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    loadingState.style.display = show ? 'block' : 'none';
}

/**
 * แสดงข้อผิดพลาด
 */
function showError(message) {
    const container = document.querySelector('.container.py-4');
    container.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-exclamation-triangle fa-4x text-danger mb-3"></i>
            <h4 class="text-danger">เกิดข้อผิดพลาด</h4>
            <p class="text-muted mb-4">${message}</p>
            <button class="btn btn-primary" onclick="initializeApp()">
                <i class="fas fa-redo me-1"></i>ลองอีกครั้ง
            </button>
        </div>
    `;
}

/**
 * แสดงว่าไม่พบผลลัพธ์
 */
function showNoResults(query) {
    const container = document.querySelector('.container.py-4');
    container.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-search fa-4x text-muted mb-3"></i>
            <h4 class="text-muted">ไม่พบแปลงที่ดิน</h4>
            <p class="text-muted mb-4">ไม่พบข้อมูลสำหรับ "${query}"</p>
            <button class="btn btn-primary me-2" onclick="showAllData()">
                <i class="fas fa-home me-1"></i>กลับหน้าหลัก
            </button>
            <button class="btn btn-outline-primary" onclick="searchAnother()">
                <i class="fas fa-search me-1"></i>ค้นหาแปลงอื่น
            </button>
        </div>
    `;
}

/**
 * ดูรูปภาพทั้งหมด
 */
function viewParcelImages() {
    if (!window.currentParcel) return;
    
    const parcelNumber = getParcelNumber(window.currentParcel);
    const images = getParcelImages(parcelNumber);
    
    if (images.length === 0) {
        alert('ไม่มีรูปภาพสำหรับแปลงนี้');
        return;
    }
    
    // สร้าง gallery ง่ายๆ
    let galleryHTML = '<div class="text-center mb-3"><h5>รูปภาพแปลง ' + parcelNumber + '</h5></div>';
    galleryHTML += '<div class="row">';
    
    images.forEach(image => {
        galleryHTML += `
            <div class="col-md-3 col-6 mb-3">
                <img src="${getDriveImageUrl(image.id, '400')}" 
                     class="img-fluid rounded"
                     style="cursor: pointer;"
                     onclick="window.open('${getDriveImageUrl(image.id)}', '_blank')">
            </div>
        `;
    });
    
    galleryHTML += '</div>';
    
    // แสดงใน modal
    const modal = new bootstrap.Modal(document.getElementById('parcelDetailsModal'));
    document.getElementById('modalAllInfo').innerHTML = galleryHTML;
    document.getElementById('modalImagesSection').style.display = 'none';
    modal.show();
}

/**
 * เปิดรูปภาพใน Modal
 */
function openImageInModal(imageId) {
    window.open(getDriveImageUrl(imageId), '_blank');
}

/**
 * ค้นหาแปลงอื่นจาก Modal
 */
function searchAnotherFromModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('parcelDetailsModal'));
    modal.hide();
    
    setTimeout(() => {
        searchAnother();
    }, 300);
}

/**
 * แสดงเกี่ยวกับระบบ
 */
function showAbout() {
    alert(`ระบบค้นหาแปลงที่ดิน\n\nเวอร์ชัน: 1.0.0\nข้อมูลจาก: Google Sheets & Google Drive\nอัปเดตล่าสุด: ${new Date().toLocaleDateString('th-TH')}\n\nฟีเจอร์:\n- ค้นหาแปลงด้วยเลขแปลง\n- แสดงข้อมูลบางส่วน\n- ค้นหาแปลงอื่นเพิ่มเติม\n- แสดงรูปภาพจาก Google Drive`);
}

// ==================== การเริ่มต้นระบบ ====================

// เมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', function() {
    // ตั้งค่า Event Listeners
    const searchInput = document.getElementById('mainSearchInput');
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            searchParcel();
        }
    });
    
    const newSearchInput = document.getElementById('newSearchInput');
    newSearchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performNewSearch();
        }
    });
    
    // ตรวจสอบ URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const parcelParam = urlParams.get('parcel');
    
    // เริ่มต้นระบบ
    initializeApp();
    
    // ถ้ามี parcel parameter ใน URL
    if (parcelParam) {
        setTimeout(() => {
            searchSpecificParcel(parcelParam);
        }, 1500);
    }
});

// เปิดเผยฟังก์ชันให้เรียกจาก HTML ได้
window.searchParcel = searchParcel;
window.searchAnother = searchAnother;
window.performNewSearch = performNewSearch;
window.viewParcelDetails = viewParcelDetails;
window.viewParcelImages = viewParcelImages;
window.searchSpecificParcel = searchSpecificParcel;
window.showAllData = showAllData;
window.showRecentSearches = showRecentSearches;
window.showAbout = showAbout;
