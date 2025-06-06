'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

interface LineItem {
  itemNumber?: string
  description?: string
  quantity?: number
  unitPrice?: number
  totalPrice?: number
}

interface POData {
  customerName?: string
  poNumber?: string
  poDate?: string
  lineItems?: LineItem[]
}

interface POFormProps {
  initialData: POData
  onSubmit: (data: POData) => void
  onCancel: () => void
}

export default function POForm({ initialData, onSubmit, onCancel }: POFormProps) {
  // Convert mm/dd/yyyy to yyyy-mm-dd for date input
  const formatDateForInput = (dateStr: string | undefined) => {
    if (!dateStr) return ''
    const parts = dateStr.split('/')
    if (parts.length === 3) {
      const [month, day, year] = parts
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    return dateStr
  }

  const [formData, setFormData] = useState<POData>({
    ...initialData,
    poDate: formatDateForInput(initialData.poDate)
  })

  const handleFieldChange = (field: keyof POData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const newLineItems = [...(formData.lineItems || [])]
    newLineItems[index] = { ...newLineItems[index], [field]: value }
    setFormData(prev => ({ ...prev, lineItems: newLineItems }))
  }

  const addLineItem = () => {
    const newLineItems = [...(formData.lineItems || []), {}]
    setFormData(prev => ({ ...prev, lineItems: newLineItems }))
  }

  const removeLineItem = (index: number) => {
    const newLineItems = formData.lineItems?.filter((_, i) => i !== index) || []
    setFormData(prev => ({ ...prev, lineItems: newLineItems }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Convert date back to mm/dd/yyyy format before submitting
    const submitData = {
      ...formData,
      poDate: formData.poDate ? new Date(formData.poDate).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      }) : ''
    }
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Purchase Order Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              value={formData.customerName || ''}
              onChange={(e) => handleFieldChange('customerName', e.target.value)}
              placeholder="Enter customer name"
            />
          </div>
          <div>
            <Label htmlFor="poNumber">PO Number</Label>
            <Input
              id="poNumber"
              value={formData.poNumber || ''}
              onChange={(e) => handleFieldChange('poNumber', e.target.value)}
              placeholder="Enter PO number"
            />
          </div>
          <div>
            <Label htmlFor="poDate">PO Date</Label>
            <Input
              id="poDate"
              type="date"
              value={formData.poDate || ''}
              onChange={(e) => handleFieldChange('poDate', e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Line Items</h3>
          <Button type="button" onClick={addLineItem} size="sm">
            Add Line Item
          </Button>
        </div>
        
        <div className="space-y-4">
          {formData.lineItems?.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">Item {index + 1}</h4>
                <Button
                  type="button"
                  onClick={() => removeLineItem(index)}
                  size="sm"
                  variant="destructive"
                >
                  Remove
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <Label>Item Number</Label>
                  <Input
                    value={item.itemNumber || ''}
                    onChange={(e) => handleLineItemChange(index, 'itemNumber', e.target.value)}
                    placeholder="Item #"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Input
                    value={item.description || ''}
                    onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                    placeholder="Item description"
                  />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={item.quantity || ''}
                    onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unitPrice || ''}
                    onChange={(e) => handleLineItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Total Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.totalPrice || ''}
                    onChange={(e) => handleLineItemChange(index, 'totalPrice', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          ))}
          
          {(!formData.lineItems || formData.lineItems.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              No line items added yet. Click "Add Line Item" to start.
            </div>
          )}
        </div>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          Confirm and Proceed
        </Button>
      </div>
    </form>
  )
}