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
  price: number
  barcode?: string
  category: { name: string }
  stock: number
  isActive: boolean
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

      // Fetch users
      const usersResponse = await fetch('/api/users')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
      }

      // For now, we'll use mock data for discount codes
      // since the API endpoints don't exist yet
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

  const handleSaveProduct = async (product: Partial<Product>) => {
    // TODO: Implement product save API call
    console.log('Saving product:', product)
    setEditingProduct(null)
  }

  const handleDeleteProduct = async (id: string) => {
    // TODO: Implement product delete API call
    console.log('Deleting product:', id)
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

  const ProductForm = ({ product, onSave, onCancel }: { 
    product?: Product | null, 
    onSave: (product: Partial<Product>) => void,
    onCancel: () => void 
  }) => {
    const [formData, setFormData] = useState({
      name: product?.name || '',
      price: product?.price || 0,
      barcode: product?.barcode || '',
      stock: product?.stock || 0,
    })

    return (
      <Card>
        <CardHeader>
          <CardTitle>{product ? 'Edit Product' : 'Add Product'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="barcode">Barcode</Label>
            <Input
              id="barcode"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
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
          <TabsList className="grid w-full grid-cols-3">
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
                          <TableHead>Price</TableHead>
                          <TableHead>Barcode</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>${product.price.toFixed(2)}</TableCell>
                            <TableCell>{product.barcode || 'N/A'}</TableCell>
                            <TableCell>{product.stock}</TableCell>
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
        </Tabs>
      </div>
    </div>
  )
}
