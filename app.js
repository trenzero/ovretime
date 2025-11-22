// 系统配置和加班记录管理
class OvertimeSystem {
    constructor() {
        this.settings = {
            normalRate: 1.5,
            weekendRate: 2.0,
            holidayRate: 3.0,
            insuranceRate: 17.5,
            taxRate: 10,
            hourlyWage: 50
        };
        this.records = [];
        this.init();
    }

    async init() {
        await this.loadSettings();
        await this.loadRecords();
        this.renderRecords();
        this.updateStatistics();
        this.setupEventListeners();
    }

    async loadSettings() {
        try {
            // 从Cloudflare KV加载设置
            const response = await fetch('/api/settings');
            if (response.ok) {
                const savedSettings = await response.json();
                this.settings = { ...this.settings, ...savedSettings };
                this.updateSettingsForm();
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }

    async loadRecords() {
        try {
            // 从Cloudflare KV加载记录
            const response = await fetch('/api/records');
            if (response.ok) {
                this.records = await response.json();
            }
        } catch (error) {
            console.error('加载记录失败:', error);
        }
    }

    updateSettingsForm() {
        document.getElementById('normalRate').value = this.settings.normalRate;
        document.getElementById('weekendRate').value = this.settings.weekendRate;
        document.getElementById('holidayRate').value = this.settings.holidayRate;
        document.getElementById('insuranceRate').value = this.settings.insuranceRate;
        document.getElementById('taxRate').value = this.settings.taxRate;
        document.getElementById('hourlyWage').value = this.settings.hourlyWage;
    }

    setupEventListeners() {
        // 深色模式切换
        document.getElementById('darkModeToggle').addEventListener('change', (e) => {
            document.documentElement.setAttribute('data-bs-theme', e.target.checked ? 'dark' : 'light');
        });
    }

    calculateOvertimePayment(hours, type) {
        let rate = this.settings.normalRate;
        if (type === 'weekend') rate = this.settings.weekendRate;
        if (type === 'holiday') rate = this.settings.holidayRate;

        const rawAmount = hours * this.settings.hourlyWage * rate;
        const insuranceDeduction = rawAmount * (this.settings.insuranceRate / 100);
        const taxableAmount = rawAmount - insuranceDeduction;
        const taxDeduction = taxableAmount * (this.settings.taxRate / 100);
        const netAmount = rawAmount - insuranceDeduction - taxDeduction;

        return {
            rawAmount: Math.round(rawAmount * 100) / 100,
            insuranceDeduction: Math.round(insuranceDeduction * 100) / 100,
            taxDeduction: Math.round(taxDeduction * 100) / 100,
            netAmount: Math.round(netAmount * 100) / 100
        };
    }

    addRecord(date, type, hours, notes) {
        const payment = this.calculateOvertimePayment(hours, type);
        const record = {
            id: Date.now(),
            date,
            type,
            hours: parseFloat(hours),
            notes,
            ...payment
        };
        
        this.records.push(record);
        this.saveRecords();
        this.renderRecords();
        this.updateStatistics();
        return record;
    }

    deleteRecord(id) {
        this.records = this.records.filter(record => record.id !== id);
        this.saveRecords();
        this.renderRecords();
        this.updateStatistics();
    }

    renderRecords() {
        const table = document.getElementById('recordsTable');
        table.innerHTML = '';

        if (this.records.length === 0) {
            table.innerHTML = '<tr><td colspan="7" class="text-center">暂无加班记录</td></tr>';
            return;
        }

        // 按日期降序排列
        this.records.sort((a, b) => new Date(b.date) - new Date(a.date));

        this.records.forEach(record => {
            const row = document.createElement('tr');
            const typeNames = {
                normal: '普通加班',
                weekend: '双休加班',
                holiday: '法定节假日加班'
            };
            
            row.innerHTML = `
                <td>${record.date}</td>
                <td>${typeNames[record.type]}</td>
                <td>${record.hours}小时</td>
                <td>¥${record.rawAmount}</td>
                <td>¥${record.netAmount}</td>
                <td>${record.notes || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="overtimeSystem.deleteRecord(${record.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            table.appendChild(row);
        });
    }

    updateStatistics() {
        const totalHours = this.records.reduce((sum, record) => sum + record.hours, 0);
        const totalRawIncome = this.records.reduce((sum, record) => sum + record.rawAmount, 0);
        const totalDeduction = this.records.reduce((sum, record) => 
            sum + record.insuranceDeduction + record.taxDeduction, 0);
        const totalNetIncome = this.records.reduce((sum, record) => sum + record.netAmount, 0);

        document.getElementById('totalHours').textContent = totalHours.toFixed(1);
        document.getElementById('totalRawIncome').textContent = totalRawIncome.toFixed(2);
        document.getElementById('totalDeduction').textContent = totalDeduction.toFixed(2);
        document.getElementById('totalNetIncome').textContent = totalNetIncome.toFixed(2);
    }

    async saveSettings() {
        this.settings = {
            normalRate: parseFloat(document.getElementById('normalRate').value),
            weekendRate: parseFloat(document.getElementById('weekendRate').value),
            holidayRate: parseFloat(document.getElementById('holidayRate').value),
            insuranceRate: parseFloat(document.getElementById('insuranceRate').value),
            taxRate: parseFloat(document.getElementById('taxRate').value),
            hourlyWage: parseFloat(document.getElementById('hourlyWage').value)
        };

        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.settings)
            });
            alert('设置保存成功！');
        } catch (error) {
            console.error('保存设置失败:', error);
            alert('保存设置失败');
        }
    }

    async saveRecords() {
        try {
            await fetch('/api/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.records)
            });
        } catch (error) {
            console.error('保存记录失败:', error);
        }
    }

    exportData() {
        const data = {
            settings: this.settings,
            records: this.records,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `overtime_data_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    importData() {
        document.querySelector('.import-section').classList.remove('d-none');
    }

    confirmImport() {
        const importData = document.getElementById('importData').value;
        
        try {
            const data = JSON.parse(importData);
            
            if (data.settings && data.records) {
                this.settings = data.settings;
                this.records = data.records;
                
                this.saveSettings();
                this.saveRecords();
                this.renderRecords();
                this.updateStatistics();
                this.updateSettingsForm();
                
                alert('数据导入成功！');
                this.cancelImport();
            } else {
                alert('导入数据格式不正确');
            }
        } catch (error) {
            alert('导入数据解析失败，请检查格式');
        }
    }

    cancelImport() {
        document.querySelector('.import-section').classList.add('d-none');
        document.getElementById('importData').value = '';
    }
}

// 初始化系统
const overtimeSystem = new OvertimeSystem();

// 全局函数，供HTML按钮调用
function addOvertimeRecord() {
    const date = document.getElementById('overtimeDate').value;
    const type = document.getElementById('overtimeType').value;
    const hours = document.getElementById('overtimeHours').value;
    const notes = document.getElementById('overtimeNotes').value;

    if (!date || !hours) {
        alert('请填写日期和时长');
        return;
    }

    overtimeSystem.addRecord(date, type, hours, notes);
    
    // 清空表单
    document.getElementById('overtimeDate').value = '';
    document.getElementById('overtimeHours').value = '';
    document.getElementById('overtimeNotes').value = '';
}

function saveSettings() {
    overtimeSystem.saveSettings();
}

function exportData() {
    overtimeSystem.exportData();
}

function importData() {
    overtimeSystem.importData();
}

function confirmImport() {
    overtimeSystem.confirmImport();
}

function cancelImport() {
    overtimeSystem.cancelImport();
}

// 设置默认日期为今天
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('overtimeDate').valueAsDate = new Date();
});