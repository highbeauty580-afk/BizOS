import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Employee } from '../types';

export const HRPage: React.FC = () => {
  const { language, themeConfig, employees, addEmployee, updateEmployee, deleteEmployee } = useApp();

  const isRtl = language === 'ar';

  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [department, setDepartment] = useState('Operations');
  const [departmentAr, setDepartmentAr] = useState('العمليات والإنتاج');
  const [directManagerId, setDirectManagerId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Grouping for Tree view
  const rootEmployees = employees.filter((e) => !e.directManagerId);

  const getDirectReports = (managerId: string) => {
    return employees.filter((e) => e.directManagerId === managerId);
  };

  const handleOpenAdd = () => {
    setEditingEmp(null);
    setName('');
    setNameAr('');
    setTitle('');
    setTitleAr('');
    setDepartment('Operations');
    setDepartmentAr('العمليات والإنتاج');
    setDirectManagerId(rootEmployees[0]?.id || null);
    setEmail('');
    setPhone('');
    setShowModal(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setName(emp.name);
    setNameAr(emp.nameAr || '');
    setTitle(emp.title);
    setTitleAr(emp.titleAr || '');
    setDepartment(emp.department);
    setDepartmentAr(emp.departmentAr || '');
    setDirectManagerId(emp.directManagerId);
    setEmail(emp.email);
    setPhone(emp.phone);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !title.trim()) return;

    if (editingEmp) {
      updateEmployee(editingEmp.id, {
        name: name.trim(),
        nameAr: nameAr.trim() || undefined,
        title: title.trim(),
        titleAr: titleAr.trim() || undefined,
        department: department.trim(),
        departmentAr: departmentAr.trim() || undefined,
        directManagerId,
        email: email.trim(),
        phone: phone.trim(),
      });
    } else {
      addEmployee({
        name: name.trim(),
        nameAr: nameAr.trim() || undefined,
        title: title.trim(),
        titleAr: titleAr.trim() || undefined,
        department: department.trim(),
        departmentAr: departmentAr.trim() || undefined,
        directManagerId,
        email: email.trim(),
        phone: phone.trim(),
      });
    }

    setShowModal(false);
  };

  // Helper component to render an Employee Card in Tree
  const renderEmployeeNode = (emp: Employee, depth: number = 0) => {
    const reports = getDirectReports(emp.id);
    const manager = employees.find((m) => m.id === emp.directManagerId);

    return (
      <div key={emp.id} className="flex flex-col items-center">
        {/* Node Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all w-64 relative group border-t-4 border-t-indigo-600">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                {emp.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {isRtl && emp.nameAr ? emp.nameAr : emp.name}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold truncate">
                  {isRtl && emp.titleAr ? emp.titleAr : emp.title}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-[11px] text-slate-600 mb-3">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-slate-400">corporate_fare</span>
              <span className="font-medium text-indigo-900">
                {isRtl && emp.departmentAr ? emp.departmentAr : emp.department}
              </span>
            </div>
            {manager && (
              <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                <span className="material-symbols-outlined text-xs">arrow_upward</span>
                <span>
                  {isRtl ? 'المدير المباشر:' : 'Manager:'} {isRtl && manager.nameAr ? manager.nameAr : manager.name}
                </span>
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
            <span className="text-[10px] text-slate-400 font-mono">
              {reports.length} {isRtl ? 'مرؤوسين' : 'reports'}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleOpenEdit(emp)}
                className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                title={isRtl ? 'تعديل' : 'Edit'}
              >
                <span className="material-symbols-outlined text-base">edit</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm(isRtl ? 'حذف هذا الموظف؟' : 'Delete this employee?')) {
                    deleteEmployee(emp.id);
                  }
                }}
                className="p-1 text-slate-400 hover:text-red-600 rounded"
                title={isRtl ? 'حذف' : 'Delete'}
              >
                <span className="material-symbols-outlined text-base">delete</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tree Branch Connector Lines & Children */}
        {reports.length > 0 && (
          <div className="flex flex-col items-center w-full">
            {/* Vertical stem line down from parent */}
            <div className="w-0.5 h-6 bg-indigo-300" />

            {/* Horizontal branch line spanning children */}
            {reports.length > 1 && (
              <div className="w-3/4 h-0.5 bg-indigo-300 rounded-full my-0" />
            )}

            {/* Render children horizontally */}
            <div className="flex flex-wrap items-start justify-center gap-8 pt-4">
              {reports.map((child) => renderEmployeeNode(child, depth + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              {isRtl ? 'الهيكل الإداري والموظفين' : 'Organizational Management'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isRtl ? 'صفحة الموارد البشرية — الهيكل التنظيمي الهرمي' : 'Human Resources — Hierarchical Org Chart'}
          </h1>
          <p className="text-xs text-slate-500">
            {isRtl
              ? 'مخطط تنظيمي على هيئة شجرة هرمية لإضافة الموظفين وتحديد المدير المباشر والعلاقات الإدارية.'
              : 'Interactive tree organizational chart to add team members, assign direct managers, and map reporting structures.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'tree' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-sm">schema</span>
              <span>{isRtl ? 'مخطط الشجرة' : 'Tree Chart'}</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-sm">table_rows</span>
              <span>{isRtl ? 'جدول الموظفين' : 'Directory Table'}</span>
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
            style={{ backgroundColor: themeConfig.primary }}
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            <span>{isRtl ? '+ إضافة موظف جديد' : '+ Add Employee'}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: TREE ORG CHART */}
      {viewMode === 'tree' ? (
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto min-h-[500px]">
          {rootEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-2">schema</span>
              <span className="text-sm font-bold text-slate-600">
                {isRtl ? 'لا يوجد موظفين في الهيكل التنظيمي' : 'No Employees in Org Chart'}
              </span>
              <button onClick={handleOpenAdd} className="mt-2 text-xs font-bold text-indigo-600 hover:underline">
                {isRtl ? '+ إضافة المدير العام أولاً' : '+ Add General Manager First'}
              </button>
            </div>
          ) : (
            <div className="flex justify-center items-center py-6 min-w-max">
              {rootEmployees.map((rootEmp) => renderEmployeeNode(rootEmp))}
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2: TABLE DIRECTORY */
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-4 rounded-l-lg">{isRtl ? 'اسم الموظف' : 'Employee Name'}</th>
                  <th className="py-2.5 px-4">{isRtl ? 'المسمى الوظيفي' : 'Job Title'}</th>
                  <th className="py-2.5 px-4">{isRtl ? 'القسم' : 'Department'}</th>
                  <th className="py-2.5 px-4">{isRtl ? 'المدير المباشر' : 'Direct Manager'}</th>
                  <th className="py-2.5 px-4">{isRtl ? 'التواصل' : 'Contact'}</th>
                  <th className="py-2.5 px-4 text-center rounded-r-lg">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {employees.map((emp) => {
                  const manager = employees.find((m) => m.id === emp.directManagerId);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {isRtl && emp.nameAr ? emp.nameAr : emp.name}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {isRtl && emp.titleAr ? emp.titleAr : emp.title}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {isRtl && emp.departmentAr ? emp.departmentAr : emp.department}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {manager ? (isRtl && manager.nameAr ? manager.nameAr : manager.name) : (isRtl ? 'رئيس الإدارة' : 'Top Level')}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {emp.email} • {emp.phone}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(isRtl ? 'حذف الموظف؟' : 'Delete employee?')) {
                                deleteEmployee(emp.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT EMPLOYEE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingEmp
                  ? isRtl
                    ? 'تعديل بيانات الموظف'
                    : 'Edit Employee Details'
                  : isRtl
                  ? 'إضافة موظف جديد للهيكل'
                  : 'Add New Employee'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs font-medium">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'الاسم (بالإنكليزية)' : 'Full Name (English)'}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sara Alvarez"
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'الاسم (بالعربية)' : 'Full Name (Arabic)'}</label>
                  <input
                    type="text"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="مثال: سارة الفارس"
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'المسمى الوظيفي (بالإنكليزية)' : 'Job Title (English)'}</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Head of Operations"
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'المسمى الوظيفي (بالعربية)' : 'Job Title (Arabic)'}</label>
                  <input
                    type="text"
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    placeholder="مثال: مديرة العمليات والإنتاج"
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'القسم' : 'Department'}</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Operations, Finance, Marketing..."
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'المدير المباشر' : 'Direct Manager'}</label>
                  <select
                    value={directManagerId || ''}
                    onChange={(e) => setDirectManagerId(e.target.value || null)}
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">{isRtl ? 'لا يوجد (الرئيس التنفيذي / الإدارة العليا)' : 'None (Top Level / Executive)'}</option>
                    {employees
                      .filter((e) => !editingEmp || e.id !== editingEmp.id)
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {isRtl && e.nameAr ? e.nameAr : e.name} ({isRtl && e.titleAr ? e.titleAr : e.title})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sara@mybiz.com"
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'رقم الهاتف' : 'Phone'}</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+966 50 123 4567"
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow-sm"
                  style={{ backgroundColor: themeConfig.primary }}
                >
                  {editingEmp ? (isRtl ? 'حفظ التغييرات' : 'Save Details') : (isRtl ? 'إضافة الموظف' : 'Add Employee')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
