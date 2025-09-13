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
  Save
} from 'lucide-react'

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
  image?: string
  customFields?: Record<string, any>
  variants?: ProductVariant[]
}

interface ProductVariant {
  id: string
  productId: string
  name: string
  sku?: string
  barcode?: string
  price?: number
  cost?: number
  stock: number
  attributes: Record<string, any>
  isActive: boolean
}

interface CustomFieldDefinition {
  id: string
  name: string
  label: string
  type: 'text' | 'number' | 'boolean' | 'date' | 'select'
  options: string[]
  isRequired: boolean
  isActive: boolean
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

interface SettingsPageProps {
  onBack: () => void
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinition[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null)
  const [editingCustomField, setEditingCustomField] = useState<CustomFieldDefinition | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

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

      // Fetch custom field definitions
      const customFieldsResponse = await fetch('/api/custom-fields')
      if (customFieldsResponse.ok) {
        const customFieldsData = await customFieldsResponse.json()
        setCustomFieldDefinitions(customFieldsData)
      }

      // For now, we'll use mock data for users and discount codes
      // since the API endpoints don't exist yet
      setUsers([
        { id: '1', name: 'Admin User', role: 'ADMIN', isActive: true, nfcCode: 'NFC001' },
        { id: '2', name: 'Cashier 1', role: 'CASHIER', isActive: true },
        { id: '3', name: 'Manager', role: 'MANAGER', isActive: true, nfcCode: 'NFC002' },
      ])

      setDiscountCodes([
        { id: '1', code: 'SAVE10', name: '10% Off', type: 'PERCENTAGE', value: 10, isActive: true, maxUses: 100, currentUses: 5 },
        { id: '2', code: 'WELCOME5', name: 'Welcome $5 Off', type: 'FIXED_AMOUNT', value: 5, isActive: true, maxUses: 50, currentUses: 12 },
      ])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      const method = editingProduct?.id ? 'PUT' : 'POST'
      const url = editingProduct?.id ? `/api/products/${editingProduct.id}` : '/api/products'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...productData,
          customFields: productData.customFields || {}
        }),
      })

      if (response.ok) {
        const savedProduct = await response.json()
        
        if (editingProduct?.id) {
          // Update existing product
          setProducts(products.map(p => p.id === editingProduct.id ? savedProduct : p))
        } else {
          // Add new product
          setProducts([...products, savedProduct])
        }
        
        setEditingProduct(null)
      } else {
        const error = await response.json()
        alert(`Failed to save product: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to save product:', error)
      alert('Failed to save product. Please try again.')
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setProducts(products.filter(p => p.id !== id))
      } else {
        const error = await response.json()
        alert(`Failed to delete product: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('Failed to delete product. Please try again.')
    }
  }

  const ProductForm = ({ product, onSave, onCancel }: { 
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
      setFormData({
        ...formData,
        customFields: {
          ...formData.customFields,
          [fieldName]: value
        }
      })
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>{product?.id ? 'Edit Product' : 'Add Product'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-sm font-medium mb-3">Basic Information</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Product name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Stock keeping unit"
                  />
                </div>
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
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div>
            <h4 className="text-sm font-medium mb-3">Pricing & Inventory</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
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
                    min="0"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="minStock">Min Stock</Label>
                  <Input
                    id="minStock"
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Classification */}
          <div>
            <h4 className="text-sm font-medium mb-3">Classification</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.categoryId} 
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
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

              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          {customFieldDefinitions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Custom Fields</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customFieldDefinitions.map((field) => (
                    <div key={field.id}>
                      <Label htmlFor={field.name}>
                        {field.label}
                        {field.isRequired && ' *'}
                      </Label>
                      {field.type === 'text' && (
                        <Input
                          id={field.name}
                          value={formData.customFields[field.name] || ''}
                          onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                          required={field.isRequired}
                        />
                      )}
                      {field.type === 'number' && (
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          value={formData.customFields[field.name] || ''}
                          onChange={(e) => handleCustomFieldChange(field.name, parseFloat(e.target.value) || '')}
                          required={field.isRequired}
                        />
                      )}
                      {field.type === 'boolean' && (
                        <div className="flex items-center space-x-2">
                          <input
                            id={field.name}
                            type="checkbox"
                            checked={formData.customFields[field.name] || false}
                            onChange={(e) => handleCustomFieldChange(field.name, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={field.name} className="text-sm">
                            Yes
                          </Label>
                        </div>
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
                            {field.options.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button 
              onClick={() => onSave(formData)}
              disabled={!formData.name || !formData.categoryId}
            >
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
          <TabsList className="grid w-full grid-cols-4">
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
            <TabsTrigger value="custom-fields" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Custom Fields
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            {editingProduct !== null ? (
              <ProductForm 
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
                            <TableCell className="text-sm text-gray-600">{product.sku || 'N/A'}</TableCell>
                            <TableCell>${product.price.toFixed(2)}</TableCell>
                            <TableCell>${(product.cost || 0).toFixed(2)}</TableCell>
                            <TableCell>
                              <span className={product.stock <= (product.minStock || 0) ? 'text-red-600 font-medium' : ''}>
                                {product.stock}
                              </span>
                            </TableCell>
                            <TableCell>{product.minStock || 0}</TableCell>
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

          {/* Custom Fields Tab */}
          <TabsContent value="custom-fields" className="space-y-6">
            {editingCustomField !== null ? (
              <Card>
                <CardHeader>
                  <CardTitle>{editingCustomField?.id ? 'Edit Custom Field' : 'Add Custom Field'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fieldName">Field Name</Label>
                      <Input
                        id="fieldName"
                        placeholder="e.g., brand, weight, color"
                        className="lowercase"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fieldLabel">Display Label</Label>
                      <Input
                        id="fieldLabel"
                        placeholder="e.g., Brand, Weight (kg), Color"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fieldType">Field Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select field type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="boolean">Yes/No</SelectItem>
                          <SelectItem value="select">Dropdown</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="required">Required Field</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <input
                          id="required"
                          type="checkbox"
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="required" className="text-sm">
                          This field is required
                        </Label>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="options">Options (for dropdown type)</Label>
                    <Input
                      id="options"
                      placeholder="Option 1, Option 2, Option 3"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate multiple options with commas
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button>
                      <Save className="w-4 h-4 mr-2" />
                      Save Field
                    </Button>
                    <Button variant="outline" onClick={() => setEditingCustomField(null)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Custom Fields</h2>
                  <Button onClick={() => setEditingCustomField({} as CustomFieldDefinition)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Custom Field
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Field Name</TableHead>
                          <TableHead>Label</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Required</TableHead>
                          <TableHead>Options</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customFieldDefinitions.map((field) => (
                          <TableRow key={field.id}>
                            <TableCell className="font-mono text-sm">{field.name}</TableCell>
                            <TableCell className="font-medium">{field.label}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {field.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {field.isRequired ? (
                                <Badge variant="destructive">Required</Badge>
                              ) : (
                                <Badge variant="secondary">Optional</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {field.type === 'select' ? field.options.join(', ') : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setEditingCustomField(field)}
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
        </Tabs>
      </div>
    </div>
  )
}