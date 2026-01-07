// Configuration
const CONFIG = {
    GOOGLE_APPS_SCRIPT_URL: 'https://docs.google.com/spreadsheets/d/15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw/edit',
    SHEET_ID: '15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw',
    SHEET_NAME: 'สถานะ',
    ITEMS_PER_PAGE: 50,
    AUTO_REFRESH_INTERVAL: 300000, // 5 minutes
    CACHE_DURATION: 60000 // 1 minute
};

// Global variables
let allData = [];
let currentPage = 1;
let totalPages = 1;
let searchCount = 0;
let dataTable = null;
let autoRefreshTimer = null;
let isAutoRefresh = false;

// Initialize when page loads
$(document).ready(function() {
    console.log('🚀 กำลังเริ่มต้นระบบ...');
    initializeApp();
});

// Initialize application
function initializeApp() {
    // Load initial data
    loadAllData();
    
    // Set current time
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // Button event listeners
    $('#showAllBtn').click(loadAllData);
    $('#refreshAllBtn').click(() => loadAllData(true));
    $('#downloadBtn').click(downloadAllData);
    $('#searchBtn').click(performSearch);
    $('#retryBtn').click(() => loadAllData(true));
    
    // Export buttons
    $('#exportCsvBtn').click(exportToCSV);
    $('#printBtn').click(printData);
    $('#copyBtn').click(copyDataToClipboard);
    
    // Quick action buttons
    $('#firstPageBtn').click(() => changePage(1));
    $('#prevPageBtn').click(() => changePage(currentPage - 1));
    $('#nextPageBtn').click(() => changePage(currentPage + 1));
    $('#lastPageBtn').click(() => changePage(totalPages));
    $('#autoRefreshBtn').click(toggleAutoRefresh);
    
    // Search on Enter key
    $('#searchInput').keypress(function(e) {
        if (e.which === 13) {
            performSearch();
        }
    });
    
    // View source code
    $('#viewSource').click(function(e) {
        e.preventDefault();
        window.open('https://github.com/yourusername/your-repo', '_blank');
    });
    
    // Initialize with cache if available
    const cachedData = localStorage.getItem('sheetDataCache');
    const cachedTime = localStorage.getItem('sheetDataTime');
    
    if (cachedData && cachedTime) {
        const timeDiff = Date.now() - parseInt(cachedTime);
        if (timeDiff < CONFIG.CACHE_DURATION) {
            allData = JSON.parse(cachedData);
            displayAllData();
            showToast('โหลดข้อมูลจากแคชสำเร็จ', 'success');
        }
    }
}

// Load all data from Google Sheet
function loadAllData(forceRefresh = false) {
    console.log('📥 กำลังโหลดข้อมูลทั้งหมด...');
    
    showLoading(true);
    hideDataContainer();
    
    // Show refreshing animation
    if (forceRefresh) {
        $('#refreshAllBtn').addClass('refreshing');
    }
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
        const cachedData = localStorage.getItem('sheetDataCache');
        const cachedTime = localStorage.getItem('sheetDataTime');
        
        if (cachedData && cachedTime) {
            const timeDiff = Date.now() - parseInt(cachedTime);
            if (timeDiff < CONFIG.CACHE_DURATION) {
                allData = JSON.parse(cachedData);
                displayAllData();
                showToast('โหลดข้อมูลจากแคชสำเร็จ', 'info');
                showLoading(false);
                $('#refreshAllBtn').removeClass('refreshing');
                return;
            }
        }
    }
    
    // Build API URL
    const apiUrl = `${CONFIG.GOOGLE_APPS_SCRIPT_URL}?action=getData&sheetId=${CONFIG.SHEET_ID}&sheetName=${CONFIG.SHEET_NAME}&timestamp=${Date.now()}`;
    
    console.log('🔗 API URL:', apiUrl);
    
    // Fetch data using AJAX
    $.ajax({
        url: apiUrl,
        method: 'GET',
        dataType: 'json',
        timeout: 30000,
        beforeSend: function() {
            console.log('⏳ กำลังดึงข้อมูล...');
        },
        success: function(response) {
            console.log('✅ ได้รับข้อมูลจาก API:', response);
            
            if (response && response.success && response.data) {
                // Process and store data
                allData = response.data;
                
                // Cache the data
                localStorage.setItem('sheetDataCache', JSON.stringify(allData));
                localStorage.setItem('sheetDataTime', Date.now().toString());
                
                // Display data
                displayAllData();
                
                // Update statistics
                updateStatistics();
                
                // Show success message
                const count = allData.length;
                showToast(`โหลดข้อมูลสำเร็จ ${count} รายการ`, 'success');
                
                // Update data status
                $('#dataStatus').html('<span class="status-online">✓ ออนไลน์</span>');
                
            } else {
                console.error('❌ API response error:', response);
                showError('รูปแบบข้อมูลไม่ถูกต้อง');
            }
        },
        error: function(xhr, status, error) {
            console.error('❌ API request failed:', status, error);
            
            // Try fallback method
            tryFallbackMethod();
        },
        complete: function() {
            showLoading(false);
            $('#refreshAllBtn').removeClass('refreshing');
        }
    });
}

// Fallback method using CSV export
function tryFallbackMethod() {
    console.log('🔄 ลองวิธีสำรอง...');
    
    const csvUrl = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${CONFIG.SHEET_NAME}`;
    
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data && results.data.length > 0) {
                allData = results.data;
                displayAllData();
                updateStatistics();
                showToast('โหลดข้อมูลสำเร็จ (ใช้วิธีสำรอง)', 'warning');
                $('#dataStatus').html('<span class="status-online">✓ สำรอง</span>');
            } else {
                showError('ไม่พบข้อมูลใน Sheet');
                $('#dataStatus').html('<span class="status-offline">✗ ออฟไลน์</span>');
            }
        },
        error: function(error) {
            console.error('❌ CSV parse error:', error);
            showError('ไม่สามารถเชื่อมต่อกับ Google Sheet ได้');
            $('#dataStatus').html('<span class="status-offline">✗ ล้มเหลว</span>');
        }
    });
}

// Display all data in table
function displayAllData() {
    console.log('📊 กำลังแสดงข้อมูล...');
    
    if (!allData || allData.length === 0) {
        showEmptyState();
        return;
    }
    
    // Hide loading and empty states
    hideLoading();
    hideEmptyState();
    
    // Show data container
    $('#dataContainer').fadeIn();
    
    // Get headers from first data row
    const headers = Object.keys(allData[0]);
    const headersHtml = headers.map((header, index) => 
        `<th data-column="${index}">${formatHeader(header)}</th>`
    ).join('');
    
    // Set table headers
    $('#tableHeaders').html(`<th>#</th>${headersHtml}`);
    
    // Calculate pagination
    totalPages = Math.ceil(allData.length / CONFIG.ITEMS_PER_PAGE);
    currentPage = Math.min(currentPage, totalPages);
    
    // Calculate start and end indices
    const startIndex = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + CONFIG.ITEMS_PER_PAGE, allData.length);
    
    // Build table body
    let tableBodyHtml = '';
    
    for (let i = startIndex; i < endIndex; i++) {
        const row = allData[i];
        let rowHtml = `<td class="text-center fw-bold">${i + 1}</td>`;
        
        headers.forEach(header => {
            const value = row[header] || '';
            rowHtml += `<td>${formatCellValue(value)}</td>`;
        });
        
        tableBodyHtml += `<tr>${rowHtml}</tr>`;
    }
    
    // Set table body
    $('#tableBody').html(tableBodyHtml);
    
    // Update pagination
    updatePagination();
    
    // Update data info
    $('#dataInfo').html(`
        แสดง <strong>${startIndex + 1}</strong> ถึง <strong>${endIndex}</strong> 
        จากทั้งหมด <strong>${allData.length}</strong> รายการ
    `);
    
    console.log(`✅ แสดงข้อมูล ${allData.length} รายการ`);
}

// Format header text
function formatHeader(header) {
    return header
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
}

// Format cell value for display
function formatCellValue(value) {
    if (value === null || value === undefined || value === '') {
        return '<span class="text-muted">-</span>';
    }
    
    const strValue = String(value).trim();
    
    // Check if it's a number
    if (!isNaN(strValue) && strValue !== '') {
        return Number(strValue).toLocaleString('th-TH');
    }
    
    // Check if it's a date
    const date = new Date(strValue);
    if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('th-TH');
    }
    
    // Default: return as is
    return escapeHtml(strValue);
}

// Update pagination controls
function updatePagination() {
    if (totalPages <= 1) {
        $('#paginationContainer').html('');
        return;
    }
    
    let paginationHtml = '<nav><ul class="pagination justify-content-end">';
    
    // Previous button
    if (currentPage > 1) {
        paginationHtml += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;
    }
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">
                    ${i}
                </a>
            </li>
        `;
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHtml += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;
    }
    
    paginationHtml += '</ul></nav>';
    
    $('#paginationContainer').html(paginationHtml);
}

// Change page
function changePage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    currentPage = page;
    displayAllData();
    
    // Scroll to top of table
    $('html, body').animate({
        scrollTop: $('#dataContainer').offset().top - 100
    }, 300);
}

// Perform search
function performSearch() {
    const searchTerm = $('#searchInput').val().trim();
    
    if (!searchTerm) {
        showToast('กรุณากรอกคำค้นหา', 'warning');
        return;
    }
    
    if (!allData || allData.length === 0) {
        showToast('ไม่มีข้อมูลสำหรับค้นหา', 'warning');
        return;
    }
    
    searchCount++;
    $('#searchCount').text(searchCount);
    
    const searchLower = searchTerm.toLowerCase();
    const searchResults = allData.filter(row => {
        return Object.values(row).some(value => {
            if (value && typeof value === 'string') {
                return value.toLowerCase().includes(searchLower);
            }
            return String(value).toLowerCase().includes(searchLower);
        });
    });
    
    if (searchResults.length === 0) {
        showToast(`ไม่พบผลลัพธ์สำหรับ "${searchTerm}"`, 'info');
        return;
    }
    
    // Temporarily replace data with search results
    const originalData = [...allData];
    allData = searchResults;
    currentPage = 1;
    displayAllData();
    
    // Show search info
    const searchInfo = `
        <div class="alert alert-info alert-dismissible fade show mb-3">
            <i class="fas fa-search me-2"></i>
            พบ <strong>${searchResults.length}</strong> รายการที่ตรงกับ "<strong>${searchTerm}</strong>"
            <button type="button" class="btn-close" onclick="clearSearch()"></button>
        </div>
    `;
    
    $('#dataContainer').prepend(searchInfo);
    
    // Store original data for clearing search
    window.tempOriginalData = originalData;
    window.tempSearchTerm = searchTerm;
    
    showToast(`พบ ${searchResults.length} รายการ`, 'success');
}

// Clear search and show all data
function clearSearch() {
    if (window.tempOriginalData) {
        allData = window.tempOriginalData;
        currentPage = 1;
        displayAllData();
        
        // Clear search input
        $('#searchInput').val('');
        
        showToast('แสดงข้อมูลทั้งหมดแล้ว', 'info');
    }
}

// Download all data
function downloadAllData() {
    if (allData.length === 0) {
        showToast('ไม่มีข้อมูลสำหรับดาวน์โหลด', 'warning');
        return;
    }
    
    // Create CSV content
    const headers = Object.keys(allData[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    allData.forEach(row => {
        const values = headers.map(header => {
            const value = row[header] || '';
            // Escape special characters
            const escaped = String(value).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.setAttribute('href', url);
    link.setAttribute('download', `IN-TECH_Data_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('ดาวน์โหลดข้อมูลสำเร็จ', 'success');
}

// Export to CSV
function exportToCSV() {
    downloadAllData();
}

// Print data
function printData() {
    if (allData.length === 0) {
        showToast('ไม่มีข้อมูลสำหรับพิมพ์', 'warning');
        return;
    }
    
    const printContent = generatePrintContent();
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }, 500);
}

// Generate print content
function generatePrintContent() {
    const headers = Object.keys(allData[0]);
    const now = new Date();
    const timestamp = now.toLocaleString('th-TH');
    
    let tableRows = '';
    allData.forEach((row, index) => {
        tableRows += '<tr>';
        tableRows += `<td class="text-center">${index + 1}</td>`;
        headers.forEach(header => {
            tableRows += `<td>${row[header] || ''}</td>`;
        });
        tableRows += '</tr>';
    });
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>รายงานข้อมูล IN-TECH</title>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'TH Sarabun New', sans-serif; margin: 20px; }
                @page { size: A4 landscape; margin: 20mm; }
                h1, h2, h3 { text-align: center; margin: 10px 0; }
                .header { text-align: center; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; font-size: 14px; }
                th { background-color: #f2f2f2; border: 1px solid #ddd; padding: 8px; text-align: center; }
                td { border: 1px solid #ddd; padding: 6px; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                .page-break { page-break-after: always; }
                .no-print { display: none; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>รายงานข้อมูลทั้งหมด IN-TECH</h1>
                <h3>โครงการผ่ากล</h3>
                <p>ออกรายงานเมื่อ: ${timestamp}</p>
                <p>จำนวนข้อมูลทั้งหมด: ${allData.length} รายการ</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th width="50">#</th>
                        ${headers.map(h => `<th>${formatHeader(h)}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            
            <div class="footer">
                <p>ระบบค้นหาเลขแปลง IN-TECH - โครงการผ่ากล</p>
                <p>หน้า 1/1</p>
            </div>
        </body>
        </html>
    `;
}

// Copy data to clipboard
function copyDataToClipboard() {
    if (allData.length === 0) {
        showToast('ไม่มีข้อมูลสำหรับคัดลอก', 'warning');
        return;
    }
    
    const headers = Object.keys(allData[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join('\t'));
    
    // Add data rows (limited to 1000 rows for clipboard)
    const maxRows = Math.min(1000, allData.length);
    for (let i = 0; i < maxRows; i++) {
        const values = headers.map(header => {
            return allData[i][header] || '';
        });
        csvRows.push(values.join('\t'));
    }
    
    const textToCopy = csvRows.join('\n');
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast(`คัดลอกข้อมูล ${maxRows} รายการสำเร็จ`, 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('ไม่สามารถคัดลอกได้', 'danger');
    });
}

// Toggle auto-refresh
function toggleAutoRefresh() {
    const btn = $('#autoRefreshBtn');
    
    if (isAutoRefresh) {
        // Stop auto-refresh
        clearInterval(autoRefreshTimer);
        btn.removeClass('btn-success').addClass('btn-outline-success');
        btn.html('<i class="fas fa-sync"></i> รีเฟรชอัตโนมัติ');
        showToast('ปิดการรีเฟรชอัตโนมัติ', 'info');
    } else {
        // Start auto-refresh
        autoRefreshTimer = setInterval(() => {
            loadAllData(true);
            showToast('อัปเดตข้อมูลอัตโนมัติ', 'info');
        }, CONFIG.AUTO_REFRESH_INTERVAL);
        
        btn.removeClass('btn-outline-success').addClass('btn-success');
        btn.html('<i class="fas fa-stop"></i> หยุดรีเฟรช');
        showToast('เปิดการรีเฟรชอัตโนมัติทุก 5 นาที', 'success');
    }
    
    isAutoRefresh = !isAutoRefresh;
}

// Update statistics
function updateStatistics() {
    const count = allData.length;
    $('#totalRecords').text(count.toLocaleString('th-TH'));
    
    $('#columnCount').text(allData.length > 0 ? Object.keys(allData[0]).length : 0);
    
    const now = new Date();
    $('#lastUpdateTime').text(now.toLocaleTimeString('th-TH'));
}

// Update current time
function updateCurrentTime() {
    const now = new Date();
    $('#currentTime').text(now.toLocaleString('th-TH'));
}

// Show loading state
function showLoading(show) {
    if (show) {
        $('#loadingState').show();
    } else {
        $('#loadingState').hide();
    }
}

function hideLoading() {
    $('#loadingState').hide();
}

// Show empty state
function showEmptyState() {
    $('#emptyState').show();
    $('#dataContainer').hide();
    hideLoading();
}

function hideEmptyState() {
    $('#emptyState').hide();
}

// Hide data container
function hideDataContainer() {
    $('#dataContainer').hide();
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastId = 'toast-' + Date.now();
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle',
        danger: 'times-circle'
    };
    
    const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-${type} text-white">
                <i class="fas fa-${icons[type] || 'info-circle'} me-2"></i>
                <strong class="me-auto">IN-TECH System</strong>
                <small>just now</small>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    $('.toast-container').append(toastHtml);
    
    const toastElement = $(`#${toastId}`);
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 3000
    });
    
    toast.show();
    
    // Remove toast after hiding
    toastElement.on('hidden.bs.toast', function () {
        $(this).remove();
    });
}

// Show error message
function showError(message) {
    showEmptyState();
    showToast(message, 'danger');
}

// Escape HTML special characters
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Initialize DataTable (for advanced features)
function initializeDataTable() {
    if ($.fn.DataTable && !dataTable) {
        dataTable = $('#mainDataTable').DataTable({
            pageLength: CONFIG.ITEMS_PER_PAGE,
            lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, 'ทั้งหมด']],
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/th.json'
            },
            responsive: true,
            dom: 'Bfrtip',
            buttons: [
                'copy', 'csv', 'excel', 'pdf', 'print'
            ]
        });
    }
}
