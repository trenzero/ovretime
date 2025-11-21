// 加班记录管理类
class OvertimeManager {
    constructor() {
        this.records = JSON.parse(localStorage.getItem('overtimeRecords')) || [];
        this.init();
    }

    init() {
        this.setMinDate();
        this.bindEvents();
        this.renderRecords();
        this.updateSummary();
    }

    // 设置日期输入框的最小值为今天
    setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('overtime-date').value = today;
        document.getElementById('overtime-date').min = today;
    }

    // 绑定事件监听器
    bindEvents() {
        document.getElementById('overtime-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addRecord();
        });

        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importData(e);
        });

        document.getElementById('clear-btn').addEventListener('click', () => {
            if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
                this.clearAllData();
            }
        });

        // 参数变更时重新计算
        document.querySelectorAll('#settings-card input').forEach(input => {
            input.addEventListener('change', () => {
                this.renderRecords();
                this.updateSummary();
            });
        });
    }

    // 获取系统参数
    getParameters() {
        return {
            basicSalary: parseFloat(document.getElementById('basic-salary').value) || 0,
            overtimeRate: parseFloat(document.getElementById('overtime-rate').value) || 1.5,
            weekendRate: parseFloat(document.getElementById('weekend-rate').value) || 2,
            holidayRate: parseFloat(document.getElementById('holiday-rate').value) || 3,
            insuranceRate: (parseFloat(document.getElementById('insurance-rate').value) || 0) / 100,
            taxThreshold: parseFloat(document.getElementById('tax-threshold').value) || 5000
        };
    }

    // 计算每小时工资
    calculateHourlyWage(monthlySalary) {
        // 按每月平均计薪天数21.75天计算 [citation:6]
        return monthlySalary / 21.75 / 8;
    }

    // 计算单条记录的加班费
    calculateOvertimePay(record, params) {
        const hourlyWage = this.calculateHourlyWage(params.basicSalary);
        let rate;

        switch (record.type) {
            case 'ordinary': rate = params.overtimeRate; break;
            case 'weekend': rate = params.weekendRate; break;
            case 'holiday': rate = params.holidayRate; break;
            default: rate = 1;
        }

        return hourlyWage * record.hours * rate;
    }

    // 计算个税（简易计算）
    calculateTax(income, threshold) {
        const taxable = income - threshold;
        if (taxable <= 0) return 0;

        // 简化税率计算
        if (taxable <= 3000) return taxable * 0.03;
        if (taxable <= 12000) return taxable * 0.1 - 210;
        if (taxable <= 25000) return taxable * 0.2 - 1410;
        return taxable * 0.25 - 2660;
    }

    // 添加新记录
    addRecord() {
        const type = document.getElementById('overtime-type').value;
        const hours = parseFloat(document.getElementById('overtime-hours').value);
        const date = document.getElementById('overtime-date').value;

        if (!date) {
            alert('请选择加班日期');
            return;
        }

        const record = {
            id: Date.now(),
            date,
            type,
            hours,
            timestamp: new Date().toISOString()
        };

        this.records.push(record);
        this.saveRecords();
        this.renderRecords();
        this.updateSummary();

        // 重置表单
        document.getElementById('overtime-form').reset();
        this.setMinDate();
    }

    // 删除记录
    deleteRecord(id) {
        this.records = this.records.filter(record => record.id !== id);
        this.saveRecords();
        this.renderRecords();
        this.updateSummary();
    }

    // 保存记录到本地存储
    saveRecords() {
        localStorage.setItem('overtimeRecords', JSON.stringify(this.records));
    }

    // 渲染记录列表
    renderRecords() {
        const tbody = document.getElementById('records-body');
        const params = this.getParameters();
        const typeNames = {
            ordinary: '普通加班',
            weekend: '双休日加班',
            holiday: '法定节假日加班'
        };

        if (this.records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">暂无加班记录</td></tr>';
            return;
        }

        tbody.innerHTML = this.records.map(record => {
            const pay = this.calculateOvertimePay(record, params);
            return `
                <tr>
                    <td>${record.date}</td>
                    <td>${typeNames[record.type]}</td>
                    <td>${record.hours}</td>
                    <td>${pay.toFixed(2)}</td>
                    <td>
                        <button onclick="overtimeManager.deleteRecord(${record.id})" 
                                class="btn-danger" style="padding: 6px 12px;">
                            删除
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // 更新统计摘要
    updateSummary() {
        const params = this.getParameters();
        
        let totalHours = 0;
        let totalOvertimePay = 0;

        this.records.forEach(record => {
            totalHours += record.hours;
            totalOvertimePay += this.calculateOvertimePay(record, params);
        });

        const totalInsurance = totalOvertimePay * params.insuranceRate;
        const taxableIncome = totalOvertimePay - totalInsurance;
        const totalTax = this.calculateTax(taxableIncome, params.taxThreshold);
        const netPay = totalOvertimePay - totalInsurance - totalTax;

        document.getElementById('total-hours').textContent = totalHours.toFixed(1);
        document.getElementById('total-overtime-pay').textContent = totalOvertimePay.toFixed(2);
        document.getElementById('total-insurance').textContent = totalInsurance.toFixed(2);
        document.getElementById('total-tax').textContent = totalTax.toFixed(2);
        document.getElementById('net-pay').textContent = netPay.toFixed(2);
    }

    // 导出数据
    exportData() {
        const data = {
            records: this.records,
            parameters: this.getParameters(),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `overtime-records-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 导入数据
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.records && Array.isArray(data.records)) {
                    if (confirm(`确定要导入 ${data.records.length} 条记录吗？这将覆盖当前数据。`)) {
                        this.records = data.records;
                        this.saveRecords();
                        this.renderRecords();
                        this.updateSummary();
                        alert('数据导入成功！');
                    }
                } else {
                    alert('无效的数据文件格式');
                }
            } catch (error) {
                alert('文件读取失败：' + error.message);
            }
        };
        reader.readAsText(file);
        
        // 重置文件输入
        event.target.value = '';
    }

    // 清空所有数据
    clearAllData() {
        this.records = [];
        this.saveRecords();
        this.renderRecords();
        this.updateSummary();
    }
}

// 初始化应用
const overtimeManager = new OvertimeManager();