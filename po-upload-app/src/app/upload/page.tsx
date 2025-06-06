'use client'

import Layout from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from '@/lib/supabase'
import { useState, useRef } from 'react'
import POForm from '@/components/po-form'

export default function UploadPage() {
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)
  const [documentContent, setDocumentContent] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [ocrMarkdown, setOcrMarkdown] = useState<string>('')
  const [processingOcr, setProcessingOcr] = useState(false)
  const [processingAI, setProcessingAI] = useState(false)
  const [poData, setPoData] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<'ocr' | 'form'>('ocr')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setError(null)
      
      // Clear previous OCR results and PO data when new file is selected
      setOcrMarkdown('')
      setPoData(null)
      setShowForm(false)
      
      // Update success message with new file name
      setDocumentContent(`File selected: ${selectedFile.name}`)
      
      // Preview PDF locally
      const fileUrl = URL.createObjectURL(selectedFile)
      setUploadedFileUrl(fileUrl)
    }
  }

  const performOCR = async (file: File) => {
    setProcessingOcr(true)
    setOcrMarkdown('')
    
    try {
      // Step 1: Upload file to Mistral
      const formData = new FormData()
      formData.append('file', file)
      
      const uploadResponse = await fetch('/api/mistral/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to Mistral')
      }
      
      const uploadData = await uploadResponse.json()
      const fileId = uploadData.id
      
      // Step 2: Get file URL from Mistral
      const urlResponse = await fetch(`/api/mistral/file-url?id=${fileId}&expiry=24`)
      
      if (!urlResponse.ok) {
        throw new Error('Failed to get file URL from Mistral')
      }
      
      const urlData = await urlResponse.json()
      const documentUrl = urlData.url
      
      // Step 3: Perform OCR
      const ocrResponse = await fetch('/api/mistral/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentUrl }),
      })
      
      if (!ocrResponse.ok) {
        throw new Error('Failed to perform OCR')
      }
      
      const ocrData = await ocrResponse.json()
      
      // Extract markdown from the response
      if (ocrData.markdown) {
        setOcrMarkdown(ocrData.markdown)
      } else if (ocrData.pages) {
        // Handle multi-page documents
        const markdownPages = ocrData.pages.map((page: any) => page.markdown || '')
        setOcrMarkdown(markdownPages.join('\n<<<>>>\n'))
      }
      
    } catch (error: any) {
      console.error('OCR Error:', error)
      setError(`OCR Error: ${error.message}`)
    } finally {
      setProcessingOcr(false)
    }
  }

  const processWithAI = async () => {
    if (!ocrMarkdown) {
      setError('No OCR text available to process')
      return
    }

    setProcessingAI(true)
    setError(null)

    try {
      const response = await fetch('/api/openai/extract-po', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ extractedText: ocrMarkdown }),
      })

      if (!response.ok) {
        throw new Error('Failed to process with AI')
      }

      const data = await response.json()
      setPoData(data)
      setShowForm(true)
      setViewMode('form')
    } catch (error: any) {
      console.error('AI Processing Error:', error)
      setError(`AI Processing Error: ${error.message}`)
    } finally {
      setProcessingAI(false)
    }
  }

  const handlePOFormSubmit = (data: any) => {
    console.log('Confirmed PO Data:', data)
    // Here you can add logic to save the data or proceed to the next step
    setShowForm(false)
    // You might want to show a success message or navigate to another page
    setDocumentContent('Purchase order data has been confirmed and saved!')
  }

  const handlePOFormCancel = () => {
    setViewMode('ocr')
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      setError('Please select a file')
      return
    }

    setUploading(true)
    setError(null)
    setDocumentContent('') // Clear previous success message

    try {
      // First, perform OCR on the file
      await performOCR(file)
      
      // Then upload to Supabase Storage
      // Check if bucket exists by attempting to list files
      const { data: listData, error: listError } = await supabase.storage
        .from('purchase-orders')
        .list('', { limit: 1 })

      if (listError) {
        // Check for specific error types
        if (listError.message.includes('not found')) {
          throw new Error('Storage bucket "purchase-orders" not found. Please create it in your Supabase dashboard under Storage.')
        } else if (listError.message.includes('row-level security')) {
          throw new Error('Storage bucket has RLS enabled but no policies. Please either: 1) Disable RLS on the "purchase-orders" bucket in Supabase Storage settings, or 2) Add a policy allowing INSERT for anonymous users.')
        }
      }

      // Upload file to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
        .from('purchase-orders')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        // Check for RLS policy error
        if (error.message && error.message.includes('row-level security')) {
          throw new Error(`Storage RLS Policy Error: The bucket has Row Level Security enabled but no policies allow uploads. 
          
To fix this, go to your Supabase dashboard:
1. Navigate to Storage > Policies
2. Find the "purchase-orders" bucket
3. Either:
   - Disable RLS for this bucket (easier for testing), OR
   - Add a new policy with:
     • Operation: INSERT
     • Target roles: anon (for anonymous users)
     • Policy: true (to allow all uploads)`)
        }
        throw error
      }

      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('purchase-orders')
        .getPublicUrl(fileName)

      setUploadedFileUrl(publicUrl)
      setDocumentContent(`File uploaded successfully! File name: ${file.name}`)
      
      // Reset file input
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
    } catch (error: any) {
      console.error('Error uploading file:', error)
      setError(error.message || 'Error uploading file. Please check your Supabase configuration.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Upload Purchase Order</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <Input 
              ref={fileInputRef}
              type="file" 
              accept="application/pdf,image/*" 
              onChange={handleFileChange}
              disabled={uploading}
            />
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <Button type="submit" disabled={uploading || !file}>
              {uploading ? (processingOcr ? 'Processing OCR...' : 'Uploading...') : 'Upload & Extract'}
            </Button>
          </form>
        </div>

        {/* Document Preview and OCR Results Container */}
        {uploadedFileUrl && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Preview */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Document Preview</h3>
                {documentContent && (
                  <span className="text-sm text-green-600 font-medium">
                    {documentContent}
                  </span>
                )}
              </div>
              <div className="border rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 360px)', maxHeight: '800px' }}>
                <iframe
                  src={uploadedFileUrl}
                  className="w-full h-full"
                  title="Document Preview"
                />
              </div>
            </Card>
            
            {/* OCR Results / PO Form */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {viewMode === 'ocr' ? 'OCR Extracted Text' : 'Purchase Order Form'}
                </h3>
                <div className="flex gap-2">
                  {/* Toggle buttons */}
                  {showForm && (
                    <div className="flex rounded-lg border">
                      <Button
                        variant={viewMode === 'ocr' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('ocr')}
                        className="rounded-r-none"
                      >
                        OCR Text
                      </Button>
                      <Button
                        variant={viewMode === 'form' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('form')}
                        className="rounded-l-none"
                      >
                        PO Form
                      </Button>
                    </div>
                  )}
                  {/* Process with AI button */}
                  {ocrMarkdown && !showForm && (
                    <Button 
                      onClick={processWithAI} 
                      disabled={processingAI}
                      size="sm"
                    >
                      {processingAI ? 'Processing...' : 'Process with AI'}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Content based on view mode */}
              {processingOcr ? (
                <div className="text-gray-500">Processing OCR...</div>
              ) : viewMode === 'ocr' && ocrMarkdown ? (
                <div className="border rounded-lg p-4 overflow-auto" style={{ height: 'calc(100vh - 360px)', maxHeight: '800px' }}>
                  <pre className="whitespace-pre-wrap font-mono text-sm">{ocrMarkdown}</pre>
                </div>
              ) : viewMode === 'form' && showForm && poData ? (
                <div className="overflow-auto" style={{ height: 'calc(100vh - 360px)', maxHeight: '800px' }}>
                  <POForm 
                    initialData={poData}
                    onSubmit={handlePOFormSubmit}
                    onCancel={handlePOFormCancel}
                  />
                </div>
              ) : (
                <div className="text-gray-500">
                  {viewMode === 'ocr' ? 'No OCR results available' : 'No form data available'}
                </div>
              )}
            </Card>
          </div>
        )}
        
      </div>
    </Layout>
  );
}
