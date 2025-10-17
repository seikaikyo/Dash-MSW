// 清除所有舊資料並重新初始化系統
console.log('🔄 開始清除舊資料...');

// 清除 localStorage
localStorage.removeItem('msw_station_data');
localStorage.removeItem('msw_users');
localStorage.removeItem('msw_forms');
localStorage.removeItem('msw_form_instances');

// 清除 sessionStorage
sessionStorage.removeItem('currentStationId');

console.log('✓ 已清除所有舊資料（localStorage + sessionStorage）');
console.log('🔄 正在重新載入頁面...');

window.location.reload();
