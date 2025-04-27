// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('تم تحميل الصفحة');
    initializeDates();
    loadAllData(); // Load all data first
    setupTabs(); // Setup main tabs
    setupSubTabs(); // Setup member sub-tabs
    initializeEventListeners();
    createEmployeeDetailsModal(); // Ensure employee modal exists on load
    createMemberDetailsModal(); // Ensure member modal exists on load
    // Add Bootstrap Icons CSS dynamically
    if (!document.querySelector('link[href*="bootstrap-icons.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css';
        document.head.appendChild(link);
    }

    // تهيئة قسم التقارير
    initReports();
});

// Function to display alerts
function showAlert(type, message) {
    console.log(`Alert (${type}): ${message}`);
    const alertPlaceholder = document.getElementById('alertPlaceholder');
    if (alertPlaceholder) {
        const alertType = type === 'danger' ? 'danger' : (type === 'warning' ? 'warning' : 'success');
        const icon = type === 'danger' ? 'exclamation-triangle-fill' : (type === 'warning' ? 'exclamation-triangle-fill' : 'check-circle-fill');
        const wrapper = document.createElement('div');
        wrapper.innerHTML = [
            `<div class="alert alert-${alertType} alert-dismissible fade show d-flex align-items-center" role="alert">`,
            `   <i class="bi bi-${icon} me-2"></i>`,
            `   <div>${message}</div>`,
            '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
            '</div>'
        ].join('');
        alertPlaceholder.innerHTML = '';
        alertPlaceholder.append(wrapper);
    } else {
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

// Setup main tabs
function setupTabs() {
    const tabElements = document.querySelectorAll('#nav-tab button[data-bs-toggle="tab"]');
    tabElements.forEach(tab => {
        new bootstrap.Tab(tab);
    });
}

// Setup member sub-tabs
function setupSubTabs() {
    const subTabElements = document.querySelectorAll('#members-sub-tabs button[data-bs-toggle="pill"]');
    subTabElements.forEach(tab => {
        new bootstrap.Tab(tab);
    });
}

// Initialize all event listeners
function initializeEventListeners() {
    // Toggle Form Button Listener
    const toggleFormBtns = document.querySelectorAll('.toggle-form-btn');
    toggleFormBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            // تغيير أيقونة الزر عند النقر عليه
            const icon = this.querySelector('i');
            if (icon) {
                if (isExpanded) {
                    // إذا كان النموذج مفتوحاً، سيتم طيه
                    icon.classList.remove('bi-chevron-up');
                    icon.classList.add('bi-chevron-down');
                } else {
                    // إذا كان النموذج مطوياً، سيتم فتحه
                    icon.classList.remove('bi-chevron-down');
                    icon.classList.add('bi-chevron-up');
                }
            }
        });
    });

    // Employee Form Listener (Original Tab)
    const employeeForm = document.getElementById('employee-form');
    if (employeeForm) {
        employeeForm.addEventListener('submit', handleEmployeeSubmit);
        const resetButton = employeeForm.querySelector('button[type="reset"]');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                employeeForm.querySelector('button[type="submit"]').textContent = 'حفظ البيانات';
                document.getElementById('employee-id').value = ''; // Use original ID
            });
        }
    }

    // Member Form Listener
    const memberForm = document.getElementById('member-form');
    if (memberForm) {
        memberForm.onsubmit = addMember;
        const cancelEditBtn = document.getElementById('cancel-member-edit-btn');
        if(cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                memberForm.reset();
                memberForm.querySelector('#member-edit-id').value = '';
                memberForm.querySelector('button[type="submit"]').textContent = 'حفظ البيانات';
                cancelEditBtn.style.display = 'none';
                const memberListTabButton = document.getElementById('member-list-subtab');
                 if (memberListTabButton) {
                    const tab = bootstrap.Tab.getInstance(memberListTabButton) || new bootstrap.Tab(memberListTabButton);
                    tab.show();
                }
            });
        }
    }

    // Transaction Form Listener
    const transactionForm = document.getElementById('transaction-form');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleTransactionSubmit);
    }

    // General Expense Form Listener
    const expenseForm = document.getElementById('expense-form');
    if (expenseForm) {
        expenseForm.addEventListener('submit', handleExpenseSubmit);
    }

    // Member Specific Expense Form Listener
    const memberExpenseForm = document.getElementById('member-expense-form');
    if (memberExpenseForm) {
        memberExpenseForm.addEventListener('submit', handleMemberExpenseSubmit);
    }
}

// Date handling functions
function initializeDates() {
    updateDates();
    setInterval(updateDates, 60000);
}

function updateDates() {
    const now = moment();
    const gregorianDate = now.locale('en').format('YYYY/MM/DD');
    const hijriDate = now.locale('ar-SA').format('iYYYY/iM/iD');
    // Display in header
    const headerGregorian = document.querySelector('#date-display-header #gregorian-date');
    const headerHijri = document.querySelector('#date-display-header #hijri-date');
    if(headerGregorian) headerGregorian.textContent = `الميلادي: ${gregorianDate}`;
    if(headerHijri) headerHijri.textContent = `الهجري: ${hijriDate}`;
}

// Data Storage Functions
const STORAGE_KEYS = {
    EMPLOYEES: 'salary_management_employees',
    MEMBERS: 'salary_management_members',
    EXPENSES: 'salary_management_expenses',
    MEMBER_EXPENSES: 'salary_management_member_expenses',
    TRANSACTIONS: 'salary_management_transactions',
    MEMBER_ORDER: 'salary_management_member_order'
};

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`تم حفظ البيانات بنجاح: ${key}`);
        return true;
    } catch (error) {
        console.error(`خطأ في حفظ البيانات: ${key}`, error);
        showAlert('danger', 'حدث خطأ في حفظ البيانات');
        return false;
    }
}

function loadData(key, defaultValue = []) {
    try {
        const data = localStorage.getItem(key);
        const parsedData = data ? JSON.parse(data) : defaultValue;

        if (key === STORAGE_KEYS.MEMBERS && Array.isArray(parsedData)) {
             return parsedData.map(item => ({
                 ...item,
                 id: String(item.id),
                 isActive: item.isActive === undefined ? true : item.isActive,
                 monthlyContribution: typeof item.monthlyContribution === 'number' ? item.monthlyContribution : 0,
                 previousBalance: typeof item.previousBalance === 'number' ? item.previousBalance : 0
                }));
        }
        if (key === STORAGE_KEYS.EMPLOYEES && Array.isArray(parsedData)) {
            // Ensure paidMonths exists and is an array
            return parsedData.map(item => ({
                ...item,
                id: String(item.id),
                salary: typeof item.salary === 'number' ? item.salary : 0,
                paidMonths: Array.isArray(item.paidMonths) ? item.paidMonths : [] // Initialize if missing
            }));
        }
        if (key === STORAGE_KEYS.TRANSACTIONS && Array.isArray(parsedData)) {
             return parsedData.map(item => ({ ...item, memberId: String(item.memberId) }));
        }
         if (key === STORAGE_KEYS.MEMBER_EXPENSES && Array.isArray(parsedData)) {
             return parsedData.map(item => ({ ...item, memberId: String(item.memberId) }));
        }
        return parsedData;
    } catch (error) {
        console.error(`خطأ في تحميل البيانات: ${key}`, error);
        showAlert('danger', `حدث خطأ في تحميل البيانات لـ ${key}`);
        return defaultValue;
    }
}

// Global data variables
let members = loadData(STORAGE_KEYS.MEMBERS);
let employees = loadData(STORAGE_KEYS.EMPLOYEES);
let transactions = loadData(STORAGE_KEYS.TRANSACTIONS);
let expenses = loadData(STORAGE_KEYS.EXPENSES);
let memberExpenses = loadData(STORAGE_KEYS.MEMBER_EXPENSES);
let memberOrder = loadData(STORAGE_KEYS.MEMBER_ORDER, []);

// Function to get members in the saved order
function getOrderedMembers() {
    const memberMap = new Map(members.map(m => [m.id, m]));
    const orderedMembers = memberOrder.map(id => memberMap.get(id)).filter(m => m);
    const unorderedMembers = members.filter(m => !memberOrder.includes(m.id));
    return [...orderedMembers, ...unorderedMembers];
}

// Function to save the current member order
function saveMemberOrder() {
    saveData(STORAGE_KEYS.MEMBER_ORDER, memberOrder);
}

// Initial data load and UI update
function loadAllData() {
    try {
        console.log('تم تحميل البيانات:', { /* ... data lengths ... */ });

        const currentMemberIds = new Set(members.map(m => m.id));
        memberOrder = memberOrder.filter(id => currentMemberIds.has(id));
        members.forEach(m => {
            if (!memberOrder.includes(m.id)) {
                memberOrder.push(m.id);
            }
        });
        saveData(STORAGE_KEYS.MEMBER_ORDER, memberOrder);

        updateEmployeesList();
        displayMembers();
        updateExpensesList();
        populateMemberSelects();
        updateDashboardSummary();

    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        showAlert('danger', 'حدث خطأ في تحميل البيانات');
    }
}

// --- Employee Management (Original Tab Version) ---
function handleEmployeeSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const editingId = document.getElementById('employee-id').value;

    const serviceStartDate = formData.get('serviceStartDate');
    const durationValue = parseInt(formData.get('serviceDurationValue'), 10);
    const durationUnit = formData.get('serviceDurationUnit');
    let serviceEndDate = null;

    if (serviceStartDate && durationValue > 0 && moment(serviceStartDate).isValid()) {
        serviceEndDate = moment(serviceStartDate).add(durationValue, durationUnit).format('YYYY-MM-DD');
    }

    const existingEmployee = editingId ? employees.find(emp => emp.id === editingId) : null;

    const employee = {
        id: editingId || Date.now().toString(),
        name: formData.get('name'),
        workType: formData.get('workType'),
        passportNumber: formData.get('passportNumber'),
        passportExpiry: formData.get('passportExpiry'),
        iqamaNumber: formData.get('iqamaNumber'),
        iqamaExpiry: formData.get('iqamaExpiry'),
        phone: formData.get('phone'),
        salary: parseFloat(formData.get('salary')) || 0,
        homeAddress: formData.get('homeAddress'),
        relativeName: formData.get('relativeName'),
        relativeAccount: formData.get('relativeAccount'),
        serviceStartDate: serviceStartDate,
        serviceDurationValue: durationValue || null,
        serviceDurationUnit: durationUnit,
        serviceEndDate: serviceEndDate,
        paidMonths: existingEmployee ? existingEmployee.paidMonths : [] // Preserve or initialize paidMonths
    };

    if (editingId) {
        employees = employees.map(emp => (emp.id === editingId ? employee : emp));
    } else {
        employees.push(employee);
    }

    if (saveData(STORAGE_KEYS.EMPLOYEES, employees)) {
        form.reset();
        document.getElementById('employee-id').value = '';
        form.querySelector('#serviceDurationUnit').value = 'years';
        form.querySelector('button[type="submit"]').textContent = 'حفظ البيانات';
        updateEmployeesList();
        displayMembers();
        updateDashboardSummary();
        showAlert('success', `تم ${editingId ? 'تحديث' : 'حفظ'} بيانات الموظف بنجاح`);
    }
}

function updateEmployeesList() {
    const tbody = document.getElementById('employees-list');
    if (!tbody) return;
    tbody.innerHTML = '';

    employees.forEach(employee => {
        const employeeIdString = String(employee.id);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employee.name || '-'}</td>
            <td>${employee.workType || '-'}</td>
            <td>${employee.passportNumber || '-'}</td>
            <td>${employee.iqamaNumber || '-'}</td>
            <td class="arabic-numbers">${(employee.salary || 0).toLocaleString('ar-SA')} ريال</td>
            <td>
                <button class="btn btn-sm btn-info me-1" title="عرض التفاصيل والرواتب" onclick="showEmployeeDetails('${employeeIdString}')"><i class="bi bi-eye-fill"></i></button>
                <button class="btn btn-sm btn-primary me-1" title="تعديل" onclick="editEmployee('${employeeIdString}')"><i class="bi bi-pencil-fill"></i></button>
                <button class="btn btn-sm btn-danger" title="حذف" onclick="deleteEmployee('${employeeIdString}')"><i class="bi bi-trash-fill"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function deleteEmployee(id) {
    const employeeIdString = String(id);
    if (confirm('هل أنت متأكد من حذف هذا العامل؟ سيتم حذف أي مصروفات رواتب مرتبطة به أيضًا.')) {
        // Find related salary expenses before deleting employee
        const relatedExpenseIds = expenses.filter(exp => exp.id.startsWith(`emp-${employeeIdString}-`)).map(exp => exp.id);

        employees = employees.filter(emp => emp.id !== employeeIdString);
        expenses = expenses.filter(exp => !exp.id.startsWith(`emp-${employeeIdString}-`)); // Delete related expenses

        const savedEmployees = saveData(STORAGE_KEYS.EMPLOYEES, employees);
        const savedExpenses = saveData(STORAGE_KEYS.EXPENSES, expenses);

        if(savedEmployees && savedExpenses) {
            updateEmployeesList();
            updateExpensesList(); // Update expense list as well
            displayMembers();
            updateDashboardSummary();
            showAlert('success', 'تم حذف العامل ومصروفات رواتبه المرتبطة بنجاح');
        } else {
             showAlert('danger', 'حدث خطأ أثناء حذف العامل أو مصروفاته.');
        }
    }
}

function editEmployee(id) {
    const employeeIdString = String(id);
    const employee = employees.find(emp => emp.id === employeeIdString);
    if (!employee) {
        showAlert('danger', 'لم يتم العثور على العامل للتعديل.');
        return;
    }

    const form = document.getElementById('employee-form');
    document.getElementById('employee-id').value = employee.id;
    form.name.value = employee.name || '';
    form.workType.value = employee.workType || '';
    form.salary.value = employee.salary || '';
    form.passportNumber.value = employee.passportNumber || '';
    form.passportExpiry.value = employee.passportExpiry || '';
    form.iqamaNumber.value = employee.iqamaNumber || '';
    form.iqamaExpiry.value = employee.iqamaExpiry || '';
    form.phone.value = employee.phone || '';
    form.homeAddress.value = employee.homeAddress || '';
    form.relativeName.value = employee.relativeName || '';
    form.relativeAccount.value = employee.relativeAccount || '';
    form.serviceStartDate.value = employee.serviceStartDate || '';
    form.serviceDurationValue.value = employee.serviceDurationValue || '';
    form.serviceDurationUnit.value = employee.serviceDurationUnit || 'years';

    form.querySelector('button[type="submit"]').textContent = 'تحديث البيانات';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    form.name.focus();
}

// --- Member Management ---

function calculateAutomaticContribution() {
    const domesticWorkers = employees.filter(emp => emp.workType && emp.workType.includes('منزلي') && emp.salary > 0);
    const activeMembers = members.filter(m => m.isActive === undefined || m.isActive);
    const activeMembersCount = activeMembers.length;
    let totalDomesticSalary = 0;
    domesticWorkers.forEach(worker => {
        totalDomesticSalary += worker.salary;
    });
    if (activeMembersCount > 0 && totalDomesticSalary > 0) {
        return Math.ceil(totalDomesticSalary / activeMembersCount); // Round up
    }
    return 0;
}

function getAppliedContribution(member) {
    // إذا كان العضو لديه اشتراك شهري محدد يدوياً، نستخدمه
    if (member.monthlyContribution > 0) {
        return member.monthlyContribution;
    }

    // نحسب الاشتراك الآلي لجميع الأعضاء (نشطين وغير نشطين)
    // لكن نعرضه فقط للأعضاء النشطين في واجهة المستخدم
    return calculateAutomaticContribution();
}

function displayMembers() {
    const membersList = document.getElementById('members-list');
    if (!membersList) return;
    membersList.innerHTML = '';
    const orderedMembers = getOrderedMembers();

    // Calculate share of general expenses for active members (excluding salaries)
    const activeMembersCount = members.filter(m => m.isActive === undefined || m.isActive).length;
    let totalGeneralExpenses = 0;
    expenses.forEach(exp => {
        // استثناء مصروفات الرواتب من حساب نصيب العضو
        if (exp.type !== 'راتب') {
            totalGeneralExpenses += exp.amount;
        }
    });
    const generalExpenseShare = activeMembersCount > 0 ? (totalGeneralExpenses / activeMembersCount) : 0;

    orderedMembers.forEach((member, index) => {
        const memberIdString = String(member.id);
        const row = document.createElement('tr');
        row.dataset.memberId = memberIdString;
        const isActive = member.isActive === undefined ? true : member.isActive;
        const appliedContribution = getAppliedContribution(member);

        // Calculate member balance
        const previousBalance = member.previousBalance || 0;
        let totalDeposits = 0;
        transactions.filter(t => t.memberId === memberIdString).forEach(d => totalDeposits += d.amount);

        let totalMemberExpenses = 0;
        memberExpenses.filter(me => me.memberId === memberIdString).forEach(e => totalMemberExpenses += e.amount);

        // Calculate due contributions for current year
        const currentYear = moment().year();
        const startOfYear = moment().year(currentYear).startOf('year');
        const today = moment();
        let totalDueContributionThisYear = 0;

        let monthIterator = startOfYear.clone();
        while (monthIterator.isSameOrBefore(today, 'month')) {
            // Check if due date (28th) has passed for the current iterating month
            const dueDateForMonthPassed = today.isSameOrAfter(monthIterator.clone().date(28));

            // نحسب الاشتراك الشهري لجميع الأعضاء (نشطين وغير نشطين)
            if (dueDateForMonthPassed) {
                totalDueContributionThisYear += appliedContribution;
            }

            monthIterator.add(1, 'month');
        }

        // Final balance calculation
        const finalBalance = previousBalance + totalDeposits - totalMemberExpenses - totalDueContributionThisYear - (isActive ? generalExpenseShare : 0);

        // Determine balance status for styling
        let balanceStatusClass = '';
        if (finalBalance > 0) {
            balanceStatusClass = 'text-success';
        } else if (finalBalance < 0) {
            balanceStatusClass = 'text-danger';
        } else {
            balanceStatusClass = 'text-secondary';
        }

        // تحديد حالة الاشتراك الشهري
        let contributionStatus = '';
        if (member.monthlyContribution > 0) {
            contributionStatus = '<small class="text-muted">(يدوي)</small>';
        } else if (appliedContribution > 0) {
            contributionStatus = '<small class="text-muted">(آلي)</small>';
        }

        // تحديد لون وحالة العضو
        let memberStatusBadge = '';
        if (isActive) {
            memberStatusBadge = '<span class="badge bg-success member-status-badge">نشط</span>';
        } else {
            memberStatusBadge = '<span class="badge bg-danger member-status-badge">غير نشط</span>';
        }

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${member.name || '-'}</td>
            <td class="arabic-numbers">${appliedContribution > 0 ? appliedContribution.toLocaleString('ar-SA') + ' ريال' : '-'} ${contributionStatus}</td>
            <td class="arabic-numbers ${balanceStatusClass} fw-bold">${finalBalance.toLocaleString('ar-SA')} ريال</td>
            <td>${memberStatusBadge}</td>
            <td>
                <button class="btn btn-sm btn-outline-secondary move-member-up" title="نقل لأعلى" ${index === 0 ? 'disabled' : ''} onclick="moveMember('${memberIdString}', 'up')"><i class="bi bi-arrow-up-short"></i></button>
                <button class="btn btn-sm btn-outline-secondary move-member-down" title="نقل لأسفل" ${index === orderedMembers.length - 1 ? 'disabled' : ''} onclick="moveMember('${memberIdString}', 'down')"><i class="bi bi-arrow-down-short"></i></button>
            </td>
            <td>
                <button class="btn btn-sm btn-success me-1" title="عرض التفاصيل" onclick="showMemberDetails('${memberIdString}')"><i class="bi bi-eye-fill"></i></button>
                <button class="btn btn-sm btn-primary me-1" title="تعديل" onclick="editMember('${memberIdString}')"><i class="bi bi-pencil-fill"></i></button>
                <button class="btn btn-sm btn-danger" title="حذف" onclick="deleteMember('${memberIdString}')"><i class="bi bi-trash-fill"></i></button>
            </td>
        `;
        membersList.appendChild(row);
    });
}

function moveMember(memberId, direction) {
    const index = memberOrder.indexOf(memberId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
        [memberOrder[index], memberOrder[index - 1]] = [memberOrder[index - 1], memberOrder[index]];
    } else if (direction === 'down' && index < memberOrder.length - 1) {
        [memberOrder[index], memberOrder[index + 1]] = [memberOrder[index + 1], memberOrder[index]];
    }

    saveMemberOrder();
    displayMembers();
}

function addMember(e) {
    e.preventDefault();
    e.stopPropagation();
    const form = e.target.closest('form');
    if (!form) return;

    const memberName = form.memberName.value.trim();
    if (!memberName) {
        showAlert('danger', 'الرجاء إدخال اسم العضو');
        return;
    }
    const manualContribution = parseFloat(form.monthlyContribution?.value) || 0;
    const previousBalance = parseFloat(form.previousBalance?.value) || 0;
    const isActive = form.memberStatus.checked;

    const member = {
        id: Date.now().toString(),
        name: memberName,
        monthlyContribution: manualContribution,
        previousBalance: previousBalance,
        isActive: isActive
    };

    members.push(member);
    memberOrder.push(member.id);

    if (saveData(STORAGE_KEYS.MEMBERS, members) && saveData(STORAGE_KEYS.MEMBER_ORDER, memberOrder)) {
        form.reset();
        form.memberStatus.checked = true;
        displayMembers();
        populateMemberSelects();
        updateDashboardSummary();
        showAlert('success', 'تم إضافة العضو بنجاح');
        const memberListTabButton = document.getElementById('member-list-subtab');
         if (memberListTabButton) {
            const tab = bootstrap.Tab.getInstance(memberListTabButton) || new bootstrap.Tab(memberListTabButton);
            tab.show();
        }
    }
}

function editMember(id) {
    const memberIdString = String(id);
    const member = members.find(m => m.id === memberIdString);
    if (!member) {
         showAlert('danger', 'لم يتم العثور على العضو للتعديل.');
         return;
    }

    const form = document.getElementById('member-form');
    form.querySelector('#member-edit-id').value = member.id;
    form.memberName.value = member.name || '';
    form.monthlyContribution.value = member.monthlyContribution || 0;
    form.previousBalance.value = member.previousBalance || 0;
    form.memberStatus.checked = member.isActive === undefined ? true : member.isActive;

    form.querySelector('button[type="submit"]').textContent = 'تحديث البيانات';
    document.getElementById('cancel-member-edit-btn').style.display = 'inline-block';

    const addMemberTabButton = document.getElementById('add-member-subtab');
    if (addMemberTabButton) {
        const tab = bootstrap.Tab.getInstance(addMemberTabButton) || new bootstrap.Tab(addMemberTabButton);
        tab.show();
    }

    form.onsubmit = function updateMemberHandler(e) {
        e.preventDefault();
        e.stopPropagation();
        const editingId = form.querySelector('#member-edit-id').value;
        if(!editingId) return;

        const newName = form.memberName.value.trim();
        if (!newName) {
            showAlert('danger', 'الرجاء إدخال اسم العضو');
            return;
        }
        const newManualContribution = parseFloat(form.monthlyContribution?.value) || 0;
        const newPreviousBalance = parseFloat(form.previousBalance?.value) || 0;
        const newIsActive = form.memberStatus.checked;

        members = members.map(m =>
            m.id === editingId ? {
                ...m,
                name: newName,
                monthlyContribution: newManualContribution,
                previousBalance: newPreviousBalance,
                isActive: newIsActive
                } : m
        );

        if (saveData(STORAGE_KEYS.MEMBERS, members)) {
            form.reset();
            form.memberStatus.checked = true;
            form.querySelector('#member-edit-id').value = '';
            form.querySelector('button[type="submit"]').textContent = 'حفظ البيانات';
            document.getElementById('cancel-member-edit-btn').style.display = 'none';
            form.onsubmit = addMember;

            displayMembers();
            populateMemberSelects();
            updateDashboardSummary();
            showAlert('success', 'تم تحديث بيانات العضو بنجاح');

            const memberListTabButton = document.getElementById('member-list-subtab');
             if (memberListTabButton) {
                const tab = bootstrap.Tab.getInstance(memberListTabButton) || new bootstrap.Tab(memberListTabButton);
                tab.show();
            }
        }
    };
    form.scrollIntoView({ behavior: 'smooth' });
    form.memberName.focus();
}

function deleteMember(id) {
    const memberIdString = String(id);
    if (confirm('هل أنت متأكد من حذف هذا العضو؟ سيتم حذف جميع إيداعاته ومصروفاته الخاصة أيضًا.')) {
        members = members.filter(m => m.id !== memberIdString);
        transactions = transactions.filter(t => t.memberId !== memberIdString);
        memberExpenses = memberExpenses.filter(me => me.memberId !== memberIdString);
        memberOrder = memberOrder.filter(orderId => orderId !== memberIdString);

        const savedMembers = saveData(STORAGE_KEYS.MEMBERS, members);
        const savedTransactions = saveTransactions();
        const savedMemberExpenses = saveData(STORAGE_KEYS.MEMBER_EXPENSES, memberExpenses);
        const savedOrder = saveData(STORAGE_KEYS.MEMBER_ORDER, memberOrder);

        if (savedMembers && savedTransactions && savedMemberExpenses && savedOrder) {
            displayMembers();
            populateMemberSelects();
            updateDashboardSummary();
            showAlert('success', 'تم حذف العضو وجميع بياناته المرتبطة بنجاح');
        } else {
             showAlert('danger', 'حدث خطأ أثناء حذف بيانات العضو.');
        }
    }
}


// --- General Expense Management ---
function handleExpenseSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const amount = parseFloat(formData.get('amount'));
    const date = formData.get('date');
    const type = formData.get('type');
    if (!date || !type || !amount || amount <= 0) {
         showAlert('danger', 'الرجاء إدخال جميع حقول المصروف بشكل صحيح.');
        return;
    }
    const expense = { id: Date.now().toString(), date, type, amount, notes: formData.get('notes') };
    expenses.push(expense);
    if (saveData(STORAGE_KEYS.EXPENSES, expenses)) {
        updateExpensesList();
        updateDashboardSummary();
        form.reset();
        showAlert('success', 'تم تسجيل المصروف العام بنجاح');
    }
}

function updateExpensesList() {
    const tbody = document.getElementById('expenses-list');
     if (!tbody) return;
    tbody.innerHTML = '';
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(expense => {
         const expenseIdString = String(expense.id);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(expense.date)}</td>
            <td>${expense.type || '-'}</td>
            <td class="arabic-numbers">${(expense.amount || 0).toLocaleString('ar-SA')} ريال</td>
            <td>${expense.notes || '-'}</td>
             <td><button class="btn btn-sm btn-danger" title="حذف" onclick="deleteExpense('${expenseIdString}')"><i class="bi bi-trash-fill"></i></button></td>
        `;
        tbody.appendChild(row);
    });
}

function deleteExpense(id) {
     const expenseIdString = String(id);
    if (confirm('هل أنت متأكد من حذف هذا المصروف العام؟')) {
        expenses = expenses.filter(exp => exp.id !== expenseIdString);
        if(saveData(STORAGE_KEYS.EXPENSES, expenses)) {
            updateExpensesList();
            updateDashboardSummary();
            showAlert('success', 'تم حذف المصروف العام بنجاح');
        }
    }
}


// --- Member Specific Expense Management ---
function handleMemberExpenseSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const memberId = formData.get('memberId');
    const amount = parseFloat(formData.get('amount'));
    const date = formData.get('date');
    const description = formData.get('description');
    if (!memberId || !date || !amount || amount <= 0 || !description) {
        showAlert('danger', 'الرجاء إدخال جميع حقول مصروف العضو بشكل صحيح.');
        return;
    }
    const memberExpense = { id: Date.now().toString(), memberId: String(memberId), date, amount, description, notes: formData.get('notes') };
    memberExpenses.push(memberExpense);

    // حفظ البيانات
    if (saveData(STORAGE_KEYS.MEMBER_EXPENSES, memberExpenses)) {
        try {
            // إعادة تعيين النموذج
            form.reset();

            // تحديث واجهة المستخدم
            updateDashboardSummary();
            displayMembers(); // تحديث قائمة الأعضاء

            // تحديث تفاصيل العضو إذا كانت النافذة مفتوحة
            const memberDetailsModal = document.getElementById('memberDetailsModal');
            if (memberDetailsModal && memberDetailsModal.classList.contains('show')) {
                // الحصول على معرف العضو المعروض حالياً
                const currentMemberId = memberDetailsModal.getAttribute('data-member-id');
                if (currentMemberId === memberId) {
                    showMemberDetails(memberId);
                }
            }

            showAlert('success', 'تم تسجيل مصروف العضو بنجاح');
        } catch (error) {
            console.error('حدث خطأ أثناء تحديث واجهة المستخدم بعد إضافة مصروف العضو:', error);
        }
    }
}

function deleteMemberExpense(id, memberIdToUpdate = null) {
    const expenseIdString = String(id);
    if (confirm('هل أنت متأكد من حذف هذا المصروف الخاص؟')) {
        // حفظ معرف العضو قبل حذف المصروف إذا لم يتم توفيره
        if (!memberIdToUpdate) {
            const expense = memberExpenses.find(me => me.id === expenseIdString);
            if (expense) {
                memberIdToUpdate = expense.memberId;
            }
        }

        // حذف المصروف
        memberExpenses = memberExpenses.filter(me => me.id !== expenseIdString);

        // حفظ البيانات
        if(saveData(STORAGE_KEYS.MEMBER_EXPENSES, memberExpenses)) {
            try {
                // تحديث واجهة المستخدم
                updateDashboardSummary();
                displayMembers(); // تحديث قائمة الأعضاء

                // تحديث تفاصيل العضو إذا كانت النافذة مفتوحة
                const memberDetailsModal = document.getElementById('memberDetailsModal');
                if (memberIdToUpdate && memberDetailsModal && memberDetailsModal.classList.contains('show')) {
                    // التحقق مما إذا كان العضو المعروض هو نفسه العضو المرتبط بالمصروف
                    const currentMemberId = memberDetailsModal.getAttribute('data-member-id');
                    if (currentMemberId === memberIdToUpdate) {
                        showMemberDetails(memberIdToUpdate);
                    }
                }

                showAlert('success', 'تم حذف مصروف العضو بنجاح');
            } catch (error) {
                console.error('حدث خطأ أثناء تحديث واجهة المستخدم بعد حذف المصروف:', error);
            }
        }
    }
}


// --- Member Deposits Management ---
function handleTransactionSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const memberId = formData.get('memberId');
    const amount = parseFloat(formData.get('amount'));
    const transferDate = formData.get('transferDate');
    if (!memberId || !transferDate || !amount || amount <= 0) {
        showAlert('danger', 'الرجاء إدخال العضو والتاريخ ومبلغ إيداع صحيح.');
        return;
    }
    const transaction = { id: Date.now().toString(), memberId: String(memberId), amount, transferDate, bank: formData.get('bank'), transferMethod: formData.get('transferMethod'), notes: formData.get('notes') };
    transactions.push(transaction);

    // حفظ البيانات
    if (saveTransactions()) {
        try {
            // إعادة تعيين النموذج
            form.reset();

            // تحديث واجهة المستخدم
            updateDashboardSummary();
            displayMembers(); // تحديث قائمة الأعضاء

            // تحديث تفاصيل العضو إذا كانت النافذة مفتوحة
            const memberDetailsModal = document.getElementById('memberDetailsModal');
            if (memberDetailsModal && memberDetailsModal.classList.contains('show')) {
                // الحصول على معرف العضو المعروض حالياً
                const currentMemberId = memberDetailsModal.getAttribute('data-member-id');
                if (currentMemberId === memberId) {
                    showMemberDetails(memberId);
                }
            }

            showAlert('success', 'تم تسجيل الإيداع بنجاح');
        } catch (error) {
            console.error('حدث خطأ أثناء تحديث واجهة المستخدم بعد إضافة الإيداع:', error);
        }
    }
}

function saveTransactions() {
    try {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
        console.log('تم حفظ الإيداعات بنجاح:', transactions.length);
        return true;
    } catch (error) {
        console.error('خطأ في حفظ الإيداعات:', error);
        showAlert('danger', 'حدث خطأ في حفظ الإيداعات');
        return false;
    }
}

function deleteTransaction(id, memberIdToUpdate = null) {
    const transactionIdString = String(id);
    if (confirm('هل أنت متأكد من حذف هذا الإيداع؟')) {
        // حفظ معرف العضو قبل حذف الإيداع إذا لم يتم توفيره
        if (!memberIdToUpdate) {
            const transaction = transactions.find(t => t.id === transactionIdString);
            if (transaction) {
                memberIdToUpdate = transaction.memberId;
            }
        }

        // حذف الإيداع
        transactions = transactions.filter(t => t.id !== transactionIdString);

        // حفظ البيانات
        if (saveTransactions()) {
            try {
                // تحديث واجهة المستخدم
                updateDashboardSummary();
                displayMembers(); // تحديث قائمة الأعضاء

                // تحديث تفاصيل العضو إذا كانت النافذة مفتوحة
                const memberDetailsModal = document.getElementById('memberDetailsModal');
                if (memberIdToUpdate && memberDetailsModal && memberDetailsModal.classList.contains('show')) {
                    showMemberDetails(memberIdToUpdate);
                }

                showAlert('success', 'تم حذف الإيداع بنجاح');
            } catch (error) {
                console.error('حدث خطأ أثناء تحديث واجهة المستخدم بعد حذف الإيداع:', error);
            }
        }
    }
}


// --- Member Details Modal Logic ---
function showMemberDetails(memberId) {
    const memberIdString = String(memberId);
    const member = members.find(m => m.id === memberIdString);
    if (!member) {
        showAlert('danger', 'لم يتم العثور على العضو.');
        return;
    }

    const memberDeposits = transactions.filter(t => t.memberId === memberIdString).sort((a, b) => new Date(b.transferDate) - new Date(a.transferDate));
    const memberSpecificExpenses = memberExpenses.filter(me => me.memberId === memberIdString).sort((a, b) => new Date(b.date) - new Date(a.date));

    // --- Calculations ---
    const previousBalance = member.previousBalance || 0;
    let totalDeposits = 0;
    memberDeposits.forEach(d => totalDeposits += d.amount);

    let totalMemberExpenses = 0;
    memberSpecificExpenses.forEach(e => totalMemberExpenses += e.amount);

    const appliedContribution = getAppliedContribution(member);
    const isActiveMember = member.isActive === undefined || member.isActive;

    // Monthly Breakdown Calculation
    const monthlyBreakdown = {};
    const currentYear = moment().year();
    const startOfYear = moment().year(currentYear).startOf('year');
    const today = moment();
    let runningBalance = previousBalance;
    let totalDueContributionThisYear = 0;

    const depositsPerMonth = {};
    memberDeposits.forEach(deposit => {
        const depositMonth = moment(deposit.transferDate).format('YYYY-MM');
        depositsPerMonth[depositMonth] = (depositsPerMonth[depositMonth] || 0) + deposit.amount;
    });
    const expensesPerMonth = {};
     memberSpecificExpenses.forEach(expense => {
        const expenseMonth = moment(expense.date).format('YYYY-MM');
        expensesPerMonth[expenseMonth] = (expensesPerMonth[expenseMonth] || 0) + expense.amount;
    });

    // Calculate share of general expenses for this member (excluding salaries)
    const activeMembersCount = members.filter(m => m.isActive === undefined || m.isActive).length;
    let totalGeneralExpenses = 0;
    expenses.forEach(exp => {
        // استثناء مصروفات الرواتب من حساب نصيب العضو
        if (exp.type !== 'راتب') {
            totalGeneralExpenses += exp.amount;
        }
    });
    const generalExpenseShare = activeMembersCount > 0 ? (totalGeneralExpenses / activeMembersCount) : 0;


    let monthIterator = startOfYear.clone();
    while (monthIterator.isSameOrBefore(today, 'month')) {
        const monthStr = monthIterator.format('YYYY-MM');
        // نحسب الاشتراك الشهري لجميع الأعضاء (نشطين وغير نشطين)
        const monthDueBase = appliedContribution;
        const monthPaid = depositsPerMonth[monthStr] || 0;
        const monthExpenses = expensesPerMonth[monthStr] || 0;
        const balanceBeforeMonth = runningBalance;

        // Check if due date (28th) has passed for the current iterating month
        const dueDateForMonthPassed = today.isSameOrAfter(monthIterator.clone().date(28));
        const monthDue = dueDateForMonthPassed ? monthDueBase : 0;

        let monthStatus = 'لم يحن بعد';
        let statusClass = 'text-muted';

        if (dueDateForMonthPassed) {
            if (monthDue > 0) {
                totalDueContributionThisYear += monthDue;
                if (monthPaid >= monthDue) {
                    monthStatus = 'مسدد';
                    statusClass = 'text-success';
                } else if (balanceBeforeMonth + monthPaid - monthExpenses >= monthDue) {
                    monthStatus = 'مسدد من الرصيد';
                    statusClass = 'text-primary';
                } else {
                    // إذا كان العضو غير نشط، نضع حالة "متأخر" للأشهر
                    if (!isActiveMember) {
                        monthStatus = 'متأخر (غير نشط)';
                        statusClass = 'text-danger fw-bold';
                    } else {
                        monthStatus = 'متأخر';
                        statusClass = 'text-danger';
                    }
                }
            } else {
                 monthStatus = 'لا يوجد قسط';
                 statusClass = 'text-secondary';
            }
        }

        monthlyBreakdown[monthStr] = {
            due: monthDue,
            paid: monthPaid,
            expenses: monthExpenses,
            balanceBefore: balanceBeforeMonth,
            status: monthStatus,
            statusClass: statusClass
        };

        runningBalance += monthPaid - monthExpenses - monthDue;
        monthIterator.add(1, 'month');
    }

    // Final balance calculation including share of general expenses
    const finalBalance = previousBalance + totalDeposits - totalMemberExpenses - totalDueContributionThisYear - (isActiveMember ? generalExpenseShare : 0);
    let balanceStatusText = '';
    let balanceStatusClass = '';
    if (finalBalance > 0) {
        balanceStatusText = 'فائض';
        balanceStatusClass = 'bg-success';
    } else if (finalBalance < 0) {
        balanceStatusText = 'مديون';
        balanceStatusClass = 'bg-danger';
    } else {
        balanceStatusText = 'متوازن';
        balanceStatusClass = 'bg-secondary';
    }

    let surplusCoverageText = '';
    if (finalBalance > 0 && appliedContribution > 0) {
        const monthsCovered = Math.floor(finalBalance / appliedContribution);
        if (monthsCovered > 0) {
            surplusCoverageText = `(يغطي ${monthsCovered} ${monthsCovered > 1 ? 'أشهر' : 'شهر'} قادمة)`;
        }
    }
    // --- End Calculations ---


    // --- Render Modal ---
    let modalBody = document.getElementById('memberDetailsModalBody');
     if (!modalBody) {
        console.error('Member details modal body not found!');
        createMemberDetailsModal();
        modalBody = document.getElementById('memberDetailsModalBody');
        if (!modalBody) {
             showAlert('danger', 'فشل في إنشاء أو العثور على نافذة تفاصيل العضو.');
             return;
        }
    }

    // Build Monthly Breakdown Table
    let monthlyTableHtml = `<h5 class="mt-4"><i class="bi bi-calendar3 me-2 text-info"></i>الحالة الشهرية لسنة ${currentYear}</h5>`;
    monthlyTableHtml += `<div class="table-responsive mb-3">
                            <table class="table table-sm table-bordered text-center monthly-breakdown">
                                <thead class="table-light"><tr><th>الشهر</th>`;
     const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    for (let i = 0; i < 12; i++) {
        monthlyTableHtml += `<th>${arabicMonths[i]}</th>`;
    }
    monthlyTableHtml += `</tr></thead><tbody>`;
    // Due Row
    monthlyTableHtml += `<tr><td>المستحق</td>`;
    for (let i = 0; i < 12; i++) {
        const monthStr = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
        const monthData = monthlyBreakdown[monthStr];
        const displayDue = monthData ? (isActiveMember || member.monthlyContribution > 0 ? appliedContribution : 0) : 0;
        monthlyTableHtml += `<td class="arabic-numbers">${displayDue > 0 ? displayDue.toLocaleString('ar-SA') : '-'}</td>`;
    }
    monthlyTableHtml += `</tr>`;
    // Paid Row
    monthlyTableHtml += `<tr><td>المدفوع</td>`;
     for (let i = 0; i < 12; i++) {
        const monthStr = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
        const monthData = monthlyBreakdown[monthStr];
        monthlyTableHtml += `<td class="arabic-numbers text-success">${monthData && monthData.paid > 0 ? monthData.paid.toLocaleString('ar-SA') : '-'}</td>`;
    }
    monthlyTableHtml += `</tr>`;
     // Status Row
    monthlyTableHtml += `<tr><td>الحالة</td>`;
     for (let i = 0; i < 12; i++) {
        const monthStr = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
        const monthData = monthlyBreakdown[monthStr];
        const statusText = monthData ? monthData.status : (moment(monthStr).isAfter(today, 'month') ? 'لم يحن بعد' : '-');
        const statusCls = monthData ? monthData.statusClass : 'text-muted';
         monthlyTableHtml += `<td><span class="${statusCls}">${statusText}</span></td>`;
    }
    monthlyTableHtml += `</tr>`;
    monthlyTableHtml += `</tbody></table></div>`;


    let html = `
        <!-- بطاقة معلومات العضو الرئيسية -->
        <div class="member-profile-header mb-3">
            <div class="member-profile-banner bg-gradient-primary rounded-3 p-3 text-white shadow-sm">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <div class="member-avatar bg-white text-primary rounded-circle shadow-sm">
                            <i class="bi bi-person-fill"></i>
                        </div>
                        <div class="ms-2">
                            <h3 class="mb-0 fw-bold">${member.name}</h3>
                            <div class="d-flex align-items-center mt-1">
                                ${isActiveMember ?
                                    '<span class="badge bg-success text-white px-2 py-1 rounded-pill"><i class="bi bi-check-circle-fill me-1"></i>عضو نشط</span>' :
                                    '<span class="badge bg-danger text-white px-2 py-1 rounded-pill"><i class="bi bi-dash-circle-fill me-1"></i>غير نشط</span> <span class="badge bg-warning text-dark px-2 py-1 rounded-pill ms-1"><i class="bi bi-exclamation-triangle-fill me-1"></i>يتم احتساب الاشتراك الشهري</span>'}
                                <span class="ms-2 text-white-50"><i class="bi bi-calendar3 me-1"></i>رقم العضوية: ${member.id}</span>
                            </div>
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="balance-display p-2 rounded-3 ${finalBalance >= 0 ? 'bg-success text-white' : 'bg-danger text-white'}">
                            <div class="small fw-bold mb-0">الرصيد النهائي</div>
                            <div class="h3 mb-0 arabic-numbers">${finalBalance.toLocaleString('ar-SA')} ريال</div>
                            <div class="small">${balanceStatusText} ${surplusCoverageText}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- بطاقات المعلومات المالية -->
        <div class="row g-2 mb-3">
            <!-- بطاقة الرصيد السابق -->
            <div class="col-md-6 col-lg-3">
                <div class="card h-100 border-0 shadow-sm rounded-3">
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="card-title mb-0 fw-bold">الرصيد السابق</h6>
                            <div class="stat-icon-container bg-primary text-white rounded-circle">
                                <i class="bi bi-flag-fill"></i>
                            </div>
                        </div>
                        <div class="stat-value arabic-numbers h4 mb-0 ${previousBalance >= 0 ? 'text-success' : 'text-danger'}">${previousBalance.toLocaleString('ar-SA')} ريال</div>
                    </div>
                </div>
            </div>

            <!-- بطاقة الاشتراك الشهري -->
            <div class="col-md-6 col-lg-3">
                <div class="card h-100 border-0 shadow-sm rounded-3">
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="card-title mb-0 fw-bold">الاشتراك الشهري</h6>
                            <div class="stat-icon-container bg-primary text-white rounded-circle">
                                <i class="bi bi-calendar-month"></i>
                            </div>
                        </div>
                        <div class="stat-value arabic-numbers h4 mb-0">${appliedContribution.toLocaleString('ar-SA')} ريال</div>
                        <small class="text-muted">${member.monthlyContribution > 0 ? 'تم تحديده يدوياً' : 'تم حسابه تلقائياً'}</small>
                    </div>
                </div>
            </div>

            <!-- بطاقة المبلغ السنوي المطلوب -->
            <div class="col-md-6 col-lg-3">
                <div class="card h-100 border-0 shadow-sm rounded-3">
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="card-title mb-0 fw-bold">المبلغ السنوي</h6>
                            <div class="stat-icon-container bg-info text-white rounded-circle">
                                <i class="bi bi-calendar-year"></i>
                            </div>
                        </div>
                        <div class="stat-value arabic-numbers h4 mb-0">${(appliedContribution * 12).toLocaleString('ar-SA')} ريال</div>
                        <small class="text-muted">الاشتراك السنوي الكامل</small>
                    </div>
                </div>
            </div>

            <!-- بطاقة المبلغ المتبقي للسنة -->
            <div class="col-md-6 col-lg-3">
                <div class="card h-100 border-0 shadow-sm rounded-3">
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="card-title mb-0 fw-bold">المتبقي للسنة</h6>
                            <div class="stat-icon-container bg-warning text-dark rounded-circle">
                                <i class="bi bi-hourglass-split"></i>
                            </div>
                        </div>
                        <div class="stat-value arabic-numbers h4 mb-0 text-warning">${((appliedContribution * 12) - totalDueContributionThisYear).toLocaleString('ar-SA')} ريال</div>
                        <small class="text-muted">المبلغ المتبقي للسنة ${currentYear}</small>
                    </div>
                </div>
            </div>

            <!-- بطاقة إجمالي المستحقات -->
            <div class="col-md-6 col-lg-3">
                <div class="card h-100 border-0 shadow-sm rounded-3">
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="card-title mb-0 fw-bold">إجمالي المستحقات</h6>
                            <div class="stat-icon-container bg-secondary text-white rounded-circle">
                                <i class="bi bi-receipt"></i>
                            </div>
                        </div>
                        <div class="stat-value arabic-numbers h4 mb-0">${totalDueContributionThisYear.toLocaleString('ar-SA')} ريال</div>
                        <small class="text-muted">للسنة الحالية ${currentYear}</small>
                    </div>
                </div>
            </div>

            <!-- بطاقة إجمالي الإيداعات -->
            <div class="col-md-6 col-lg-3">
                <div class="card h-100 border-0 shadow-sm rounded-3">
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="card-title mb-0 fw-bold">إجمالي الإيداعات</h6>
                            <div class="stat-icon-container bg-success text-white rounded-circle">
                                <i class="bi bi-arrow-down-circle-fill"></i>
                            </div>
                        </div>
                        <div class="stat-value arabic-numbers h4 mb-0 text-success">${totalDeposits.toLocaleString('ar-SA')} ريال</div>
                    </div>
                </div>
            </div>

            <!-- بطاقة المصروفات الخاصة -->
            <div class="col-md-6 col-lg-6">
                <div class="card h-100 border-0 shadow-sm rounded-3">
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="card-title mb-0 fw-bold">المصروفات الخاصة</h6>
                            <div class="stat-icon-container bg-danger text-white rounded-circle">
                                <i class="bi bi-arrow-up-circle-fill"></i>
                            </div>
                        </div>
                        <div class="stat-value arabic-numbers h4 mb-0 text-danger">${totalMemberExpenses.toLocaleString('ar-SA')} ريال</div>
                    </div>
                </div>
            </div>

            <!-- بطاقة نصيب المصروفات العامة -->
            <div class="col-md-6 col-lg-6">
                <div class="card h-100 border-0 shadow-sm rounded-3">
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="card-title mb-0 fw-bold">نصيب المصروفات العامة</h6>
                            <div class="stat-icon-container bg-danger text-white rounded-circle">
                                <i class="bi bi-cart-dash-fill"></i>
                            </div>
                        </div>
                        <div class="stat-value arabic-numbers h4 mb-0 text-danger">${(isActiveMember ? generalExpenseShare : 0).toLocaleString('ar-SA')} ريال</div>
                        ${!isActiveMember ? '<small class="text-warning">(لا يتم احتساب نصيب للأعضاء غير النشطين من المصروفات العامة، لكن يتم احتساب الاشتراك الشهري)</small>' : ''}
                    </div>
                </div>
            </div>
        </div>

        <!-- جدول الحالة الشهرية -->
        <div class="card border-0 shadow-sm rounded-3 mb-3">
            <div class="card-header bg-primary text-white py-2">
                <h5 class="mb-0 fw-bold"><i class="bi bi-calendar3 me-2"></i>الحالة الشهرية لسنة ${currentYear}</h5>
            </div>
            <div class="card-body p-0">
                ${monthlyTableHtml.replace('<h5 class="mt-4"><i class="bi bi-calendar3 me-2 text-info"></i>الحالة الشهرية لسنة', '<h5 class="d-none">')}
            </div>
        </div>
    `;

    // بطاقات الجداول
    html += `<div class="row g-2">
        <!-- بطاقة سجل الإيداعات -->
        <div class="col-md-12 col-lg-6">
            <div class="card border-0 shadow-sm rounded-3 h-100">
                <div class="card-header bg-success text-white py-2 d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <h5 class="mb-0 fw-bold"><i class="bi bi-cash-stack me-2"></i>سجل الإيداعات</h5>
                        <button class="btn btn-sm btn-light ms-2" title="إضافة إيداع جديد" onclick="showAddDepositForm('${memberIdString}')">
                            <i class="bi bi-plus-circle-fill text-success"></i> إيداع جديد
                        </button>
                    </div>
                    <span class="badge bg-white text-success px-2 py-1 rounded-pill">
                        <i class="bi bi-arrow-down-circle-fill me-1"></i>
                        <span class="arabic-numbers">${totalDeposits.toLocaleString('ar-SA')} ريال</span>
                    </span>
                </div>
                <div class="card-body p-0">`;

    if (memberDeposits.length > 0) {
        html += `<div class="table-responsive" style="max-height: 250px; overflow-y: auto;">
                    <table class="table table-sm table-striped table-hover mb-0">
                        <thead class="table-success sticky-top">
                            <tr>
                                <th class="ps-2">التاريخ</th>
                                <th class="arabic-numbers">المبلغ</th>
                                <th>البنك/الطريقة</th>
                                <th>ملاحظات</th>
                                <th class="text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>`;
        memberDeposits.forEach(t => {
            const transactionIdString = String(t.id);
            html += `<tr>
                        <td class="ps-2">${formatDate(t.transferDate)}</td>
                        <td class="arabic-numbers fw-bold text-success">+${t.amount.toLocaleString('ar-SA')}</td>
                        <td>${t.bank || '-'} / ${t.transferMethod || '-'}</td>
                        <td>${t.notes || '-'}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-danger btn-sm" title="حذف الإيداع" onclick="deleteTransaction('${transactionIdString}', '${memberIdString}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>`;
        });
        html += `</tbody></table></div>`;
    } else {
        html += `<div class="text-center p-3">
                    <div class="empty-state-icon mb-2">
                        <i class="bi bi-inbox text-muted"></i>
                    </div>
                    <p class="text-muted">لا توجد إيداعات مسجلة لهذا العضو</p>
                </div>`;
    }

    html += `</div></div></div>

        <!-- بطاقة سجل المصروفات الخاصة -->
        <div class="col-md-12 col-lg-6">
            <div class="card border-0 shadow-sm rounded-3 h-100">
                <div class="card-header bg-danger text-white py-2 d-flex justify-content-between align-items-center">
                    <h5 class="mb-0 fw-bold"><i class="bi bi-dash-circle-fill me-2"></i>سجل المصروفات الخاصة</h5>
                    <span class="badge bg-white text-danger px-2 py-1 rounded-pill">
                        <i class="bi bi-arrow-up-circle-fill me-1"></i>
                        <span class="arabic-numbers">${totalMemberExpenses.toLocaleString('ar-SA')} ريال</span>
                    </span>
                </div>
                <div class="card-body p-0">`;

    if (memberSpecificExpenses.length > 0) {
        html += `<div class="table-responsive" style="max-height: 250px; overflow-y: auto;">
                    <table class="table table-sm table-striped table-hover mb-0">
                        <thead class="table-danger sticky-top">
                            <tr>
                                <th class="ps-2">التاريخ</th>
                                <th>الوصف</th>
                                <th class="arabic-numbers">المبلغ</th>
                                <th>ملاحظات</th>
                                <th class="text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>`;
        memberSpecificExpenses.forEach(me => {
            const expenseIdString = String(me.id);
            html += `<tr>
                        <td class="ps-2">${formatDate(me.date)}</td>
                        <td>${me.description || '-'}</td>
                        <td class="arabic-numbers fw-bold text-danger">-${me.amount.toLocaleString('ar-SA')}</td>
                        <td>${me.notes || '-'}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-danger btn-sm" title="حذف المصروف" onclick="deleteMemberExpense('${expenseIdString}', '${memberIdString}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>`;
        });
        html += `</tbody></table></div>`;
    } else {
        html += `<div class="text-center p-3">
                    <div class="empty-state-icon mb-2">
                        <i class="bi bi-inbox text-muted"></i>
                    </div>
                    <p class="text-muted">لا توجد مصروفات خاصة مسجلة لهذا العضو</p>
                </div>`;
    }

    html += `</div></div></div></div>`;

    // بطاقات المصروفات العامة والرواتب
    html += `<div class="row g-2 mt-2">
        <!-- بطاقة المصروفات العامة -->
        <div class="col-md-12 col-lg-6">
            <div class="card border-0 shadow-sm rounded-3 h-100">
                <div class="card-header bg-secondary text-white py-2 d-flex justify-content-between align-items-center">
                    <h5 class="mb-0 fw-bold"><i class="bi bi-receipt me-2"></i>المصروفات العامة</h5>
                    <span class="badge bg-white text-secondary px-2 py-1 rounded-pill">
                        <i class="bi bi-cart-dash-fill me-1"></i>
                        <span class="arabic-numbers">${(isActiveMember ? generalExpenseShare : 0).toLocaleString('ar-SA')} ريال</span>
                    </span>
                </div>
                <div class="card-body p-0">`;

    const currentYearExpenses = expenses
        .filter(exp => moment(exp.date).year() === currentYear && exp.type !== 'راتب') // استثناء الرواتب
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (currentYearExpenses.length > 0) {
        html += `<div class="table-responsive" style="max-height: 250px; overflow-y: auto;">
                    <table class="table table-sm table-striped table-hover mb-0">
                        <thead class="table-secondary sticky-top">
                            <tr>
                                <th class="ps-2">التاريخ</th>
                                <th>النوع</th>
                                <th class="arabic-numbers">المبلغ الإجمالي</th>
                                <th>ملاحظات</th>
                            </tr>
                        </thead>
                        <tbody>`;
        currentYearExpenses.forEach(exp => {
            html += `<tr>
                        <td class="ps-2">${formatDate(exp.date)}</td>
                        <td><span class="badge bg-secondary text-white rounded-pill">${exp.type || '-'}</span></td>
                        <td class="arabic-numbers fw-bold">${exp.amount.toLocaleString('ar-SA')}</td>
                        <td>${exp.notes || '-'}</td>
                     </tr>`;
        });
        html += `</tbody></table></div>`;
    } else {
        html += `<div class="text-center p-3">
                    <div class="empty-state-icon mb-2">
                        <i class="bi bi-inbox text-muted"></i>
                    </div>
                    <p class="text-muted">لا توجد مصروفات عامة مسجلة لهذه السنة</p>
                </div>`;
    }

    html += `</div>
                <div class="card-footer bg-light py-1 text-center">
                    <small class="text-muted">نصيب العضو من المصروفات العامة للسنة الحالية ${currentYear}</small>
                </div>
            </div>
        </div>

        <!-- بطاقة مصروفات الرواتب -->
        <div class="col-md-12 col-lg-6">
            <div class="card border-0 shadow-sm rounded-3 h-100">
                <div class="card-header bg-info text-white py-2 d-flex justify-content-between align-items-center">
                    <h5 class="mb-0 fw-bold"><i class="bi bi-cash-coin me-2"></i>مصروفات الرواتب</h5>
                    <span class="badge bg-white text-info px-2 py-1 rounded-pill">
                        <i class="bi bi-person-workspace me-1"></i>
                        <span class="arabic-numbers">للسنة الحالية ${currentYear}</span>
                    </span>
                </div>
                <div class="card-body p-0">`;

    const currentYearSalaries = expenses
        .filter(exp => moment(exp.date).year() === currentYear && exp.type === 'راتب')
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (currentYearSalaries.length > 0) {
        html += `<div class="table-responsive" style="max-height: 250px; overflow-y: auto;">
                    <table class="table table-sm table-striped table-hover mb-0">
                        <thead class="table-info sticky-top">
                            <tr>
                                <th class="ps-2">التاريخ</th>
                                <th>الموظف</th>
                                <th class="arabic-numbers">المبلغ</th>
                                <th>الشهر</th>
                            </tr>
                        </thead>
                        <tbody>`;
        currentYearSalaries.forEach(exp => {
            const employeeName = exp.notes ? exp.notes.split(' لشهر ')[0].replace('راتب ', '') : '-';
            const monthName = exp.notes ? exp.notes.split(' لشهر ')[1] || '-' : '-';

            html += `<tr>
                        <td class="ps-2">${formatDate(exp.date)}</td>
                        <td><span class="badge bg-primary text-white rounded-pill"><i class="bi bi-person-fill me-1"></i>${employeeName}</span></td>
                        <td class="arabic-numbers fw-bold">${exp.amount.toLocaleString('ar-SA')}</td>
                        <td><span class="badge bg-info text-white rounded-pill"><i class="bi bi-calendar-month me-1"></i>${monthName}</span></td>
                     </tr>`;
        });
        html += `</tbody></table></div>`;
    } else {
        html += `<div class="text-center p-3">
                    <div class="empty-state-icon mb-2">
                        <i class="bi bi-inbox text-muted"></i>
                    </div>
                    <p class="text-muted">لا توجد مصروفات رواتب مسجلة لهذه السنة</p>
                </div>`;
    }

    html += `</div>
                <div class="card-footer bg-light py-1 text-center">
                    <small class="text-muted">مصروفات الرواتب لا تؤثر على حساب العضو بشكل مباشر</small>
                </div>
            </div>
        </div>
    </div>`;


    modalBody.innerHTML = html;
    // --- End Render ---

    const detailsModalElement = document.getElementById('memberDetailsModal');
    if (detailsModalElement) {
        // تخزين معرف العضو في النافذة لاستخدامه لاحقاً
        detailsModalElement.setAttribute('data-member-id', memberIdString);

        const detailsModal = bootstrap.Modal.getInstance(detailsModalElement) || new bootstrap.Modal(detailsModalElement);
        detailsModal.show();
    } else {
        console.error("Modal element #memberDetailsModal not found for showing.");
    }
}

// دالة لإنشاء Modal تفاصيل العضو ديناميكيًا
function createMemberDetailsModal() {
    if (document.getElementById('memberDetailsModal')) return;
    const modalHTML = `
    <div class="modal fade" id="memberDetailsModal" tabindex="-1" aria-labelledby="memberDetailsModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content shadow-lg">
          <div class="modal-header bg-primary text-white"> <!-- Changed to primary color -->
            <h5 class="modal-title" id="memberDetailsModalLabel"><i class="bi bi-person-vcard-fill me-2"></i>تفاصيل العضو</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" id="memberDetailsModalBody">
            <p class="text-center">جاري تحميل التفاصيل...</p>
          </div>
          <div class="modal-footer justify-content-start flex-wrap"> <!-- Align buttons left and allow wrapping -->
            <button type="button" class="btn btn-sm btn-outline-secondary mb-1" onclick="printMemberDetails()"><i class="bi bi-printer-fill me-1"></i>طباعة</button>
            <button type="button" class="btn btn-sm btn-outline-danger mb-1" onclick="exportMemberDetailsPDF()"><i class="bi bi-file-earmark-pdf-fill me-1"></i>تصدير PDF</button>
            <button type="button" class="btn btn-sm btn-outline-success mb-1" onclick="shareMemberDetails('whatsapp')"><i class="bi bi-whatsapp me-1"></i>واتساب</button>
            <button type="button" class="btn btn-sm btn-outline-info mb-1" onclick="shareMemberDetails('telegram')"><i class="bi bi-telegram me-1"></i>تليجرام</button>
            <button type="button" class="btn btn-sm btn-outline-primary mb-1" onclick="shareMemberDetails('email')"><i class="bi bi-envelope-fill me-1"></i>ايميل</button>
            <button type="button" class="btn btn-sm btn-outline-dark mb-1" onclick="shareMemberDetails('sms')"><i class="bi bi-chat-text-fill me-1"></i>SMS</button>
            <button type="button" class="btn btn-secondary btn-sm ms-auto mb-1" data-bs-dismiss="modal"><i class="bi bi-x-circle me-1"></i>إغلاق</button> <!-- Close button aligned right -->
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('Member details modal created dynamically.');
}

// --- Dashboard Summary ---
function updateDashboardSummary() {
    let totalIncome = 0;
    transactions.forEach(t => totalIncome += t.amount);
    // إضافة الرصيد السابق للأعضاء إلى إجمالي الإيرادات
    let totalPreviousBalance = 0;
    members.forEach(m => {
        totalPreviousBalance += (typeof m.previousBalance === 'number' ? m.previousBalance : 0);
    });
    totalIncome += totalPreviousBalance;

    // حساب إجمالي المصروفات العامة والرواتب بشكل منفصل
    let totalGeneralExpenses = 0;
    let totalSalaryExpenses = 0;

    expenses.forEach(e => {
        if (e.type === 'راتب') {
            // إضافة مصروفات الرواتب إلى إجمالي الرواتب فقط
            totalSalaryExpenses += e.amount;
        } else {
            // إضافة المصروفات الأخرى إلى إجمالي المصروفات العامة
            totalGeneralExpenses += e.amount;
        }
    });

    // حساب إجمالي مصروفات الأعضاء
    let totalMemberExpenses = 0;
    memberExpenses.forEach(me => totalMemberExpenses += me.amount);

    // حساب الرصيد النهائي بعد خصم جميع المصروفات (المصروفات العامة والرواتب ومصروفات الأعضاء)
    const totalBalance = totalIncome - totalGeneralExpenses - totalSalaryExpenses - totalMemberExpenses;

    // تسجيل المعلومات في وحدة التحكم للتحقق
    console.log(`تحديث الرصيد العام:
        إجمالي الإيرادات: ${totalIncome} ريال
        إجمالي المصروفات العامة: ${totalGeneralExpenses} ريال
        إجمالي مصروفات الرواتب: ${totalSalaryExpenses} ريال
        إجمالي مصروفات الأعضاء: ${totalMemberExpenses} ريال
        الرصيد النهائي: ${totalBalance} ريال
    `);

    document.getElementById('summary-income').textContent = `${totalIncome.toLocaleString('ar-SA')} ريال`;
    // ملاحظة: الآن إجمالي الإيرادات يشمل الرصيد السابق للأعضاء
    document.getElementById('summary-general-expenses').textContent = `${totalGeneralExpenses.toLocaleString('ar-SA')} ريال`;
    document.getElementById('summary-salary-expenses').textContent = `${totalSalaryExpenses.toLocaleString('ar-SA')} ريال`;
    document.getElementById('summary-member-expenses').textContent = `${totalMemberExpenses.toLocaleString('ar-SA')} ريال`;
    document.getElementById('summary-balance').textContent = `${totalBalance.toLocaleString('ar-SA')} ريال`;

    const balanceCard = document.getElementById('summary-balance').closest('.summary-card');
    if (balanceCard) {
        balanceCard.classList.remove('bg-success', 'bg-danger', 'bg-primary');
        if (totalBalance > 0) {
            balanceCard.classList.add('bg-success');
        } else if (totalBalance < 0) {
            balanceCard.classList.add('bg-danger');
        } else {
            balanceCard.classList.add('bg-primary');
        }
    }
}


// --- Placeholder Functions for Print/Share ---
function printMemberDetails() {
    showAlert('info', 'وظيفة الطباعة قيد التطوير.');
    // window.print(); // Avoid printing the whole page unless intended
}

function exportMemberDetailsPDF() {
    showAlert('info', 'وظيفة تصدير PDF قيد التطوير (تتطلب مكتبات إضافية).');
}

function shareMemberDetails(platform) {
    const memberName = document.querySelector('#memberDetailsModal h4')?.textContent || 'تفاصيل العضو';
    const summaryElement = document.querySelector('#memberDetailsModal .row.mb-3.gy-2');
    let shareText = `ملخص حساب ${memberName}:\n`;
    if(summaryElement){
        summaryElement.querySelectorAll('div[class^="col-"]').forEach(col => {
            const label = col.querySelector('strong')?.textContent || '';
            const value = col.querySelector('span.arabic-numbers')?.textContent || '';
            const badge = col.querySelector('.badge')?.textContent || '';
            shareText += `- ${label.replace(':', '')}: ${value} ${badge}\n`;
        });
    } else {
         shareText += "(لا يمكن استخلاص الملخص حالياً)";
    }

    const encodedText = encodeURIComponent(shareText.trim());
    let shareUrl = '';

    switch (platform) {
        case 'whatsapp': shareUrl = `https://wa.me/?text=${encodedText}`; break;
        case 'telegram': shareUrl = `https://t.me/share/url?url=&text=${encodedText}`; break;
        case 'email': shareUrl = `mailto:?subject=تفاصيل حساب ${memberName}&body=${encodedText}`; break;
        case 'sms': shareUrl = `sms:?body=${encodedText}`; break;
        default: showAlert('warning', 'منصة مشاركة غير معروفة.'); return;
    }
    window.open(shareUrl, '_blank');
}

// --- وظائف الطباعة والمشاركة للعمال ---
function printEmployeeDetails() {
    showAlert('info', 'وظيفة طباعة تفاصيل العامل قيد التطوير.');
    // يمكن تنفيذ طباعة مخصصة هنا
}

function exportEmployeeDetailsPDF() {
    showAlert('info', 'وظيفة تصدير تفاصيل العامل إلى PDF قيد التطوير.');
    // يمكن تنفيذ تصدير PDF هنا
}

function shareEmployeeDetails(platform) {
    const employeeName = document.querySelector('#employeeDetailsModal .card-header + .card-body .h5')?.textContent || 'تفاصيل العامل';
    const salaryInfo = document.querySelector('#employeeDetailsModal .display-6')?.textContent || '';

    // تجميع معلومات الجواز والإقامة
    const passportNumber = document.querySelector('#employeeDetailsModal .border-info .h5')?.textContent || '';
    const iqamaNumber = document.querySelector('#employeeDetailsModal .border-warning .h5')?.textContent || '';

    // تجميع معلومات الراتب
    const salaryCards = document.querySelectorAll('#employeeDetailsModal .row.mb-4.g-3 .card .display-6');
    let salaryTotal = '';
    let salaryPaid = '';
    let salaryRemaining = '';

    if (salaryCards.length >= 3) {
        salaryTotal = salaryCards[0]?.textContent || '';
        salaryPaid = salaryCards[1]?.textContent || '';
        salaryRemaining = salaryCards[2]?.textContent || '';
    }

    // إنشاء نص المشاركة
    let shareText = `معلومات العامل: ${employeeName}\n`;
    shareText += `الراتب: ${salaryInfo}\n`;
    shareText += `رقم الجواز: ${passportNumber}\n`;
    shareText += `رقم الإقامة: ${iqamaNumber}\n\n`;
    shareText += `ملخص الرواتب:\n`;
    shareText += `- إجمالي المستحق: ${salaryTotal} ريال\n`;
    shareText += `- إجمالي المدفوع: ${salaryPaid} ريال\n`;
    shareText += `- المتبقي: ${salaryRemaining} ريال\n`;

    const encodedText = encodeURIComponent(shareText.trim());
    let shareUrl = '';

    switch (platform) {
        case 'whatsapp': shareUrl = `https://wa.me/?text=${encodedText}`; break;
        case 'telegram': shareUrl = `https://t.me/share/url?url=&text=${encodedText}`; break;
        case 'email': shareUrl = `mailto:?subject=تفاصيل العامل ${employeeName}&body=${encodedText}`; break;
        default: showAlert('warning', 'منصة مشاركة غير معروفة.'); return;
    }
    window.open(shareUrl, '_blank');
}


// --- Helper Functions ---

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const mDate = moment(dateString);
        if (!mDate.isValid()) return dateString;
        return mDate.format('YYYY/MM/DD');
    } catch (e) {
        console.error('Error formatting date:', dateString, e);
        return dateString;
    }
}

function populateMemberSelects() {
    const selects = document.querySelectorAll('select[name="memberId"]');
    if (!selects.length) return;
    const currentValues = {};
    selects.forEach(select => { currentValues[select.id] = select.value; });
    const orderedMembers = getOrderedMembers();
    selects.forEach(select => {
        select.innerHTML = '<option value="">اختر العضو...</option>';
        orderedMembers.forEach(member => {
            const option = document.createElement('option');
            option.value = String(member.id);
            option.textContent = member.name;
            select.appendChild(option);
        });
        if (currentValues[select.id]) { select.value = currentValues[select.id]; }
    });
}

// --- Backup and Restore Functions ---
function autoBackupData() {
    try {
        const backup = {
            timestamp: new Date().toISOString(),
            members: members,
            employees: employees,
            transactions: transactions,
            expenses: expenses,
            memberExpenses: memberExpenses,
            memberOrder: memberOrder
        };
        localStorage.setItem('salary_system_backup', JSON.stringify(backup));
        console.log('تم إنشاء نسخة احتياطية بنجاح');
    } catch (error) {
        console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
    }
}

function tryRestoreFromBackup() {
    try {
        const backup = localStorage.getItem('salary_system_backup');
        if (backup) {
            const data = JSON.parse(backup);
            members = (data.members || []).map(item => ({
                ...item,
                id: String(item.id),
                isActive: item.isActive === undefined ? true : item.isActive,
                monthlyContribution: typeof item.monthlyContribution === 'number' ? item.monthlyContribution : 0,
                previousBalance: typeof item.previousBalance === 'number' ? item.previousBalance : 0
            }));
            employees = (data.employees || []).map(item => {
                return {
                    ...item,
                    id: String(item.id),
                    salary: typeof item.salary === 'number' ? item.salary : 0,
                    paidMonths: Array.isArray(item.paidMonths) ? item.paidMonths : []
                };
            });
            transactions = (data.transactions || []).map(item => ({ ...item, memberId: String(item.memberId) }));
            expenses = data.expenses || [];
            memberExpenses = (data.memberExpenses || []).map(item => ({ ...item, memberId: String(item.memberId) }));
            memberOrder = data.memberOrder || members.map(m => m.id);

            saveData(STORAGE_KEYS.MEMBERS, members);
            saveData(STORAGE_KEYS.EMPLOYEES, employees);
            saveTransactions();
            saveData(STORAGE_KEYS.EXPENSES, expenses);
            saveData(STORAGE_KEYS.MEMBER_EXPENSES, memberExpenses);
            saveData(STORAGE_KEYS.MEMBER_ORDER, memberOrder);

            console.log('تم استعادة البيانات من النسخة الاحتياطية');
            showAlert('success', 'تم استعادة البيانات بنجاح');
            loadAllData();
            return true;
        }
    } catch (error) {
        console.error('خطأ في استعادة النسخة الاحتياطية:', error);
    }
    return false;
}

// --- Employee Details Modal ---
function formatRemainingDuration(dateString, isEndDate = false) {
    if (!dateString) return { text: 'غير محدد', days: null, isExpired: false, isSoon: false };
    const today = moment().startOf('day');
    const targetDate = moment(dateString).startOf('day');
    if (!targetDate.isValid()) return { text: 'تاريخ غير صالح', days: null, isExpired: false, isSoon: false };

    const remainingDaysTotal = targetDate.diff(today, 'days');
    const isExpired = remainingDaysTotal < 0;
    const isSoon = !isExpired && remainingDaysTotal <= 30;

    let text = '';
    let parts = [];

    if (isExpired) {
        let tempTargetDate = targetDate.clone();
        const years = today.diff(tempTargetDate, 'year');
        tempTargetDate.add(years, 'years');
        const months = today.diff(tempTargetDate, 'months');
        tempTargetDate.add(months, 'months');
        const days = today.diff(tempTargetDate, 'days');

        text = `${isEndDate ? 'انتهت الخدمة' : 'منتهي'} منذ `;
        if (years > 0) parts.push(`${years} سنة`);
        if (months > 0) parts.push(`${months} شهور`);
        parts.push(`${days} يوم`);
        text += parts.join(' | ');

    } else if (remainingDaysTotal === 0) {
        text = isEndDate ? 'تنتهي الخدمة اليوم' : 'ينتهي اليوم';
    } else {
        let tempStartDate = today.clone();
        const years = targetDate.diff(tempStartDate, 'year');
        tempStartDate.add(years, 'years');
        const months = targetDate.diff(tempStartDate, 'months');
        tempStartDate.add(months, 'months');
        const days = targetDate.diff(tempStartDate, 'days');

        text = `متبقي `;
        if (years > 0) parts.push(`${years} سنة`);
        if (months > 0) parts.push(`${months} شهور`);
        if (days > 0 || parts.length === 0) {
             parts.push(`${days} يوم`);
        }
        text += parts.join(' | ');
        if (isEndDate) text += ' في الخدمة';
    }

    if (parts.length === 1 && text.includes('|')) {
       text = text.replace(/\s*\|\s*$/, '');
    }

    return { text: text, days: remainingDaysTotal, isExpired, isSoon };
}

// Function to handle salary payment toggle
function toggleSalaryPayment(employeeId, monthStr, isPaid) {
    console.log(`تبديل حالة الدفع: العامل ${employeeId}، الشهر ${monthStr}، الحالة ${isPaid ? 'مدفوع' : 'غير مدفوع'}`);

    // تحديث حالة الزر فوراً لتحسين تجربة المستخدم
    const toggleButton = document.getElementById(`salary-btn-${employeeId}-${monthStr}`);
    if (toggleButton) {
        // إظهار حالة التحميل
        toggleButton.disabled = true;
        toggleButton.innerHTML = `<i class="bi bi-arrow-repeat"></i> جاري التحديث...`;
        toggleButton.classList.add('loading-btn');
    }

    const employeeIdString = String(employeeId);
    const employee = employees.find(emp => emp.id === employeeIdString);
    if (!employee) {
        showAlert('danger', 'لم يتم العثور على بيانات العامل.');
        resetButton(false);
        return;
    }

    // تأكد من وجود مصفوفة paidMonths
    if (!employee.paidMonths) {
        employee.paidMonths = [];
    }

    // تحويل الشهر إلى تاريخ كامل (اليوم الأول من الشهر)
    const monthDate = moment(monthStr + '-01', 'YYYY-MM-DD').format('YYYY-MM-DD');
    const salary = employee.salary || 0;

    // التحقق من الحالة الحالية للدفع
    const isCurrentlyPaid = employee.paidMonths.some(date => date.startsWith(monthStr));
    console.log(`الحالة الحالية للدفع: ${isCurrentlyPaid ? 'مدفوع' : 'غير مدفوع'}`);

    // تنفيذ التغيير بغض النظر عن الحالة الحالية
    // هذا يضمن أن الزر يعمل دائماً حتى لو كانت الحالة المطلوبة هي نفس الحالة الحالية
    if (isPaid) {
        // إضافة الشهر إلى قائمة الرواتب المدفوعة
        if (!isCurrentlyPaid) {
            employee.paidMonths.push(monthDate);
            console.log(`تمت إضافة الشهر ${monthStr} إلى قائمة الرواتب المدفوعة`);
        }

        // إضافة الراتب كمصروف عام
        const expenseDate = moment().format('YYYY-MM-DD'); // تاريخ اليوم
        const expenseType = 'راتب';
        const expenseNotes = `راتب ${employee.name} لشهر ${getArabicMonthName(monthStr)}`;

        // التحقق مما إذا كان هناك مصروف موجود بالفعل لهذا الراتب
        const existingExpense = expenses.find(exp =>
            exp.type === 'راتب' &&
            (
                (exp.employeeId === employeeIdString && exp.monthStr === monthStr) ||
                (exp.notes.includes(employee.name) && exp.notes.includes(getArabicMonthName(monthStr)))
            )
        );

        if (!existingExpense) {
            // إنشاء مصروف جديد
            const expense = {
                id: Date.now().toString(),
                date: expenseDate,
                type: expenseType,
                amount: salary,
                notes: expenseNotes,
                employeeId: employeeIdString, // إضافة معرف العامل للمصروف
                monthStr: monthStr // إضافة الشهر للمصروف
            };

            // إضافة المصروف إلى قائمة المصروفات
            expenses.push(expense);
            saveData(STORAGE_KEYS.EXPENSES, expenses);
            console.log(`تمت إضافة مصروف جديد بقيمة ${salary} ريال للعامل ${employee.name} لشهر ${getArabicMonthName(monthStr)}`);
        }
    } else {
        // إزالة الشهر من قائمة الرواتب المدفوعة
        if (isCurrentlyPaid) {
            employee.paidMonths = employee.paidMonths.filter(date => !date.startsWith(monthStr));
            console.log(`تمت إزالة الشهر ${monthStr} من قائمة الرواتب المدفوعة`);
        }

        // البحث عن المصروف المرتبط بهذا الراتب وحذفه
        // استخدام معرف العامل والشهر للبحث عن المصروفات المرتبطة بدقة أكبر
        const relatedExpenses = expenses.filter(exp =>
            exp.type === 'راتب' &&
            (
                // البحث باستخدام المعرفات الجديدة إذا كانت موجودة
                (exp.employeeId === employeeIdString && exp.monthStr === monthStr) ||
                // أو البحث بالطريقة القديمة للتوافق مع البيانات القديمة
                (exp.notes.includes(employee.name) && exp.notes.includes(getArabicMonthName(monthStr)))
            )
        );

        if (relatedExpenses.length > 0) {
            console.log(`تم العثور على ${relatedExpenses.length} مصروف مرتبط`);
            // حذف المصروفات المرتبطة
            expenses = expenses.filter(exp => !relatedExpenses.some(re => re.id === exp.id));
            saveData(STORAGE_KEYS.EXPENSES, expenses);
            console.log(`تم حذف المصروفات المرتبطة`);
        }
    }

    // حفظ التغييرات
    employees = employees.map(emp => (emp.id === employeeIdString ? employee : emp));

    // حفظ بيانات الموظفين
    const savedEmployees = saveData(STORAGE_KEYS.EMPLOYEES, employees);
    // حفظ بيانات المصروفات
    const savedExpenses = saveData(STORAGE_KEYS.EXPENSES, expenses);

    if (savedEmployees && savedExpenses) {
        // تحديث قائمة المصروفات والرصيد العام
        updateExpensesList();
        updateDashboardSummary();

        // تحديث حالة الزر مباشرة
        updateButtonState(isPaid);

        // تحديث الإحصائيات في مسير الراتب
        updateSalaryStatistics(employeeIdString);

        // عرض رسالة نجاح
        showAlert('success', `تم ${isPaid ? 'تأكيد' : 'إلغاء'} دفع راتب شهر ${getArabicMonthName(monthStr)}`);
    } else {
        showAlert('danger', 'حدث خطأ أثناء حفظ بيانات الراتب.');
        resetButton(isCurrentlyPaid);
    }

    // دالة مساعدة لتحديث حالة الزر
    function updateButtonState(isPaid) {
        try {
            console.log(`تحديث حالة الزر إلى ${isPaid ? 'مدفوع' : 'غير مدفوع'}`);

            if (!toggleButton) {
                console.error(`لم يتم العثور على الزر salary-btn-${employeeId}-${monthStr}`);
                // محاولة العثور على الزر مرة أخرى
                const newToggleButton = document.getElementById(`salary-btn-${employeeId}-${monthStr}`);
                if (!newToggleButton) {
                    console.error(`فشل العثور على الزر مرة أخرى`);
                    return;
                }
                console.log(`تم العثور على الزر بنجاح`);
                toggleButton = newToggleButton;
            }

            // تحديث حالة الزر
            toggleButton.disabled = false;
            toggleButton.classList.remove('loading-btn');

            // تحديث نص وأيقونة الزر
            toggleButton.innerHTML = isPaid ?
                `<i class="bi bi-check-circle-fill"></i> تم الدفع` :
                `<i class="bi bi-cash-coin"></i> دفع`;

            // تحديث لون الزر
            toggleButton.className = `btn btn-sm ${isPaid ? 'btn-success' : 'btn-outline-danger'} payment-toggle-btn`;

            // تحديث معامل النقر
            toggleButton.setAttribute('onclick', `event.preventDefault(); event.stopPropagation(); toggleSalaryPayment('${employeeIdString}', '${monthStr}', ${!isPaid});`);

            // تحديث حالة الخلية
            const cell = toggleButton.closest('td');
            if (cell) {
                cell.className = isPaid ? 'bg-success-subtle' : 'bg-danger-subtle';

                // تحديث شارة الحالة
                const statusBadge = cell.querySelector('.badge');
                if (statusBadge) {
                    statusBadge.className = `badge ${isPaid ? 'bg-success text-white' : 'bg-danger text-white'} mb-1`;
                    statusBadge.textContent = isPaid ? 'تم الدفع' : 'غير مدفوع';
                }
            }

            console.log(`تم تحديث حالة زر التبديل بنجاح إلى ${isPaid ? 'مدفوع' : 'غير مدفوع'}`);
        } catch (error) {
            console.error('حدث خطأ أثناء تحديث حالة الزر:', error);
            // محاولة إعادة تعيين الزر
            resetButton(isPaid);
        }
    }

    // دالة مساعدة لإعادة تعيين الزر في حالة الخطأ
    function resetButton(isPaid) {
        try {
            console.log(`إعادة تعيين الزر إلى الحالة ${isPaid ? 'مدفوع' : 'غير مدفوع'}`);

            if (!toggleButton) {
                console.error(`لم يتم العثور على الزر salary-btn-${employeeId}-${monthStr}`);
                // محاولة العثور على الزر مرة أخرى
                const newToggleButton = document.getElementById(`salary-btn-${employeeId}-${monthStr}`);
                if (!newToggleButton) {
                    console.error(`فشل العثور على الزر مرة أخرى`);
                    return;
                }
                console.log(`تم العثور على الزر بنجاح`);
                toggleButton = newToggleButton;
            }

            toggleButton.disabled = false;
            toggleButton.classList.remove('loading-btn');

            // إعادة تعيين نص وأيقونة الزر
            toggleButton.innerHTML = isPaid ?
                `<i class="bi bi-check-circle-fill"></i> تم الدفع` :
                `<i class="bi bi-cash-coin"></i> دفع`;

            // إعادة تعيين لون الزر
            toggleButton.className = `btn btn-sm ${isPaid ? 'btn-success' : 'btn-outline-danger'} payment-toggle-btn`;

            console.log(`تم إعادة تعيين الزر بنجاح`);
        } catch (error) {
            console.error('حدث خطأ أثناء إعادة تعيين الزر:', error);
        }
    }
}

// دالة لتحديث إحصائيات الراتب في مسير الراتب
function updateSalaryStatistics(employeeId) {
    console.log(`تحديث إحصائيات الراتب للعامل ${employeeId}`);

    const employeeIdString = String(employeeId);
    const employee = employees.find(emp => emp.id === employeeIdString);
    if (!employee) {
        console.error(`لم يتم العثور على العامل ${employeeId}`);
        return;
    }

    // تحضير بيانات الرواتب المدفوعة
    if (!employee.paidMonths) {
        employee.paidMonths = [];
    }

    // تحويل تواريخ الرواتب المدفوعة إلى تنسيق YYYY-MM
    const paidMonthsMap = {};
    employee.paidMonths.forEach(date => {
        const monthKey = moment(date).format('YYYY-MM');
        paidMonthsMap[monthKey] = true;
    });

    const currentYear = moment().year();
    const today = moment();

    // حساب عدد الأشهر المستحقة والمدفوعة والمتبقية
    let dueMonthsCount = 0;
    let paidMonthsCount = 0;
    let remainingMonthsCount = 0;

    for (let i = 0; i < 12; i++) {
        const monthStr = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
        const monthDate = moment(monthStr, 'YYYY-MM');

        // التحقق مما إذا كان الشهر قد انتهى (آخر يوم في الشهر) أو هو الشهر الحالي
        const isLastDayOfMonth = today.date() === monthDate.daysInMonth();
        const isMonthPassed = monthDate.isBefore(today, 'month');
        const isMonthDue = isMonthPassed || (monthDate.isSame(today, 'month') && isLastDayOfMonth);

        // التحقق مما إذا كان العامل قد بدأ العمل قبل هذا الشهر
        const hasStarted = !employee.serviceStartDate || moment(employee.serviceStartDate).isBefore(monthDate, 'month');

        // التحقق مما إذا كان العامل لا يزال يعمل في هذا الشهر
        const isStillWorking = !employee.serviceEndDate || moment(employee.serviceEndDate).isAfter(monthDate, 'month');

        const isPaid = paidMonthsMap[monthStr];

        // الراتب مستحق إذا كان آخر يوم في الشهر أو الشهر قد انتهى أو تم تأكيد الدفع
        const isSalaryDue = (isMonthDue || isPaid) && hasStarted && isStillWorking;

        if (isSalaryDue) {
            dueMonthsCount++;
            if (isPaid) {
                paidMonthsCount++;
            }
        } else if (monthDate.isAfter(today, 'month') && hasStarted && isStillWorking) {
            // الأشهر المتبقية من السنة التي لم تحن بعد
            remainingMonthsCount++;
        }
    }

    const totalSalaryDue = dueMonthsCount * (employee.salary || 0);
    const totalSalaryPaid = paidMonthsCount * (employee.salary || 0);
    const remainingSalaryMonths = remainingMonthsCount * (employee.salary || 0);

    console.log(`إحصائيات الراتب: المستحق ${totalSalaryDue}، المدفوع ${totalSalaryPaid}، المتبقي ${remainingSalaryMonths}`);

    // تحديث الإحصائيات في واجهة المستخدم
    try {
        // البحث عن العناصر داخل نافذة تفاصيل العامل
        const modalBody = document.getElementById('employeeDetailsModalBody');
        if (!modalBody) {
            console.error('لم يتم العثور على نافذة تفاصيل العامل');
            return;
        }

        // البحث عن عناصر الإحصائيات
        const dueElement = modalBody.querySelector('.text-primary.mb-0');
        const paidElement = modalBody.querySelector('.text-success.mb-0');
        const remainingElement = modalBody.querySelector('.text-info.mb-0');

        if (dueElement) {
            dueElement.textContent = `${totalSalaryDue.toLocaleString('ar-SA')} ريال`;
            console.log(`تم تحديث إجمالي المستحق: ${totalSalaryDue.toLocaleString('ar-SA')} ريال`);
        } else {
            console.error('لم يتم العثور على عنصر إجمالي المستحق');
        }

        if (paidElement) {
            paidElement.textContent = `${totalSalaryPaid.toLocaleString('ar-SA')} ريال`;
            console.log(`تم تحديث إجمالي المدفوع: ${totalSalaryPaid.toLocaleString('ar-SA')} ريال`);
        } else {
            console.error('لم يتم العثور على عنصر إجمالي المدفوع');
        }

        if (remainingElement) {
            remainingElement.textContent = `${remainingSalaryMonths.toLocaleString('ar-SA')} ريال`;
            console.log(`تم تحديث المتبقي من السنة: ${remainingSalaryMonths.toLocaleString('ar-SA')} ريال`);
        } else {
            console.error('لم يتم العثور على عنصر المتبقي من السنة');
        }
    } catch (error) {
        console.error('حدث خطأ أثناء تحديث إحصائيات الراتب:', error);
    }
}

// دالة مساعدة للحصول على اسم الشهر بالعربية
function getArabicMonthName(monthStr) {
    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const monthIndex = parseInt(monthStr.split('-')[1]) - 1;
    return arabicMonths[monthIndex];
}

function showEmployeeDetails(id) {
    const employeeIdString = String(id);
    const employee = employees.find(emp => emp.id === employeeIdString);
    if (!employee) {
        showAlert('danger', 'لم يتم العثور على بيانات العامل.');
        return;
    }

    const passportStatus = formatRemainingDuration(employee.passportExpiry);
    const iqamaStatus = formatRemainingDuration(employee.iqamaExpiry);
    const serviceStatus = formatRemainingDuration(employee.serviceEndDate, true);

    let modalBody = document.getElementById('employeeDetailsModalBody');
    if (!modalBody) {
        console.error('Employee details modal body not found!');
        return;
    }

    let durationText = '-';
    if (employee.serviceDurationValue && employee.serviceDurationUnit) {
        durationText = `${employee.serviceDurationValue} ${employee.serviceDurationUnit === 'years' ? 'سنوات' : 'أشهر'}`;
    }

    const getStatusClass = (status) => {
        if (status.isExpired) return 'alert-danger';
        if (status.isSoon) return 'alert-warning';
        return 'alert-success';
    };

    // إضافة مسير الراتب الشهري
    const currentYear = moment().year();
    const startOfYear = moment().year(currentYear).startOf('year');
    const today = moment();

    // تحضير بيانات الرواتب المدفوعة
    // إذا لم تكن موجودة، نقوم بإنشاء مصفوفة فارغة
    if (!employee.paidMonths) {
        employee.paidMonths = [];
    }

    // تحويل تواريخ الرواتب المدفوعة إلى تنسيق YYYY-MM
    const paidMonthsMap = {};
    employee.paidMonths.forEach(date => {
        const monthKey = moment(date).format('YYYY-MM');
        paidMonthsMap[monthKey] = true;
    });

    // إنشاء جدول مسير الراتب
    let salaryTableHtml = `<h5 class="mt-4"><i class="bi bi-calendar3 me-2 text-info"></i>مسير الراتب لسنة ${currentYear}</h5>`;

    // حساب إجمالي الرواتب
    // الأشهر المستحقة حتى الآن
    let dueMonthsCount = 0;
    let paidMonthsCount = 0;
    let remainingMonthsCount = 0;

    // حساب عدد الأشهر المستحقة والمدفوعة والمتبقية
    for (let i = 0; i < 12; i++) {
        const monthStr = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
        const monthDate = moment(monthStr, 'YYYY-MM');

        // التحقق مما إذا كان الشهر قد انتهى (آخر يوم في الشهر) أو هو الشهر الحالي
        const isLastDayOfMonth = today.date() === monthDate.daysInMonth();
        const isMonthPassed = monthDate.isBefore(today, 'month');
        const isMonthDue = isMonthPassed || (monthDate.isSame(today, 'month') && isLastDayOfMonth);

        // التحقق مما إذا كان العامل قد بدأ العمل قبل هذا الشهر
        const hasStarted = !employee.serviceStartDate || moment(employee.serviceStartDate).isBefore(monthDate, 'month');

        // التحقق مما إذا كان العامل لا يزال يعمل في هذا الشهر
        const isStillWorking = !employee.serviceEndDate || moment(employee.serviceEndDate).isAfter(monthDate, 'month');

        const isPaid = paidMonthsMap[monthStr];

        // الراتب مستحق إذا كان آخر يوم في الشهر أو الشهر قد انتهى أو تم تأكيد الدفع
        const isSalaryDue = (isMonthDue || isPaid) && hasStarted && isStillWorking;

        if (isSalaryDue) {
            dueMonthsCount++;
            if (isPaid) {
                paidMonthsCount++;
            }
        } else if (monthDate.isAfter(today, 'month') && hasStarted && isStillWorking) {
            // الأشهر المتبقية من السنة التي لم تحن بعد
            remainingMonthsCount++;
        }
    }

    const totalSalaryDue = dueMonthsCount * (employee.salary || 0);
    const totalSalaryPaid = paidMonthsCount * (employee.salary || 0);
    const remainingSalaryMonths = remainingMonthsCount * (employee.salary || 0);

    // إضافة ملخص الرواتب في بطاقات
    salaryTableHtml += `
    <div class="row mb-3 g-2">
        <div class="col-md-4">
            <div class="card border-0 shadow-sm rounded-3 h-100">
                <div class="card-body p-2 text-center">
                    <div class="d-flex align-items-center justify-content-center mb-1">
                        <div class="bg-primary text-white rounded-circle p-2 me-2" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                            <i class="bi bi-calendar-check"></i>
                        </div>
                        <div class="text-dark fw-bold">إجمالي المستحق</div>
                    </div>
                    <div class="h3 arabic-numbers text-primary mb-0">${totalSalaryDue.toLocaleString('ar-SA')} ريال</div>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card border-0 shadow-sm rounded-3 h-100">
                <div class="card-body p-2 text-center">
                    <div class="d-flex align-items-center justify-content-center mb-1">
                        <div class="bg-success text-white rounded-circle p-2 me-2" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                            <i class="bi bi-check-circle"></i>
                        </div>
                        <div class="text-dark fw-bold">إجمالي المدفوع</div>
                    </div>
                    <div class="h3 arabic-numbers text-success mb-0">${totalSalaryPaid.toLocaleString('ar-SA')} ريال</div>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card border-0 shadow-sm rounded-3 h-100">
                <div class="card-body p-2 text-center">
                    <div class="d-flex align-items-center justify-content-center mb-1">
                        <div class="bg-info text-white rounded-circle p-2 me-2" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                            <i class="bi bi-hourglass-split"></i>
                        </div>
                        <div class="text-dark fw-bold">المتبقي من السنة</div>
                    </div>
                    <div class="h3 arabic-numbers text-info mb-0">${remainingSalaryMonths.toLocaleString('ar-SA')} ريال</div>
                </div>
            </div>
        </div>
    </div>`;

    // جدول الرواتب الشهرية
    salaryTableHtml += `<div class="table-responsive">
                            <table class="table table-sm table-bordered text-center salary-breakdown table-hover">
                                <thead class="bg-primary text-white"><tr><th>الشهر</th>`;

    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    for (let i = 0; i < 12; i++) {
        salaryTableHtml += `<th>${arabicMonths[i]}</th>`;
    }
    salaryTableHtml += `</tr></thead><tbody>`;

    // صف الراتب المستحق
    salaryTableHtml += `<tr><td class="bg-light fw-bold">المستحق</td>`;
    for (let i = 0; i < 12; i++) {
        const monthStr = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
        const monthDate = moment(monthStr, 'YYYY-MM');

        // التحقق مما إذا كان الشهر قد انتهى (آخر يوم في الشهر) أو هو الشهر الحالي
        const isLastDayOfMonth = today.date() === monthDate.daysInMonth();
        const isMonthPassed = monthDate.isBefore(today, 'month');
        const isMonthDue = isMonthPassed || (monthDate.isSame(today, 'month') && isLastDayOfMonth);

        // التحقق مما إذا كان العامل قد بدأ العمل قبل هذا الشهر
        const hasStarted = !employee.serviceStartDate || moment(employee.serviceStartDate).isBefore(monthDate, 'month');

        // التحقق مما إذا كان العامل لا يزال يعمل في هذا الشهر
        const isStillWorking = !employee.serviceEndDate || moment(employee.serviceEndDate).isAfter(monthDate, 'month');

        const isPaid = paidMonthsMap[monthStr];

        // الراتب مستحق إذا كان آخر يوم في الشهر أو الشهر قد انتهى أو تم تأكيد الدفع
        const isSalaryDue = (isMonthDue || isPaid) && hasStarted && isStillWorking;

        salaryTableHtml += `<td class="arabic-numbers fw-bold ${isSalaryDue ? 'bg-primary-subtle text-primary' : ''}">${isSalaryDue ? (employee.salary || 0).toLocaleString('ar-SA') : '-'}</td>`;
    }
    salaryTableHtml += `</tr>`;

    // صف حالة الدفع
    salaryTableHtml += `<tr><td class="bg-light fw-bold">الحالة</td>`;
    for (let i = 0; i < 12; i++) {
        const monthStr = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
        const monthDate = moment(monthStr, 'YYYY-MM');

        // التحقق مما إذا كان الشهر قد انتهى (آخر يوم في الشهر) أو هو الشهر الحالي
        const isLastDayOfMonth = today.date() === monthDate.daysInMonth();
        const isMonthPassed = monthDate.isBefore(today, 'month');
        const isMonthDue = isMonthPassed || (monthDate.isSame(today, 'month') && isLastDayOfMonth);

        // التحقق مما إذا كان العامل قد بدأ العمل قبل هذا الشهر
        const hasStarted = !employee.serviceStartDate || moment(employee.serviceStartDate).isBefore(monthDate, 'month');

        // التحقق مما إذا كان العامل لا يزال يعمل في هذا الشهر
        const isStillWorking = !employee.serviceEndDate || moment(employee.serviceEndDate).isAfter(monthDate, 'month');

        const isPaid = paidMonthsMap[monthStr];

        // يمكن دفع الراتب لأي شهر طالما أن العامل قد بدأ العمل وما زال يعمل
        // بغض النظر عن تاريخ الشهر (يمكن دفع راتب مقدم)
        const canPaySalary = hasStarted && isStillWorking;

        // الراتب مستحق إذا كان آخر يوم في الشهر أو الشهر قد انتهى أو تم تأكيد الدفع
        const isSalaryDue = (isMonthDue || isPaid) && canPaySalary;

        let statusText = '-';
        let statusClass = '';
        let bgClass = '';
        let badgeClass = '';

        if (canPaySalary) {
            if (isPaid) {
                statusText = 'تم الدفع';
                statusClass = 'text-white';
                bgClass = 'bg-success-subtle';
                badgeClass = 'bg-success text-white';
            } else if (isMonthDue) {
                statusText = 'مستحق';
                statusClass = 'text-warning';
                bgClass = 'bg-warning-subtle';
                badgeClass = 'bg-warning text-dark';
            } else if (monthDate.isSame(today, 'month')) {
                statusText = 'الشهر الحالي';
                statusClass = 'text-info';
                bgClass = 'bg-info-subtle';
                badgeClass = 'bg-info text-white';
            } else if (monthDate.isAfter(today, 'month')) {
                statusText = 'راتب مقدم';
                statusClass = 'text-primary';
                bgClass = 'bg-primary-subtle';
                badgeClass = 'bg-primary text-white';
            } else {
                statusText = 'غير مدفوع';
                statusClass = 'text-danger';
                bgClass = 'bg-danger-subtle';
                badgeClass = 'bg-danger text-white';
            }
        }

        // دائماً نعرض زر الدفع إذا كان العامل قد بدأ العمل وما زال يعمل
        const showPaymentToggle = canPaySalary;

        salaryTableHtml += `<td class="${bgClass}">
            <div class="d-flex flex-column align-items-center py-1">
                <span class="badge ${badgeClass} mb-1">${statusText}</span>
                ${showPaymentToggle ? `
                <div class="payment-toggle-container">
                    <button type="button"
                        class="btn btn-sm ${isPaid ? 'btn-success' : 'btn-outline-danger'} payment-toggle-btn"
                        id="salary-btn-${employeeIdString}-${monthStr}"
                        onclick="event.preventDefault(); event.stopPropagation(); toggleSalaryPayment('${employeeIdString}', '${monthStr}', ${!isPaid});">
                        ${isPaid ?
                            `<i class="bi bi-check-circle-fill"></i> تم الدفع` :
                            `<i class="bi bi-cash-coin"></i> دفع`}
                    </button>
                </div>` : ''}
            </div>
        </td>`;
    }
    salaryTableHtml += `</tr>`;

    salaryTableHtml += `</tbody></table></div>`;

    modalBody.innerHTML = `
        <!-- بطاقة المعلومات الأساسية -->
        <div class="card shadow-sm mb-3 border-0 rounded-3">
            <div class="card-header bg-primary py-2">
                <h5 class="mb-0 text-dark"><i class="bi bi-person-vcard-fill me-2"></i>المعلومات الأساسية</h5>
            </div>
            <div class="card-body p-2">
                <div class="row g-2">
                    <div class="col-md-6">
                        <div class="d-flex align-items-center mb-2">
                            <div class="bg-primary text-white rounded-circle p-2 me-2" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                <i class="bi bi-person-fill"></i>
                            </div>
                            <div>
                                <div class="text-muted small">الاسم</div>
                                <div class="h6 mb-0 fw-bold">${employee.name || '-'}</div>
                            </div>
                        </div>
                        <div class="d-flex align-items-center mb-2">
                            <div class="bg-secondary text-white rounded-circle p-2 me-2" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                <i class="bi bi-briefcase-fill"></i>
                            </div>
                            <div>
                                <div class="text-muted small">نوع العمل</div>
                                <div class="h6 mb-0 fw-bold">${employee.workType || '-'}</div>
                            </div>
                        </div>
                        <div class="d-flex align-items-center mb-2">
                            <div class="bg-success text-white rounded-circle p-2 me-2" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                <i class="bi bi-cash-coin"></i>
                            </div>
                            <div>
                                <div class="text-muted small">الراتب</div>
                                <div class="h6 mb-0 fw-bold arabic-numbers">${(employee.salary || 0).toLocaleString('ar-SA')} ريال</div>
                            </div>
                        </div>
                        <div class="d-flex align-items-center">
                            <div class="bg-info text-white rounded-circle p-2 me-2" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                <i class="bi bi-telephone-fill"></i>
                            </div>
                            <div>
                                <div class="text-muted small">الجوال</div>
                                <div class="h6 mb-0 fw-bold arabic-numbers">${employee.phone || '-'}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="d-flex align-items-center mb-2">
                            <div class="bg-dark text-white rounded-circle p-2 me-2" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                <i class="bi bi-geo-alt-fill"></i>
                            </div>
                            <div>
                                <div class="text-muted small">عنوان السكن</div>
                                <div class="h6 mb-0 fw-bold">${employee.homeAddress || '-'}</div>
                            </div>
                        </div>
                        <div class="d-flex align-items-center mb-2">
                            <div class="bg-secondary text-white rounded-circle p-2 me-2" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                <i class="bi bi-person-fill"></i>
                            </div>
                            <div>
                                <div class="text-muted small">اسم القريب</div>
                                <div class="h6 mb-0 fw-bold">${employee.relativeName || '-'}</div>
                            </div>
                        </div>
                        <div class="d-flex align-items-center">
                            <div class="bg-secondary text-white rounded-circle p-2 me-2" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                <i class="bi bi-credit-card-fill"></i>
                            </div>
                            <div>
                                <div class="text-muted small">حساب القريب</div>
                                <div class="h6 mb-0 fw-bold arabic-numbers">${employee.relativeAccount || '-'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- بطاقة معلومات الوثائق -->
        <div class="row g-2 mb-3">
            <div class="col-md-6">
                <div class="card shadow-sm h-100 border-0 rounded-3">
                    <div class="card-header bg-info py-2">
                        <h5 class="mb-0 text-dark"><i class="bi bi-passport-fill me-2"></i>معلومات الجواز</h5>
                    </div>
                    <div class="card-body p-2">
                        <div class="mb-2">
                            <div class="text-muted small">الرقم</div>
                            <div class="h6 mb-0 fw-bold arabic-numbers">${employee.passportNumber || '-'}</div>
                        </div>
                        <div class="mb-2">
                            <div class="text-muted small">تاريخ الانتهاء</div>
                            <div class="h6 mb-0 fw-bold">${formatDate(employee.passportExpiry) || '-'}</div>
                        </div>
                        <div class="alert ${getStatusClass(passportStatus)} p-2 mb-0">
                            <i class="bi bi-clock-history me-2"></i>
                            <strong>الحالة:</strong> ${passportStatus.text}
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card shadow-sm h-100 border-0 rounded-3">
                    <div class="card-header bg-warning py-2">
                        <h5 class="mb-0 text-dark"><i class="bi bi-card-heading me-2"></i>معلومات الإقامة</h5>
                    </div>
                    <div class="card-body p-2">
                        <div class="mb-2">
                            <div class="text-muted small">الرقم</div>
                            <div class="h6 mb-0 fw-bold arabic-numbers">${employee.iqamaNumber || '-'}</div>
                        </div>
                        <div class="mb-2">
                            <div class="text-muted small">تاريخ الانتهاء</div>
                            <div class="h6 mb-0 fw-bold">${formatDate(employee.iqamaExpiry) || '-'}</div>
                        </div>
                        <div class="alert ${getStatusClass(iqamaStatus)} p-2 mb-0">
                            <i class="bi bi-clock-history me-2"></i>
                            <strong>الحالة:</strong> ${iqamaStatus.text}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- بطاقة معلومات الخدمة -->
        <div class="card shadow-sm mb-3 border-0 rounded-3">
            <div class="card-header bg-success py-2">
                <h5 class="mb-0 text-dark"><i class="bi bi-calendar-check-fill me-2"></i>معلومات الخدمة</h5>
            </div>
            <div class="card-body p-2">
                <div class="row g-2">
                    <div class="col-md-4">
                        <div class="text-muted small">تاريخ البداية</div>
                        <div class="h6 mb-0 fw-bold">${formatDate(employee.serviceStartDate) || '-'}</div>
                    </div>
                    <div class="col-md-4">
                        <div class="text-muted small">المدة</div>
                        <div class="h6 mb-0 fw-bold">${durationText}</div>
                    </div>
                    <div class="col-md-4">
                        <div class="text-muted small">تاريخ النهاية (المحسوب)</div>
                        <div class="h6 mb-0 fw-bold">${formatDate(employee.serviceEndDate) || '-'}</div>
                    </div>
                    <div class="col-12">
                        <div class="alert ${getStatusClass(serviceStatus)} p-2 mb-0">
                            <i class="bi bi-clock-history me-2"></i>
                            <strong>حالة الخدمة:</strong> ${serviceStatus.text}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- بطاقة مسير الراتب -->
        <div class="card shadow-sm mb-3 border-0 rounded-3">
            <div class="card-header bg-primary py-2">
                <h5 class="mb-0 text-dark"><i class="bi bi-cash-stack me-2"></i>مسير الراتب لسنة ${currentYear}</h5>
            </div>
            <div class="card-body p-0">
                ${salaryTableHtml.replace('<h5 class="mt-4"><i class="bi bi-calendar3 me-2 text-info"></i>مسير الراتب لسنة ' + currentYear + '</h5>', '')}
            </div>
        </div>
    `;

    const detailsModalElement = document.getElementById('employeeDetailsModal');
    if (detailsModalElement) {
        const detailsModal = bootstrap.Modal.getInstance(detailsModalElement) || new bootstrap.Modal(detailsModalElement);
        detailsModal.show();
    } else {
        console.error("Modal element #employeeDetailsModal not found for showing.");
    }
}

function createEmployeeDetailsModal() {
    if (document.getElementById('employeeDetailsModal')) return;
    const modalHTML = `
    <div class="modal fade" id="employeeDetailsModal" tabindex="-1" aria-labelledby="employeeDetailsModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content shadow-lg border-0">
          <div class="modal-header bg-primary text-white py-2">
            <h5 class="modal-title" id="employeeDetailsModalLabel">
                <i class="bi bi-person-badge-fill me-2"></i>تفاصيل العامل
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-3" id="employeeDetailsModalBody" style="font-size: 0.9rem; background-color: #f8f9fa;">
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2">جاري تحميل التفاصيل...</p>
            </div>
          </div>
          <div class="modal-footer justify-content-start flex-wrap py-2">
            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="printEmployeeDetails()">
                <i class="bi bi-printer-fill me-1"></i>طباعة
            </button>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="exportEmployeeDetailsPDF()">
                <i class="bi bi-file-earmark-pdf-fill me-1"></i>تصدير PDF
            </button>
            <button type="button" class="btn btn-sm btn-outline-success" onclick="shareEmployeeDetails('whatsapp')">
                <i class="bi bi-whatsapp me-1"></i>واتساب
            </button>
            <button type="button" class="btn btn-sm btn-outline-info" onclick="shareEmployeeDetails('telegram')">
                <i class="bi bi-telegram me-1"></i>تليجرام
            </button>
            <button type="button" class="btn btn-sm btn-outline-primary" onclick="shareEmployeeDetails('email')">
                <i class="bi bi-envelope-fill me-1"></i>ايميل
            </button>
            <button type="button" class="btn btn-secondary btn-sm ms-auto" data-bs-dismiss="modal">
                <i class="bi bi-x-circle me-1"></i>إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('Employee details modal created dynamically.');
}

// دالة لعرض نموذج إضافة إيداع جديد
function showAddDepositForm(memberId) {
    const memberIdString = String(memberId);
    const member = members.find(m => m.id === memberIdString);
    if (!member) {
        showAlert('danger', 'لم يتم العثور على العضو.');
        return;
    }

    // إنشاء نموذج إضافة إيداع
    const modalHTML = `
    <div class="modal fade" id="addDepositModal" tabindex="-1" aria-labelledby="addDepositModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow-lg border-0">
          <div class="modal-header bg-success text-white py-2">
            <h5 class="modal-title" id="addDepositModalLabel">
                <i class="bi bi-cash-stack me-2"></i>إضافة إيداع جديد
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-3">
            <form id="quick-deposit-form">
                <input type="hidden" id="quick-deposit-member-id" value="${memberIdString}">
                <div class="mb-3">
                    <label class="form-label fw-bold">العضو</label>
                    <div class="form-control bg-light">${member.name}</div>
                </div>
                <div class="mb-3">
                    <label for="quick-deposit-amount" class="form-label fw-bold">المبلغ</label>
                    <input type="number" step="0.01" class="form-control" id="quick-deposit-amount" required>
                </div>
                <div class="mb-3">
                    <label for="quick-deposit-date" class="form-label fw-bold">تاريخ الإيداع</label>
                    <input type="date" class="form-control" id="quick-deposit-date" value="${moment().format('YYYY-MM-DD')}" required>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="quick-deposit-bank" class="form-label fw-bold">البنك</label>
                        <input type="text" class="form-control" id="quick-deposit-bank">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="quick-deposit-method" class="form-label fw-bold">طريقة الإيداع</label>
                        <input type="text" class="form-control" id="quick-deposit-method">
                    </div>
                </div>
                <div class="mb-3">
                    <label for="quick-deposit-notes" class="form-label fw-bold">ملاحظات</label>
                    <textarea class="form-control" id="quick-deposit-notes" rows="2"></textarea>
                </div>
            </form>
          </div>
          <div class="modal-footer py-2">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                <i class="bi bi-x-circle me-1"></i>إلغاء
            </button>
            <button type="button" class="btn btn-success" onclick="saveQuickDeposit()">
                <i class="bi bi-save-fill me-1"></i>حفظ الإيداع
            </button>
          </div>
        </div>
      </div>
    </div>`;

    // إضافة النموذج إلى الصفحة
    if (document.getElementById('addDepositModal')) {
        document.getElementById('addDepositModal').remove();
    }
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // عرض النموذج
    const modal = new bootstrap.Modal(document.getElementById('addDepositModal'));
    modal.show();
}

// دالة لحفظ الإيداع الجديد
function saveQuickDeposit() {
    const memberId = document.getElementById('quick-deposit-member-id').value;
    const amount = parseFloat(document.getElementById('quick-deposit-amount').value);
    const transferDate = document.getElementById('quick-deposit-date').value;
    const bank = document.getElementById('quick-deposit-bank').value;
    const transferMethod = document.getElementById('quick-deposit-method').value;
    const notes = document.getElementById('quick-deposit-notes').value;

    if (!memberId || !transferDate || !amount || amount <= 0) {
        showAlert('danger', 'الرجاء إدخال المبلغ وتاريخ الإيداع بشكل صحيح.');
        return;
    }

    // إنشاء إيداع جديد
    const transaction = {
        id: Date.now().toString(),
        memberId: String(memberId),
        amount,
        transferDate,
        bank,
        transferMethod,
        notes
    };

    // إضافة الإيداع إلى قائمة الإيداعات
    transactions.push(transaction);

    // حفظ البيانات
    if (saveTransactions()) {
        try {
            // إغلاق النموذج
            const modal = bootstrap.Modal.getInstance(document.getElementById('addDepositModal'));
            if (modal) {
                modal.hide();

                // إزالة النموذج من DOM بعد إغلاقه
                document.getElementById('addDepositModal').addEventListener('hidden.bs.modal', function() {
                    this.remove();
                });
            }

            // تحديث واجهة المستخدم
            updateDashboardSummary();
            displayMembers(); // تحديث قائمة الأعضاء

            // تحديث تفاصيل العضو إذا كانت النافذة مفتوحة
            const memberDetailsModal = document.getElementById('memberDetailsModal');
            if (memberDetailsModal && memberDetailsModal.classList.contains('show')) {
                showMemberDetails(memberId);
            }

            showAlert('success', 'تم تسجيل الإيداع بنجاح');
        } catch (error) {
            console.error('حدث خطأ أثناء تحديث واجهة المستخدم:', error);
        }
    }
}
