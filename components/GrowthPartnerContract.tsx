/**
 * GrowthPartnerContract — نص عقد شراكة النمو الكامل (للعرض في لوحة الأدمن)
 * نسخة القراءة فقط — بدون توقيع
 * المحتوى مطابق لما يراه الشريك في بوابة partner.dasm.com.sa
 */

interface Props {
  partnerName?: string;
  commissionPercent?: number;
  referralCode?: string;
  contractDate?: string;
}

export default function GrowthPartnerContract({
  partnerName,
  commissionPercent = 20,
  referralCode,
  contractDate,
}: Props) {
  const today =
    contractDate ??
    new Date().toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const sec = 'mb-5';
  const h3  = 'font-bold text-base mb-2 text-indigo-700';
  const p   = 'text-gray-600 text-sm leading-relaxed';
  const li  = 'text-gray-600 text-sm leading-relaxed';

  return (
    <div className="text-sm leading-loose text-gray-800 space-y-6 font-sans" dir="rtl">

      {/* ── الرأس ── */}
      <div className="text-center space-y-1 pb-4 border-b border-gray-200">
        <p className="text-xs text-gray-400">بسم الله الرحمن الرحيم</p>
        <h2 className="text-xl font-bold text-indigo-700">عقد شراكة النمو</h2>
        <p className="text-xs text-gray-400 font-mono">نظام Mr.20% — منصة داسم لتداول السيارات</p>
        <p className="text-xs text-gray-400">تاريخ العقد: {today}</p>
      </div>

      {/* أطراف العقد */}
      <section className={sec}>
        <h3 className={h3}>أولاً: أطراف العقد</h3>
        <p className={p}>أُبرم هذا العقد بين:</p>
        <ul className="mt-2 space-y-2 text-gray-600 text-sm pr-4">
          <li>
            <span className="font-semibold text-gray-800">الطرف الأول (المنصة):</span>{' '}
            منصة داسم لتداول السيارات — شركة مسجّلة وفق أنظمة المملكة العربية السعودية.
          </li>
          <li>
            <span className="font-semibold text-gray-800">الطرف الثاني (شريك النمو):</span>{' '}
            {partnerName ? (
              <span className="font-bold text-indigo-700">{partnerName}</span>
            ) : (
              'الشخص أو الجهة التي تقبل هذه الشروط وتُوقّع عليها إلكترونياً.'
            )}
            {referralCode && (
              <span className="text-xs text-gray-400 mr-2">
                (كود الإحالة: <span className="font-mono font-bold">{referralCode}</span>)
              </span>
            )}
          </li>
        </ul>
      </section>

      {/* المادة 1 */}
      <section className={sec}>
        <h3 className={h3}>المادة الأولى: التعريفات</h3>
        <div className="space-y-2 text-gray-600 text-sm">
          <p><span className="font-semibold text-gray-800">المنصة:</span> منصة داسم الرقمية لتداول وعرض السيارات المستعملة والجديدة.</p>
          <p><span className="font-semibold text-gray-800">شريك النمو:</span> فرد أو جهة مُعتمدة تعمل على جلب عملاء وصفقات للمنصة مقابل عمولة محددة.</p>
          <p><span className="font-semibold text-gray-800">كود الإحالة:</span> معرّف فريد ثابت بصيغة <span className="font-mono">Ptnr_[منطقة]_[رقم]</span> يُربط العميل بشريك النمو عند التسجيل.</p>
          <p><span className="font-semibold text-gray-800">عقد الإحالة (Attribution Contract):</span> الارتباط التلقائي بين كيان وشريك النمو الذي جلبه — ينشأ بمجرد استخدام كود الإحالة.</p>
          <p><span className="font-semibold text-gray-800">الكيان:</span> أي جهة مُحالة: مستخدم فردي (Usr)، تاجر (Dlr)، معرض سيارات (Csr)، شركة (Cmp)، مزرعة (FRMR).</p>
          <p><span className="font-semibold text-gray-800">C (رسوم المنصة):</span> قيمة العمولة الأساسية على كل صفقة وفق جدول الشرائح المعتمد.</p>
          <p><span className="font-semibold text-gray-800">الليدجر:</span> السجل المالي الرسمي للمنصة — المرجع الوحيد والملزم لاحتساب المستحقات.</p>
        </div>
      </section>

      {/* المادة 2 */}
      <section className={sec}>
        <h3 className={h3}>المادة الثانية: طبيعة الشراكة ودور الشريك</h3>
        <div className="space-y-3 text-gray-600 text-sm">
          <p>يعمل شريك النمو بأحد الدورين التاليين حسب نوع الكيان المُحال:</p>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
            <p className="font-semibold text-gray-800">أ) وسيط صفقة — للأفراد والتجار:</p>
            <div className="pr-3 space-y-1 text-xs text-gray-500">
              <p>• مستخدم فردي (Usr): عمولة على كل صفقة — مدة الإحالة 90 يوماً</p>
              <p>• تاجر (Dlr): عمولة على كل صفقة — مدة الإحالة 180 يوماً</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
            <p className="font-semibold text-gray-800">ب) مدير حساب — للجهات التجارية:</p>
            <div className="pr-3 space-y-1 text-xs text-gray-500">
              <p>• معرض سيارات (Csr): عمولة على كل صفقات المعرض — 365 يوماً، تجديد تلقائي</p>
              <p>• شركة (Cmp): عمولة على كل صفقات الشركة — 730 يوماً، تجديد تلقائي</p>
              <p>• مزرعة (FRMR): عمولة على كل صفقات المزرعة — 730 يوماً، تجديد تلقائي</p>
            </div>
          </div>
          <p>شريك النمو مستقل وليس موظفاً أو وكيلاً حصرياً للمنصة.</p>
        </div>
      </section>

      {/* المادة 3 */}
      <section className={sec}>
        <h3 className={h3}>المادة الثالثة: نسبة العمولة ونظام الرتب</h3>
        <div className="space-y-3 text-gray-600 text-sm">
          <p>
            تُحدَّد نسبة عمولة الطرف الثاني بـ{' '}
            <span className="font-bold text-indigo-700 text-base">{commissionPercent}%</span>{' '}
            من صافي عمولة المنصة على كل صفقة مكتملة عن طريقه:
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700">الرتبة</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700">شرط الترقية</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700">العمولة</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700">المزايا الإضافية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-3 py-2 font-medium">برونزي (مستكشف)</td>
                  <td className="px-3 py-2 text-gray-500">الانضمام المباشر</td>
                  <td className="px-3 py-2 font-bold text-amber-700">10%</td>
                  <td className="px-3 py-2 text-gray-500">التصوير، الرفع، المساعدة</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">فضي (موثق)</td>
                  <td className="px-3 py-2 text-gray-500">10 عمليات + تقييم 4.0+</td>
                  <td className="px-3 py-2 font-bold text-slate-600">20%</td>
                  <td className="px-3 py-2 text-gray-500">+ الفحص المبدئي، أولوية المهام</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">ذهبي (سفير)</td>
                  <td className="px-3 py-2 text-gray-500">50 عمليات + اختبار معرفة</td>
                  <td className="px-3 py-2 font-bold text-yellow-700">20%–30% + مكافآت</td>
                  <td className="px-3 py-2 text-gray-500">+ فحص فني، نقل ملكية، مكافآت ربع سنوية</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* المادة 4 */}
      <section className={sec}>
        <h3 className={h3}>المادة الرابعة: آلية احتساب العمولة</h3>
        <div className="space-y-2 text-gray-600 text-sm">
          <p className="font-medium text-gray-800">نموذج احتساب رسوم المنصة (C):</p>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700">نطاق السعر</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700">رسوم المنصة (C)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="px-3 py-2">حتى 50,000 ر.س</td><td className="px-3 py-2 font-mono">250 ر.س</td></tr>
                <tr><td className="px-3 py-2">50,001 – 100,000 ر.س</td><td className="px-3 py-2 font-mono">500 ر.س</td></tr>
                <tr><td className="px-3 py-2">100,001 – 150,000 ر.س</td><td className="px-3 py-2 font-mono">1,000 ر.س</td></tr>
                <tr><td className="px-3 py-2">150,001 – 200,000 ر.س</td><td className="px-3 py-2 font-mono">2,000 ر.س</td></tr>
                <tr><td className="px-3 py-2">أكثر من 200,000 ر.س</td><td className="px-3 py-2 font-mono">2,500 ر.س + 1,000 ر.س لكل 100,000 إضافية</td></tr>
              </tbody>
            </table>
          </div>
          <p className={p}>
            عمولة الشريك = نسبته المئوية × صافي دخل المنصة. في صفقات البائع الفرد: المنصة تأخذ C من البائع وC من المشتري (2×C إجمالاً).
          </p>
        </div>
      </section>

      {/* المادة 5 */}
      <section className={sec}>
        <h3 className={h3}>المادة الخامسة: قواعد الإحالة والربط</h3>
        <div className="space-y-2 text-gray-600 text-sm">
          <p><span className="font-semibold text-gray-800">قاعدة الأولوية (First-touch wins):</span> أول إحالة تُقبل. أي محاولة ربط لكيان مرتبط بشريك آخر تُرفض تلقائياً.</p>
          <p><span className="font-semibold text-gray-800">نافذة الإحالة:</span> تمتد من تاريخ تسجيل الكيان وفق المدد المحددة (90 – 730 يوماً).</p>
          <p><span className="font-semibold text-gray-800">كود الإحالة ثابت:</span> أي تغيير يُلغي الاستحقاق على الإحالات السابقة.</p>
          <p><span className="font-semibold text-gray-800">قفل العقد:</span> يُقفل عند إكمال KYC أو أول عملية مالية أو بقرار إداري. بعد القفل لا يُعدَّل إلا بموافقة إدارية مع Audit Log.</p>
        </div>
      </section>

      {/* المادة 6 */}
      <section className={sec}>
        <h3 className={h3}>المادة السادسة: التسوية والمدفوعات</h3>
        <div className="space-y-2 text-gray-600 text-sm">
          <p>تُصدر كشوف حساب شهرية توضح: الصفقات المكتملة، إجمالي العمولات، المبالغ المدفوعة، والمستحق الصافي.</p>
          <p>تُحوَّل المستحقات عبر التحويل البنكي بعد اكتمال مراحل التحقق. الحد الأدنى للصرف: <strong>500 ر.س</strong>.</p>
          <p><span className="font-semibold text-gray-800">الليدجر المرجعي:</span> السجل المالي للمنصة هو المرجع الرسمي الوحيد. المحفظة الظاهرة مؤشر وليست سجلاً قانونياً.</p>
          <p>تخضع المستحقات لضريبة القيمة المضافة (15%) وأي رسوم قانونية أخرى معمول بها.</p>
        </div>
      </section>

      {/* المادة 7 */}
      <section className={sec}>
        <h3 className={h3}>المادة السابعة: التزامات شريك النمو</h3>
        <div className="space-y-1 text-gray-600 text-sm pr-2">
          <p>١. التعامل بمصداقية وشفافية مع العملاء وعدم تقديم وعود مخالفة لسياسات المنصة.</p>
          <p>٢. الامتناع عن نشر معلومات مضللة أو مبالغ فيها عن خدمات المنصة.</p>
          <p>٣. الحفاظ على سرية بيانات العملاء وعدم إفشائها لأي طرف ثالث.</p>
          <p>٤. عدم التعامل مع المنصات المنافسة بطريقة تضر بمصالح داسم طوال مدة العقد.</p>
          <p>٥. الاستجابة لمتطلبات الإدارة والتحقق في مدة لا تتجاوز 48 ساعة.</p>
          <p>٦. التقيّد بمعايير التصوير والفحص المعتمدة عند تنفيذ المهام الميدانية.</p>
          <p>٧. إبلاغ الإدارة فور اكتشاف أي تعارض في المصالح أو محاولة احتيال.</p>
        </div>
      </section>

      {/* المادة 8 */}
      <section className={sec}>
        <h3 className={h3}>المادة الثامنة: التزامات المنصة</h3>
        <div className="space-y-1 text-gray-600 text-sm pr-2">
          <p>١. توفير لوحة تحكم شفافة تعرض الإحالات والصفقات والعمولات بشكل مستمر.</p>
          <p>٢. تسوية المستحقات الموثّقة في المواعيد المتفق عليها دون تأخير.</p>
          <p>٣. إبلاغ الشريك بأي تغيير في نسبة العمولة أو سياسات النظام قبل 30 يوماً.</p>
          <p>٤. توفير مواد تسويقية وأدوات داعمة لمساعدة الشريك في أداء مهامه.</p>
          <p>٥. الحفاظ على سرية بيانات الشريك وعدم مشاركتها مع أطراف خارجية.</p>
        </div>
      </section>

      {/* المادة 9 */}
      <section className={sec}>
        <h3 className={h3}>المادة التاسعة: السرية والملكية الفكرية</h3>
        <div className="space-y-2 text-gray-600 text-sm">
          <p>جميع المعلومات والأساليب وبيانات العملاء والأدوات المقدمة من المنصة هي ملكية خاصة لمنصة داسم ومحمية قانونياً.</p>
          <p>يلتزم الشريك بعدم الإفشاء أو الاستخدام خارج نطاق هذه الشراكة. يبقى هذا الالتزام سارياً لمدة 3 سنوات بعد انتهاء العقد.</p>
        </div>
      </section>

      {/* المادة 10 */}
      <section className={sec}>
        <h3 className={h3}>المادة العاشرة: مدة العقد وإنهاؤه</h3>
        <div className="space-y-2 text-gray-600 text-sm">
          <p><span className="font-semibold text-gray-800">المدة:</span> يسري من تاريخ القبول الإلكتروني لمدة سنة قابلة للتجديد التلقائي.</p>
          <p><span className="font-semibold text-gray-800">إنهاء من قبل الشريك:</span> إشعار إلكتروني قبل 15 يوماً. تُسوَّى المستحقات خلال 30 يوماً.</p>
          <p><span className="font-semibold text-gray-800">إنهاء من قبل المنصة:</span> إشعار قبل 30 يوماً. يجوز الإنهاء الفوري في حالات الغش أو الاحتيال أو انتهاك السرية.</p>
          <p><span className="font-semibold text-gray-800">أثر الإنهاء:</span> تنتهي عقود الإحالة الجارية وتُصفّى العمولات المستحقة حتى تاريخ الإنهاء.</p>
        </div>
      </section>

      {/* المادة 11 */}
      <section className={sec}>
        <h3 className={h3}>المادة الحادية عشرة: حل النزاعات</h3>
        <div className="space-y-2 text-gray-600 text-sm">
          <p>في حالة أي نزاع يُحاول الطرفان أولاً تسويته ودياً خلال 14 يوماً من تاريخ الإبلاغ.</p>
          <p>إذا تعذّر الحل الودي، يُلجأ إلى التحكيم التجاري وفق أنظمة المملكة العربية السعودية.</p>
          <p>يُعتمد الليدجر المالي للمنصة كدليل أول في أي نزاع يتعلق بالأرقام والمستحقات.</p>
        </div>
      </section>

      {/* المادة 12 */}
      <section className={sec}>
        <h3 className={h3}>المادة الثانية عشرة: أحكام عامة</h3>
        <div className="space-y-1 text-gray-600 text-sm pr-2">
          <p>١. يخضع هذا العقد لأنظمة المملكة العربية السعودية ومبادئ الشريعة الإسلامية.</p>
          <p>٢. الموافقة الإلكترونية تحمل القوة القانونية ذاتها للتوقيع الخطي وفق نظام التعاملات الإلكترونية السعودي.</p>
          <p>٣. لا يحق للشريك التنازل عن هذا العقد دون موافقة خطية من المنصة.</p>
          <p>٤. إذا أُبطل أي بند لأي سبب قانوني، تبقى بقية البنود سارية.</p>
          <p>٥. النسخة العربية من هذا العقد هي النسخة المعتمدة والملزمة.</p>
        </div>
      </section>

      {/* الخاتمة */}
      <div className="border-t-2 border-indigo-100 pt-4 text-center text-xs text-gray-400 space-y-1">
        <p>أُبرم هذا العقد وفق الشروط والأحكام المذكورة أعلاه.</p>
        <p className="font-medium text-gray-600">
          بالموافقة الإلكترونية، يُقرّ الطرف الثاني بأنه قرأ وفهم وقبل جميع بنود هذا العقد.
        </p>
        <p className="font-mono text-[10px]">
          نسخة العقد: v2.0 — March-2026 — نظام Mr.20% × داسم
        </p>
      </div>
    </div>
  );
}
