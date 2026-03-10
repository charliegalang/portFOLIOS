import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { Plus, Moon, Sun, X, ChevronDown, Sparkles, Eye, ArrowRight, ChevronLeft, ChevronRight, Menu, Upload, Trash2, Copy, Check } from 'lucide-react'
import { useRef, useState, useEffect, useMemo } from 'react'
import { uploadToCloudinary, fetchImagesByTag, deleteFromCloudinary } from './CloudinaryService'

// Static Assets
import defaultBg from './assets/BGImage.png'
import defaultProfile from './assets/52323_2512856396012_1996282797_o 1.svg'

// Optimized Image Modal Component
const ImageModal = ({ src, isOpen, onClose, onPrev, onNext }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  
  // Handle Android back button
  useEffect(() => {
    const handlePopState = () => {
      if (isOpen) {
        onClose()
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isOpen, onClose])

  // Update browser history when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Push a new state so back button closes modal
      window.history.pushState({ modal: true }, '')
    } else {
      // Go back if we have a modal state (but don't trigger popstate)
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

  // Handle touch gestures for mobile
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
          {/* Close Button - Made larger for mobile */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="absolute top-8 right-8 p-4 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors z-[101]"
          >
            <X size={28} className="text-white" />
          </button>

          {/* Navigation Buttons - Hidden on mobile, shown on desktop */}
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
          
          {/* Swipe instruction for mobile */}
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

// Advertisement Style Gallery Component
const AdStyleGallery = ({ images, title, subtitle, onImageClick, isEditMode, onUpload, onDelete, categoryId }) => {
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
    if (count <= 2) return 'flex flex-wrap justify-center gap-3'
    if (count === 3) return 'flex flex-wrap justify-center gap-3'
    if (count === 4) return 'flex flex-wrap justify-center gap-3'
    return 'flex flex-wrap justify-center gap-3'
  }

  // Calculate width for each thumbnail based on count
  const getThumbnailWidth = () => {
    const count = images.length
    // Base width for mobile
    if (count === 1) return 'w-full max-w-[200px]'
    if (count === 2) return 'w-[calc(50%-6px)] max-w-[150px]'
    if (count === 3) return 'w-[calc(33.333%-8px)] max-w-[120px]'
    if (count === 4) return 'w-[calc(50%-6px)] sm:w-[calc(25%-9px)] max-w-[120px]'
    if (count === 5) return 'w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] lg:w-[calc(20%-10px)] max-w-[120px]'
    if (count === 6) return 'w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] lg:w-[calc(16.666%-10px)] max-w-[120px]'
    // For 7+ images, use 4 columns on desktop
    return 'w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)] max-w-[120px]'
  }

  return (
    <div className="mb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <SectionTitle align="left" subtitle={subtitle}>
          {title}
        </SectionTitle>

        {isEditMode && (
          <div className="flex gap-3">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.svg" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-6 py-3 bg-[#EAB308] text-black rounded-full font-bold hover:scale-105 transition-all disabled:opacity-50 shadow-lg"
            >
              {isUploading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Upload size={20} />}
              Upload to {title}
            </button>
          </div>
        )}
      </div>

      {images.length === 0 ? (
        <div className="text-center py-12 bg-theme-secondary rounded-2xl border border-dashed border-[#EAB308]/30">
          <p className="text-lg text-theme-primary">No {title} designs available yet.</p>
          <p className="text-sm mt-2 text-theme-secondary opacity-60">Check back soon for updates!</p>
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
              className={`w-full h-full object-contain transition-opacity duration-500 ${mainImageLoaded ? 'opacity-100' : 'opacity-0'}`}
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

          {/* Thumbnails - Using flexbox to fill all space */}
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
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${thumbnailsLoaded[index] ? 'opacity-100' : 'opacity-0'}`}
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

// Section Title Component - Exact original styling
const SectionTitle = ({ children, align = "left", subtitle }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`mb-12 ${align === 'center' ? 'text-center' : ''}`}
  >
    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-theme-primary">
      {children}
    </h2>
    {subtitle && (
      <p className="mt-4 text-theme-secondary text-lg max-w-2xl mx-auto">
        {subtitle}
      </p>
    )}
    <div className={`h-[2px] w-24 bg-[#EAB308] mt-6 ${align === 'center' ? 'mx-auto' : ''}`} />
  </motion.div>
)

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

  // State for images
  const [galleries, setGalleries] = useState({ uiux: [], brand_identity: [], social_media: [], presentations_print: [] })
  const [profileUrl, setProfileUrl] = useState(localStorage.getItem('ron_profile_url') || defaultProfile)
  const [bgUrl, setBgUrl] = useState(localStorage.getItem('ron_bg_url') || defaultBg)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAllImages = async () => {
      setLoading(true)
      try {
        const [uiux, brand, social, print] = await Promise.all([
          fetchImagesByTag('uiux_design'),
          fetchImagesByTag('brand_identity'),
          fetchImagesByTag('social_media'),
          fetchImagesByTag('presentations_print')
        ])
        setGalleries({ uiux, brand_identity: brand, social_media: social, presentations_print: print })
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

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"], layoutEffect: false })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.8])

  const handleStaticUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = await uploadToCloudinary(file, `static_${type}`);
    if (data) {
      if (type === 'profile') { setProfileUrl(data.url); localStorage.setItem('ron_profile_url', data.url); }
      else { setBgUrl(data.url); localStorage.setItem('ron_bg_url', data.url); }
    }
  }

  const allAssets = useMemo(() => [...galleries.uiux, ...galleries.brand_identity, ...galleries.social_media, ...galleries.presentations_print], [galleries])

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
            <img src={bgUrl} alt="Background" className="w-full h-full object-cover opacity-60 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black transition-colors duration-500" />
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
            <motion.h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-white mb-4 sm:mb-6 tracking-tighter px-2"
              animate={{ textShadow: ["0 0 20px rgba(234,179,8,0.3)", "0 0 40px rgba(234,179,8,0.5)", "0 0 20px rgba(234,179,8,0.3)"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Simplicity.
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-white/80 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl tracking-[0.3em] sm:tracking-[0.5em] uppercase mb-8 sm:mb-12 px-4">
              Pure. Precise. Purposeful.
            </motion.p>
          </motion.div>
        </div>

        <button onClick={() => scrollToSection(workRef)} className="absolute bottom-8 sm:bottom-12 md:bottom-16 lg:bottom-20 left-1/2 -translate-x-1/2 cursor-pointer hover:text-[#EAB308] transition-colors z-20">
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown size={24} className="sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10 text-white/60 hover:text-[#EAB308]" />
          </motion.div>
        </button>
      </section>

      <main className="relative z-20 bg-theme-primary transition-colors duration-500">

        {/* Profile Section - Exact Original Stats */}
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
                  I'm <span className="text-[#EAB308]">Ron Medina</span>
                </h2>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-theme-secondary leading-relaxed">
                  Designing simplicity out of complexity.
                  <span className="block mt-2 sm:mt-3 md:mt-4 text-theme-primary font-medium">
                    Currently crafting digital experiences that matter.
                  </span>
                </p>

                <div className="flex gap-4 sm:gap-6 md:gap-8 pt-4 sm:pt-6 md:pt-8">
                  {[{ n: '5+', l: 'Years Experience' }, { n: '100+', l: 'Projects' }, { n: '50+', l: 'Happy Clients' }].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-[#EAB308]">{stat.n}</div>
                      <div className="text-xs sm:text-sm text-theme-secondary">{stat.l}</div>
                    </motion.div>
                  ))}
                </div>

                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => scrollToSection(contactRef)} className="mt-4 sm:mt-6 md:mt-8 group inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-[#EAB308] text-black rounded-full text-sm sm:text-base font-medium">
                  Let's work together <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px] group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Work Sections */}
        <section ref={workRef} className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12 bg-theme-secondary transition-colors duration-500">
          <div className="max-w-7xl mx-auto">
            <AdStyleGallery categoryId="uiux_design" images={galleries.uiux} title="UI/UX Design" subtitle="Clean, intuitive interfaces for digital products" onImageClick={setSelectedImage} isEditMode={isEditMode} onUpload={(data) => setGalleries(p=>({...p, uiux:[...p.uiux, data]}))} onDelete={(i) => setGalleries(p=>({...p, uiux:p.uiux.filter((_,idx)=>idx!==i)}))} />
            <AdStyleGallery categoryId="brand_identity" images={galleries.brand_identity} title="Brand Identity" subtitle="Guidelines and identity systems that define brands" onImageClick={setSelectedImage} isEditMode={isEditMode} onUpload={(data) => setGalleries(p=>({...p, brand_identity:[...p.brand_identity, data]}))} onDelete={(i) => setGalleries(p=>({...p, brand_identity:p.brand_identity.filter((_,idx)=>idx!==i)}))} />
            <AdStyleGallery categoryId="social_media" images={galleries.social_media} title="Social Media" subtitle="Engaging visual content for social platforms" onImageClick={setSelectedImage} isEditMode={isEditMode} onUpload={(data) => setGalleries(p=>({...p, social_media:[...p.social_media, data]}))} onDelete={(i) => setGalleries(p=>({...p, social_media:p.social_media.filter((_,idx)=>idx!==i)}))} />
            <AdStyleGallery categoryId="presentations_print" images={galleries.presentations_print} title="Presentations & Print" subtitle="Professional presentation and print materials" onImageClick={setSelectedImage} isEditMode={isEditMode} onUpload={(data) => setGalleries(p=>({...p, presentations_print:[...p.presentations_print, data]}))} onDelete={(i) => setGalleries(p=>({...p, presentations_print:p.presentations_print.filter((_,idx)=>idx!==i)}))} />
          </div>
        </section>

        {/* Promise Section - EXACT ORIGINAL TEXT */}
        <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12 bg-theme-primary transition-colors duration-500">
          <div className="max-w-7xl mx-auto">
            <SectionTitle align="center" subtitle="What I always deliver">Two Things</SectionTitle>
            <div className="grid md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8 mt-8 sm:mt-10 md:mt-12 lg:mt-16">
              {[
                { n: "01", t: "Designs you will love", d: "I love creating new things — it's what drives me. Great teamwork always brings ideas to life." },
                { n: "02", t: "Stress free work", d: "I keep things simple — no stress, no drama — just results that help move forward." }
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }} viewport={{ once: true }} className="group p-4 sm:p-5 md:p-6 lg:p-8 rounded-[30px] sm:rounded-[35px] md:rounded-[40px] bg-theme-primary border border-theme hover:shadow-xl transition-all duration-500">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-black text-[#EAB308]/20 mb-3 sm:mb-4 md:mb-5 lg:mb-6">{item.n}</div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 md:mb-4 text-theme-primary">{item.t}</h3>
                  <p className="text-sm sm:text-base md:text-lg text-theme-secondary leading-relaxed">{item.d}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section ref={contactRef} className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12 bg-[#EAB308] text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-black mb-4 sm:mb-5 px-2">Let's create something amazing</h2>
          <p className="text-base sm:text-lg md:text-xl text-black/80 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">Ready to bring your ideas to life? Let's collaborate and make something extraordinary together.</p>
          <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href="mailto:hello@ronmedina.com" className="group inline-flex items-center gap-2 sm:gap-3 md:gap-4 px-6 md:px-10 py-3 md:py-5 bg-black text-white rounded-full text-sm md:text-lg font-medium">Get in touch <Plus size={16} className="group-hover:rotate-90 transition-transform duration-500" /></motion.a>
        </section>
      </main>

      {/* Footer - EXACT ORIGINAL ICONS & LAYOUT */}
      <footer className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 lg:px-12 bg-theme-primary border-t border-theme relative overflow-hidden transition-colors duration-500">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12 text-left">
            <div>
              <h4 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-5 md:mb-6">Ron Medina</h4>
              <p className="text-sm sm:text-base text-theme-secondary opacity-60">Designing simplicity out of complexity.</p>

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
            <div><h4 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 md:mb-6">Navigation</h4><ul className="space-y-2 sm:space-y-2.5 opacity-60 text-sm sm:text-base"><li><button onClick={() => scrollToSection(workRef)} className="hover:text-[#EAB308]">Work</button></li><li><button onClick={() => scrollToSection(aboutRef)} className="hover:text-[#EAB308]">About</button></li><li><button onClick={() => scrollToSection(contactRef)} className="hover:text-[#EAB308]">Contact</button></li></ul></div>
            <div><h4 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 md:mb-6">Connect</h4><ul className="space-y-2 sm:space-y-2.5 opacity-60 text-sm sm:text-base"><li><a href="mailto:hello@ronmedina.com" className="hover:text-[#EAB308]">hello@ronmedina.com</a></li><li><a href="https://linkedin.com" target="_blank" className="hover:text-[#EAB308]">LinkedIn</a></li><li><a href="https://instagram.com" target="_blank" className="hover:text-[#EAB308]">Instagram</a></li></ul></div>
          </div>
          <div className="mt-16 text-center opacity-40 text-sm">© 2024 Ron Medina. All rights reserved.</div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 text-center opacity-[0.03] pointer-events-none text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black whitespace-nowrap text-theme-primary">RON MEDINA • RON MEDINA • RON MEDINA</div>
      </footer>

      <ImageModal src={selectedImage} isOpen={selectedImage !== null} onClose={() => setSelectedImage(null)} onNext={() => setSelectedImage(allAssets[(allAssets.indexOf(selectedImage) + 1) % allAssets.length])} onPrev={() => setSelectedImage(allAssets[(allAssets.indexOf(selectedImage) - 1 + allAssets.length) % allAssets.length])} />
    </div>
  )
}

export default App;


//done


//done

//charlie