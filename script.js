/**
 * ระบบจัดการข้อมูลแปลงที่ดิน
 * ดึงข้อมูลจาก Google Sheets และรูปภาพจาก Google Drive
 */

// ตัวแปร Global
let allData = [];           // ข้อมูลทั้งหมดจาก Google Sheets
let allImages = [];         // รายการรูปภาพทั้งหมดจาก Google Drive
let headers = [];           // หัวคอลัมน์จาก Google Sheets
let currentParcel = null;   // แปลงปัจจุบันที่กำลังดู
let driveFiles = [];        // ไฟล์จาก Google Drive

// ==================== ฟังก์ชันเริ่มต้นระบบ ====================

/**
 * โหลดข้อมูลทั้งหมดเมื่อหน้าเว็บโหลด
 */
async function initializeApp() {
    showLoading(true);
    
    try {
        console.log('กำลังเริ่มต้นระบบ...');
        
        // แสดง URL Google Sheets
        document.getElementById('sheetsUrl').textContent = CONFIG.GOOGLE_SHEETS_URL;
        
        // โหลดข้อมูลจาก Google Sheets และ Google Drive พร้อมกัน
        await Promise.all([
            loadGoogleSheetsData(),
            loadGoogleDriveImages()
        ]);
        
        console.log('โหลดข้อมูลสำเร็จ:', {
            records: allData.length,
            images: allImages.length,
            driveFiles: driveFiles.length
        });
        
        // อัพเดตสถิติ
        updateStatistics();
        
        // แสดงข้อมูลทั้งหมด
        showAllData();
        
        // อัพเดตเวลาล่าสุด
        updateLastUpdated();
        
        showLoading(false);
        
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการเริ่มต้นระบบ:', error);
        showError('ไม่สามารถโหลดข้อมูลได้: ' + error.message);
        showLoading(false);
    }
}

/**
 * โหลดข้อมูลจาก Google Sheets
 */
async function loadGoogleSheetsData() {
    try {
        console.log('กำลังโหลดข้อมูลจาก Google Sheets...');
        
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
        
        console.log(`โหลดข้อมูลจาก Google Sheets สำเร็จ: ${allData.length} แถว`);
        
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการโหลด Google Sheets:', error);
        throw error;
    }
}

/**
 * โหลดรูปภาพจาก Google Drive
 */
async function loadGoogleDriveImages() {
    try {
        console.log('กำลังโหลดข้อมูลจาก Google Drive...');
        
        // ใช้ Google Drive API ดึงไฟล์จากโฟลเดอร์
        const files = await fetchDriveFiles(CONFIG.GOOGLE_DRIVE_FOLDER_ID);
        
        if (files && files.length > 0) {
            driveFiles = files;
            
            // กรองเฉพาะไฟล์รูปภาพ
            allImages = files.filter(file => 
                CONFIG.IMAGE_EXTENSIONS.some(ext => 
                    file.name.toLowerCase().endsWith(ext.toLowerCase())
                )
            );
            
            console.log(`พบรูปภาพใน Google Drive: ${allImages.length} ไฟล์`);
        } else {
            console.warn('ไม่พบไฟล์ใน Google Drive');
            allImages = [];
            driveFiles = [];
        }
        
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการโหลด Google Drive:', error);
        // ยังคงทำงานต่อไปแม้ไม่สามารถโหลดรูปภาพได้
        allImages = [];
        driveFiles = [];
    }
}

/**
 * ดึงไฟล์จาก Google Drive
 */
async function fetchDriveFiles(folderId) {
    try {
        // สร้าง URL สำหรับดึงไฟล์จากโฟลเดอร์
        const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&key=AIzaSyB4M2-d7tNqgRgoPql7Sq1r0w6dV6RHB34`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            // ถ้า API key ไม่ทำงาน ให้ใช้วิธีดึงจากเว็บ
            return await fetchDriveFilesViaWeb(folderId);
        }
        
        const data = await response.json();
        
        if (data.files && data.files.length > 0) {
            return data.files.map(file => ({
                id: file.id,
                name: file.name,
                mimeType: file.mimeType,
                thumbnailLink: file.thumbnailLink,
                webViewLink: file.webViewLink,
                createdTime: file.createdTime,
                modifiedTime: file.modifiedTime
            }));
        }
        
        return [];
        
    } catch (error) {
        console.error('Error fetching drive files via API:', error);
        return await fetchDriveFilesViaWeb(folderId);
    }
}

/**
 * ดึงไฟล์จาก Google Drive ผ่านเว็บ (fallback method)
 */
async function fetchDriveFilesViaWeb(folderId) {
    try {
        // ใช้ embedded viewer เพื่อดึงรายการไฟล์
        const viewerUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}`;
        
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(viewerUrl)}`);
        
        if (!response.ok) {
            throw new Error('ไม่สามารถดึงข้อมูลจาก Google Drive ได้');
        }
        
        const data = await response.json();
        const html = data.contents;
        
        // สร้าง DOM parser เพื่อแยกข้อมูล
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const files = [];
        const links = doc.querySelectorAll('a[href*="/file/d/"]');
        
        links.forEach(link => {
            const href = link.getAttribute('href') || '';
            const match = href.match(/\/file\/d\/([^\/]+)/);
            
            if (match) {
                const fileId = match[1];
                const fileName = link.textContent.trim() || 'unnamed.jpg';
                
                files.push({
                    id: fileId,
                    name: fileName,
                    mimeType: 'image/jpeg',
                    thumbnailLink: getDriveThumbnailUrl(fileId),
                    webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
                    createdTime: new Date().toISOString()
                });
            }
        });
        
        return files;
        
    } catch (error) {
        console.error('Error fetching drive files via web:', error);
        return [];
    }
}

// ==================== ฟังก์ชันค้นหาแปลง ====================

/**
 * ค้นหาแปลงที่ดิน
 */
function searchParcel() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (!query) {
        showAllData();
        return;
    }
    
    performSearch(query);
}

/**
 * ทำการค้นหา
 */
function performSearch(query) {
    const results = findParcels(query);
    
    document.getElementById('searchQuery').textContent = query;
    document.getElementById('resultsCount').textContent = results.length;
    
    if (results.length === 0) {
        showNoResults(query);
        return;
    }
    
    // ถ้ามีผลลัพธ์เดียว ให้แสดงรายละเอียดเลย
    if (results.length === 1) {
        showParcelDetails(results[0]);
        return;
    }
    
    // ถ้ามีหลายผลลัพธ์ ให้แสดงรายการทั้งหมด
    showSearchResults(results, query);
}

/**
 * ค้นหาแปลงในข้อมูล
 */
function findParcels(query) {
    const searchTerm = query.toLowerCase();
    const results = [];
    
    allData.forEach(row => {
        let matchFound = false;
        
        // ตรวจสอบในทุกคอลัมน์
        for (const [key, value] of Object.entries(row)) {
            if (value && value.toString().toLowerCase().includes(searchTerm)) {
                matchFound = true;
                break;
            }
        }
        
        // ตรวจสอบเลขแปลงโดยเฉพาะ
        const parcelNumber = extractParcelNumber(row);
        if (parcelNumber && parcelNumber.toLowerCase().includes(searchTerm)) {
            matchFound = true;
        }
        
        if (matchFound) {
            results.push(row);
        }
    });
    
    return results;
}

// ==================== ฟังก์ชันแสดงผล ====================

/**
 * แสดงข้อมูลทั้งหมด
 */
function showAllData() {
    hideAllSections();
    document.getElementById('allParcelsSection').style.display = 'block';
    document.getElementById('statisticsSection').style.display = 'block';
    
    displayAllParcels();
}

/**
 * แสดงผลการค้นหา
 */
function showSearchResults(results, query) {
    hideAllSections();
    document.getElementById('searchResultsSection').style.display = 'block';
    document.getElementById('statisticsSection').style.display = 'block';
    
    displaySearchResults(results, query);
}

/**
 * แสดงรายละเอียดแปลง
 */
function showParcelDetails(row) {
    currentParcel = row;
    
    hideAllSections();
    document.getElementById('parcelDetailsSection').style.display = 'block';
    
    displayParcelDetails(row);
}

/**
 * แสดงว่าไม่พบผลลัพธ์
 */
function showNoResults(query) {
    hideAllSections();
    
    const container = document.querySelector('.container.py-4');
    container.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-search fa-4x text-muted mb-3"></i>
            <h4 class="text-muted">ไม่พบผลการค้นหา</h4>
            <p class="text-muted mb-4">ไม่พบข้อมูลสำหรับ "${query}"</p>
            <button class="btn btn-primary me-2" onclick="showAllData()">
                <i class="fas fa-list me-1"></i>ดูแปลงทั้งหมด
            </button>
            <button class="btn btn-outline-primary" onclick="document.getElementById('searchInput').focus()">
                <i class="fas fa-redo me-1"></i>ค้นหาใหม่
            </button>
        </div>
    `;
}

// ==================== ฟังก์ชันแสดงผล UI ====================

/**
 * แสดงแปลงทั้งหมดใน Grid
 */
function displayAllParcels() {
    const container = document.getElementById('allParcelsGrid');
    const totalCount = document.getElementById('totalParcelsCount');
    
    totalCount.textContent = allData.length;
    
    if (allData.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="text-center py-5 text-muted">
                    <i class="fas fa-inbox fa-4x mb-3"></i>
                    <h5>ไม่มีข้อมูลแปลงที่ดิน</h5>
                </div>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    // แสดงเฉพาะ 20 แปลงแรก
    allData.slice(0, CONFIG.SETTINGS.ITEMS_PER_PAGE).forEach((row, index) => {
        const parcelNumber = extractParcelNumber(row) || `แปลง-${index + 1}`;
        const images = getParcelImages(parcelNumber);
        const firstImage = images.length > 0 ? getDriveThumbnailUrl(images[0].id) : CONFIG.FALLBACK_IMAGES[index % CONFIG.FALLBACK_IMAGES.length];
        
        // หาข้อมูลเพิ่มเติม
        const area = getColumnValue(row, ['พื้นที่', 'area', 'size']) || 'ไม่ระบุ';
        const owner = getColumnValue(row, ['เจ้าของ', 'owner', 'name']) || 'ไม่ระบุ';
        const location = getColumnValue(row, ['ตำแหน่ง', 'location', 'address']) || 'ไม่ระบุ';
        
        html += `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card parcel-card h-100" onclick="showParcelDetailsByIndex(${index})">
                    <div class="position-relative">
                        <img src="${firstImage}" 
                             class="card-img-top parcel-image" 
                             alt="แปลง ${parcelNumber}"
                             loading="lazy"
                             onerror="this.src='${CONFIG.FALLBACK_IMAGES[0]}'">
                        <div class="info-badge">
                            <i class="fas fa-image me-1"></i>${images.length}
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
                        <p class="card-text text-truncate-2 mb-3">
                            <small class="text-muted">
                                <i class="fas fa-location-dot me-1"></i>${location}
                            </small>
                        </p>
                        <button class="btn btn-sm btn-primary w-100" 
                                onclick="event.stopPropagation(); showParcelDetailsByIndex(${index})">
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
 * แสดงผลการค้นหา
 */
function displaySearchResults(results, query) {
    const container = document.getElementById('searchResults');
    
    let html = '';
    
    results.forEach((row, index) => {
        const parcelNumber = extractParcelNumber(row) || `แปลง-${index + 1}`;
        const images = getParcelImages(parcelNumber);
        const firstImage = images.length > 0 ? getDriveThumbnailUrl(images[0].id) : CONFIG.FALLBACK_IMAGES[0];
        
        // Highlight คำค้นหาในข้อมูล
        const area = highlightSearchTerm(getColumnValue(row, ['พื้นที่', 'area', 'size']) || 'ไม่ระบุ', query);
        const owner = highlightSearchTerm(getColumnValue(row, ['เจ้าของ', 'owner', 'name']) || 'ไม่ระบุ', query);
        
        html += `
            <div class="col-lg-6 col-md-12 mb-4">
                <div class="card h-100" onclick="showParcelDetailsByIndex(${allData.indexOf(row)})">
                    <div class="row g-0">
                        <div class="col-md-4">
                            <img src="${firstImage}" 
                                 class="img-fluid rounded-start h-100" 
                                 style="object-fit: cover; min-height: 200px;"
                                 alt="แปลง ${parcelNumber}"
                                 loading="lazy"
                                 onerror="this.src='${CONFIG.FALLBACK_IMAGES[0]}'">
                        </div>
                        <div class="col-md-8">
                            <div class="card-body">
                                <h5 class="card-title">
                                    <i class="fas fa-map-marker-alt me-2 text-primary"></i>
                                    แปลง ${highlightSearchTerm(parcelNumber, query)}
                                </h5>
                                <div class="row g-2 mb-2">
                                    <div class="col-6">
                                        <small class="text-muted d-block">พื้นที่</small>
                                        <div>${area}</div>
                                    </div>
                                    <div class="col-6">
                                        <small class="text-muted d-block">เจ้าของ</small>
                                        <div>${owner}</div>
                                    </div>
                                </div>
                                <button class="btn btn-sm btn-outline-primary mt-2" 
                                        onclick="event.stopPropagation(); showParcelDetailsByIndex(${allData.indexOf(row)})">
                                    <i class="fas fa-search me-1"></i>ดูรายละเอียด
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * แสดงรายละเอียดแปลง
 */
function displayParcelDetails(row) {
    const parcelNumber = extractParcelNumber(row) || 'ไม่มีข้อมูล';
    const images = getParcelImages(parcelNumber);
    
    // อัพเดตข้อมูลพื้นฐาน
    document.getElementById('parcelNumber').textContent = parcelNumber;
    document.getElementById('imageCount').textContent = images.length;
    
    // แสดงรูปภาพหลัก
    displayMainImage(parcelNumber, images);
    
    // แสดงข้อมูลแปลง
    displayParcelInfo(row);
    
    // แสดงแกลเลอรี่รูปภาพ
    displayParcelImagesGallery(parcelNumber, images);
    
    // แสดงตารางข้อมูล
    displayParcelDataTable(row);
}

/**
 * แสดงรูปภาพหลัก
 */
function displayMainImage(parcelNumber, images) {
    const container = document.getElementById('parcelMainImage');
    
    if (images.length > 0) {
        const mainImage = images[0];
        container.innerHTML = `
            <div class="position-relative">
                <img src="${getDriveImageUrl(mainImage.id)}" 
                     class="img-fluid rounded w-100" 
                     style="max-height: 300px; object-fit: cover;"
                     alt="แปลง ${parcelNumber}"
                     onclick="openImageModal('${mainImage.id}', '${mainImage.name}')"
                     loading="lazy">
                <div class="position-absolute bottom-0 start-0 m-3">
                    <span class="badge bg-primary">
                        <i class="fas fa-image me-1"></i>รูปภาพ 1/${images.length}
                    </span>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="no-image d-flex flex-column align-items-center justify-content-center">
                <i class="fas fa-image fa-3x text-muted mb-3"></i>
                <p class="text-muted">ไม่มีรูปภาพสำหรับแปลงนี้</p>
            </div>
        `;
    }
}

/**
 * แสดงข้อมูลแปลง
 */
function displayParcelInfo(row) {
    const container = document.getElementById('parcelInfo');
    let html = '';
    
    // กรองข้อมูลสำคัญ 6 รายการแรก
    const importantColumns = headers.filter(header => 
        !isImageColumn(header) && row[header] && row[header].trim() !== ''
    ).slice(0, 6);
    
    importantColumns.forEach(header => {
        const value = row[header];
        const isParcel = isParcelColumn(header);
        
        html += `
            <div class="col-md-6">
                <div class="card h-100 ${isParcel ? 'border-primary' : ''}">
                    <div class="card-body">
                        <h6 class="card-subtitle mb-2 text-muted">${header}</h6>
                        <p class="card-text">${value}</p>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html || '<div class="col-12 text-center text-muted">ไม่มีข้อมูลเพิ่มเติม</div>';
}

/**
 * แสดงแกลเลอรี่รูปภาพ
 */
function displayParcelImagesGallery(parcelNumber, images) {
    const container = document.getElementById('parcelImages');
    const section = document.getElementById('parcelImagesSection');
    
    if (images.length > 0) {
        let html = '';
        
        images.forEach((image, index) => {
            html += `
                <div class="position-relative">
                    <img src="${getDriveThumbnailUrl(image.id)}" 
                         class="image-thumbnail"
                         onclick="openImageModal('${image.id}', '${image.name}', ${index})"
                         alt="${image.name}"
                         loading="lazy">
                    ${index === 0 ? 
                        '<span class="position-absolute top-0 start-0 m-1 badge bg-primary">หลัก</span>' : ''}
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
 * แสดงตารางข้อมูลแปลง
 */
function displayParcelDataTable(row) {
    const container = document.getElementById('parcelDataTable');
    
    let html = `
        <thead>
            <tr>
                <th width="30%">คอลัมน์</th>
                <th>ข้อมูล</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    headers.forEach(header => {
        const value = row[header] || '';
        const isParcel = isParcelColumn(header);
        const isImage = isImageColumn(header);
        
        html += `
            <tr class="${isParcel ? 'table-primary' : isImage ? 'table-info' : ''}">
                <td><strong>${header}</strong></td>
                <td>
                    ${isImage && isValidImageUrl(value) ? 
                        `<a href="${convertDriveLink(value)}" target="_blank" class="text-primary">
                            <i class="fas fa-external-link-alt me-1"></i>เปิดรูปภาพ
                        </a>` : 
                        value}
                </td>
            </tr>
        `;
    });
    
    html += '</tbody>';
    container.innerHTML = html;
}

// ==================== ฟังก์ชันจัดการรูปภาพ ====================

/**
 * ดึงรูปภาพของแปลงจาก Google Drive
 */
function getParcelImages(parcelNumber) {
    if (!parcelNumber || allImages.length === 0) {
        return [];
    }
    
    const searchPatterns = generateImageSearchPatterns(parcelNumber);
    const matchedImages = [];
    
    allImages.forEach(image => {
        const fileName = image.name.toLowerCase();
        
        // ตรวจสอบว่าชื่อไฟล์ตรงกับรูปแบบใดรูปแบบหนึ่ง
        const matches = searchPatterns.some(pattern => 
            fileName.includes(pattern.toLowerCase()) ||
            fileName.includes(parcelNumber.toLowerCase())
        );
        
        if (matches) {
            matchedImages.push(image);
        }
    });
    
    return matchedImages.slice(0, CONFIG.SETTINGS.MAX_IMAGES_PER_PARCEL);
}

/**
 * เปิด Modal รูปภาพ
 */
function openImageModal(imageId, imageName, index = 0) {
    const modal = new bootstrap.Modal(document.getElementById('imageModal'));
    const modalImage = document.getElementById('modalImage');
    const modalLabel = document.getElementById('imageModalLabel');
    const imageInfo = document.getElementById('imageInfo');
    
    modalLabel.textContent = `รูปภาพแปลง ${extractParcelNumber(currentParcel) || ''}`;
    modalImage.src = getDriveImageUrl(imageId);
    imageInfo.textContent = imageName;
    
    // บันทึกข้อมูลรูปภาพปัจจุบันสำหรับดาวน์โหลด
    window.currentModalImage = { id: imageId, name: imageName };
    
    modal.show();
}

/**
 * ดาวน์โหลดรูปภาพปัจจุบัน
 */
function downloadCurrentImage() {
    if (!window.currentModalImage) return;
    
    const { id, name } = window.currentModalImage;
    const link = document.createElement('a');
    link.href = getDriveImageUrl(id);
    link.download = name;
    link.click();
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
 * ดึงค่าจากคอลัมน์
 */
function getColumnValue(row, patterns) {
    for (const pattern of patterns) {
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
 * ไฮไลท์คำค้นหา
 */
function highlightSearchTerm(text, query) {
    if (!text || !query) return text;
    
    const searchTerm = query.toLowerCase();
    const textStr = text.toString();
    const lowerText = textStr.toLowerCase();
    
    if (!lowerText.includes(searchTerm)) {
        return textStr;
    }
    
    const regex = new RegExp(`(${query})`, 'gi');
    return textStr.replace(regex, '<span class="search-highlight">$1</span>');
}

/**
 * อัพเดตสถิติ
 */
function updateStatistics() {
    const container = document.getElementById('statisticsCards');
    
    // คำนวณสถิติ
    const totalParcels = allData.length;
    const totalImages = allImages.length;
    
    // นับจำนวนแปลงที่มีรูปภาพ
    let parcelsWithImages = 0;
    allData.forEach(row => {
        const parcelNumber = extractParcelNumber(row);
        if (parcelNumber && getParcelImages(parcelNumber).length > 0) {
            parcelsWithImages++;
        }
    });
    
    container.innerHTML = `
        <div class="col-md-3 col-6 mb-3">
            <div class="stat-card">
                <div class="stat-number">${totalParcels}</div>
                <div class="stat-label">แปลงที่ดินทั้งหมด</div>
            </div>
        </div>
        <div class="col-md-3 col-6 mb-3">
            <div class="stat-card">
                <div class="stat-number">${totalImages}</div>
                <div class="stat-label">รูปภาพทั้งหมด</div>
            </div>
        </div>
        <div class="col-md-3 col-6 mb-3">
            <div class="stat-card">
                <div class="stat-number">${parcelsWithImages}</div>
                <div class="stat-label">แปลงที่มีรูปภาพ</div>
            </div>
        </div>
        <div class="col-md-3 col-6 mb-3">
            <div class="stat-card">
                <div class="stat-number">${headers.length}</div>
                <div class="stat-label">คอลัมน์ข้อมูล</div>
            </div>
        </div>
    `;
}

/**
 * อัพเดตเวลาล่าสุด
 */
function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    document.getElementById('lastUpdateTime').textContent = timeString;
}

/**
 * ซ่อนทุก section
 */
function hideAllSections() {
    const sections = [
        'loadingState',
        'statisticsSection',
        'searchResultsSection',
        'parcelDetailsSection',
        'allParcelsSection',
        'emptyState'
    ];
    
    sections.forEach(id => {
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
    hideAllSections();
    
    const container = document.querySelector('.container.py-4');
    container.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-exclamation-triangle fa-4x text-danger mb-3"></i>
            <h4 class="text-danger">เกิดข้อผิดพลาด</h4>
            <p class="text-muted mb-4">${message}</p>
            <button class="btn btn-primary me-2" onclick="initializeApp()">
                <i class="fas fa-redo me-1"></i>ลองอีกครั้ง
            </button>
            <button class="btn btn-outline-primary" onclick="showAllData()">
                <i class="fas fa-eye me-1"></i>ดูข้อมูลที่มี
            </button>
        </div>
    `;
}

// ==================== ฟังก์ชันเพิ่มเติม ====================

/**
 * แสดงรายละเอียดแปลงตาม index
 */
function showParcelDetailsByIndex(index) {
    if (index >= 0 && index < allData.length) {
        showParcelDetails(allData[index]);
    }
}

/**
 * รีเฟรชข้อมูลทั้งหมด
 */
async function refreshAllData() {
    await initializeApp();
}

/**
 * พิมพ์ข้อมูลแปลง
 */
function printParcel() {
    window.print();
}

/**
 * แชร์แปลง
 */
function shareParcel() {
    if (!currentParcel) return;
    
    const parcelNumber = extractParcelNumber(currentParcel);
    const shareUrl = `${window.location.origin}${window.location.pathname}?parcel=${encodeURIComponent(parcelNumber)}`;
    
    if (navigator.share) {
        navigator.share({
            title: `แปลงที่ดิน ${parcelNumber}`,
            text: `ดูข้อมูลแปลงที่ดิน ${parcelNumber}`,
            url: shareUrl
        });
    } else {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('คัดลอกลิงก์เรียบร้อยแล้ว');
        });
    }
}

/**
 * แสดงเกี่ยวกับระบบ
 */
function showAbout() {
    alert(`ระบบจัดการข้อมูลแปลงที่ดิน\n\nเวอร์ชัน: 2.0.0\nข้อมูลจาก: Google Sheets & Google Drive\nพัฒนาโดย: HTML/JavaScript\nอัปเดต: ${new Date().toLocaleDateString('th-TH')}`);
}

// ==================== การเริ่มต้นระบบ ====================

// เมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', function() {
    // ตั้งค่า Event Listeners
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            searchParcel();
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
            document.getElementById('searchInput').value = parcelParam;
            performSearch(parcelParam);
        }, 1500);
    }
    
    // ตั้งค่า Auto-refresh
    setInterval(refreshAllData, CONFIG.SETTINGS.AUTO_REFRESH_MINUTES * 60 * 1000);
});

// เปิดเผยฟังก์ชันให้เรียกจาก HTML ได้
window.searchParcel = searchParcel;
window.showAllData = showAllData;
window.refreshAllData = refreshAllData;
window.showParcelDetailsByIndex = showParcelDetailsByIndex;
window.openImageModal = openImageModal;
window.downloadCurrentImage = downloadCurrentImage;
window.printParcel = printParcel;
window.shareParcel = shareParcel;
window.showAbout = showAbout;
