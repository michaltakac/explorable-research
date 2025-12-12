'use client'

import { RepoBanner } from './repo-banner'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { isFileInArray } from '@/lib/utils'
import { ArrowUp, FileText, ImageIcon, Paperclip, Square, X } from 'lucide-react'
import { SetStateAction, useEffect, useMemo, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function truncateFileName(name: string, maxLength: number = 20): string {
  if (name.length <= maxLength) return name
  const extension = name.split('.').pop() || ''
  const baseName = name.slice(0, name.length - extension.length - 1)
  const truncatedBase = baseName.slice(0, maxLength - extension.length - 4) + '...'
  return `${truncatedBase}.${extension}`
}

export function ChatInput({
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
  children: React.ReactNode
}) {
  function handleImageInput(e: React.ChangeEvent<HTMLInputElement>) {
    handleFileChange((prev) => {
      const newFiles = Array.from(e.target.files || [])
      const uniqueFiles = newFiles.filter((file) => !isFileInArray(file, prev))
      return [...prev, ...uniqueFiles]
    })
  }

  function handlePdfInput(e: React.ChangeEvent<HTMLInputElement>) {
    handlePdfFileChange((prev) => {
      const newFiles = Array.from(e.target.files || [])
      const uniqueFiles = newFiles.filter((file) => !isFileInArray(file, prev))
      return [...prev, ...uniqueFiles]
    })
  }

  function handleFileRemove(file: File) {
    handleFileChange((prev) => prev.filter((f) => f !== file))
  }

  function handlePdfRemove(file: File) {
    handlePdfFileChange((prev) => prev.filter((f) => f !== file))
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.items)

    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault()

        const file = item.getAsFile()
        if (file) {
          handleFileChange((prev) => {
            if (!isFileInArray(file, prev)) {
              return [...prev, file]
            }
            return prev
          })
        }
      }
    }
  }

  const [dragActive, setDragActive] = useState(false)

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
    
    const droppedImages = allDroppedFiles.filter((file) =>
      file.type.startsWith('image/'),
    )
    
    const droppedPdfs = allDroppedFiles.filter((file) =>
      file.type === 'application/pdf',
    )

    if (droppedImages.length > 0) {
      handleFileChange((prev) => {
        const uniqueFiles = droppedImages.filter(
          (file) => !isFileInArray(file, prev),
        )
        return [...prev, ...uniqueFiles]
      })
    }

    if (droppedPdfs.length > 0) {
      handlePdfFileChange((prev) => {
        const uniqueFiles = droppedPdfs.filter(
          (file) => !isFileInArray(file, prev),
        )
        return [...prev, ...uniqueFiles]
      })
    }
  }

  const imagePreview = useMemo(() => {
    if (files.length === 0) return null
    return Array.from(files).map((file) => {
      return (
        <div className="relative" key={file.name}>
          <span
            onClick={() => handleFileRemove(file)}
            className="absolute top-[-8] right-[-8] bg-muted rounded-full p-1 z-10"
          >
            <X className="h-3 w-3 cursor-pointer" />
          </span>
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="rounded-xl w-10 h-10 object-cover"
          />
        </div>
      )
    })
  }, [files])

  const pdfPreview = useMemo(() => {
    if (pdfFiles.length === 0) return null
    return Array.from(pdfFiles).map((file) => {
      return (
        <div 
          className="relative flex items-center gap-2 bg-muted rounded-xl px-3 py-2 pr-8" 
          key={file.name}
        >
          <span
            onClick={() => handlePdfRemove(file)}
            className="absolute top-[-6px] right-[-6px] bg-background border rounded-full p-1 z-10 cursor-pointer hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </span>
          <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium truncate max-w-[120px]" title={file.name}>
              {truncateFileName(file.name)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </span>
          </div>
        </div>
      )
    })
  }, [pdfFiles])

  function onEnter(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  useEffect(() => {
    if (!isMultiModal) {
      handleFileChange([])
      handlePdfFileChange([])
    }
  }, [isMultiModal])

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={onEnter}
      className="mb-2 mt-auto flex flex-col bg-background"
      onDragEnter={isMultiModal ? handleDrag : undefined}
      onDragLeave={isMultiModal ? handleDrag : undefined}
      onDragOver={isMultiModal ? handleDrag : undefined}
      onDrop={isMultiModal ? handleDrop : undefined}
    >
      {isErrored && (
        <div
          className={`flex items-center p-1.5 text-sm font-medium mx-4 mb-10 rounded-xl ${
            isRateLimited
              ? 'bg-orange-400/10 text-orange-400'
              : 'bg-red-400/10 text-red-400'
          }`}
        >
          <span className="flex-1 px-1.5">{errorMessage}</span>
          <button
            className={`px-2 py-1 rounded-sm ${
              isRateLimited ? 'bg-orange-400/20' : 'bg-red-400/20'
            }`}
            onClick={retry}
          >
            Try again
          </button>
        </div>
      )}
      <div className="relative">
        <RepoBanner className="absolute bottom-full inset-x-2 translate-y-1 z-0 pb-2" />
        <div
          className={`shadow-md rounded-2xl relative z-10 bg-background border ${
            dragActive
              ? 'before:absolute before:inset-0 before:rounded-2xl before:border-2 before:border-dashed before:border-primary'
              : ''
          }`}
        >
          <div className="flex items-center px-3 py-2 gap-1">{children}</div>
          <TextareaAutosize
            autoFocus={true}
            minRows={1}
            maxRows={5}
            className="text-normal px-3 resize-none ring-0 bg-inherit w-full m-0 outline-none"
            placeholder="Add instructions (optional)..."
            disabled={isErrored}
            value={input}
            onChange={handleInputChange}
            onPaste={isMultiModal ? handlePaste : undefined}
          />
          <div className="flex p-3 gap-2 items-center">
            <input
              type="file"
              id="image-upload"
              name="image-upload"
              accept="image/*"
              multiple={true}
              className="hidden"
              onChange={handleImageInput}
            />
            <input
              type="file"
              id="pdf-upload"
              name="pdf-upload"
              accept="application/pdf"
              multiple={true}
              className="hidden"
              onChange={handlePdfInput}
            />
            <div className="flex items-center flex-1 gap-2 flex-wrap">
              <DropdownMenu>
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          disabled={!isMultiModal || isErrored}
                          type="button"
                          variant="outline"
                          size="icon"
                          className="rounded-xl h-10 w-10"
                        >
                          <Paperclip className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Add attachments</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent side="top" align="start" className="w-48">
                  <DropdownMenuItem
                    onClick={() => document.getElementById('pdf-upload')?.click()}
                    className="cursor-pointer"
                  >
                    <FileText className="h-4 w-4 mr-2 text-red-500" />
                    Upload PDFs
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="cursor-pointer"
                  >
                    <ImageIcon className="h-4 w-4 mr-2 text-blue-500" />
                    Upload images
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {pdfFiles.length > 0 && pdfPreview}
              {files.length > 0 && imagePreview}
            </div>
            <div>
              {!isLoading ? (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        disabled={isErrored || (input.trim().length === 0 && files.length === 0 && pdfFiles.length === 0)}
                        variant="default"
                        size="icon"
                        type="submit"
                        className="rounded-xl h-10 w-10"
                      >
                        <ArrowUp className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send message</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-xl h-10 w-10"
                        onClick={(e) => {
                          e.preventDefault()
                          stop()
                        }}
                      >
                        <Square className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Stop generation</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Fragments is an open-source project made by{' '}
        <a href="https://e2b.dev" target="_blank" className="text-[#ff8800]">
          ✶ E2B
        </a>
      </p>
    </form>
  )
}
