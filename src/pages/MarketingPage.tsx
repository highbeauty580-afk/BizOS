import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MarketingMixP, BuyerPersona } from '../types';

export const MarketingPage: React.FC = () => {
  const {
    language,
    themeConfig,
    marketingMix,
    buyerPersona,
    updateMarketingP,
    updateBuyerPersona,
    clearMarketingData,
  } = useApp();

  const isRtl = language === 'ar';

  // 4Ps Edit Modal State
  const [editingP, setEditingP] = useState<MarketingMixP | null>(null);
  const [pDescriptionEn, setPDescriptionEn] = useState('');
  const [pDescriptionAr, setPDescriptionAr] = useState('');
  const [pBulletsText, setPBulletsText] = useState('');

  // Buyer Persona Edit Modal State
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [personaForm, setPersonaForm] = useState<BuyerPersona>(buyerPersona);
  const [demographicsText, setDemographicsText] = useState('');
  const [needsText, setNeedsText] = useState('');
  const [painsText, setPainsText] = useState('');
  const [channelsText, setChannelsText] = useState('');

  // Open 4P Edit Modal
  const handleOpenEditP = (p: MarketingMixP) => {
    setEditingP(p);
    setPDescriptionEn(p.descriptionEn || '');
    setPDescriptionAr(p.descriptionAr || '');
    setPBulletsText((p.bulletPoints || []).join('\n'));
  };

  const handleSaveP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingP) return;

    const bullets = pBulletsText
      .split('\n')
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    updateMarketingP(editingP.id, {
      descriptionEn: pDescriptionEn.trim(),
      descriptionAr: pDescriptionAr.trim(),
      bulletPoints: bullets,
    });

    setEditingP(null);
  };

  // Open Persona Edit Modal
  const handleOpenEditPersona = () => {
    setPersonaForm({ ...buyerPersona });
    setDemographicsText((buyerPersona.demographics || []).join('\n'));
    setNeedsText((buyerPersona.needsAndGoals || []).join('\n'));
    setPainsText((buyerPersona.motivationsAndPains || []).join('\n'));
    setChannelsText((buyerPersona.buyingChannels || []).join('\n'));
    setShowPersonaModal(true);
  };

  const handleSavePersona = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedPersona: BuyerPersona = {
      ...personaForm,
      demographics: demographicsText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
      needsAndGoals: needsText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
      motivationsAndPains: painsText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
      buyingChannels: channelsText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    };

    updateBuyerPersona(updatedPersona);
    setShowPersonaModal(false);
  };

  const handleClearData = () => {
    if (
      window.confirm(
        isRtl
          ? 'هل أنت تأكد من رغبتك في تفريغ ومسح كافة بيانات التسويق والشخصية المستهدفة؟'
          : 'Are you sure you want to clear all marketing mix & buyer persona data?'
      )
    ) {
      clearMarketingData();
    }
  };

  const hasPersonaData =
    buyerPersona.name ||
    buyerPersona.title ||
    buyerPersona.titleAr ||
    buyerPersona.age ||
    buyerPersona.gender ||
    buyerPersona.occupation ||
    buyerPersona.incomeLevel ||
    buyerPersona.profileDescription ||
    buyerPersona.profileDescriptionAr ||
    (buyerPersona.demographics && buyerPersona.demographics.length > 0) ||
    (buyerPersona.needsAndGoals && buyerPersona.needsAndGoals.length > 0) ||
    (buyerPersona.motivationsAndPains && buyerPersona.motivationsAndPains.length > 0) ||
    (buyerPersona.buyingChannels && buyerPersona.buyingChannels.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              {isRtl ? 'المزيج التسويقي وشخصية العميل' : 'Marketing Strategy & Customer Persona'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isRtl ? 'صفحة التسويق — المزيج التسويقي (4Ps) وشخصية العميل' : 'Marketing Page — 4Ps Mix & Buyer Persona'}
          </h1>
          <p className="text-xs text-slate-500">
            {isRtl
              ? 'تخصيص عناصر المزيج التسويقي الأربعة وتعديل بطاقة شخصية العميل المستهدف بالكامل بدون بيانات افتراضية.'
              : 'Customize the 4Ps marketing mix and fully edit your target buyer persona card with clean data.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleClearData}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title={isRtl ? 'مسح بيانات التسويق' : 'Clear Marketing Data'}
          >
            <span className="material-symbols-outlined text-base">delete_sweep</span>
            <span>{isRtl ? 'تفريغ البيانات' : 'Clear Data'}</span>
          </button>

          <button
            onClick={handleOpenEditPersona}
            className="px-4 py-2.5 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
            style={{ backgroundColor: themeConfig.primary }}
          >
            <span className="material-symbols-outlined text-lg">face</span>
            <span>{isRtl ? 'تعديل شخصية العميل (Persona)' : 'Edit Buyer Persona'}</span>
          </button>
        </div>
      </div>

      {/* TOP SECTION: THE 4Ps MARKETING MIX (أربعة مربعات) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600 text-xl">grid_view</span>
            <h2 className="text-base font-bold text-slate-900">
              {isRtl ? 'عناصر المزيج التسويقي الأربعة (4Ps Marketing Mix)' : 'The 4Ps Marketing Mix'}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {isRtl ? 'اضغط تعديل على أي عنصر لإدخال بياناتك' : 'Click edit icon to customize'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {marketingMix.map((p) => {
            const icons: Record<string, string> = {
              product: 'package_2',
              price: 'sell',
              place: 'storefront',
              promotion: 'campaign',
            };

            const hasDescription = isRtl ? Boolean(p.descriptionAr) : Boolean(p.descriptionEn);
            const hasBullets = p.bulletPoints && p.bulletPoints.length > 0;

            return (
              <div
                key={p.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between gap-4 hover:border-indigo-300 transition-all group"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">{icons[p.id]}</span>
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-sm font-bold text-slate-900">{isRtl ? p.titleAr : p.titleEn}</h3>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {isRtl ? p.subtitleAr : p.subtitleEn}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenEditP(p)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title={isRtl ? 'تعديل العنصر' : 'Edit Mix Element'}
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                  </div>

                  {hasDescription ? (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {isRtl ? p.descriptionAr : p.descriptionEn}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-200">
                      {isRtl
                        ? 'لا يوجد وصف مدخل بعد — اضغط تعديل لإدخال الاستراتيجية.'
                        : 'No description entered yet — click edit to add strategy.'}
                    </p>
                  )}

                  {hasBullets ? (
                    <div className="flex flex-col gap-1.5 pt-1">
                      {p.bulletPoints.map((bp, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                          <span className="leading-tight">{bp}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400">
                      {isRtl ? 'لم يتم إضافة نقاط تفصيلية' : 'No bullet points added'}
                    </div>
                  )}
                </div>

                <div className="text-[10px] font-mono text-slate-400 border-t border-slate-100 pt-2 flex items-center justify-between">
                  <span>{isRtl ? 'قابل للتحديث' : 'Editable Strategy'}</span>
                  <span className="text-indigo-600 font-bold">
                    {p.bulletPoints ? p.bulletPoints.length : 0} {isRtl ? 'نقاط' : 'points'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM SECTION: BUYER PERSONA CANVAS (شخصية العميل المستهدف) */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-indigo-600 text-2xl">person_search</span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isRtl ? 'بطاقة شخصية العميل المستهدف (Buyer Persona)' : 'Target Buyer Persona Canvas'}
              </h2>
              <p className="text-xs text-slate-500">
                {isRtl
                  ? 'تمثيل مرئي لشخصية العميل المستهدف وخصائصه ودوافعه وااحتياجاته الشراعية.'
                  : 'Detailed customer archetype representation with demographics, needs, pains, and buying habits.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenEditPersona}
              className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-1.5 rounded-xl border border-indigo-200 text-indigo-900 text-xs font-bold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-indigo-600">edit_note</span>
              <span>{buyerPersona.name || (isRtl ? 'حدد اسم العميل' : 'Set Persona Name')}</span>
              {(buyerPersona.titleAr || buyerPersona.title) && (
                <>
                  <span className="text-indigo-300">•</span>
                  <span className="font-normal text-indigo-700">
                    {isRtl && buyerPersona.titleAr ? buyerPersona.titleAr : buyerPersona.title}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Layout with Centered Human Silhouette Graphic + Surrounding Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* LEFT COLUMN: Demographics & Profile Description (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base">badge</span>
                  <span>{isRtl ? 'الخصائص الديموغرافية' : 'Demographics & Overview'}</span>
                </div>
                <button
                  onClick={handleOpenEditPersona}
                  className="text-[11px] text-indigo-600 hover:underline font-bold"
                >
                  {isRtl ? 'تعديل' : 'Edit'}
                </button>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400">{isRtl ? 'العمر:' : 'Age:'}</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {buyerPersona.age || (isRtl ? 'غير محدد' : 'Not set')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400">{isRtl ? 'الجنس:' : 'Gender:'}</span>
                  <span className="font-bold text-slate-900">
                    {buyerPersona.gender || (isRtl ? 'غير محدد' : 'Not set')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400">{isRtl ? 'الوظيفة / القطاع:' : 'Occupation:'}</span>
                  <span className="font-bold text-slate-900">
                    {buyerPersona.occupation || (isRtl ? 'غير محدد' : 'Not set')}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">{isRtl ? 'مستوى الدخل / الميزانية:' : 'Income / Budget:'}</span>
                  <span className="font-bold text-indigo-700">
                    {buyerPersona.incomeLevel || (isRtl ? 'غير محدد' : 'Not set')}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col gap-3 flex-1">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-base">description</span>
                <span>{isRtl ? 'الوصف الشامل والخلفية' : 'Profile Description'}</span>
              </div>

              {(isRtl && buyerPersona.profileDescriptionAr) || buyerPersona.profileDescription ? (
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {isRtl && buyerPersona.profileDescriptionAr
                    ? buyerPersona.profileDescriptionAr
                    : buyerPersona.profileDescription}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic bg-white p-3 rounded-xl border border-dashed border-slate-200">
                  {isRtl
                    ? 'لم يتم إضافة وصف شامل للعميل المستهدف بعد. اضغط على زر التعديل لكتابة وصف ودراسة حالة للعميل.'
                    : 'No profile description added yet. Click edit button to specify details.'}
                </p>
              )}

              {buyerPersona.demographics && buyerPersona.demographics.length > 0 ? (
                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    {isRtl ? 'صفات إضافية:' : 'Additional Traits:'}
                  </span>
                  {buyerPersona.demographics.map((demo, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>{demo}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* CENTER COLUMN: HUMAN SILHOUETTE VECTOR ARTWORK (4 Cols) */}
          <div className="lg:col-span-4 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 flex flex-col items-center justify-between text-white text-center shadow-lg relative overflow-hidden min-h-[380px] group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.2)_0,transparent_70%)] pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between w-full">
              <span className="text-[11px] uppercase tracking-widest font-mono text-indigo-300 font-bold">
                {isRtl ? 'صورة ظلية للعميل' : 'Target Silhouette'}
              </span>
              <button
                onClick={handleOpenEditPersona}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                <span>{isRtl ? 'تعديل' : 'Edit'}</span>
              </button>
            </div>

            {/* SVG Vector Human Silhouette Graphic */}
            <div className="relative z-10 py-4 my-auto flex flex-col items-center w-full">
              <div className="w-40 h-52 relative flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-full h-full text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                  stroke="currentColor"
                  strokeWidth="0.8"
                >
                  <path
                    d="M12 2a4 4 0 100 8 4 4 0 000-8zM12 11c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5z"
                    fill="currentColor"
                    fillOpacity="0.85"
                  />
                </svg>
              </div>

              <div className="mt-2 flex flex-col items-center gap-1 px-4 text-center">
                <span className="text-base font-bold text-white tracking-wide">
                  {buyerPersona.name || (isRtl ? 'العميل المستهدف' : 'Target Persona')}
                </span>
                <span className="text-xs text-indigo-200 font-medium">
                  {isRtl && buyerPersona.titleAr
                    ? buyerPersona.titleAr
                    : buyerPersona.title || (isRtl ? 'انقر لإدخال بيانات العميل' : 'Click edit to populate')}
                </span>
              </div>
            </div>

            <div className="relative z-10 w-full flex items-center justify-center">
              <button
                onClick={handleOpenEditPersona}
                className="px-4 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-full border border-white/20 text-xs text-indigo-100 font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-indigo-300">edit_attributes</span>
                <span>
                  {hasPersonaData
                    ? isRtl
                      ? 'تعديل بطاقة العميل الكاملة'
                      : 'Edit Full Persona Card'
                    : isRtl
                    ? '+ إضافة وتعديل شخصية العميل'
                    : '+ Add Persona Details'}
                </span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Needs, Pain Points & Channels (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Needs & Goals */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base">task_alt</span>
                  <span>{isRtl ? 'الاحتياجات والأهداف' : 'Needs & Key Goals'}</span>
                </div>
                <button
                  onClick={handleOpenEditPersona}
                  className="text-[11px] text-emerald-700 hover:underline font-bold"
                >
                  {isRtl ? 'تعديل' : 'Edit'}
                </button>
              </div>

              {buyerPersona.needsAndGoals && buyerPersona.needsAndGoals.length > 0 ? (
                <div className="flex flex-col gap-2 pt-1">
                  {buyerPersona.needsAndGoals.map((need, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="material-symbols-outlined text-sm text-emerald-600 mt-0.5 shrink-0">
                        check_circle
                      </span>
                      <span className="leading-tight">{need}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-2">
                  {isRtl ? 'لا توجد أهداف أو احتياجات شراعية مدخلة.' : 'No needs or goals defined yet.'}
                </p>
              )}
            </div>

            {/* Motivations & Pains */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base">warning</span>
                  <span>{isRtl ? 'الدوافع ونقاط الألم' : 'Motivations & Pain Points'}</span>
                </div>
                <button
                  onClick={handleOpenEditPersona}
                  className="text-[11px] text-amber-700 hover:underline font-bold"
                >
                  {isRtl ? 'تعديل' : 'Edit'}
                </button>
              </div>

              {buyerPersona.motivationsAndPains && buyerPersona.motivationsAndPains.length > 0 ? (
                <div className="flex flex-col gap-2 pt-1">
                  {buyerPersona.motivationsAndPains.map((pain, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="material-symbols-outlined text-sm text-amber-600 mt-0.5 shrink-0">
                        priority_high
                      </span>
                      <span className="leading-tight">{pain}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-2">
                  {isRtl ? 'لا توجد دوافع أو نقاط ألم مدخلة.' : 'No motivations or pains defined yet.'}
                </p>
              )}
            </div>

            {/* Buying Channels */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base">shopping_cart</span>
                  <span>{isRtl ? 'قنوات الشراء والوصول' : 'Buying & Contact Channels'}</span>
                </div>
                <button
                  onClick={handleOpenEditPersona}
                  className="text-[11px] text-indigo-700 hover:underline font-bold"
                >
                  {isRtl ? 'تعديل' : 'Edit'}
                </button>
              </div>

              {buyerPersona.buyingChannels && buyerPersona.buyingChannels.length > 0 ? (
                <div className="flex flex-col gap-2 pt-1">
                  {buyerPersona.buyingChannels.map((channel, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="material-symbols-outlined text-sm text-indigo-600 mt-0.5 shrink-0">
                        hub
                      </span>
                      <span className="leading-tight">{channel}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-2">
                  {isRtl ? 'لا توجد قنوات شراء أو تواصل مدخلة.' : 'No buying channels defined yet.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: EDIT 4P ELEMENT */}
      {editingP && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {isRtl ? `تعديل استراتيجية ${editingP.titleAr}` : `Edit ${editingP.titleEn}`}
              </h3>
              <button onClick={() => setEditingP(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveP} className="flex flex-col gap-4 text-xs font-medium">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">
                  {isRtl ? 'الوصف الأساسي (بالعربية)' : 'Description (Arabic)'}
                </label>
                <textarea
                  rows={2}
                  value={pDescriptionAr}
                  onChange={(e) => setPDescriptionAr(e.target.value)}
                  placeholder={isRtl ? 'أدخل وصف استراتيجية هذا العنصر...' : 'Enter strategy description...'}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">
                  {isRtl ? 'الوصف الأساسي (بالإنكليزية)' : 'Description (English)'}
                </label>
                <textarea
                  rows={2}
                  value={pDescriptionEn}
                  onChange={(e) => setPDescriptionEn(e.target.value)}
                  placeholder={isRtl ? 'الوصف بالإنكليزية (اختياري)...' : 'English description (optional)...'}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">
                  {isRtl ? 'النقاط الأساسية (كل نقطة في سطر منفصل)' : 'Bullet Points (One per line)'}
                </label>
                <textarea
                  rows={4}
                  value={pBulletsText}
                  onChange={(e) => setPBulletsText(e.target.value)}
                  placeholder={isRtl ? 'نقطة 1\nنقطة 2' : 'Point 1\nPoint 2'}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500 resize-y font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingP(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow-sm cursor-pointer"
                  style={{ backgroundColor: themeConfig.primary }}
                >
                  {isRtl ? 'حفظ التعديلات' : 'Save Strategy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT BUYER PERSONA */}
      {showPersonaModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-xl">face</span>
                <h3 className="text-base font-bold text-slate-900">
                  {isRtl ? 'تعديل بطاقة شخصية العميل (Buyer Persona)' : 'Edit Buyer Persona Details'}
                </h3>
              </div>
              <button onClick={() => setShowPersonaModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePersona} className="flex flex-col gap-4 text-xs font-medium">
              {/* Basic Details: Name & Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'اسم العميل المستهدف' : 'Persona Name'}</label>
                  <input
                    type="text"
                    value={personaForm.name || ''}
                    onChange={(e) => setPersonaForm({ ...personaForm, name: e.target.value })}
                    placeholder={isRtl ? 'مثال: أمل أحمد / شركة الأمل' : 'e.g. Sarah Smith'}
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'المسمى الوظيفي / الصفة (بالعربية)' : 'Title (Arabic)'}</label>
                  <input
                    type="text"
                    value={personaForm.titleAr || ''}
                    onChange={(e) => setPersonaForm({ ...personaForm, titleAr: e.target.value })}
                    placeholder={isRtl ? 'مثال: مديرة مشتريات / صاحب عمل' : 'e.g. Purchasing Manager'}
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">{isRtl ? 'المسمى الوظيفي / الصفة (بالإنكليزية)' : 'Title (English)'}</label>
                <input
                  type="text"
                  value={personaForm.title || ''}
                  onChange={(e) => setPersonaForm({ ...personaForm, title: e.target.value })}
                  placeholder={isRtl ? 'English Title (Optional)' : 'e.g. Operations Director'}
                  className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Demographics: Age, Gender, Occupation, Income */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'العمر' : 'Age Range'}</label>
                  <input
                    type="text"
                    value={personaForm.age || ''}
                    onChange={(e) => setPersonaForm({ ...personaForm, age: e.target.value })}
                    placeholder={isRtl ? '30-45 سنة' : '30-45'}
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'الجنس' : 'Gender'}</label>
                  <input
                    type="text"
                    value={personaForm.gender || ''}
                    onChange={(e) => setPersonaForm({ ...personaForm, gender: e.target.value })}
                    placeholder={isRtl ? 'ذكر / أنثى' : 'Male / Female'}
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'الوظيفة' : 'Occupation'}</label>
                  <input
                    type="text"
                    value={personaForm.occupation || ''}
                    onChange={(e) => setPersonaForm({ ...personaForm, occupation: e.target.value })}
                    placeholder={isRtl ? 'قطاع تجاري' : 'Business'}
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">{isRtl ? 'الميزانية' : 'Budget'}</label>
                  <input
                    type="text"
                    value={personaForm.incomeLevel || ''}
                    onChange={(e) => setPersonaForm({ ...personaForm, incomeLevel: e.target.value })}
                    placeholder={isRtl ? 'مرتفعة' : 'High'}
                    className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              {/* Profile Descriptions */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">{isRtl ? 'الوصف الشامل وخلفية العميل (بالعربية)' : 'Profile Description (Arabic)'}</label>
                <textarea
                  rows={2}
                  value={personaForm.profileDescriptionAr || ''}
                  onChange={(e) => setPersonaForm({ ...personaForm, profileDescriptionAr: e.target.value })}
                  placeholder={isRtl ? 'اكتب نبذة عن العميل وطريقة تفكيره واحتياجات منشأته...' : 'Describe customer background...'}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">{isRtl ? 'الوصف الشامل (بالإنكليزية)' : 'Profile Description (English)'}</label>
                <textarea
                  rows={2}
                  value={personaForm.profileDescription || ''}
                  onChange={(e) => setPersonaForm({ ...personaForm, profileDescription: e.target.value })}
                  placeholder={isRtl ? 'الوصف بالإنكليزية (اختياري)...' : 'English profile description...'}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Demographics Traits list */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">
                  {isRtl ? 'خصائص ديموغرافية إضافية (كل نقطة في سطر)' : 'Demographics Traits (One per line)'}
                </label>
                <textarea
                  rows={2}
                  value={demographicsText}
                  onChange={(e) => setDemographicsText(e.target.value)}
                  placeholder={isRtl ? 'إدارة عليا\nمقر العمل: المدن الرئيسية' : 'Senior Management\nLocation: Key cities'}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Needs & Goals */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">
                  {isRtl ? 'الاحتياجات والأهداف (كل هدف في سطر)' : 'Needs & Goals (One per line)'}
                </label>
                <textarea
                  rows={3}
                  value={needsText}
                  onChange={(e) => setNeedsText(e.target.value)}
                  placeholder={isRtl ? 'تسليم سريع للمشتريات\nفواتير ضريبية واضحة' : 'Fast delivery\nClear invoices'}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Motivations & Pains */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">
                  {isRtl ? 'الدوافع ونقاط الألم (كل نقطة في سطر)' : 'Motivations & Pains (One per line)'}
                </label>
                <textarea
                  rows={3}
                  value={painsText}
                  onChange={(e) => setPainsText(e.target.value)}
                  placeholder={isRtl ? 'نقطة ألم: تأخر الموردين\nدافع: جودة المنتجات والخدمة' : 'Pain: Delayed shipping\nMotivation: Quality'}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Buying Channels */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">
                  {isRtl ? 'قنوات الشراء المفضلة (كل قناة في سطر)' : 'Buying Channels (One per line)'}
                </label>
                <textarea
                  rows={3}
                  value={channelsText}
                  onChange={(e) => setChannelsText(e.target.value)}
                  placeholder={isRtl ? 'الشراء المباشر عبر الكاشير\nالطلب الإلكتروني' : 'Direct POS\nOnline portal'}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPersonaModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow-sm cursor-pointer"
                  style={{ backgroundColor: themeConfig.primary }}
                >
                  {isRtl ? 'حفظ بيانات Persona' : 'Save Persona'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
