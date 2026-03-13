import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import {
  Plus, Moon, Sun, X, ChevronDown, Sparkles, Eye, ArrowRight,
  ChevronLeft, ChevronRight, Menu, Upload, Trash2, Copy, Check,
  Briefcase, Edit2, Save, Trash, ChevronUp, Bold, Italic, Underline, Type, MoveVertical
} from 'lucide-react'
import { useRef, useState, useEffect, useMemo } from 'react'
import { uploadToCloudinary, fetchImagesByTag, deleteFromCloudinary } from './CloudinaryService'

// Rich Text Editor Component
const RichTextEditor = ({ value, onSave, className = "", isEditMode }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [fontSize, setFontSize] = useState('16')
  const textareaRef = useRef(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  const handleSave = () => {
    onSave(editValue)
    setIsEditing(false)
  }

  const applyStyle = (style) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = editValue.substring(start, end)

    let newText = editValue
    let newCursorPos = end

    switch(style) {
      case 'bold':
        newText = editValue.substring(0, start) + `**${selectedText}**` + editValue.substring(end)
        newCursorPos = end + 4
        break
      case 'italic':
        newText = editValue.substring(0, start) + `*${selectedText}*` + editValue.substring(end)
        newCursorPos = end + 2
        break
      case 'underline':
        newText = editValue.substring(0, start) + `__${selectedText}__` + editValue.substring(end)
        newCursorPos = end + 4
        break
    }

    setEditValue(newText)

    // Restore selection after state update
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const changeFontSize = (delta) => {
    setFontSize(prev => Math.max(12, Math.min(32, parseInt(prev) + delta)).toString())
  }

  if (isEditing && isEditMode) {
    return (
      <div className="relative inline-block w-full">
        <div className="mb-2 flex gap-2 p-2 bg-theme-secondary rounded-lg border border-theme">
          <button
            onClick={() => applyStyle('bold')}
            className={`p-2 rounded hover:bg-[#EAB308]/20 transition-colors ${isBold ? 'bg-[#EAB308]/30' : ''}`}
            title="Bold"
          >
            <Bold size={16} className="text-theme-primary" />
          </button>
          <button
            onClick={() => applyStyle('italic')}
            className={`p-2 rounded hover:bg-[#EAB308]/20 transition-colors ${isItalic ? 'bg-[#EAB308]/30' : ''}`}
            title="Italic"
          >
            <Italic size={16} className="text-theme-primary" />
          </button>
          <button
            onClick={() => applyStyle('underline')}
            className={`p-2 rounded hover:bg-[#EAB308]/20 transition-colors ${isUnderline ? 'bg-[#EAB308]/30' : ''}`}
            title="Underline"
          >
            <Underline size={16} className="text-theme-primary" />
          </button>
          <div className="w-px bg-theme mx-1" />
          <div className="flex items-center gap-1">
            <button
              onClick={() => changeFontSize(-2)}
              className="p-2 rounded hover:bg-[#EAB308]/20 transition-colors"
              title="Decrease font size"
            >
              <Type size={16} className="text-theme-primary" />
            </button>
            <span className="text-sm text-theme-primary w-12 text-center">{fontSize}px</span>
            <button
              onClick={() => changeFontSize(2)}
              className="p-2 rounded hover:bg-[#EAB308]/20 transition-colors"
              title="Increase font size"
            >
              <Type size={16} className="text-theme-primary" />
            </button>
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className={`bg-theme-secondary border-2 border-[#EAB308] rounded-lg px-3 py-2 w-full min-h-[100px] text-theme-primary ${className}`}
          style={{ fontSize: `${fontSize}px` }}
        />
        <button
          onClick={handleSave}
          className="absolute -top-8 right-0 p-1 bg-[#EAB308] text-black rounded-full hover:scale-110 transition-transform"
        >
          <Save size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative group">
      <div
        className={`${className} ${isEditMode ? 'cursor-pointer hover:ring-2 hover:ring-[#EAB308]/30 rounded-lg transition-all p-2' : ''}`}
        onClick={() => isEditMode && setIsEditing(true)}
        dangerouslySetInnerHTML={{
          __html: value
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/__(.*?)__/g, '<u>$1</u>')
        }}
      />
      {isEditMode && !isEditing && (
        <div className="absolute -top-8 right-0 p-1 bg-[#EAB308] text-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit2 size={14} />
        </div>
      )}
    </div>
  )
}

// Gallery Section Component with Reordering
const GallerySection = ({
  id,
  categoryId,
  images,
  title,
  subtitle,
  onImageClick,
  isEditMode,
  onUpload,
  onDelete,
  onTitleEdit,
  onSubtitleEdit,
  onMoveUp,
  onMoveDown,
  onDeleteSection,
  showMoveUp,
  showMoveDown
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mainImageLoaded, setMainImageLoaded] = useState(false)
  const [thumbnailsLoaded, setThumbnailsLoaded] = useState({})
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const autoPlayRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (images.length <= 1 || !isAutoPlaying) return

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
      setMainImageLoaded(false)
    }, 5000)

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [images.length, isAutoPlaying])

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setIsUploading(true)
      const data = await uploadToCloudinary(file, categoryId);
      if (data) onUpload(data)
      setIsUploading(false)
    }
  }

  const selectImage = (index) => {
    setCurrentIndex(index)
    setMainImageLoaded(false)
  }

  const nextImage = () => {
    if (images.length === 0) return
    setCurrentIndex((prev) => (prev + 1) % images.length)
    setMainImageLoaded(false)
  }

  const prevImage = () => {
    if (images.length === 0) return
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    setMainImageLoaded(false)
  }

  const handleThumbnailLoad = (index) => {
    setThumbnailsLoaded(prev => ({ ...prev, [index]: true }))
  }

  // Get flexbox classes instead of grid - this will fill all space
  const getFlexClasses = () => {
    const count = images.length
    return 'flex flex-wrap justify-center gap-3'
  }

  // Calculate width for each thumbnail based on count
  const getThumbnailWidth = () => {
    const count = images.length
    if (count === 1) return 'w-full max-w-[200px]'
    if (count === 2) return 'w-[calc(50%-6px)] max-w-[150px]'
    if (count === 3) return 'w-[calc(33.333%-8px)] max-w-[120px]'
    if (count === 4) return 'w-[calc(50%-6px)] sm:w-[calc(25%-9px)] max-w-[120px]'
    if (count === 5) return 'w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] lg:w-[calc(20%-10px)] max-w-[120px]'
    if (count === 6) return 'w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] lg:w-[calc(16.666%-10px)] max-w-[120px]'
    return 'w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)] max-w-[120px]'
  }

  return (
    <div className="mb-32 relative group/section">
      {/* Section Controls */}
      {isEditMode && (
        <div className="absolute -top-12 right-0 flex gap-2">
          {showMoveUp && (
            <button
              onClick={onMoveUp}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              title="Move section up"
            >
              <ChevronUp size={16} />
            </button>
          )}
          {showMoveDown && (
            <button
              onClick={onMoveDown}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              title="Move section down"
            >
              <ChevronDown size={16} />
            </button>
          )}
          <button
            onClick={onDeleteSection}
            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            title="Delete section"
          >
            <Trash size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div className="flex-1">
          <RichTextEditor
            value={title}
            onSave={onTitleEdit}
            isEditMode={isEditMode}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-theme-primary"
          />
          {subtitle && (
            <RichTextEditor
              value={subtitle}
              onSave={onSubtitleEdit}
              isEditMode={isEditMode}
              className="mt-4 text-theme-secondary text-lg max-w-2xl"
            />
          )}
          <div className="h-[2px] w-24 bg-[#EAB308] mt-6" />
        </div>

        {isEditMode && (
          <div className="flex gap-3">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.svg" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-6 py-3 bg-[#EAB308] text-black rounded-full font-bold hover:scale-105 transition-all disabled:opacity-50 shadow-lg"
            >
              {isUploading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Upload size={20} />}
              Upload Images
            </button>
          </div>
        )}
      </div>

      {images.length === 0 ? (
        <div className="text-center py-12 bg-theme-secondary rounded-2xl border border-dashed border-[#EAB308]/30">
          <p className="text-lg text-theme-primary">No designs available yet.</p>
          {isEditMode && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-6 py-3 bg-[#EAB308] text-black rounded-full font-bold hover:scale-105 transition-all"
            >
              Upload First Image
            </button>
          )}
        </div>
      ) : (
        <div
          className="max-w-6xl mx-auto px-4"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Main Featured Image */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative aspect-video mb-8 group cursor-pointer flex items-center justify-center overflow-visible"
            onClick={() => onImageClick(images[currentIndex])}
          >
            {!mainImageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#EAB308] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <motion.img
              key={images[currentIndex]?.url}
              src={images[currentIndex]?.url}
              alt={`${title} featured`}
              className={`w-full h-full object-contain transition-opacity duration-500 image-preserve ${mainImageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setMainImageLoaded(true)}
            />

            {isEditMode && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if(confirm("Permanently delete this image?")) {
                    const success = await deleteFromCloudinary(images[currentIndex].public_id);
                    if (success) {
                      onDelete(currentIndex);
                      if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
                    } else {
                      alert("Failed to delete from server. Please try again.");
                    }
                  }
                }}
                className="absolute top-4 left-4 p-3 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-20"
              >
                <Trash2 size={20} />
              </button>
            )}

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/50 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-10"
                >
                  <ChevronLeft size={24} className="text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/50 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-10"
                >
                  <ChevronRight size={24} className="text-white" />
                </button>
              </>
            )}

            {/* Indicators */}
            <div className="absolute bottom-4 left-4 flex gap-1">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'w-8 bg-[#EAB308]'
                      : 'w-2 bg-white/50'
                  }`}
                />
              ))}
            </div>

            <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </motion.div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={getFlexClasses()}
            >
              {images.map((img, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className={getThumbnailWidth()}
                >
                  <div
                    className={`relative w-full pb-[100%] rounded-lg overflow-hidden bg-black cursor-pointer transition-all duration-300 ${
                      index === currentIndex
                        ? 'ring-4 ring-[#EAB308] shadow-xl'
                        : 'ring-2 ring-transparent hover:ring-[#EAB308]/50'
                    }`}
                    onClick={() => selectImage(index)}
                  >
                    {!thumbnailsLoaded[index] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                        <div className="w-6 h-6 border-3 border-[#EAB308] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <img
                      src={img.url}
                      alt=""
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 image-preserve ${thumbnailsLoaded[index] ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => handleThumbnailLoad(index)}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                      <Eye size={20} className="text-white" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}

// Rich Text Editable Component for simple text
const RichEditableText = ({ value, onSave, className = "", tag = "span", isEditMode }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleSave = () => {
    onSave(editValue)
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && tag !== 'p') {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      setEditValue(value)
      setIsEditing(false)
    }
  }

  const Tag = tag

  if (isEditing && isEditMode) {
    return (
      <div className="relative inline-block group w-full">
        {tag === 'p' ? (
          <textarea
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={`bg-theme-secondary border-2 border-[#EAB308] rounded-lg px-3 py-2 w-full min-h-[100px] text-theme-primary ${className}`}
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={`bg-theme-secondary border-2 border-[#EAB308] rounded-lg px-3 py-1 text-theme-primary ${className}`}
          />
        )}
        <button
          onClick={handleSave}
          className="absolute -top-8 right-0 p-1 bg-[#EAB308] text-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Save size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative group">
      <Tag className={`${className} ${isEditMode ? 'cursor-pointer hover:ring-2 hover:ring-[#EAB308]/30 rounded-lg transition-all' : ''}`}
        onClick={() => isEditMode && setIsEditing(true)}
      >
        {value}
      </Tag>
      {isEditMode && !isEditing && (
        <div className="absolute -top-8 right-0 p-1 bg-[#EAB308] text-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit2 size={14} />
        </div>
      )}
    </div>
  )
}

// CRUD Controls Component
const CrudControls = ({ onAdd, onDelete, onMoveUp, onMoveDown, showMove = true, className = "" }) => {
  return (
    <div className={`flex gap-2 ${className}`}>
      {onAdd && (
        <button
          onClick={onAdd}
          className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
          title="Add new"
        >
          <Plus size={16} />
        </button>
      )}
      {onMoveUp && showMove && (
        <button
          onClick={onMoveUp}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          title="Move up"
        >
          <ChevronUp size={16} />
        </button>
      )}
      {onMoveDown && showMove && (
        <button
          onClick={onMoveDown}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          title="Move down"
        >
          <ChevronDown size={16} />
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          title="Delete"
        >
          <Trash size={16} />
        </button>
      )}
    </div>
  )
}

// Optimized Image Modal Component
const ImageModal = ({ src, isOpen, onClose, onPrev, onNext }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  useEffect(() => {
    const handlePopState = () => {
      if (isOpen) {
        onClose()
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: true }, '')
    } else {
      if (window.history.state?.modal) {
        window.history.back()
      }
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onPrev, onNext])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
    if (isOpen) setImageLoaded(false)
  }, [isOpen, src])

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      onNext()
    } else if (isRightSwipe) {
      onPrev()
    }

    setTouchStart(0)
    setTouchEnd(0)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl"
          onClick={onClose}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="absolute top-8 right-8 p-4 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors z-[101]"
          >
            <X size={28} className="text-white" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onPrev() }}
            className="hidden md:block absolute left-2 md:left-8 p-2 md:p-4 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full transition-all group z-[101]"
          >
            <ChevronLeft size={32} className="text-white group-hover:scale-110 transition-transform" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onNext() }}
            className="hidden md:block absolute right-2 md:right-8 p-2 md:p-4 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full transition-all group z-[101]"
          >
            <ChevronRight size={32} className="text-white group-hover:scale-110 transition-transform" />
          </button>

          <div className="absolute top-20 left-1/2 -translate-x-1/2 md:hidden text-white/50 text-sm bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
            ← swipe to navigate →
          </div>

          <motion.div
            key={src?.url}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="relative max-w-[95vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#EAB308] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <img
              src={src?.url}
              alt="Project View"
              className={`max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Section Title Component
const SectionTitle = ({ children, align = "left", subtitle, isEditMode, onTitleEdit, onSubtitleEdit }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`mb-12 ${align === 'center' ? 'text-center' : ''}`}
  >
    <RichEditableText
      value={children}
      onSave={onTitleEdit}
      tag="h2"
      isEditMode={isEditMode}
      className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-theme-primary"
    />
    {subtitle && (
      <RichEditableText
        value={subtitle}
        onSave={onSubtitleEdit}
        tag="p"
        isEditMode={isEditMode}
        className="mt-4 text-theme-secondary text-lg max-w-2xl mx-auto"
      />
    )}
    <div className={`h-[2px] w-24 bg-[#EAB308] mt-6 ${align === 'center' ? 'mx-auto' : ''}`} />
  </motion.div>
)

// Experience Section Component with Full CRUD
const ExperienceSection = ({ isEditMode }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expData, setExpData] = useState({
    summary: `Senior Graphic Designer with over 8 years of experience in digital printing, brand identity, and web design.
    Passionate about creating clean, purposeful designs that communicate effectively and deliver results.`,

    work: [
      {
        id: '1',
        title: "Senior Graphic Designer",
        company: "Skills Unlimited Digital Printing Services",
        period: "December 2025 - Present",
        type: "Freelance",
        responsibilities: [
          { id: '1-1', text: "Led end-to-end design production for large- and small-format digital printing projects, including banners, stickers, DTF, sublimation, signage, packaging, and marketing collateral." },
          { id: '1-2', text: "Prepared press-ready files and managed pre-press workflows, ensuring accurate color profiles, bleed, imposition, production efficiency, and minimal material waste." },
          { id: '1-3', text: "Coordinated with production teams and clients to ensure on-time delivery, supervised print quality control, and mentored junior designers on workflow and print standards." }
        ]
      },
      {
        id: '2',
        title: "Graphic Designer",
        company: "The Branding Agency",
        period: "November 2024 - October 2025",
        type: "Full Time",
        responsibilities: [
          { id: '2-1', text: "Designed impactful brand identities and marketing materials that effectively communicated client messages while maintaining cross-platform consistency." },
          { id: '2-2', text: "Collaborated with clients and cross-functional teams to achieve project goals, meet deadlines, and uphold high creative standards." },
          { id: '2-3', text: "Stayed current with design trends and industry best practices to deliver innovative, high-quality visual solutions." }
        ]
      },
      {
        id: '3',
        title: "Web Designer",
        company: "3LC Corporation",
        period: "June 2020 - November 2024",
        type: "Freelance",
        responsibilities: [
          { id: '3-1', text: "Designed and maintained conversion-focused e-commerce websites for a deepdiving business, ensuring strong user experience, mobile responsiveness, and brand consistency." },
          { id: '3-2', text: "Managed product listings, pricing updates, inventory synchronization, and developed customized landing pages and promotional campaigns." },
          { id: '3-3', text: "Integrated payment gateways, order tracking systems, and third-party apps while monitoring analytics, applying basic SEO, and optimizing site performance." }
        ]
      },
      {
        id: '4',
        title: "Junior Graphic Designer",
        company: "Skills Unlimited Digital Printing Services",
        period: "January 2015 - May 2024",
        type: "Full Time",
        responsibilities: [
          { id: '4-1', text: "Designed and prepared print-ready artwork for banners, tarpaulins, flyers, stickers, and apparel (DTF/sublimation), ensuring high-quality and production-ready outputs." },
          { id: '4-2', text: "Converted client-provided files into accurate production formats and assisted in pre-press processes, including file checking, resizing, imposition, and RIP software preparation." },
          { id: '4-3', text: "Coordinated with senior designers and production staff to ensure print accuracy and on-time delivery, while supporting walk-in clients with layout revisions and rush print requests." }
        ]
      },
      {
        id: '5',
        title: "IT Manager | MIS Coordinator",
        company: "Holy Trinity School",
        period: "June 2013 - October 2014",
        type: "Full Time",
        responsibilities: [
          { id: '5-1', text: "Oversaw the school's IT infrastructure and administered the Management Information System (MIS) for enrollment, grading, attendance, billing, and academic records." },
          { id: '5-2', text: "Led digital transformation initiatives by streamlining workflows, automating processes, and integrating technology across academic and administrative departments." },
          { id: '5-3', text: "Provided technical support, implemented data security protocols and backup systems, and developed analytical reporting tools." }
        ]
      }
    ],

    education: {
      degree: "Bachelor of Information Technology - Multimedia",
      school: "Holy Angel University",
      period: "June 2008 - April 2013"
    }
  })

  // Generate unique IDs
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Summary CRUD
  const updateSummary = (newSummary) => {
    setExpData(prev => ({ ...prev, summary: newSummary }))
  }

  // Work CRUD
  const addWork = () => {
    const newWork = {
      id: generateId(),
      title: "New Position",
      company: "Company Name",
      period: "Start Date - End Date",
      type: "Full Time",
      responsibilities: []
    }
    setExpData(prev => ({
      ...prev,
      work: [...prev.work, newWork]
    }))
  }

  const deleteWork = (workId) => {
    if (confirm("Delete this work experience?")) {
      setExpData(prev => ({
        ...prev,
        work: prev.work.filter(w => w.id !== workId)
      }))
    }
  }

  const moveWork = (workId, direction) => {
    const index = expData.work.findIndex(w => w.id === workId)
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === expData.work.length - 1)
    ) return

    const newWork = [...expData.work]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[newWork[index], newWork[newIndex]] = [newWork[newIndex], newWork[index]]

    setExpData(prev => ({ ...prev, work: newWork }))
  }

  const updateWork = (workId, field, value) => {
    setExpData(prev => ({
      ...prev,
      work: prev.work.map(item =>
        item.id === workId ? { ...item, [field]: value } : item
      )
    }))
  }

  // Responsibility CRUD
  const addResponsibility = (workId) => {
    const newResp = {
      id: generateId(),
      text: "New responsibility"
    }
    setExpData(prev => ({
      ...prev,
      work: prev.work.map(item =>
        item.id === workId
          ? { ...item, responsibilities: [...item.responsibilities, newResp] }
          : item
      )
    }))
  }

  const deleteResponsibility = (workId, respId) => {
    if (confirm("Delete this responsibility?")) {
      setExpData(prev => ({
        ...prev,
        work: prev.work.map(item =>
          item.id === workId
            ? { ...item, responsibilities: item.responsibilities.filter(r => r.id !== respId) }
            : item
        )
      }))
    }
  }

  const moveResponsibility = (workId, respId, direction) => {
    const work = expData.work.find(w => w.id === workId)
    const index = work.responsibilities.findIndex(r => r.id === respId)

    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === work.responsibilities.length - 1)
    ) return

    const newResponsibilities = [...work.responsibilities]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[newResponsibilities[index], newResponsibilities[newIndex]] = [newResponsibilities[newIndex], newResponsibilities[index]]

    setExpData(prev => ({
      ...prev,
      work: prev.work.map(item =>
        item.id === workId ? { ...item, responsibilities: newResponsibilities } : item
      )
    }))
  }

  const updateResponsibility = (workId, respId, value) => {
    setExpData(prev => ({
      ...prev,
      work: prev.work.map(item =>
        item.id === workId ? {
          ...item,
          responsibilities: item.responsibilities.map(r =>
            r.id === respId ? { ...r, text: value } : r
          )
        } : item
      )
    }))
  }

  // Education CRUD
  const updateEducation = (field, value) => {
    setExpData(prev => ({
      ...prev,
      education: { ...prev.education, [field]: value }
    }))
  }

  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12 bg-theme-secondary transition-colors duration-500">
      <div className="max-w-5xl mx-auto relative">
        {isEditMode && (
          <CrudControls
            onAdd={addWork}
            className="absolute -top-12 right-0"
          />
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between gap-4 p-6 rounded-2xl bg-theme-primary border border-theme hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#EAB308]/10 rounded-full">
              <Briefcase size={24} className="text-[#EAB308]" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-theme-primary">Professional Experience</h2>
              <p className="text-sm text-theme-secondary opacity-60">Click to {isExpanded ? 'collapse' : 'expand'} my career journey</p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="p-2 rounded-full bg-theme-secondary group-hover:bg-[#EAB308]/10 transition-colors"
          >
            <ChevronDown size={24} className="text-[#EAB308]" />
          </motion.div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="overflow-hidden"
            >
              <div className="mt-8 space-y-12">
                {/* Professional Summary */}
                <div className="bg-theme-primary rounded-2xl p-8 border border-theme relative">
                  {isEditMode && (
                    <CrudControls
                      onDelete={() => {
                        if (confirm("Clear summary?")) {
                          updateSummary("")
                        }
                      }}
                      className="absolute top-4 right-4"
                    />
                  )}
                  <h3 className="text-xl font-bold text-[#EAB308] mb-4">Professional Summary</h3>
                  <RichTextEditor
                    value={expData.summary}
                    onSave={updateSummary}
                    isEditMode={isEditMode}
                    className="text-theme-secondary leading-relaxed"
                  />
                </div>

                {/* Work Experience */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-theme-primary">Work History</h3>
                  </div>

                  {expData.work.map((job, index) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative pl-8 border-l-2 border-[#EAB308]/30 hover:border-[#EAB308] transition-colors group"
                    >
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#EAB308] opacity-30 group-hover:opacity-100 transition-opacity" />

                      {isEditMode && (
                        <CrudControls
                          onAdd={() => addResponsibility(job.id)}
                          onDelete={() => deleteWork(job.id)}
                          onMoveUp={() => moveWork(job.id, 'up')}
                          onMoveDown={() => moveWork(job.id, 'down')}
                          className="absolute -top-2 right-0"
                        />
                      )}

                      <div className="bg-theme-primary rounded-xl p-6 border border-theme hover:shadow-lg transition-all">
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                          <div>
                            <RichEditableText
                              value={job.title}
                              onSave={(val) => updateWork(job.id, 'title', val)}
                              tag="h4"
                              isEditMode={isEditMode}
                              className="text-xl font-bold text-theme-primary"
                            />
                            <RichEditableText
                              value={job.company}
                              onSave={(val) => updateWork(job.id, 'company', val)}
                              tag="span"
                              isEditMode={isEditMode}
                              className="text-[#EAB308] font-medium"
                            />
                          </div>
                          <div className="text-right">
                            <RichEditableText
                              value={job.period}
                              onSave={(val) => updateWork(job.id, 'period', val)}
                              tag="div"
                              isEditMode={isEditMode}
                              className="text-sm text-theme-secondary opacity-60"
                            />
                            <RichEditableText
                              value={job.type}
                              onSave={(val) => updateWork(job.id, 'type', val)}
                              tag="div"
                              isEditMode={isEditMode}
                              className="text-xs px-3 py-1 bg-[#EAB308]/10 text-[#EAB308] rounded-full mt-2"
                            />
                          </div>
                        </div>

                        <ul className="space-y-3">
                          {job.responsibilities.map((resp, respIndex) => (
                            <li key={resp.id} className="flex gap-3 group/resp">
                              <span className="text-[#EAB308] mt-1">•</span>
                              <RichTextEditor
                                value={resp.text}
                                onSave={(val) => updateResponsibility(job.id, resp.id, val)}
                                isEditMode={isEditMode}
                                className="text-theme-secondary text-sm leading-relaxed flex-1"
                              />
                              {isEditMode && (
                                <CrudControls
                                  onDelete={() => deleteResponsibility(job.id, resp.id)}
                                  onMoveUp={() => moveResponsibility(job.id, resp.id, 'up')}
                                  onMoveDown={() => moveResponsibility(job.id, resp.id, 'down')}
                                  className="opacity-0 group-hover/resp:opacity-100 transition-opacity"
                                />
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Education */}
                <div className="bg-theme-primary rounded-2xl p-8 border border-theme relative">
                  {isEditMode && (
                    <CrudControls
                      onDelete={() => {
                        if (confirm("Clear education?")) {
                          updateEducation('degree', '')
                          updateEducation('school', '')
                          updateEducation('period', '')
                        }
                      }}
                      className="absolute top-4 right-4"
                    />
                  )}
                  <h3 className="text-xl font-bold text-[#EAB308] mb-4">Education</h3>
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <RichEditableText
                        value={expData.education.degree}
                        onSave={(val) => updateEducation('degree', val)}
                        tag="h4"
                        isEditMode={isEditMode}
                        className="text-lg font-bold text-theme-primary"
                      />
                      <RichEditableText
                        value={expData.education.school}
                        onSave={(val) => updateEducation('school', val)}
                        tag="p"
                        isEditMode={isEditMode}
                        className="text-theme-secondary"
                      />
                    </div>
                    <RichEditableText
                      value={expData.education.period}
                      onSave={(val) => updateEducation('period', val)}
                      tag="span"
                      isEditMode={isEditMode}
                      className="text-sm text-theme-secondary opacity-60"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

// Stat Item Component with CRUD
const StatItem = ({ stat, index, onUpdate, onDelete, onMove, isEditMode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
      className="relative group/stat"
    >
      {isEditMode && (
        <CrudControls
          onDelete={onDelete}
          onMoveUp={() => onMove('up')}
          onMoveDown={() => onMove('down')}
          className="absolute -top-8 right-0 opacity-0 group-hover/stat:opacity-100 transition-opacity"
        />
      )}
      <RichEditableText
        value={stat.n}
        onSave={(val) => onUpdate('n', val)}
        tag="div"
        isEditMode={isEditMode}
        className="text-xl sm:text-2xl md:text-3xl font-bold text-[#EAB308]"
      />
      <RichEditableText
        value={stat.l}
        onSave={(val) => onUpdate('l', val)}
        tag="div"
        isEditMode={isEditMode}
        className="text-xs sm:text-sm text-theme-secondary"
      />
    </motion.div>
  )
}

// Promise Item Component with CRUD
const PromiseItem = ({ item, index, onUpdate, onDelete, onMove, isEditMode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.2 }}
      viewport={{ once: true }}
      className="group p-4 sm:p-5 md:p-6 lg:p-8 rounded-[30px] sm:rounded-[35px] md:rounded-[40px] bg-theme-primary border border-theme hover:shadow-xl transition-all duration-500 relative"
    >
      {isEditMode && (
        <CrudControls
          onDelete={onDelete}
          onMoveUp={() => onMove('up')}
          onMoveDown={() => onMove('down')}
          className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      )}
      <RichEditableText
        value={item.n}
        onSave={(val) => onUpdate('n', val)}
        tag="div"
        isEditMode={isEditMode}
        className="text-4xl sm:text-5xl md:text-6xl font-black text-[#EAB308]/20 mb-3 sm:mb-4 md:mb-5 lg:mb-6"
      />
      <RichEditableText
        value={item.t}
        onSave={(val) => onUpdate('t', val)}
        tag="h3"
        isEditMode={isEditMode}
        className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 md:mb-4 text-theme-primary"
      />
      <RichTextEditor
        value={item.d}
        onSave={(val) => onUpdate('d', val)}
        isEditMode={isEditMode}
        className="text-sm sm:text-base md:text-lg text-theme-secondary leading-relaxed"
      />
    </motion.div>
  )
}

function App() {
  const [isEditMode] = useState(() => {
    if (window.location.search.includes('view=public') || window.location.pathname.includes('ronmedina')) return false;
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.search.includes('edit=true');
  })

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // State for gallery sections
  const [gallerySections, setGallerySections] = useState([
    {
      id: 'uiux',
      categoryId: 'uiux_design',
      title: 'UI/UX Design',
      subtitle: 'Clean, intuitive interfaces for digital products',
      images: []
    },
    {
      id: 'brand',
      categoryId: 'brand_identity',
      title: 'Brand Identity',
      subtitle: 'Guidelines and identity systems that define brands',
      images: []
    },
    {
      id: 'social',
      categoryId: 'social_media',
      title: 'Social Media',
      subtitle: 'Engaging visual content for social platforms',
      images: []
    },
    {
      id: 'print',
      categoryId: 'presentations_print',
      title: 'Presentations & Print',
      subtitle: 'Professional presentation and print materials',
      images: []
    }
  ])

  const [profileUrl, setProfileUrl] = useState(localStorage.getItem('ron_profile_url') || '')
  const [profileId, setProfileId] = useState(localStorage.getItem('ron_profile_id') || '')
  const [bgUrl, setBgUrl] = useState(localStorage.getItem('ron_bg_url') || '')
  const [bgId, setBgId] = useState(localStorage.getItem('ron_bg_id') || '')
  const [loading, setLoading] = useState(true)

  // Editable text states with CRUD
  const [heroTitle, setHeroTitle] = useState("Simplicity.")
  const [heroSubtitle, setHeroSubtitle] = useState("Pure. Precise. Purposeful.")
  const [aboutName, setAboutName] = useState("Ron Medina")
  const [aboutText, setAboutText] = useState("Designing simplicity out of complexity. Currently crafting digital experiences that matter.")

  // Stats with CRUD
  const [stats, setStats] = useState([
    { id: '1', n: '5+', l: 'Years Experience' },
    { id: '2', n: '100+', l: 'Projects' },
    { id: '3', n: '50+', l: 'Happy Clients' }
  ])

  // Promise items with CRUD
  const [promiseItems, setPromiseItems] = useState([
    { id: '1', n: "01", t: "Designs you will love", d: "I love creating new things — it's what drives me. Great teamwork always brings ideas to life." },
    { id: '2', n: "02", t: "Stress free work", d: "I keep things simple — no stress, no drama — just results that help move forward." }
  ])

  // Contact section with CRUD
  const [contactTitle, setContactTitle] = useState("Let's create something amazing")
  const [contactText, setContactText] = useState("Ready to bring your ideas to life? Let's collaborate and make something extraordinary together.")
  const [contactButton, setContactButton] = useState("Get in touch")

  // Footer with CRUD
  const [footerName, setFooterName] = useState("Ron Medina")
  const [footerText, setFooterText] = useState("Designing simplicity out of complexity.")
  const [footerEmail, setFooterEmail] = useState("hello@ronmedina.com")
  const [copyright, setCopyright] = useState("© 2024 Ron Medina. All rights reserved.")

  // Generate unique IDs
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Gallery Section CRUD
  const addGallerySection = () => {
    const newSection = {
      id: generateId(),
      categoryId: generateId(),
      title: 'New Gallery Section',
      subtitle: 'Add a description here',
      images: []
    }
    setGallerySections(prev => [...prev, newSection])
  }

  const deleteGallerySection = (sectionId) => {
    if (confirm("Delete this entire gallery section?")) {
      setGallerySections(prev => prev.filter(s => s.id !== sectionId))
    }
  }

  const moveGallerySection = (sectionId, direction) => {
    const index = gallerySections.findIndex(s => s.id === sectionId)
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === gallerySections.length - 1)
    ) return

    const newSections = [...gallerySections]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]]

    setGallerySections(newSections)
  }

  const updateGallerySection = (sectionId, field, value) => {
    setGallerySections(prev => prev.map(section =>
      section.id === sectionId ? { ...section, [field]: value } : section
    ))
  }

  const updateGalleryImages = (sectionId, images) => {
    setGallerySections(prev => prev.map(section =>
      section.id === sectionId ? { ...section, images } : section
    ))
  }

  // Stats CRUD
  const addStat = () => {
    setStats(prev => [...prev, { id: generateId(), n: 'New', l: 'New Stat' }])
  }

  const updateStat = (id, field, value) => {
    setStats(prev => prev.map(stat =>
      stat.id === id ? { ...stat, [field]: value } : stat
    ))
  }

  const deleteStat = (id) => {
    if (confirm("Delete this stat?")) {
      setStats(prev => prev.filter(stat => stat.id !== id))
    }
  }

  const moveStat = (id, direction) => {
    const index = stats.findIndex(s => s.id === id)
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === stats.length - 1)
    ) return

    const newStats = [...stats]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[newStats[index], newStats[newIndex]] = [newStats[newIndex], newStats[index]]

    setStats(newStats)
  }

  // Promise Items CRUD
  const addPromiseItem = () => {
    const newNumber = (promiseItems.length + 1).toString().padStart(2, '0')
    setPromiseItems(prev => [...prev, {
      id: generateId(),
      n: newNumber,
      t: 'New Title',
      d: 'New description'
    }])
  }

  const updatePromiseItem = (id, field, value) => {
    setPromiseItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const deletePromiseItem = (id) => {
    if (confirm("Delete this promise item?")) {
      setPromiseItems(prev => prev.filter(item => item.id !== id))
    }
  }

  const movePromiseItem = (id, direction) => {
    const index = promiseItems.findIndex(i => i.id === id)
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === promiseItems.length - 1)
    ) return

    const newItems = [...promiseItems]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]]

    // Update numbers
    setPromiseItems(newItems.map((item, i) => ({
      ...item,
      n: (i + 1).toString().padStart(2, '0')
    })))
  }

  useEffect(() => {
    const loadAllImages = async () => {
      setLoading(true)
      try {
        const [uiux, brand, social, print, profiles, bgs] = await Promise.all([
          fetchImagesByTag('uiux_design'),
          fetchImagesByTag('brand_identity'),
          fetchImagesByTag('social_media'),
          fetchImagesByTag('presentations_print'),
          fetchImagesByTag('static_profile'),
          fetchImagesByTag('static_bg')
        ])

        setGallerySections([
          {
            id: 'uiux',
            categoryId: 'uiux_design',
            title: 'UI/UX Design',
            subtitle: 'Clean, intuitive interfaces for digital products',
            images: uiux
          },
          {
            id: 'brand',
            categoryId: 'brand_identity',
            title: 'Brand Identity',
            subtitle: 'Guidelines and identity systems that define brands',
            images: brand
          },
          {
            id: 'social',
            categoryId: 'social_media',
            title: 'Social Media',
            subtitle: 'Engaging visual content for social platforms',
            images: social
          },
          {
            id: 'print',
            categoryId: 'presentations_print',
            title: 'Presentations & Print',
            subtitle: 'Professional presentation and print materials',
            images: print
          }
        ])

        if (profiles.length > 0) {
          const latest = profiles.sort((a,b) => b.version - a.version)[0];
          setProfileUrl(latest.url); setProfileId(latest.public_id);
          localStorage.setItem('ron_profile_url', latest.url); localStorage.setItem('ron_profile_id', latest.public_id);
        }
        if (bgs.length > 0) {
          const latest = bgs.sort((a,b) => b.version - a.version)[0];
          setBgUrl(latest.url); setBgId(latest.public_id);
          localStorage.setItem('ron_bg_url', latest.url); localStorage.setItem('ron_bg_id', latest.public_id);
        }
      } catch (error) {
        console.error('Error loading portfolio images:', error)
      } finally {
        setLoading(false)
      }
    }
    loadAllImages()
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

  const [selectedImage, setSelectedImage] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const heroRef = useRef(null)
  const workRef = useRef(null)
  const aboutRef = useRef(null)
  const contactRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fixed useScroll with layoutEffect: false to prevent warning
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
    layoutEffect: false
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.8])

  const handleStaticUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const currentImages = await fetchImagesByTag(`static_${type}`);
    if (currentImages.length > 0) {
      for (const img of currentImages) {
        await deleteFromCloudinary(img.public_id);
      }
    }

    const data = await uploadToCloudinary(file, `static_${type}`);
    if (data) {
      if (type === 'profile') {
        setProfileUrl(data.url); setProfileId(data.public_id);
        localStorage.setItem('ron_profile_url', data.url); localStorage.setItem('ron_profile_id', data.public_id);
      }
      else {
        setBgUrl(data.url); setBgId(data.public_id);
        localStorage.setItem('ron_bg_url', data.url); localStorage.setItem('ron_bg_id', data.public_id);
      }
    }
  }

  const allAssets = useMemo(() => gallerySections.flatMap(section => section.images), [gallerySections])

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
    setMobileMenuOpen(false)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#EAB308] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-theme-primary text-theme-primary transition-colors duration-500 overflow-x-hidden min-h-screen relative">

      {/* Navigation - Exact Original */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8 }}
        className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-12 transition-all ${
          scrolled ? "bg-theme-primary/80 backdrop-blur-md shadow-sm py-2" : "bg-transparent py-4"
        }`}
      >
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
          <div className="w-10 h-10 rounded-full bg-[#EAB308] overflow-hidden">
            <img src={profileUrl} alt="Ron" className="w-full h-full object-cover" />
          </div>
          <span className={`font-bold transition-colors ${scrolled ? "text-theme-primary" : "text-white"}`}>
            RON MEDINA
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <div className={`flex gap-8 text-sm font-medium transition-colors ${scrolled ? "text-theme-secondary" : "text-white/80"}`}>
            <button onClick={() => scrollToSection(workRef)} className="hover:text-[#EAB308] transition-colors">Work</button>
            <button onClick={() => scrollToSection(aboutRef)} className="hover:text-[#EAB308] transition-colors">About</button>
            <button onClick={() => scrollToSection(contactRef)} className="hover:text-[#EAB308] transition-colors">Contact</button>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full transition-colors bg-white/10">
            {darkMode ? <Sun size={18} className={scrolled ? "text-theme-primary" : "text-white"} /> : <Moon size={18} className={scrolled ? "text-theme-primary" : "text-white"} />}
          </button>
        </div>

        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 bg-white/10 rounded-full transition-colors">
          {mobileMenuOpen ? <X size={18} className={scrolled || darkMode ? "text-theme-primary" : "text-white"} /> : <Menu size={18} className={scrolled || darkMode ? "text-theme-primary" : "text-white"} />}
        </button>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-4 right-4 md:hidden bg-theme-primary rounded-2xl shadow-xl border border-theme p-4"
            >
              <div className="flex flex-col gap-4">
                <button onClick={() => scrollToSection(workRef)} className="text-left px-4 py-3 hover:bg-theme-secondary rounded-xl transition-colors text-theme-primary">Work</button>
                <button onClick={() => scrollToSection(aboutRef)} className="text-left px-4 py-3 hover:bg-theme-secondary rounded-xl transition-colors text-theme-primary">About</button>
                <button onClick={() => scrollToSection(contactRef)} className="text-left px-4 py-3 hover:bg-theme-secondary rounded-xl transition-colors text-theme-primary">Contact</button>
                <div className="border-t border-theme pt-4">
                  <button onClick={() => setDarkMode(!darkMode)} className="flex items-center justify-between w-full px-4 py-3 hover:bg-theme-secondary rounded-xl transition-colors text-theme-primary">
                    <span>Theme</span> {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section - Exact Original Styling and Sizes */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden bg-black transition-colors duration-500">
        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="absolute inset-0">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 20, repeat: Infinity }} className="absolute inset-0">
            <img src={bgUrl} alt="Background" className="w-full h-full object-cover opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/10 to-black/20 transition-colors duration-500" />
          </motion.div>
        </motion.div>

        {isEditMode && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30">
            <input type="file" onChange={(e)=>handleStaticUpload(e,'bg')} className="hidden" id="bg-upload" />
            <label htmlFor="bg-upload" className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold cursor-pointer border border-white/20 transition-all flex items-center gap-2">
              <Upload size={14} /> Update Background
            </label>
          </div>
        )}

        <div className="relative z-10 text-center px-4 w-full">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="flex flex-col items-center">
            <RichEditableText
              value={heroTitle}
              onSave={setHeroTitle}
              tag="h1"
              isEditMode={isEditMode}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-white mb-4 sm:mb-6 tracking-tighter px-2"
            />
            <RichEditableText
              value={heroSubtitle}
              onSave={setHeroSubtitle}
              tag="p"
              isEditMode={isEditMode}
              className="text-white/80 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl tracking-[0.3em] sm:tracking-[0.5em] uppercase mb-8 sm:mb-12 px-4"
            />
          </motion.div>
        </div>

        <button onClick={() => scrollToSection(workRef)} className="absolute bottom-8 sm:bottom-12 md:bottom-16 lg:bottom-20 left-1/2 -translate-x-1/2 cursor-pointer hover:text-[#EAB308] transition-colors z-20">
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown size={24} className="sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10 text-white/60 hover:text-[#EAB308]" />
          </motion.div>
        </button>
      </section>

      <main className="relative z-20 bg-theme-primary transition-colors duration-500">

        {/* Profile Section - Exact Original Stats with CRUD */}
        <section ref={aboutRef} className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
              <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative group cursor-pointer">
                <div className="relative aspect-[3/4] max-w-sm sm:max-w-md mx-auto" onClick={() => setSelectedImage({url: profileUrl})}>
                  <div className="absolute inset-0 bg-[#EAB308] rounded-[40px] sm:rounded-[50px] md:rounded-[60px] rotate-3 group-hover:rotate-6 transition-transform duration-500" />
                  <div className="absolute inset-3 sm:inset-4 bg-black rounded-[30px] sm:rounded-[40px] md:rounded-[50px] overflow-hidden transition-colors duration-500">
                    <img src={profileUrl} alt="Ron" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                {isEditMode && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
                    <input type="file" onChange={(e)=>handleStaticUpload(e,'profile')} className="hidden" id="profile-upload" />
                    <label htmlFor="profile-upload" className="bg-[#EAB308] text-black px-4 py-2 rounded-full text-xs font-bold cursor-pointer shadow-xl transition-all flex items-center gap-2">
                      <Upload size={14} /> Update Profile
                    </label>
                  </div>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-4 sm:space-y-5 md:space-y-6 px-2 sm:px-0">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] text-theme-primary">
                  I'm <RichEditableText value={aboutName} onSave={setAboutName} tag="span" isEditMode={isEditMode} className="text-[#EAB308]" />
                </h2>
                <RichTextEditor
                  value={aboutText}
                  onSave={setAboutText}
                  isEditMode={isEditMode}
                  className="text-base sm:text-lg md:text-xl lg:text-2xl text-theme-secondary leading-relaxed"
                />

                <div className="flex gap-4 sm:gap-6 md:gap-8 pt-4 sm:pt-6 md:pt-8 relative">
                  {isEditMode && (
                    <CrudControls
                      onAdd={addStat}
                      className="absolute -top-8 right-0"
                    />
                  )}
                  {stats.map((stat, i) => (
                    <StatItem
                      key={stat.id}
                      stat={stat}
                      index={i}
                      onUpdate={(field, value) => updateStat(stat.id, field, value)}
                      onDelete={() => deleteStat(stat.id)}
                      onMove={(direction) => moveStat(stat.id, direction)}
                      isEditMode={isEditMode}
                    />
                  ))}
                </div>

                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => scrollToSection(contactRef)} className="mt-4 sm:mt-6 md:mt-8 group inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-[#EAB308] text-black rounded-full text-sm sm:text-base font-medium">
                  Let's work together <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px] group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Experience Section with Full CRUD */}
        <ExperienceSection isEditMode={isEditMode} />

        {/* Gallery Sections with Add Section Button */}
        <section ref={workRef} className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12 bg-theme-secondary transition-colors duration-500">
          <div className="max-w-7xl mx-auto">
            {isEditMode && (
              <div className="mb-8 flex justify-center">
                <button
                  onClick={addGallerySection}
                  className="flex items-center gap-2 px-8 py-4 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 transition-all hover:scale-105 shadow-lg"
                >
                  <Plus size={20} />
                  Add New Gallery Section
                </button>
              </div>
            )}

            {gallerySections.map((section, index) => (
              <GallerySection
                key={section.id}
                id={section.id}
                categoryId={section.categoryId}
                images={section.images}
                title={section.title}
                subtitle={section.subtitle}
                onImageClick={setSelectedImage}
                isEditMode={isEditMode}
                onUpload={(data) => {
                  const updatedImages = [...section.images, data]
                  updateGalleryImages(section.id, updatedImages)
                }}
                onDelete={(imageIndex) => {
                  const updatedImages = section.images.filter((_, idx) => idx !== imageIndex)
                  updateGalleryImages(section.id, updatedImages)
                }}
                onTitleEdit={(val) => updateGallerySection(section.id, 'title', val)}
                onSubtitleEdit={(val) => updateGallerySection(section.id, 'subtitle', val)}
                onMoveUp={index > 0 ? () => moveGallerySection(section.id, 'up') : null}
                onMoveDown={index < gallerySections.length - 1 ? () => moveGallerySection(section.id, 'down') : null}
                onDeleteSection={() => deleteGallerySection(section.id)}
                showMoveUp={index > 0}
                showMoveDown={index < gallerySections.length - 1}
              />
            ))}
          </div>
        </section>

        {/* Promise Section - EXACT ORIGINAL TEXT with CRUD */}
        <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12 bg-theme-primary transition-colors duration-500">
          <div className="max-w-7xl mx-auto relative">
            {isEditMode && (
              <CrudControls
                onAdd={addPromiseItem}
                className="absolute -top-12 right-0"
              />
            )}

            <SectionTitle align="center" subtitle="What I always deliver" isEditMode={isEditMode} onTitleEdit={() => {}} onSubtitleEdit={() => {}}>
              Two Things
            </SectionTitle>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8 mt-8 sm:mt-10 md:mt-12 lg:mt-16">
              {promiseItems.map((item, i) => (
                <PromiseItem
                  key={item.id}
                  item={item}
                  index={i}
                  onUpdate={(field, value) => updatePromiseItem(item.id, field, value)}
                  onDelete={() => deletePromiseItem(item.id)}
                  onMove={(direction) => movePromiseItem(item.id, direction)}
                  isEditMode={isEditMode}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section ref={contactRef} className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12 bg-[#EAB308] text-center">
          <RichEditableText
            value={contactTitle}
            onSave={setContactTitle}
            tag="h2"
            isEditMode={isEditMode}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-black mb-4 sm:mb-5 px-2"
          />
          <RichTextEditor
            value={contactText}
            onSave={setContactText}
            isEditMode={isEditMode}
            className="text-base sm:text-lg md:text-xl text-black/80 mb-6 sm:mb-8 max-w-2xl mx-auto px-4"
          />
          <RichEditableText
            value={contactButton}
            onSave={setContactButton}
            tag="span"
            isEditMode={isEditMode}
            className="group inline-flex items-center gap-2 sm:gap-3 md:gap-4 px-6 md:px-10 py-3 md:py-5 bg-black text-white rounded-full text-sm md:text-lg font-medium"
          />
        </section>
      </main>

      {/* Footer - EXACT ORIGINAL ICONS & LAYOUT */}
      <footer className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 lg:px-12 bg-theme-primary border-t border-theme relative overflow-hidden transition-colors duration-500">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12 text-left">
            <div>
              <RichEditableText
                value={footerName}
                onSave={setFooterName}
                tag="h4"
                isEditMode={isEditMode}
                className="text-xl sm:text-2xl font-bold mb-4 sm:mb-5 md:mb-6"
              />
              <RichEditableText
                value={footerText}
                onSave={setFooterText}
                tag="p"
                isEditMode={isEditMode}
                className="text-sm sm:text-base text-theme-secondary opacity-60"
              />

              {isEditMode && (
                <div className="mt-8 p-4 bg-theme-secondary rounded-2xl border border-theme inline-block">
                  <p className="text-xs font-bold text-[#EAB308] mb-2 uppercase tracking-wider">Public Link</p>
                  <button onClick={() => { navigator.clipboard.writeText("https://portfolioss-4gai.onrender.com/"); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className="flex items-center gap-2 px-4 py-2 bg-[#EAB308] text-black rounded-full text-sm font-bold active:scale-95">
                    {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied!" : "Copy Public Link"}
                  </button>
                </div>
              )}

              <div className="flex gap-3 sm:gap-4 mt-8">
                <a href="https://linkedin.com" target="_blank" className="w-8 h-8 sm:w-10 sm:h-10 bg-theme-secondary border border-theme rounded-full flex items-center justify-center hover:bg-[#EAB308] hover:text-black transition-colors"><svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
                <a href="https://instagram.com" target="_blank" className="w-8 h-8 sm:w-10 sm:h-10 bg-theme-secondary border border-theme rounded-full flex items-center justify-center hover:bg-[#EAB308] hover:text-black transition-colors"><svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/></svg></a>
              </div>
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 md:mb-6">Navigation</h4>
              <ul className="space-y-2 sm:space-y-2.5 opacity-60 text-sm sm:text-base">
                <li><button onClick={() => scrollToSection(workRef)} className="hover:text-[#EAB308]">Work</button></li>
                <li><button onClick={() => scrollToSection(aboutRef)} className="hover:text-[#EAB308]">About</button></li>
                <li><button onClick={() => scrollToSection(contactRef)} className="hover:text-[#EAB308]">Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 md:mb-6">Connect</h4>
              <ul className="space-y-2 sm:space-y-2.5 opacity-60 text-sm sm:text-base">
                <li>
                  <RichEditableText
                    value={footerEmail}
                    onSave={setFooterEmail}
                    tag="a"
                    isEditMode={isEditMode}
                    className="hover:text-[#EAB308]"
                    href={`mailto:${footerEmail}`}
                  />
                </li>
                <li><a href="https://linkedin.com" target="_blank" className="hover:text-[#EAB308]">LinkedIn</a></li>
                <li><a href="https://instagram.com" target="_blank" className="hover:text-[#EAB308]">Instagram</a></li>
              </ul>
            </div>
          </div>
          <RichEditableText
            value={copyright}
            onSave={setCopyright}
            tag="div"
            isEditMode={isEditMode}
            className="mt-16 text-center opacity-40 text-sm"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 text-center opacity-[0.03] pointer-events-none text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black whitespace-nowrap text-theme-primary">RON MEDINA • RON MEDINA • RON MEDINA</div>
      </footer>

      <ImageModal src={selectedImage} isOpen={selectedImage !== null} onClose={() => setSelectedImage(null)} onNext={() => setSelectedImage(allAssets[(allAssets.indexOf(selectedImage) + 1) % allAssets.length])} onPrev={() => setSelectedImage(allAssets[(allAssets.indexOf(selectedImage) - 1 + allAssets.length) % allAssets.length])} />
    </div>
  )
}

export default App;


//
// can you help me on the when i try to change the font nothing happend can you make it like a ms word where it expand and also  when i try this and double  click some of them this is showing *Designing simplicity out of complexity. Currently crafting digital experiences that matter.*****________**************** which is not good they should work like in msword, and also can you add this to all of my project so they are editable and also when i try to  use the px then save it nothing change maybe do something about that last one don't touch my other code even 1 letter okay and don't change how it look or how it flow only change what i ask      and also why is there already a value in some of them because when i delete some then refresh it all of the thing i delete is there again