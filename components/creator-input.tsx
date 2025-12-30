'use client'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { isFileInArray } from '@/lib/utils'
import { track } from '@vercel/analytics'
import { ArrowRight, FileText, ImageIcon, Upload, Square, X, ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react'
import { SetStateAction, useEffect, useMemo, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function truncateFileName(name: string, maxLength: number = 30): string {
  if (name.length <= maxLength) return name
  const extension = name.split('.').pop() || ''
  const baseName = name.slice(0, name.length - extension.length - 1)
  const truncatedBase = baseName.slice(0, maxLength - extension.length - 4) + '...'
  return `${truncatedBase}.${extension}`
}

// File limits
const MAX_PDF_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_PDF_COUNT = 4
const MAX_IMAGE_COUNT = 8

export function CreatorInput({
  retry,
  isErrored,
  errorMessage,
  isLoading,
  isRateLimited,
  stop,
  input,
  handleInputChange,
  handleSubmit,
  isMultiModal,
  files,
  handleFileChange,
  pdfFiles,
  handlePdfFileChange,
  selectedModel,
  children,
}: {
  retry: () => void
  isErrored: boolean
  errorMessage: string
  isLoading: boolean
  isRateLimited: boolean
  stop: () => void
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isMultiModal: boolean
  files: File[]
  handleFileChange: (change: SetStateAction<File[]>) => void
  pdfFiles: File[]
  handlePdfFileChange: (change: SetStateAction<File[]>) => void
  selectedModel: string
  children: React.ReactNode
}) {
  const [showInstructions, setShowInstructions] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  function handlePdfInput(e: React.ChangeEvent<HTMLInputElement>) {
    handlePdfFileChange((prev) => {
      const newFiles = Array.from(e.target.files || [])
      const uniqueFiles = newFiles
        .filter((file) => !isFileInArray(file, prev))
        .filter((file) => file.size <= MAX_PDF_SIZE)
      const availableSlots = MAX_PDF_COUNT - prev.length
      return [...prev, ...uniqueFiles.slice(0, availableSlots)]
    })
  }

  function handleImageInput(e: React.ChangeEvent<HTMLInputElement>) {
    handleFileChange((prev) => {
      const newFiles = Array.from(e.target.files || [])
      const uniqueFiles = newFiles
        .filter((file) => !isFileInArray(file, prev))
        .filter((file) => file.size <= MAX_IMAGE_SIZE)
      const availableSlots = MAX_IMAGE_COUNT - prev.length
      return [...prev, ...uniqueFiles.slice(0, availableSlots)]
    })
  }

  function handlePdfRemove(file: File) {
    handlePdfFileChange((prev) => prev.filter((f) => f !== file))
  }

  function handleFileRemove(file: File) {
    handleFileChange((prev) => prev.filter((f) => f !== file))
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const allDroppedFiles = Array.from(e.dataTransfer.files)
    
    const droppedPdfs = allDroppedFiles.filter((file) =>
      file.type === 'application/pdf' && file.size <= MAX_PDF_SIZE,
    )

    const droppedImages = allDroppedFiles.filter((file) =>
      file.type.startsWith('image/') && file.size <= MAX_IMAGE_SIZE,
    )

    if (droppedPdfs.length > 0) {
      handlePdfFileChange((prev) => {
        const uniqueFiles = droppedPdfs.filter(
          (file) => !isFileInArray(file, prev),
        )
        const availableSlots = MAX_PDF_COUNT - prev.length
        return [...prev, ...uniqueFiles.slice(0, availableSlots)]
      })
    }

    if (droppedImages.length > 0) {
      handleFileChange((prev) => {
        const uniqueFiles = droppedImages.filter(
          (file) => !isFileInArray(file, prev),
        )
        const availableSlots = MAX_IMAGE_COUNT - prev.length
        return [...prev, ...uniqueFiles.slice(0, availableSlots)]
      })
    }
  }

  function trackGenerateExplorable() {
    track('Generate Explorable Click', {
      customInstructions: input.trim(),
      pdfs: JSON.stringify(pdfFiles.map((file) => ({ name: file.name, size: file.size }))),
      images: JSON.stringify(files.map((file) => ({ name: file.name, size: file.size }))),
      model: selectedModel,
    })
  }

  function onEnter(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      trackGenerateExplorable()
      handleSubmit(e)
    }
  }

  useEffect(() => {
    if (!isMultiModal) {
      handleFileChange([])
      handlePdfFileChange([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMultiModal])

  const hasPdfs = pdfFiles.length > 0
  const hasImages = files.length > 0
  const hasContent = hasPdfs || hasImages || input.trim().length > 0

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={onEnter}
      className="w-full max-w-2xl mx-auto"
      onDragEnter={isMultiModal ? handleDrag : undefined}
      onDragLeave={isMultiModal ? handleDrag : undefined}
      onDragOver={isMultiModal ? handleDrag : undefined}
      onDrop={isMultiModal ? handleDrop : undefined}
    >
      {/* Error message */}
      {isErrored && (
        <div
          className={`flex items-center p-3 text-sm font-medium mb-6 rounded-xl ${
            isRateLimited
              ? 'bg-orange-400/10 text-orange-400'
              : 'bg-red-400/10 text-red-400'
          }`}
        >
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            className={`px-3 py-1 rounded-lg ${
              isRateLimited ? 'bg-orange-400/20' : 'bg-red-400/20'
            }`}
            onClick={retry}
          >
            Try again
          </button>
        </div>
      )}

      {/* Main upload area / Loading state */}
      <div
        className={`relative rounded-2xl border-2 transition-all duration-200 ${
          isLoading
            ? 'border-violet-400 dark:border-violet-600 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30'
            : dragActive
            ? 'border-dashed border-violet-500 bg-violet-50 dark:bg-violet-900/20'
            : hasPdfs
            ? 'border-dashed border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-900/10'
            : 'border-dashed border-border hover:border-violet-300 dark:hover:border-violet-700'
        }`}
      >
        <input
          type="file"
          id="pdf-upload"
          name="pdf-upload"
          accept="application/pdf"
          multiple={true}
          className="hidden"
          onChange={handlePdfInput}
        />
        <input
          type="file"
          id="image-upload"
          name="image-upload"
          accept="image/*"
          multiple={true}
          className="hidden"
          onChange={handleImageInput}
        />

        {/* Content */}
        <div className="p-8">
          {isLoading ? (
            // Loading state - generating explorable
            <div className="flex flex-col items-center text-center py-8">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background border-2 border-violet-400 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-violet-600 animate-spin" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Generating your explorable...
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                We{"'"}re analyzing your content and creating an interactive experience. This usually takes 30-60 seconds.
              </p>
              <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>AI is working its magic...</span>
              </div>
            </div>
          ) : !hasPdfs ? (
            // Empty state - prompt to upload
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Upload your research article
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Drop a PDF here or click to browse. We{"'"}ll transform it into an interactive explorable website.
              </p>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => document.getElementById('pdf-upload')?.click()}
                disabled={!isMultiModal || isErrored}
              >
                <Upload className="w-4 h-4" />
                Choose PDF
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Max {MAX_PDF_COUNT} PDFs, up to 10MB each
              </p>
            </div>
          ) : (
            // PDFs uploaded - show them
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-foreground">
                  Uploaded articles ({pdfFiles.length})
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => document.getElementById('pdf-upload')?.click()}
                  disabled={!isMultiModal || isErrored || pdfFiles.length >= MAX_PDF_COUNT}
                >
                  <Upload className="w-3 h-3" />
                  Add more
                </Button>
              </div>
              {pdfFiles.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center gap-3 p-3 bg-background rounded-xl border"
                >
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={file.name}>
                      {truncateFileName(file.name)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handlePdfRemove(file)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Optional instructions toggle - hide when loading */}
      {!isLoading && (
        <div className="mt-4">
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowInstructions(!showInstructions)}
          >
            {showInstructions ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            Add custom instructions (optional)
          </button>
          
          {showInstructions && (
            <div className="mt-3 space-y-3">
              <TextareaAutosize
                minRows={2}
                maxRows={5}
                className="w-full text-sm px-4 py-3 resize-none rounded-xl border bg-background ring-0 outline-none focus:border-violet-300 dark:focus:border-violet-700 transition-colors"
                placeholder="E.g., Focus on the methodology section, include interactive visualizations for the data..."
                disabled={isErrored}
                value={input}
                onChange={handleInputChange}
              />
              
              {/* Optional: Add reference images */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 text-muted-foreground"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  disabled={!isMultiModal || isErrored}
                >
                  <ImageIcon className="w-3 h-3" />
                  Add reference images
                </Button>
                {hasImages && (
                  <div className="flex gap-2">
                    {files.map((file) => (
                      <div key={file.name} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleFileRemove(file)}
                          className="absolute -top-1 -right-1 bg-background border rounded-full p-0.5"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Model/Template selector and submit - or Stop button when loading */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {!isLoading ? (
          <>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {children}
            </div>
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    disabled={isErrored || !hasContent}
                    type="submit"
                    className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white gap-2"
                    onClick={trackGenerateExplorable}
                  >
                    Generate Explorable
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {!hasContent ? 'Upload a PDF or add instructions' : 'Generate interactive explorable'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        ) : (
          <div className="w-full flex justify-center">
            <Button
              variant="outline"
              className="gap-2"
              onClick={(e) => {
                e.preventDefault()
                stop()
              }}
            >
              <Square className="w-4 h-4" />
              Stop generating
            </Button>
          </div>
        )}
      </div>
    </form>
  )
}
