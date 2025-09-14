'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Settings, 
  Package, 
  Users, 
  Ticket, 
  Edit, 
  Trash2, 
  Plus,
  ArrowLeft,
  Save,
  FileText,
  Wrench
} from 'lucide-react'

interface CustomField {
  id: string
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'boolean'
  options?: string[]
  isRequired?: boolean
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  cost?: number
  sku?: string
  barcode?: string
  category: { name: string }
  categoryId: string
  stock: number
  minStock: number
  isActive: boolean
  customFields?: Record<string, any>
}

interface Category {
  id: string
  name: string
  description?: string
  color?: string
}

interface User {
  id: string
  name: string
  role: string
  isActive: boolean
  nfcCode?: string
}

interface DiscountCode {
  id: string
  code: string
  name: string
  type: string
  value: number
  isActive: boolean
  maxUses?: number
  currentUses: number
}

interface ReceiptSettings {
  id?: string
  businessName: string
  headerText?: string
  footerText: string
  logoUrl?: string
  address?: string
  phone?: string
  email?: string
  website?: string
}

interface EnhancedSettingsPageProps {
  onBack: () => void
}

export default function EnhancedSettingsPage({ onBack }: EnhancedSettingsPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([])
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>({
    businessName: "OpenPOS",
    footerText: "Thank you for shopping with us!"
  })
  const [loading, setLoading] = useState(true)

  // Form states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch products
      const productsResponse = await fetch('/api/products')
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        setProducts(productsData)
      }

      // Fetch categories
      const categoriesResponse = await fetch('/api/categories')
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData)
      }

      // Fetch custom fields
      const customFieldsResponse = await fetch('/api/custom-fields')
      if (customFieldsResponse.ok) {
        const customFieldsData = await customFieldsResponse.json()
        setCustomFields(customFieldsData)
      }

      // Fetch users
      const usersResponse = await fetch('/api/users')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
      }

      // For now, we'll use mock data for discount codes
      setDiscountCodes([
        { id: '1', code: 'SAVE10', name: '10% Off', type: 'PERCENTAGE', value: 10, isActive: true, maxUses: 100, currentUses: 5 },
        { id: '2', code: 'WELCOME5', name: 'Welcome $5 Off', type: 'FIXED_AMOUNT', value: 5, isActive: true, maxUses: 50, currentUses: 12 },
      ])

      // Fetch receipt settings
      const receiptResponse = await fetch('/api/receipt-settings')
      if (receiptResponse.ok) {
        const receiptData = await receiptResponse.json()
        setReceiptSettings(receiptData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProduct = async (product: Partial<Product>) => {
    try {
      const method = editingProduct?.id ? 'PUT' : 'POST'
      const url = editingProduct?.id ? `/api/products/${editingProduct.id}` : '/api/products'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      })

      if (response.ok) {
        await fetchData() // Refresh the product list
        setEditingProduct(null)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Failed to save product')
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchData() // Refresh the product list
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    }
  }

  const handleSaveUser = async (user: Partial<User & { pin: string }>) => {
    try {
      const method = editingUser?.id ? 'PUT' : 'POST'
      const url = editingUser?.id ? `/api/users/${editingUser.id}` : '/api/users'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      })

      if (response.ok) {
        await fetchData() // Refresh the user list
        setEditingUser(null)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving user:', error)
      alert('Failed to save user')
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchData() // Refresh the user list
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
  }

  const handleSaveReceiptSettings = async (settings: ReceiptSettings) => {
    try {
      const response = await fetch('/api/receipt-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        const updatedSettings = await response.json()
        setReceiptSettings(updatedSettings)
        alert('Receipt settings saved successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving receipt settings:', error)
      alert('Failed to save receipt settings')
    }
  }

  const EnhancedProductForm = ({ product, onSave, onCancel }: { 
    product?: Product | null, 
    onSave: (product: Partial<Product>) => void,
    onCancel: () => void 
  }) => {
    const [formData, setFormData] = useState({
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || 0,
      cost: product?.cost || 0,
      sku: product?.sku || '',
      barcode: product?.barcode || '',
      stock: product?.stock || 0,
      minStock: product?.minStock || 0,
      categoryId: product?.categoryId || '',
      image: product?.image || '',
      customFields: product?.customFields || {}
    })

    const handleCustomFieldChange = (fieldName: string, value: any) => {
      setFormData(prev => ({
        ...prev,
        customFields: {
          ...prev.customFields,
          [fieldName]: value
        }
      }))
    }

    return (
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>{product ? 'Edit Product' : 'Add Product'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description"
                />
              </div>

              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Product SKU"
                />
              </div>

              <div>
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Product barcode"
                />
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pricing & Inventory</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cost">Cost</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock">Current Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="minStock">Minimum Stock</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          {customFields.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Custom Fields</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customFields.map((field) => (
                  <div key={field.id}>
                    <Label htmlFor={field.name}>
                      {field.label}
                      {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {field.type === 'text' && (
                      <Input
                        id={field.name}
                        value={formData.customFields[field.name] || ''}
                        onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        required={field.isRequired}
                      />
                    )}
                    {field.type === 'number' && (
                      <Input
                        id={field.name}
                        type="number"
                        value={formData.customFields[field.name] || ''}
                        onChange={(e) => handleCustomFieldChange(field.name, parseFloat(e.target.value) || '')}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        required={field.isRequired}
                      />
                    )}
                    {field.type === 'select' && (
                      <Select
                        value={formData.customFields[field.name] || ''}
                        onValueChange={(value) => handleCustomFieldChange(field.name, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {field.type === 'boolean' && (
                      <div className="flex items-center space-x-2 mt-2">
                        <input
                          type="checkbox"
                          id={field.name}
                          checked={formData.customFields[field.name] || false}
                          onChange={(e) => handleCustomFieldChange(field.name, e.target.checked)}
                        />
                        <Label htmlFor={field.name}>Yes</Label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button onClick={() => onSave(formData)} disabled={!formData.name || !formData.categoryId}>
              <Save className="w-4 h-4 mr-2" />
              Save Product
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const UserForm = ({ user, onSave, onCancel }: { 
    user?: User | null, 
    onSave: (user: Partial<User & { pin: string }>) => void,
    onCancel: () => void 
  }) => {
    const [formData, setFormData] = useState({
      name: user?.name || '',
      pin: '',
      role: user?.role || 'CASHIER',
      nfcCode: user?.nfcCode || '',
      isActive: user?.isActive ?? true,
    })

    return (
      <Card>
        <CardHeader>
          <CardTitle>{user?.id ? 'Edit User' : 'Add User'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="userName">Name</Label>
            <Input
              id="userName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter user name"
            />
          </div>
          <div>
            <Label htmlFor="userPin">PIN {user?.id ? '(leave empty to keep current)' : '(4-6 digits)'}</Label>
            <Input
              id="userPin"
              type="password"
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
              placeholder={user?.id ? 'Leave empty to keep current PIN' : 'Enter 4-6 digit PIN'}
              maxLength={6}
            />
          </div>
          <div>
            <Label htmlFor="userRole">Role</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="CASHIER">Cashier</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="userNfc">NFC Code (optional)</Label>
            <Input
              id="userNfc"
              value={formData.nfcCode}
              onChange={(e) => setFormData({ ...formData, nfcCode: e.target.value })}
              placeholder="Enter NFC code"
            />
          </div>
          {user?.id && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="userActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <Label htmlFor="userActive">Active User</Label>
            </div>
          )}
          <div className="flex space-x-2">
            <Button onClick={() => onSave(formData)}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const DiscountForm = ({ discount, onSave, onCancel }: { 
    discount?: DiscountCode | null, 
    onSave: (discount: Partial<DiscountCode>) => void,
    onCancel: () => void 
  }) => {
    const [formData, setFormData] = useState({
      code: discount?.code || '',
      name: discount?.name || '',
      type: discount?.type || 'PERCENTAGE',
      value: discount?.value || 0,
      maxUses: discount?.maxUses || 100,
    })

    return (
      <Card>
        <CardHeader>
          <CardTitle>{discount ? 'Edit Discount Code' : 'Add Discount Code'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., SAVE10"
            />
          </div>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., 10% Off Sale"
            />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
              placeholder={formData.type === 'PERCENTAGE' ? '10' : '5.00'}
            />
          </div>
          <div>
            <Label htmlFor="maxUses">Max Uses</Label>
            <Input
              id="maxUses"
              type="number"
              value={formData.maxUses}
              onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) })}
            />
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => onSave(formData)}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to POS
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Settings className="w-6 h-6 mr-2" />
                Settings
              </h1>
              <p className="text-sm text-gray-600">Manage your POS system</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="discounts" className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              Discount Codes
            </TabsTrigger>
            <TabsTrigger value="receipts" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Receipt Settings
            </TabsTrigger>
            <TabsTrigger value="custom-fields" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Custom Fields
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            {editingProduct !== null ? (
              <EnhancedProductForm 
                product={editingProduct}
                onSave={handleSaveProduct}
                onCancel={() => setEditingProduct(null)}
              />
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Products</h2>
                  <Button onClick={() => setEditingProduct({} as Product)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Min Stock</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.sku || 'N/A'}</TableCell>
                            <TableCell>${product.price.toFixed(2)}</TableCell>
                            <TableCell>${(product.cost || 0).toFixed(2)}</TableCell>
                            <TableCell>{product.stock}</TableCell>
                            <TableCell>{product.minStock}</TableCell>
                            <TableCell>{product.category.name}</TableCell>
                            <TableCell>
                              <Badge variant={product.isActive ? 'default' : 'secondary'}>
                                {product.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setEditingProduct(product)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteProduct(product.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {editingUser !== null ? (
              <UserForm 
                user={editingUser}
                onSave={handleSaveUser}
                onCancel={() => setEditingUser(null)}
              />
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Users</h2>
                  <Button onClick={() => setEditingUser({} as User)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>NFC Code</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{user.role}</Badge>
                            </TableCell>
                            <TableCell>{user.nfcCode || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setEditingUser(user)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Discount Codes Tab */}
          <TabsContent value="discounts" className="space-y-6">
            {editingDiscount !== null ? (
              <DiscountForm 
                discount={editingDiscount}
                onSave={(discount) => {
                  console.log('Saving discount:', discount)
                  setEditingDiscount(null)
                }}
                onCancel={() => setEditingDiscount(null)}
              />
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Discount Codes</h2>
                  <Button onClick={() => setEditingDiscount({} as DiscountCode)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Discount Code
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Usage</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {discountCodes.map((discount) => (
                          <TableRow key={discount.id}>
                            <TableCell className="font-mono font-medium">{discount.code}</TableCell>
                            <TableCell>{discount.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {discount.type === 'PERCENTAGE' ? 'Percentage' : 'Fixed Amount'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {discount.type === 'PERCENTAGE' ? `${discount.value}%` : `$${discount.value}`}
                            </TableCell>
                            <TableCell>
                              {discount.currentUses} / {discount.maxUses || '∞'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={discount.isActive ? 'default' : 'secondary'}>
                                {discount.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setEditingDiscount(discount)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Receipt Settings Tab */}
          <TabsContent value="receipts" className="space-y-6">
            <ReceiptSettingsForm 
              settings={receiptSettings}
              onSave={handleSaveReceiptSettings}
            />
          </TabsContent>

          {/* Custom Fields Tab */}
          <TabsContent value="custom-fields" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Custom Fields</h2>
              <Button onClick={() => console.log('Add custom field')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Field
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Options</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customFields.map((field) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-mono">{field.name}</TableCell>
                        <TableCell>{field.label}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{field.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={field.isRequired ? 'destructive' : 'secondary'}>
                            {field.isRequired ? 'Required' : 'Optional'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {field.type === 'select' && field.options ? 
                            field.options.slice(0, 3).join(', ') + (field.options.length > 3 ? '...' : '') :
                            'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Receipt Settings Form Component
interface ReceiptSettingsFormProps {
  settings: ReceiptSettings
  onSave: (settings: ReceiptSettings) => void
}

function ReceiptSettingsForm({ settings, onSave }: ReceiptSettingsFormProps) {
  const [formData, setFormData] = useState<ReceiptSettings>(settings)

  useEffect(() => {
    setFormData(settings)
  }, [settings])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleInputChange = (field: keyof ReceiptSettings, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipt Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Business Information</h3>
              
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="Your business name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main St, City, State 12345"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="info@yourbusiness.com"
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website || ''}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="www.yourbusiness.com"
                />
              </div>
            </div>

            {/* Receipt Customization */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Receipt Customization</h3>
              
              <div>
                <Label htmlFor="headerText">Header Text</Label>
                <Input
                  id="headerText"
                  value={formData.headerText || ''}
                  onChange={(e) => handleInputChange('headerText', e.target.value)}
                  placeholder="Additional header text (optional)"
                />
              </div>

              <div>
                <Label htmlFor="footerText">Footer Text *</Label>
                <Input
                  id="footerText"
                  value={formData.footerText}
                  onChange={(e) => handleInputChange('footerText', e.target.value)}
                  placeholder="Thank you message"
                  required
                />
              </div>

              <div>
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={formData.logoUrl || ''}
                  onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter a URL to an image that will be displayed at the top of receipts
                </p>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Receipt Preview</h3>
            <div className="bg-gray-50 p-4 border rounded-md font-mono text-sm max-w-md">
              <div className="text-center mb-4">
                {formData.logoUrl && (
                  <div className="mb-2">
                    <div className="w-16 h-16 bg-gray-200 mx-auto rounded flex items-center justify-center text-xs">
                      LOGO
                    </div>
                  </div>
                )}
                <h4 className="font-bold text-lg">{formData.businessName || 'Your Business'}</h4>
                {formData.headerText && (
                  <p className="text-xs mt-1">{formData.headerText}</p>
                )}
                {formData.address && <p className="text-xs">{formData.address}</p>}
                {formData.phone && <p className="text-xs">{formData.phone}</p>}
                {formData.email && <p className="text-xs">{formData.email}</p>}
              </div>
              
              <div className="border-b border-dashed border-gray-400 my-2"></div>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Receipt #:</span>
                  <span>REC-001</span>
                </div>
                <div className="flex justify-between">
                  <span>Order #:</span>
                  <span className="font-bold">1</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="border-b border-dashed border-gray-400 my-2"></div>
              
              <div className="space-y-1">
                <div className="font-medium">Sample Item</div>
                <div className="flex justify-between text-xs">
                  <span>1 x $5.00</span>
                  <span>$5.00</span>
                </div>
              </div>
              
              <div className="border-b border-dashed border-gray-400 my-2"></div>
              
              <div className="flex justify-between font-bold">
                <span>TOTAL:</span>
                <span>$5.00</span>
              </div>
              
              <div className="text-center mt-4 text-xs">
                <p>{formData.footerText || 'Thank you for shopping with us!'}</p>
                {formData.website && <p className="mt-1">{formData.website}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Receipt Settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}