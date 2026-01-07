// Configuration
const CONFIG = {
    GOOGLE_APPS_SCRIPT_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHlqFXL5N8DKNhyg8au_M9eypFk65rXRgXdCna7pO9gadqpHLmtcz8FHKeCaBlxuqGcIY60PxUhyu-/pubhtml?gid=980262450&single=true',
    SHEET_ID: '15eCkphn1ZCWJu1fg3ppe3Os-bKxAb4alvC33mAEgGrw',
    SHEET_NAME: 'สถานะ',
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes cache
    ITEMS_PER_PAGE: 25
};

// Global variables
let allData = [];
let currentPage = 1;
let totalPages = 1;
let searchCount = 0;
let dataTable = null;

// Initialize when page loads
$(document).ready(function() {
    initializePage();
    loadDataFromGoogleSheet();
    
    // Set current time
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000); // Update every minute
    
    // Search button click
    $('#searchBtn').click(performSearch);
    
    // Search on Enter key
    $('#searchInput').keypress(function(e) {
        if (e.which === 13) {
            performSearch();
        }
    });
    
    // Refresh button
    $('#refreshBtn').click(function() {
        $(this).addClass('refreshing');
        loadDataFromGoogleSheet(true);
        setTimeout(() => $(this).removeClass('refreshing'), 1000);
    });
    
    // Export buttons
    $('#exportExcel').click(exportToExcel);
    $('#exportPDF').click(exportToPDF);
    $('#printData').click(printData);
});

// Initialize page
function initializePage() {
    // Load from localStorage if available
    const cachedData = localStorage.getItem('sheetData');
    const cachedTime = localStorage.getItem('lastUpdate');
    
    if (cachedData && cachedTime) {
        const timeDiff = Date.now() - parseInt(cachedTime);
        if (timeDiff < CONFIG.CACHE_DURATION) {
            allData = JSON.parse(cachedData);
            displayData();
            showToast('โหลดข้อมูลจากแคช', 'info');
        }
    }
}

// Load data from Google Sheet
function loadDataFromGoogleSheet(forceRefresh = false) {
    showLoading(true);
    
    // Clear existing table if refreshing
    if (forceRefresh) {
        allData = [];
        if (dataTable) {
            dataTable.destroy();
            dataTable = null;
        }
    }
    
    // Check cache first
    const cachedData = localStorage.getItem('sheetData');
    const cachedTime = localStorage.getItem('lastUpdate');
    
    if (!forceRefresh && cachedData && cachedTime) {
        const timeDiff = Date.now() - parseInt(cachedTime);
        if (timeDiff < CONFIG.CACHE_DURATION) {
            allData = JSON.parse(cachedData);
            displayData();
            showToast('โหลดข้อมูลจากแคชสำเร็จ', 'success');
            showLoading(false);
            return;
        }
    }
    
    // Fetch from Google Apps Script
    const url = `${CONFIG.GOOGLE_APPS_SCRIPT_URL}?action=getData&sheetId=${CONFIG.SHEET_ID}&sheetName=${CONFIG.SHEET_NAME}`;
    
    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'json',
        crossDomain: true,
        timeout: 30000, // 30 seconds timeout
        success: function(response) {
            if (response.success && response.data) {
                allData = response.data;
                
                // Save to localStorage
                localStorage.setItem('sheetData', JSON.stringify(allData));
                localStorage.setItem('lastUpdate', Date.now().toString());
                
                displayData();
                updateStatistics();
                showToast('โหลดข้อมูลสำเร็จ', 'success');
            } else {
                showError('ไม่สามารถดึงข้อมูลได้: ' + (response.message || 'Unknown error'));
            }
            showLoading(false);
        },
        error: function(xhr, status, error) {
            console.error('Error loading data:', error);
            
            // Try fallback method - load CSV from published sheet
            tryFallbackMethod();
        }
    });
}

// Fallback method using published CSV
function tryFallbackMethod() {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:csv`;
    
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data && results.data.length > 0) {
                allData = results.data;
                displayData();
                updateStatistics();
                showToast('โหลดข้อมูลสำเร็จ (ใช้วิธีสำรอง)', 'success');
            } else {
                showError('ไม่สามารถดึงข้อมูลได้');
            }
            showLoading(false);
        },
        error: function(error) {
            console.error('CSV parse error:', error);
            showError('ไม่สามารถเชื่อมต่อกับ Google Sheet ได้');
            showLoading(false);
        }
    });
}

// Display data in table
function displayData() {
    if (!allData || allData.length === 0) {
        $('#noData').show();
        $('#dataTableContainer').hide();
        return;
    }
    
    $('#noData').hide();
    $('#dataTableContainer').show();
    
    // Create table headers from first row keys
    const headers = Object.keys(allData[0]);
    const headerHtml = headers.map(header => 
        `<th>${header}</th>`
    ).join('');
    
    $('#tableHeader').html(`<th>#</th>${headerHtml}`);
    
    // Create table body
    let tableBody = '';
    allData.forEach((row, index) => {
        let rowHtml = `<td>${index + 1}</td>`;
        
        headers.forEach(header => {
            const value = row[header] || '';
            rowHtml += `<td>${escapeHtml(value.toString())}</td>`;
        });
        
        tableBody += `<tr>${rowHtml}</tr>`;
    });
    
    $('#tableBody').html(tableBody);
    
    // Initialize DataTable if not already
    if (!dataTable) {
        dataTable = $('#dataTable').DataTable({
            pageLength: CONFIG.ITEMS_PER_PAGE,
            lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, 'ทั้งหมด']],
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/th.json'
            },
            dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
                 '<"row"<"col-sm-12"tr>>' +
                 '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
            responsive: true,
            order: [[0, 'asc']]
        });
    }
    
    updatePagination();
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
    
    const searchResults = allData.filter(row => {
        return Object.values(row).some(value => 
            value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
    });
    
    displaySearchResults(searchResults, searchTerm);
}

// Display search results
function displaySearchResults(results, searchTerm) {
    $('#searchResults').show();
    
    if (results.length === 0) {
        $('#searchResultContent').html(`
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ไม่พบผลลัพธ์สำหรับ "${searchTerm}"
            </div>
        `);
        return;
    }
    
    const headers = Object.keys(results[0]);
    
    let resultHtml = `
        <div class="alert alert-success">
            <i class="fas fa-check-circle me-2"></i>
            พบ ${results.length} รายการที่ตรงกับ "${searchTerm}"
        </div>
        <div class="table-responsive">
            <table class="table table-sm table-hover">
                <thead>
                    <tr>
                        <th>#</th>
                        ${headers.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
    `;
    
    results.forEach((row, index) => {
        resultHtml += '<tr>';
        resultHtml += `<td>${index + 1}</td>`;
        
        headers.forEach(header => {
            let value = row[header] || '';
            value = value.toString();
            
            // Highlight search term
            if (value.toLowerCase().includes(searchTerm.toLowerCase())) {
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                value = value.replace(regex, '<span class="highlight">$1</span>');
            }
            
            resultHtml += `<td>${value}</td>`;
        });
        
        resultHtml += '</tr>';
    });
    
    resultHtml += `
                </tbody>
            </table>
        </div>
    `;
    
    $('#searchResultContent').html(resultHtml);
    
    // Scroll to results
    $('html, body').animate({
        scrollTop: $('#searchResults').offset().top - 100
    }, 500);
}

// Update statistics
function updateStatistics() {
    $('#totalCount').text(allData.length);
    $('#columnCount').text(allData.length > 0 ? Object.keys(allData[0]).length : 0);
    
    const now = new Date();
    const timeString = now.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    $('#lastUpdate').text(timeString);
}

// Update pagination
function updatePagination() {
    if (!dataTable) return;
    
    const info = dataTable.page.info();
    const totalItems = allData.length;
    const itemsPerPage = CONFIG.ITEMS_PER_PAGE;
    
    totalPages = Math.ceil(totalItems / itemsPerPage);
    
    $('#dataTableInfo').html(`
        แสดง ${info.start + 1} ถึง ${info.end} จากทั้งหมด ${totalItems} รายการ
    `);
}

// Export to Excel
function exportToExcel() {
    if (allData.length === 0) {
        showToast('ไม่มีข้อมูลสำหรับส่งออก', 'warning');
        return;
    }
    
    // Create CSV
    const headers = Object.keys(allData[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    allData.forEach(row => {
        const values = headers.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes
            const escaped = value.toString().replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `IN-TECH_Data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('ส่งออกข้อมูลเป็น Excel สำเร็จ', 'success');
}

// Export to PDF
function exportToPDF() {
    showToast('กำลังเตรียมไฟล์ PDF...', 'info');
    // Note: You would need a PDF library like jsPDF for this
    // This is a simplified version
    window.print();
}

// Print data
function printData() {
    const printWindow = window.open('', '_blank');
    const headers = Object.keys(allData[0]);
    
    let printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>IN-TECH Data Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .header { text-align: center; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>ข้อมูลระบบ IN-TECH</h1>
                <p>ออกรายงานเมื่อ: ${new Date().toLocaleString('th-TH')}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        ${headers.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
    `;
    
    allData.forEach((row, index) => {
        printContent += '<tr>';
        printContent += `<td>${index + 1}</td>`;
        
        headers.forEach(header => {
            printContent += `<td>${row[header] || ''}</td>`;
        });
        
        printContent += '</tr>';
    });
    
    printContent += `
                </tbody>
            </table>
            <p style="margin-top: 20px; text-align: center;">
                จำนวนทั้งหมด: ${allData.length} รายการ
            </p>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

// Helper functions
function showLoading(show) {
    if (show) {
        $('#loading').show();
        $('#dataTableContainer').hide();
        $('#noData').hide();
    } else {
        $('#loading').hide();
    }
}

function showError(message) {
    $('#noData').show();
    $('#dataTableContainer').hide();
    $('#loading').hide();
    
    showToast(message, 'danger');
}

function showToast(message, type = 'info') {
    // Remove existing toasts
    $('.toast-container').remove();
    
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${getToastIcon(type)} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    $('body').append(`<div class="toast-container">${toastHtml}</div>`);
    
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

function getToastIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'warning': return 'exclamation-triangle';
        case 'danger': return 'times-circle';
        default: return 'info-circle';
    }
}

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

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleString('th-TH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    $('#currentTime').text(timeString);
}
