import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OperationStep, StepStatus } from '../types';

export const OperationsPage: React.FC = () => {
  const { language, themeConfig, operationSteps, addStep, updateStep, deleteStep, reorderStep } = useApp();

  const isRtl = language === 'ar';

  const [filterStatus, setFilterStatus] = useState<'all' | StepStatus>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStep, setEditingStep] = useState<OperationStep | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    assignedTo: '',
    duration: '',
    category: 'Production',
    status: 'pending' as StepStatus,
  });

  const filteredSteps = operationSteps.filter((step) => {
    if (filterStatus === 'all') return true;
    return step.status === filterStatus;
  });

  const handleOpenAdd = () => {
    setEditingStep(null);
    setFormData({
      title: '',
      titleAr: '',
      description: '',
      descriptionAr: '',
      assignedTo: '',
      duration: '1 hour',
      category: 'Production',
      status: 'pending',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (step: OperationStep) => {
    setEditingStep(step);
    setFormData({
      title: step.title,
      titleAr: step.titleAr || '',
      description: step.description,
      descriptionAr: step.descriptionAr || '',
      assignedTo: step.assignedTo,
      duration: step.duration,
      category: step.category,
      status: step.status,
    });
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingStep) {
      updateStep(editingStep.id, {
        title: formData.title.trim(),
        titleAr: formData.titleAr.trim() || undefined,
        description: formData.description.trim(),
        descriptionAr: formData.descriptionAr.trim() || undefined,
        assignedTo: formData.assignedTo.trim() || 'Team',
        duration: formData.duration.trim() || '1 hour',
        category: formData.category,
        status: formData.status,
      });
    } else {
      addStep({
        title: formData.title.trim(),
        titleAr: formData.titleAr.trim() || undefined,
        description: formData.description.trim(),
        descriptionAr: formData.descriptionAr.trim() || undefined,
        assignedTo: formData.assignedTo.trim() || 'Team',
        duration: formData.duration.trim() || '1 hour',
        category: formData.category,
        status: formData.status,
      });
    }

    setShowAddModal(false);
  };

  const handleToggleStatus = (step: OperationStep) => {
    const nextStatus: Record<StepStatus, StepStatus> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'pending',
    };
    updateStep(step.id, { status: nextStatus[step.status] });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              {isRtl ? 'إدارة خطوط الإنتاج والتقديم' : 'Production & Service Line'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isRtl ? 'صفحة التشغيل والإنتاج — مسار العمل المتعرج' : 'Operations & Production — Connected Zigzag Path'}
          </h1>
          <p className="text-xs text-slate-500">
            {isRtl
              ? 'خط سير العمل المرن المتصل لحقن خطوات الإنتاج وإعادة ترتيبها وتحديد مسؤوليات التنفيذ.'
              : 'Interactive connected workflow line to add, reorder, assign, and track production phases.'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
          style={{ backgroundColor: themeConfig.primary }}
        >
          <span className="material-symbols-outlined text-lg">add_task</span>
          <span>{isRtl ? '+ إضافة خطوة عمل جديدة' : '+ Add Workflow Step'}</span>
        </button>
      </div>

      {/* Filter Segmented Control */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {(['all', 'completed', 'in_progress', 'pending'] as const).map((st) => {
            const labelsEn: Record<string, string> = {
              all: 'All Steps',
              completed: 'Completed',
              in_progress: 'In Progress',
              pending: 'Pending',
            };
            const labelsAr: Record<string, string> = {
              all: 'جميع الخطوات',
              completed: 'المكتملة',
              in_progress: 'قيد التنفيذ',
              pending: 'المعلقة',
            };
            const isActive = filterStatus === st;

            return (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isRtl ? labelsAr[st] : labelsEn[st]}
              </button>
            );
          })}
        </div>

        <div className="text-xs font-semibold text-slate-500 px-2">
          {isRtl ? `إجمالي الخطوات: ${operationSteps.length}` : `Total Steps: ${operationSteps.length}`}
        </div>
      </div>

      {/* VISUAL CONNECTED ZIGZAG WORKFLOW PATH (المسار المتعرج المتصل) */}
      <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden min-h-[500px]">
        {filteredSteps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-2">route</span>
            <span className="text-sm font-bold text-slate-600">
              {isRtl ? 'لا توجد خطوات عمل مطابقة' : 'No Workflow Steps Found'}
            </span>
            <button
              onClick={handleOpenAdd}
              className="mt-3 text-xs font-bold text-indigo-600 hover:underline"
            >
              {isRtl ? '+ إضافة خطوة الآن' : '+ Add a Step Now'}
            </button>
          </div>
        ) : (
          <div className="relative max-w-4xl mx-auto py-6">
            {/* Visual Connected Zigzag Background Path Line */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-slate-200/80 hidden md:block rounded-full z-0" />

            <div className="flex flex-col gap-12 relative z-10">
              {filteredSteps.map((step, index) => {
                const isEven = index % 2 === 0;
                const statusStyles: Record<StepStatus, { bg: string; text: string; border: string; badge: string; badgeAr: string }> = {
                  completed: {
                    bg: 'bg-emerald-500',
                    text: 'text-emerald-700',
                    border: 'border-emerald-200',
                    badge: 'Completed',
                    badgeAr: 'مكتملة',
                  },
                  in_progress: {
                    bg: 'bg-amber-500',
                    text: 'text-amber-700',
                    border: 'border-amber-200',
                    badge: 'In Progress',
                    badgeAr: 'قيد التنفيذ',
                  },
                  pending: {
                    bg: 'bg-slate-400',
                    text: 'text-slate-600',
                    border: 'border-slate-200',
                    badge: 'Pending',
                    badgeAr: 'معلقة',
                  },
                };

                const currentStyle = statusStyles[step.status];

                return (
                  <div
                    key={step.id}
                    className={`flex flex-col md:flex-row items-center gap-6 ${
                      isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                  >
                    {/* STEP CARD */}
                    <div className="flex-1 w-full">
                      <div className="bg-slate-50/90 hover:bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-sm transition-all group relative">
                        {/* Top Header Row inside Card */}
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono px-2 py-0.5 bg-slate-200 text-slate-800 rounded-md">
                              {step.stepNumber < 10 ? `0${step.stepNumber}` : step.stepNumber}
                            </span>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                              {step.category}
                            </span>
                          </div>

                          {/* Status Badge - Click to toggle */}
                          <button
                            onClick={() => handleToggleStatus(step)}
                            title={isRtl ? 'انقر لتغيير الحالة' : 'Click to toggle status'}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${currentStyle.border} bg-white flex items-center gap-1.5 cursor-pointer hover:shadow-xs transition-shadow`}
                          >
                            <span className={`w-2 h-2 rounded-full ${currentStyle.bg}`} />
                            <span className={currentStyle.text}>
                              {isRtl ? currentStyle.badgeAr : currentStyle.badge}
                            </span>
                          </button>
                        </div>

                        {/* Title & Description */}
                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {isRtl && step.titleAr ? step.titleAr : step.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {isRtl && step.descriptionAr ? step.descriptionAr : step.description}
                        </p>

                        {/* Metadata Footer */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-200/60 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                            <span className="font-medium text-slate-700">{step.assignedTo}</span>
                          </div>

                          <div className="flex items-center gap-1 bg-slate-200/60 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700 font-mono">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            <span>{step.duration}</span>
                          </div>
                        </div>

                        {/* Action Buttons Toolbar */}
                        <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => reorderStep(step.id, 'up')}
                            disabled={step.stepNumber === 1}
                            title={isRtl ? 'تحريك للأعلى' : 'Move Up'}
                            className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400"
                          >
                            <span className="material-symbols-outlined text-base">arrow_upward</span>
                          </button>
                          <button
                            onClick={() => reorderStep(step.id, 'down')}
                            disabled={step.stepNumber === operationSteps.length}
                            title={isRtl ? 'تحريك للأسفل' : 'Move Down'}
                            className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400"
                          >
                            <span className="material-symbols-outlined text-base">arrow_downward</span>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(step)}
                            title={isRtl ? 'تعديل' : 'Edit'}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(isRtl ? 'هل أنت تأكد من حذف هذه الخطوة؟' : 'Delete this step?')) {
                                deleteStep(step.id);
                              }
                            }}
                            title={isRtl ? 'حذف' : 'Delete'}
                            className="p-1 rounded text-slate-400 hover:text-red-600"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ZIGZAG CENTER NODE CIRCLE */}
                    <div className="relative z-20 flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full border-4 border-white shadow-md flex items-center justify-center font-bold font-mono text-sm text-white ${currentStyle.bg} transition-transform duration-200 hover:scale-110`}
                      >
                        {step.stepNumber}
                      </div>
                    </div>

                    {/* BALANCING EMPTY SPACE FOR ZIGZAG ALIGNMENT */}
                    <div className="flex-1 hidden md:block" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT STEP MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingStep
                  ? isRtl
                    ? 'تعديل خطوة العمل'
                    : 'Edit Workflow Step'
                  : isRtl
                  ? 'إضافة خطوة عمل جديدة'
                  : 'Add New Workflow Step'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs font-medium">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'العنوان (بالإنكليزية)' : 'Step Title (English)'}</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Quality Inspection"
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'العنوان (بالعربية)' : 'Step Title (Arabic)'}</label>
                  <input
                    type="text"
                    value={formData.titleAr}
                    onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                    placeholder="مثال: فحص الجودة والمطابقة"
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'الوصف (بالإنكليزية)' : 'Description (English)'}</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed task description..."
                    className="p-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'الوصف (بالعربية)' : 'Description (Arabic)'}</label>
                  <textarea
                    rows={2}
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    placeholder="وصف وتفاصيل المهام في هذه المرحلة..."
                    className="p-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'المسؤول' : 'Assigned To'}</label>
                  <input
                    type="text"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    placeholder="e.g. QA Team"
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'المُدة المتوقعة' : 'Est. Duration'}</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g. 45 mins"
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'الحالة' : 'Status'}</label>
                  <select
                    value={formData.status}
                    onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="pending">{isRtl ? 'معلقة (Pending)' : 'Pending'}</option>
                    <option value="in_progress">{isRtl ? 'قيد التنفيذ (In Progress)' : 'In Progress'}</option>
                    <option value="completed">{isRtl ? 'مكتملة (Completed)' : 'Completed'}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow-sm"
                  style={{ backgroundColor: themeConfig.primary }}
                >
                  {editingStep ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'إضافة الخطوة' : 'Add Step')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
