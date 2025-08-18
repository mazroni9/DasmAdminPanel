import Layout from '../components/Layout'
import { useState } from 'react'
import { 
  UserPlusIcon,
  UserIcon,
  KeyIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'

interface Employee {
  id: string
  name: string
  email: string
  phone: string
  role: 'admin' | 'employee'
  permissions: string[]
  status: 'active' | 'inactive'
  showroom: string // إضافة حقل المعرض
  created_at: string
  last_login?: string
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: 'EMP001',
      name: 'أحمد محمد',
      email: 'ahmed@mazbrothers.com',
      phone: '0501234567',
      role: 'employee',
      permissions: ['add_cars', 'edit_cars', 'view_cars'],
      status: 'active',
      showroom: 'معرض ماز براذرز',
      created_at: '2025-01-15T10:30:00Z',
      last_login: '2025-01-20T14:20:00Z'
    },
    {
      id: 'EMP002',
      name: 'سارة أحمد',
      email: 'sara@mazbrothers.com',
      phone: '0509876543',
      role: 'employee',
      permissions: ['add_cars', 'view_cars'],
      status: 'active',
      showroom: 'معرض السيارات الحديث',
      created_at: '2025-01-18T09:15:00Z',
      last_login: '2025-01-21T16:45:00Z'
    },
    {
      id: 'EMP003',
      name: 'محمد علي',
      email: 'mohamed@dasm-e.com',
      phone: '0505551234',
      role: 'admin',
      permissions: ['add_cars', 'edit_cars', 'delete_cars', 'view_cars', 'manage_auctions', 'view_reports'],
      status: 'active',
      showroom: 'المنصة الرئيسية',
      created_at: '2025-01-10T08:00:00Z',
      last_login: '2025-01-22T09:30:00Z'
    }
  ])

  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [showEditEmployee, setShowEditEmployee] = useState<string | null>(null)
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'employee' as 'admin' | 'employee',
    permissions: [] as string[],
    password: '',
    showroom: ''
  })

  const availablePermissions = [
    { key: 'add_cars', label: 'إضافة سيارات' },
    { key: 'edit_cars', label: 'تعديل السيارات' },
    { key: 'delete_cars', label: 'حذف السيارات' },
    { key: 'view_cars', label: 'عرض السيارات' },
    { key: 'manage_auctions', label: 'إدارة المزادات' },
    { key: 'view_reports', label: 'عرض التقارير' }
  ]

  const availableShowrooms = [
    { id: 'platform', name: 'المنصة الرئيسية' },
    { id: 'maz_brothers', name: 'معرض ماز براذرز' },
    { id: 'modern_cars', name: 'معرض السيارات الحديث' },
    { id: 'premium_cars', name: 'معرض السيارات الفاخرة' },
    { id: 'auto_center', name: 'مركز السيارات' }
  ]

  const handleAddEmployee = () => {
    if (newEmployee.name && newEmployee.email && newEmployee.password && newEmployee.showroom) {
      const employee: Employee = {
        id: `EMP${Date.now()}`,
        name: newEmployee.name,
        email: newEmployee.email,
        phone: newEmployee.phone,
        role: newEmployee.role,
        permissions: newEmployee.permissions,
        status: 'active',
        showroom: newEmployee.showroom,
        created_at: new Date().toISOString()
      }
      
      setEmployees([...employees, employee])
      setNewEmployee({
        name: '',
        email: '',
        phone: '',
        role: 'employee',
        permissions: [],
        password: '',
        showroom: ''
      })
      setShowAddEmployee(false)
      alert('تم إضافة الموظف بنجاح')
    } else {
      alert('يرجى ملء جميع الحقول المطلوبة')
    }
  }

  const handleDeleteEmployee = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      setEmployees(employees.filter(emp => emp.id !== id))
      alert('تم حذف الموظف بنجاح')
    }
  }

  const toggleEmployeeStatus = (id: string) => {
    setEmployees(employees.map(emp => 
      emp.id === id 
        ? { ...emp, status: emp.status === 'active' ? 'inactive' : 'active' }
        : emp
    ))
  }

  const getPermissionLabel = (key: string) => {
    const permission = availablePermissions.find(p => p.key === key)
    return permission ? permission.label : key
  }

  const getShowroomColor = (showroom: string) => {
    if (showroom === 'المنصة الرئيسية') {
      return 'bg-purple-100 text-purple-800'
    }
    return 'bg-blue-100 text-blue-800'
  }

  return (
    <Layout title="إدارة الموظفين">
      <div className="min-h-screen bg-gray-50/50">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* رأس الصفحة */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">إدارة الموظفين</h1>
                <p className="mt-1 text-sm text-gray-500">
                  إدارة موظفي المعرض وصلاحياتهم
                </p>
              </div>
              <button 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center hover:bg-blue-700 transition-colors"
                onClick={() => setShowAddEmployee(true)}
              >
                <UserPlusIcon className="w-4 h-4 ml-2" />
                إضافة موظف جديد
              </button>
            </div>
          </div>

          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <UserIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm text-gray-600">إجمالي الموظفين</p>
                  <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-lg">
                  <UserIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm text-gray-600">نشط</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {employees.filter(emp => emp.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <KeyIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm text-gray-600">مديرين</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {employees.filter(emp => emp.role === 'admin').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <BuildingStorefrontIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm text-gray-600">المنصة الرئيسية</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {employees.filter(emp => emp.showroom === 'المنصة الرئيسية').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* نموذج إضافة موظف */}
          {showAddEmployee && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">إضافة موظف جديد</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الاسم</label>
                  <input
                    type="text"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="اسم الموظف"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0500000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
                  <input
                    type="password"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="كلمة المرور"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الصلاحية</label>
                  <select
                    value={newEmployee.role}
                    onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value as 'admin' | 'employee' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="الصلاحية"
                  >
                    <option value="employee">موظف</option>
                    <option value="admin">مدير</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المعرض</label>
                  <select
                    value={newEmployee.showroom}
                    onChange={(e) => setNewEmployee({ ...newEmployee, showroom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="المعرض"
                  >
                    <option value="">اختر المعرض</option>
                    {availableShowrooms.map((showroom) => (
                      <option key={showroom.id} value={showroom.name}>
                        {showroom.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">الصلاحيات</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availablePermissions.map((permission) => (
                    <label key={permission.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newEmployee.permissions.includes(permission.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewEmployee({
                              ...newEmployee,
                              permissions: [...newEmployee.permissions, permission.key]
                            })
                          } else {
                            setNewEmployee({
                              ...newEmployee,
                              permissions: newEmployee.permissions.filter(p => p !== permission.key)
                            })
                          }
                        }}
                        className="ml-2"
                      />
                      <span className="text-sm text-gray-700">{permission.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex space-x-2 space-x-reverse">
                <button
                  onClick={handleAddEmployee}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  إضافة الموظف
                </button>
                <button
                  onClick={() => setShowAddEmployee(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* قائمة الموظفين */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">قائمة الموظفين</h2>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full text-right border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-3">الموظف</th>
                      <th className="p-3">البريد الإلكتروني</th>
                      <th className="p-3">الصلاحية</th>
                      <th className="p-3">المعرض</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3">آخر تسجيل دخول</th>
                      <th className="p-3">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id} className="border-t">
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.phone}</div>
                          </div>
                        </td>
                        <td className="p-3 text-gray-700">{employee.email}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            employee.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {employee.role === 'admin' ? 'مدير' : 'موظف'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getShowroomColor(employee.showroom)}`}>
                            {employee.showroom}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => toggleEmployeeStatus(employee.id)}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              employee.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {employee.status === 'active' ? (
                              <>
                                <EyeIcon className="w-3 h-3 ml-1" />
                                نشط
                              </>
                            ) : (
                              <>
                                <EyeSlashIcon className="w-3 h-3 ml-1" />
                                غير نشط
                              </>
                            )}
                          </button>
                        </td>
                        <td className="p-3 text-sm text-gray-500">
                          {employee.last_login 
                            ? new Date(employee.last_login).toLocaleDateString('ar-SA')
                            : 'لم يسجل دخول'
                          }
                        </td>
                        <td className="p-3">
                          <div className="flex space-x-1 space-x-reverse">
                            <button
                              onClick={() => alert(`صلاحيات ${employee.name}: ${employee.permissions.map(getPermissionLabel).join(', ')}`)}
                              className="text-blue-600 hover:text-blue-800"
                              title="عرض الصلاحيات"
                            >
                              <KeyIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => alert(`تعديل ${employee.name}`)}
                              className="text-yellow-600 hover:text-yellow-800"
                              title="تعديل"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className="text-red-600 hover:text-red-800"
                              title="حذف"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 