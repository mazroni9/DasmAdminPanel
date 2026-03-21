# DasmAdminPanel

## 🚀 لوحة تحكم إدارة DASM

### الأمان والمراجع (إلزامي للمطورين)

- **المرجع الأمني والتشغيلي:** [docs/security/DASM_ADMIN_PANEL_SECURITY_BASELINE.md](docs/security/DASM_ADMIN_PANEL_SECURITY_BASELINE.md)
- **قاعدة Cursor (تُطبَّق تلقائيًا):** [.cursor/rules/dasm-admin-panel-security-baseline.mdc](.cursor/rules/dasm-admin-panel-security-baseline.mdc) — تقرأ الوثيقة أعلاه قبل أي تعديل يمس المسارات أو المصادقة أو `pages/api` أو البيئة.

**مسارات الكنترول روم الرسمية:** الدخول `/auth/login` → الواجهة `/admin/control-room`. مسارات `/dashboard` و`/login` تُعامل كـ legacy حتى إعادة هيكلتها (انظر الوثيقة).

### المميزات:
- إدارة السيارات والمزادات
- نظام البث المباشر
- إدارة المستخدمين والموظفين
- تقارير شاملة
- دعم اللغة العربية

### التحديثات الأخيرة:
- ✅ إصلاح مشاكل البناء
- ✅ إضافة مكتبات cloudinary و axios
- ✅ تحديث إعدادات Vercel
- ✅ إصلاح مشكلة CarIcon
- ✅ حل مشكلة functions المعطلة

### تاريخ التحديث:
**آخر تحديث:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**الكومت:** a4b493f - حل تضارب الدمج

### ملاحظة مهمة:
تم إصلاح جميع مشاكل Vercel وإزالة إعدادات functions المعطلة.

---
*تم تطوير هذا المشروع باستخدام Next.js و TypeScript*
