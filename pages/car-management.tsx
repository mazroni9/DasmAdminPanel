import Layout from '../components/Layout'
import { useState } from 'react'
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  TruckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface Car {
  id: string
  title: string
  brand: string
  model: string
  year: number
  price: number
  mileage: number
  fuel_type: string
  transmission: string
  color: string
  status: 'active' | 'sold' | 'pending' | 'auction'
  description: string
  images: string[]
  features: string[]
  created_at: string
  updated_at: string
}

export default function CarManagement() {
  const [cars, setCars] = useState<Car[]>([
    {
      id: 'CAR001',
      title: 'تويوتا كامري 2022 فل كامل',
      brand: 'تويوتا',
      model: 'كامري',
      year: 2022,
      price: 88500,
      mileage: 45000,
      fuel_type: 'بنزين',
      transmission: 'أوتوماتيك',
      color: 'أبيض',
      status: 'active',
      description: 'سيارة ممتازة بحالة جيدة جداً، فل كامل مع جميع الخيارات',
      images: ['https://cdn.dasm-e.com/cars/CAR-00123.jpg'],
      features: ['مكيف', 'فرامل ABS', 'وسائد هوائية', 'نظام صوت'],
      created_at: '2025-01-15T10:30:00Z',
      updated_at: '2025-01-20T14:20:00Z'
    },
    {
      id: 'CAR002',
      title: 'هونداي النترا 2021',
      brand: 'هونداي',
      model: 'النترا',
      year: 2021,
      price: 66500,
      mileage: 32000,
      fuel_type: 'بنزين',
      transmission: 'أوتوماتيك',
      color: 'أسود',
      status: 'pending',
      description: 'سيارة اقتصادية ومريحة، مناسبة للعائلة',
      images: ['https://cdn.dasm-e.com/cars/CAR-00157.jpg'],
      features: ['مكيف', 'فرامل ABS', 'وسائد هوائية'],
      created_at: '2025-01-18T09:15:00Z',
      updated_at: '2025-01-21T16:45:00Z'
    }
  ])

  const [showAddCar, setShowAddCar] = useState(false)
  const [showEditCar, setShowEditCar] = useState<string | null>(null)
  const [selectedCar, setSelectedCar] = useState<Car | null>(null)
  const [filter, setFilter] = useState('all')

  const [newCar, setNewCar] = useState({
    title: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    price: 0,
    mileage: 0,
    fuel_type: 'بنزين',
    transmission: 'أوتوماتيك',
    color: '',
    description: '',
    features: [] as string[]
  })

  const availableFeatures = [
    'مكيف', 'فرامل ABS', 'وسائد هوائية', 'نظام صوت', 'كشافات LED',
    'عجلات ألمنيوم', 'نظام ملاحة', 'كاميرا خلفية', 'فتحة سقف'
  ]

  const handleAddCar = () => {
    if (newCar.title && newCar.brand && newCar.model && newCar.price > 0) {
      const car: Car = {
        id: `CAR${Date.now()}`,
        ...newCar,
        status: 'pending',
        images: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      setCars([...cars, car])
      setNewCar({
        title: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        price: 0,
        mileage: 0,
        fuel_type: 'بنزين',
        transmission: 'أوتوماتيك',
        color: '',
        description: '',
        features: []
      })
      setShowAddCar(false)
      alert('تم إضافة السيارة بنجاح')
    } else {
      alert('يرجى ملء جميع الحقول المطلوبة')
    }
  }

  const handleDeleteCar = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه السيارة؟')) {
      setCars(cars.filter(car => car.id !== id))
      alert('تم حذف السيارة بنجاح')
    }
  }

  const handleEditCar = (car: Car) => {
    setSelectedCar(car)
    setNewCar({
      title: car.title,
      brand: car.brand,
      model: car.model,
      year: car.year,
      price: car.price,
      mileage: car.mileage,
      fuel_type: car.fuel_type,
      transmission: car.transmission,
      color: car.color,
      description: car.description,
      features: car.features
    })
    setShowEditCar(car.id)
  }

  const handleUpdateCar = () => {
    if (selectedCar && newCar.title && newCar.brand && newCar.model && newCar.price > 0) {
      setCars(cars.map(car => 
        car.id === selectedCar.id 
          ? { ...car, ...newCar, updated_at: new Date().toISOString() }
          : car
      ))
      setShowEditCar(null)
      setSelectedCar(null)
      setNewCar({
        title: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        price: 0,
        mileage: 0,
        fuel_type: 'بنزين',
        transmission: 'أوتوماتيك',
        color: '',
        description: '',
        features: []
      })
      alert('تم تحديث السيارة بنجاح')
    } else {
      alert('يرجى ملء جميع الحقول المطلوبة')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'sold':
        return 'bg-blue-100 text-blue-800'
      case 'auction':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'نشط'
      case 'pending':
        return 'بانتظار الموافقة'
      case 'sold':
        return 'مباع'
      case 'auction':
        return 'في المزاد'
      default:
        return status
    }
  }

  const filteredCars = cars.filter(car => {
    if (filter === 'all') return true
    return car.status === filter
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount)
  }

  return (
    <Layout title="إدارة السيارات">
      <div className="min-h-screen bg-gray-50/50">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* رأس الصفحة */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">إدارة السيارات</h1>
                <p className="mt-1 text-sm text-gray-500">
                  إضافة وتعديل وحذف سيارات المعرض
                </p>
              </div>
              <button 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center hover:bg-blue-700 transition-colors"
                onClick={() => setShowAddCar(true)}
              >
                <PlusIcon className="w-4 h-4 ml-2" />
                إضافة سيارة جديدة
              </button>
            </div>
          </div>

          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <TruckIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm text-gray-600">إجمالي السيارات</p>
                  <p className="text-2xl font-bold text-gray-900">{cars.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm text-gray-600">نشط</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {cars.filter(car => car.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm text-gray-600">بانتظار الموافقة</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {cars.filter(car => car.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm text-gray-600">في المزاد</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {cars.filter(car => car.status === 'auction').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* فلتر السيارات */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <label className="text-sm font-medium text-gray-700">فلتر الحالة:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="فلتر حالة السيارة"
              >
                <option value="all">جميع السيارات</option>
                <option value="active">نشط</option>
                <option value="pending">بانتظار الموافقة</option>
                <option value="sold">مباع</option>
                <option value="auction">في المزاد</option>
              </select>
            </div>
          </div>

          {/* نموذج إضافة/تعديل سيارة */}
          {(showAddCar || showEditCar) && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {showEditCar ? 'تعديل السيارة' : 'إضافة سيارة جديدة'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">عنوان السيارة</label>
                  <input
                    type="text"
                    value={newCar.title}
                    onChange={(e) => setNewCar({ ...newCar, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="مثال: تويوتا كامري 2022 فل كامل"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الماركة</label>
                  <input
                    type="text"
                    value={newCar.brand}
                    onChange={(e) => setNewCar({ ...newCar, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="مثال: تويوتا"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الموديل</label>
                  <input
                    type="text"
                    value={newCar.model}
                    onChange={(e) => setNewCar({ ...newCar, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="مثال: كامري"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">سنة الصنع</label>
                  <input
                    type="number"
                    value={newCar.year}
                    onChange={(e) => setNewCar({ ...newCar, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">السعر</label>
                  <input
                    type="number"
                    value={newCar.price}
                    onChange={(e) => setNewCar({ ...newCar, price: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المسافة المقطوعة</label>
                  <input
                    type="number"
                    value={newCar.mileage}
                    onChange={(e) => setNewCar({ ...newCar, mileage: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع الوقود</label>
                  <select
                    value={newCar.fuel_type}
                    onChange={(e) => setNewCar({ ...newCar, fuel_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="نوع الوقود"
                  >
                    <option value="بنزين">بنزين</option>
                    <option value="ديزل">ديزل</option>
                    <option value="كهربائي">كهربائي</option>
                    <option value="هجين">هجين</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ناقل الحركة</label>
                  <select
                    value={newCar.transmission}
                    onChange={(e) => setNewCar({ ...newCar, transmission: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="ناقل الحركة"
                  >
                    <option value="أوتوماتيك">أوتوماتيك</option>
                    <option value="يدوي">يدوي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اللون</label>
                  <input
                    type="text"
                    value={newCar.color}
                    onChange={(e) => setNewCar({ ...newCar, color: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="مثال: أبيض"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                <textarea
                  value={newCar.description}
                  onChange={(e) => setNewCar({ ...newCar, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="وصف السيارة..."
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">المميزات</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableFeatures.map((feature) => (
                    <label key={feature} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newCar.features.includes(feature)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewCar({
                              ...newCar,
                              features: [...newCar.features, feature]
                            })
                          } else {
                            setNewCar({
                              ...newCar,
                              features: newCar.features.filter(f => f !== feature)
                            })
                          }
                        }}
                        className="ml-2"
                      />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex space-x-2 space-x-reverse">
                <button
                  onClick={showEditCar ? handleUpdateCar : handleAddCar}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  {showEditCar ? 'تحديث السيارة' : 'إضافة السيارة'}
                </button>
                <button
                  onClick={() => {
                    setShowAddCar(false)
                    setShowEditCar(null)
                    setSelectedCar(null)
                    setNewCar({
                      title: '',
                      brand: '',
                      model: '',
                      year: new Date().getFullYear(),
                      price: 0,
                      mileage: 0,
                      fuel_type: 'بنزين',
                      transmission: 'أوتوماتيك',
                      color: '',
                      description: '',
                      features: []
                    })
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* قائمة السيارات */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">قائمة السيارات ({filteredCars.length})</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCars.map((car) => (
                  <div key={car.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(car.status)}`}>
                        {getStatusLabel(car.status)}
                      </span>
                      <div className="flex space-x-1 space-x-reverse">
                        <button
                          onClick={() => alert(`تفاصيل السيارة: ${car.title}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="عرض التفاصيل"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditCar(car)}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="تعديل"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCar(car.id)}
                          className="text-red-600 hover:text-red-800"
                          title="حذف"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-medium text-gray-900 mb-2">{car.title}</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>الماركة: {car.brand}</p>
                      <p>الموديل: {car.model}</p>
                      <p>السنة: {car.year}</p>
                      <p>السعر: {formatCurrency(car.price)}</p>
                      <p>المسافة: {car.mileage.toLocaleString()} كم</p>
                      <p>الوقود: {car.fuel_type}</p>
                      <p>ناقل الحركة: {car.transmission}</p>
                      <p>اللون: {car.color}</p>
                    </div>
                    
                    {car.features.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">المميزات:</p>
                        <div className="flex flex-wrap gap-1">
                          {car.features.slice(0, 3).map((feature) => (
                            <span key={feature} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                              {feature}
                            </span>
                          ))}
                          {car.features.length > 3 && (
                            <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                              +{car.features.length - 3} أكثر
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 