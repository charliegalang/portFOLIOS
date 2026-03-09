import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { Plus, Moon, Sun, X, ChevronDown, Sparkles, Eye, ArrowRight, ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { useRef, useState, useEffect, useMemo } from 'react'

// Static Assets
import bgImage from './assets/BGImage.png'
import profilePic from './assets/52323_2512856396012_1996282797_o 1.svg'

// Optimized SVG imports with lazy loading
const brandGuidelineImages = import.meta.glob('./assets/brand_guideline/*.svg', { 
  eager: false, 
  import: 'default'
})

const brandPresentationImages = import.meta.glob('./assets/Brand_Presentations/*.svg', { 
  eager: false, 
  import: 'default'
})

const socialMediaImages = import.meta.glob('./assets/Social Media/*.svg', { 
  eager: false, 
  import: 'default'
})

const uiuxImages = import.meta.glob('./assets/UIUX Designs/*.svg', { 
  eager: false, 
  import: 'default'
})

// Lazy load function for assets
const loadAssets = async (modules) => {
  const loadedAssets = await Promise.all(
    Object.values(modules).map(module => module())
  )
  return loadedAssets
}

// Create memoized asset loader
const useOptimizedAssets = () => {
  const [assets, setAssets] = useState({
    brandGuideline: [],
    brandPresentation: [],
    socialMedia: [],
    uiux: [],
    allAssets: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAllAssets = async () => {
      try {
        const [brandGuideline, brandPresentation, socialMedia, uiux] = await Promise.all([
          loadAssets(brandGuidelineImages),
          loadAssets(brandPresentationImages),
          loadAssets(socialMediaImages),
          loadAssets(uiuxImages)
        ])

        const allAssets = [...brandGuideline, ...uiux, ...socialMedia, ...brandPresentation]
        
        setAssets({
          brandGuideline,
          brandPresentation,
          socialMedia,
          uiux,
          allAssets
        })
      } catch (error) {
        console.error('Error loading assets:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAllAssets()
  }, [])

  return { ...assets, loading }
}

// Optimized Image Modal Component with loading state
const ImageModal = ({ src, allImages, isOpen, onClose, onPrev, onNext }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl"
          onClick={onClose}
        >
          {/* Close Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="absolute top-8 right-8 p-4 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors z-[101]"
          >
            <X size={28} className="text-white" />
          </button>

          {/* Navigation Buttons */}
          <button
            onClick={(e) => { e.stopPropagation(); onPrev() }}
            className="absolute left-4 md:left-8 p-4 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full transition-all group z-[101]"
          >
            <ChevronLeft size={32} className="text-white group-hover:scale-110 transition-transform" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onNext() }}
            className="absolute right-4 md:right-8 p-4 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full transition-all group z-[101]"
          >
            <ChevronRight size={32} className="text-white group-hover:scale-110 transition-transform" />
          </button>
          
          <motion.div
            key={src}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#EAB308] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <img 
              src={src} 
              alt="Project View"
              className={`max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Advertisement Style Gallery Component with Perfectly Uniform Thumbnails
const AdStyleGallery = ({ images, title, subtitle, onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mainImageLoaded, setMainImageLoaded] = useState(false)
  const [thumbnailsLoaded, setThumbnailsLoaded] = useState({})
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const autoPlayRef = useRef(null)

  // Auto-play functionality
  useEffect(() => {
    if (images.length <= 1 || !isAutoPlaying) return

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
      setMainImageLoaded(false)
    }, 5000) // Change every 5 seconds

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [images.length, isAutoPlaying])

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false)
  const handleMouseLeave = () => setIsAutoPlaying(true)

  const selectImage = (index) => {
    setCurrentIndex(index)
    setMainImageLoaded(false)
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
    setMainImageLoaded(false)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    setMainImageLoaded(false)
  }

  const handleThumbnailLoad = (index) => {
    setThumbnailsLoaded(prev => ({ ...prev, [index]: true }))
  }

  // Function to determine grid columns - fixed per row
  const getGridCols = () => {
    const count = images.length
    if (count <= 3) return `grid-cols-${count}`
    if (count === 4) return 'grid-cols-2 md:grid-cols-4'
    if (count === 5) return 'grid-cols-2 md:grid-cols-5'
    if (count === 6) return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
    if (count === 7) return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-7'
    if (count === 8) return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-8'
    if (count === 9) return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-9'
    if (count === 10) return 'grid-cols-2 md:grid-cols-5 lg:grid-cols-10'
    return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6'
  }

  if (images.length === 0) {
    return (
      <div className="mb-32">
        <SectionTitle align="center" subtitle={subtitle}>
          {title}
        </SectionTitle>
        <div className="text-center py-12 text-[#4A4A4A] dark:text-[#A0A0A0] bg-white/5 rounded-2xl border border-dashed border-[#EAB308]/30">
          <p className="text-lg">No {title} designs available yet.</p>
          <p className="text-sm mt-2 opacity-60">Check back soon for updates!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-32">
      <SectionTitle align="center" subtitle={subtitle}>
        {title}
      </SectionTitle>
      
      <div 
        className="max-w-6xl mx-auto px-4"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Main Featured Image */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-[#1a1a1a] mb-8 group cursor-pointer shadow-xl"
          onClick={() => onImageClick(images[currentIndex])}
        >
          {!mainImageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
              <div className="w-12 h-12 border-4 border-[#EAB308] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          <motion.img 
            key={currentIndex}
            src={images[currentIndex]}
            alt={`${title} featured`}
            initial={{ opacity: 0 }}
            animate={{ opacity: mainImageLoaded ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            className={`w-full h-full object-contain p-4 transition-opacity duration-500 ${mainImageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setMainImageLoaded(true)}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
              >
                <ChevronLeft size={24} className="text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
              >
                <ChevronRight size={24} className="text-white" />
              </button>
            </>
          )}
          
          {/* Progress Indicator */}
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

          {/* Image Counter */}
          <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Hint to click for full view */}
          <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            Click to view full
          </div>
        </motion.div>

        {/* Thumbnails - Perfectly uniform squares */}
        {images.length > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`grid ${getGridCols()} gap-3 justify-items-center`}
          >
            {images.map((src, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="w-full max-w-[120px] aspect-square"
              >
                <div
                  className={`relative w-full h-full rounded-lg overflow-hidden bg-black cursor-pointer transition-all duration-300 ${
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
                  <div className="relative w-full h-full bg-black">
                    <img 
                      src={src}
                      alt={`Thumbnail ${index + 1}`}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                        thumbnailsLoaded[index] ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={() => handleThumbnailLoad(index)}
                      loading="lazy"
                      style={{
                        objectPosition: 'center',
                      }}
                    />
                  </div>
                  
                  {/* Active Indicator */}
                  {index === currentIndex && (
                    <motion.div 
                      layoutId={`activeIndicator-${title}`}
                      className="absolute inset-0 ring-4 ring-[#EAB308] ring-inset pointer-events-none"
                      style={{ borderRadius: '0.5rem' }}
                    />
                  )}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                    <Eye size={20} className="text-white" />
                  </div>

                  {/* Number badge for many images */}
                  {images.length > 8 && (
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-[#EAB308] rounded-full flex items-center justify-center text-xs font-bold text-black">
                      {index + 1}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Show message for single image */}
        {images.length === 1 && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-[#4A4A4A] dark:text-[#A0A0A0] mt-4"
          >
            Only one image available
          </motion.p>
        )}
      </div>
    </div>
  )
}

// Section Title Component
const SectionTitle = ({ children, align = "left", subtitle }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`mb-12 ${align === 'center' ? 'text-center' : ''}`}
  >
    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#1E1E1E] dark:text-white">
      {children}
    </h2>
    {subtitle && (
      <p className="mt-4 text-[#4A4A4A] dark:text-[#A0A0A0] text-lg max-w-2xl mx-auto">
        {subtitle}
      </p>
    )}
    <div className={`h-[2px] w-24 bg-[#EAB308] mt-6 ${align === 'center' ? 'mx-auto' : ''}`} />
  </motion.div>
)

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Check local storage first, then system preference
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) {
      return saved === 'true'
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const heroRef = useRef(null)
  const mainRef = useRef(null)
  const workRef = useRef(null)
  const aboutRef = useRef(null)
  const contactRef = useRef(null)
  
  // Use optimized assets
  const { brandGuideline, brandPresentation, socialMedia, uiux, allAssets, loading } = useOptimizedAssets()

  // Manual dark mode toggle with localStorage
  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', newMode)
    // Apply dark mode class immediately
    document.documentElement.classList.toggle('dark', newMode)
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
      setShowScrollTop(window.scrollY > 500)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Smooth scroll functions
  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
    setMobileMenuOpen(false)
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Fix for useScroll warning
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
    layoutEffect: false
  })

  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.8])

  const openModal = (src) => {
    const index = allAssets.indexOf(src)
    setSelectedImageIndex(index)
  }

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % allAssets.length)
  }

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + allAssets.length) % allAssets.length)
  }

  // Show loading state if needed
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#EAB308] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-black text-[#1E1E1E] dark:text-white transition-colors duration-500 overflow-x-hidden">
      
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8 }}
        className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-12 py-6 transition-all ${
          scrolled ? "bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-sm" : "bg-transparent"
        }`}
      >
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 cursor-pointer"
          onClick={scrollToTop}
        >
          <div className="w-10 h-10 rounded-full bg-[#EAB308] overflow-hidden">
            <img src={profilePic} alt="Ron" className="w-full h-full object-cover" />
          </div>
          <span className={`font-bold transition-colors ${scrolled ? "text-[#1E1E1E] dark:text-white" : "text-white"}`}>
            RON MEDINA
          </span>
        </motion.div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <div className={`flex gap-8 text-sm font-medium transition-colors ${scrolled ? "text-[#4A4A4A] dark:text-white/80" : "text-white/80"}`}>
            <motion.button
              whileHover={{ y: -2 }}
              onClick={() => scrollToSection(workRef)}
              className="hover:text-[#EAB308] transition-colors"
            >
              Work
            </motion.button>
            <motion.button
              whileHover={{ y: -2 }}
              onClick={() => scrollToSection(aboutRef)}
              className="hover:text-[#EAB308] transition-colors"
            >
              About
            </motion.button>
            <motion.button
              whileHover={{ y: -2 }}
              onClick={() => scrollToSection(contactRef)}
              className="hover:text-[#EAB308] transition-colors"
            >
              Contact
            </motion.button>
          </div>
          
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors ${
              scrolled ? "bg-black/5 dark:bg-white/10" : "bg-white/10"
            }`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={18} className={scrolled ? "text-[#1E1E] dark:text-white" : "text-white"} /> : <Moon size={18} className={scrolled ? "text-[#1E1E] dark:text-white" : "text-white"} />}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`md:hidden p-2 rounded-full transition-colors ${
            scrolled ? "bg-black/5 dark:bg-white/10" : "bg-white/10"
          }`}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={18} className={scrolled ? "text-[#1E1E] dark:text-white" : "text-white"} /> : <Menu size={18} className={scrolled ? "text-[#1E1E] dark:text-white" : "text-white"} />}
        </button>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-4 right-4 md:hidden bg-white dark:bg-black rounded-2xl shadow-xl border border-[#E5E5E5] dark:border-[#2A2A2A] p-4"
            >
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => scrollToSection(workRef)}
                  className="text-left px-4 py-3 hover:bg-[#F5F5F5] dark:hover:bg-[#1a1a1a] rounded-xl transition-colors"
                >
                  Work
                </button>
                <button
                  onClick={() => scrollToSection(aboutRef)}
                  className="text-left px-4 py-3 hover:bg-[#F5F5F5] dark:hover:bg-[#1a1a1a] rounded-xl transition-colors"
                >
                  About
                </button>
                <button
                  onClick={() => scrollToSection(contactRef)}
                  className="text-left px-4 py-3 hover:bg-[#F5F5F5] dark:hover:bg-[#1a1a1a] rounded-xl transition-colors"
                >
                  Contact
                </button>
                <div className="border-t border-[#E5E5E5] dark:border-[#2A2A2A] pt-4">
                  <button
                    onClick={toggleDarkMode}
                    className="flex items-center justify-between w-full px-4 py-3 hover:bg-[#F5F5F5] dark:hover:bg-[#1a1a1a] rounded-xl transition-colors"
                  >
                    <span>Theme</span>
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section - Fixed responsive down arrow */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="absolute inset-0"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute inset-0"
          >
            <img src={bgImage} alt="Background" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black" />
          </motion.div>
        </motion.div>

        <div className="relative z-10 text-center px-4 w-full">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center justify-center"
          >
            <motion.h1 
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-white mb-4 sm:mb-6 tracking-tighter px-2"
              animate={{ 
                textShadow: [
                  "0 0 20px rgba(234,179,8,0.3)",
                  "0 0 40px rgba(234,179,8,0.5)",
                  "0 0 20px rgba(234,179,8,0.3)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Simplicity.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-white/80 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl tracking-[0.3em] sm:tracking-[0.5em] uppercase mb-8 sm:mb-12 px-4"
            >
              Pure. Precise. Purposeful.
            </motion.p>
          </motion.div>
        </div>

        {/* Fixed responsive down arrow - positioned absolutely at bottom */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          onClick={() => scrollToSection(workRef)}
          className="absolute bottom-8 sm:bottom-12 md:bottom-16 lg:bottom-20 left-1/2 -translate-x-1/2 cursor-pointer hover:text-[#EAB308] transition-colors z-20"
          aria-label="Scroll to work section"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown 
              size={24} 
              className="sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10 text-white/60 hover:text-[#EAB308]" 
            />
          </motion.div>
        </motion.button>
      </section>

      {/* Main Content */}
      <main ref={mainRef} className="relative z-20 bg-white dark:bg-black">
        
        {/* Profile Section - About */}
        <section ref={aboutRef} id="about" className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
              
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative group cursor-pointer"
                onClick={() => openModal(profilePic)}
              >
                <div className="relative aspect-[3/4] max-w-sm sm:max-w-md mx-auto">
                  <div className="absolute inset-0 bg-[#EAB308] rounded-[40px] sm:rounded-[50px] md:rounded-[60px] rotate-3 group-hover:rotate-6 transition-transform duration-500" />
                  <div className="absolute inset-3 sm:inset-4 bg-black rounded-[30px] sm:rounded-[40px] md:rounded-[50px] overflow-hidden">
                    <img 
                      src={profilePic} 
                      alt="Ron Medina"
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-4 sm:space-y-5 md:space-y-6 px-2 sm:px-0"
              >
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1]">
                  I'm <span className="text-[#EAB308]">Ron Medina</span>
                </h2>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-[#4A4A4A] dark:text-[#A0A0A0] leading-relaxed">
                  Designing simplicity out of complexity. 
                  <span className="block mt-2 sm:mt-3 md:mt-4 text-[#1E1E1E] dark:text-white font-medium">
                    Currently crafting digital experiences that matter.
                  </span>
                </p>

                <div className="flex gap-4 sm:gap-6 md:gap-8 pt-4 sm:pt-6 md:pt-8">
                  {[
                    { number: '5+', label: 'Years Experience' },
                    { number: '100+', label: 'Projects' },
                    { number: '50+', label: 'Happy Clients' }
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-[#EAB308]">{stat.number}</div>
                      <div className="text-xs sm:text-sm text-[#4A4A4A] dark:text-[#A0A0A0]">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => scrollToSection(contactRef)}
                  className="mt-4 sm:mt-6 md:mt-8 group inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-[#EAB308] text-black rounded-full text-sm sm:text-base font-medium"
                >
                  Let's work together
                  <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px] group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Work Sections */}
        <section ref={workRef} id="work" className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12 bg-[#F5F5F5] dark:bg-black">
          <div className="max-w-7xl mx-auto">
            
            {/* UI/UX Design */}
            <AdStyleGallery 
              images={uiux}
              title="UI/UX Design"
              subtitle="Clean, intuitive interfaces for digital products"
              onImageClick={openModal}
            />

            {/* Brand Identity */}
            <AdStyleGallery 
              images={brandGuideline}
              title="Brand Identity"
              subtitle="Guidelines and identity systems that define brands"
              onImageClick={openModal}
            />

            {/* Social Media */}
            <AdStyleGallery 
              images={socialMedia}
              title="Social Media"
              subtitle="Engaging visual content for social platforms"
              onImageClick={openModal}
            />

            {/* Presentations & Print */}
            <AdStyleGallery 
              images={brandPresentation}
              title="Presentations & Print"
              subtitle="Professional presentation and print materials"
              onImageClick={openModal}
            />

            {/* View All Button */}
            {allAssets.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mt-12 sm:mt-14 md:mt-16"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-7 md:px-8 py-3 sm:py-3.5 md:py-4 bg-[#EAB308] text-black rounded-full text-sm sm:text-base font-medium"
                  onClick={() => {
                    if (allAssets.length > 0) {
                      setSelectedImageIndex(0)
                    }
                  }}
                >
                  View All Projects ({allAssets.length})
                  <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px] group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </motion.div>
            )}
          </div>
        </section>

        {/* Promise Section */}
        <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <SectionTitle align="center" subtitle="What I always deliver">
              Two Things
            </SectionTitle>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8 mt-8 sm:mt-10 md:mt-12 lg:mt-16">
              {[
                {
                  number: "01",
                  title: "Designs you will love",
                  description: "I love creating new things — it's what drives me. Great teamwork always brings ideas to life."
                },
                {
                  number: "02",
                  title: "Stress free work",
                  description: "I keep things simple — no stress, no drama — just results that help move forward."
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                  viewport={{ once: true }}
                  className="group p-4 sm:p-5 md:p-6 lg:p-8 rounded-[30px] sm:rounded-[35px] md:rounded-[40px] bg-white dark:bg-black border border-[#E5E5E5] dark:border-[#2A2A2A] hover:shadow-xl transition-all duration-500"
                >
                  <div className="text-4xl sm:text-5xl md:text-6xl font-black text-[#EAB308]/20 mb-3 sm:mb-4 md:mb-5 lg:mb-6">{item.number}</div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 md:mb-4">{item.title}</h3>
                  <p className="text-sm sm:text-base md:text-lg text-[#4A4A4A] dark:text-[#A0A0A0] leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section ref={contactRef} id="contact" className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12 bg-[#EAB308]">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-black mb-4 sm:mb-5 md:mb-6 lg:mb-8 px-2">Let's create something amazing</h2>
              <p className="text-base sm:text-lg md:text-xl text-black/80 mb-6 sm:mb-8 md:mb-10 lg:mb-12 max-w-2xl mx-auto px-4">
                Ready to bring your ideas to life? Let's collaborate and make something extraordinary together.
              </p>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="mailto:hello@ronmedina.com"
                className="group inline-flex items-center gap-2 sm:gap-3 md:gap-4 px-6 sm:px-8 md:px-10 lg:px-12 py-3 sm:py-4 md:py-5 lg:py-6 bg-black text-white rounded-full text-sm sm:text-base md:text-lg font-medium hover:bg-black/90 transition-colors"
              >
                Get in touch
                <Plus size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 group-hover:rotate-90 transition-transform duration-500" />
              </motion.a>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 lg:px-12 bg-black text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
            <div>
              <h4 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-5 md:mb-6">Ron Medina</h4>
              <p className="text-sm sm:text-base text-white/60">Designing simplicity out of complexity.</p>
              <div className="flex gap-3 sm:gap-4 mt-4 sm:mt-5 md:mt-6">
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#EAB308] transition-colors"
                >
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#EAB308] transition-colors"
                >
                  <span className="sr-only">Instagram</span>
                  <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/></svg>
                </motion.a>
              </div>
            </div>
            
            <div>
              <h4 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 md:mb-6">Navigation</h4>
              <ul className="space-y-2 sm:space-y-2.5 md:space-y-3 text-white/60 text-sm sm:text-base">
                <li>
                  <button onClick={() => scrollToSection(workRef)} className="hover:text-white transition-colors">
                    Work
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection(aboutRef)} className="hover:text-white transition-colors">
                    About
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection(contactRef)} className="hover:text-white transition-colors">
                    Contact
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 md:mb-6">Connect</h4>
              <ul className="space-y-2 sm:space-y-2.5 md:space-y-3 text-white/60 text-sm sm:text-base">
                <li>
                  <a href="mailto:hello@ronmedina.com" className="hover:text-white transition-colors">
                    hello@ronmedina.com
                  </a>
                </li>
                <li><a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-10 sm:mt-12 md:mt-16 pt-6 sm:pt-7 md:pt-8 text-center text-white/40 text-xs sm:text-sm">
            <p>© 2024 Ron Medina. All rights reserved.</p>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 text-center opacity-[0.03] pointer-events-none text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black whitespace-nowrap">
          RON MEDINA • RON MEDINA • RON MEDINA
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={scrollToTop}
            className="fixed bottom-4 sm:bottom-5 md:bottom-6 lg:bottom-8 right-4 sm:right-5 md:right-6 lg:right-8 z-40 p-2 sm:p-2.5 md:p-3 lg:p-4 bg-[#EAB308] text-black rounded-full shadow-lg hover:shadow-xl transition-shadow"
            aria-label="Scroll to top"
          >
            <ChevronDown size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 lg:w-6 lg:h-6 rotate-180" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Image Modal with Navigation */}
      <ImageModal 
        src={selectedImageIndex !== null ? allAssets[selectedImageIndex] : null}
        isOpen={selectedImageIndex !== null}
        onClose={() => setSelectedImageIndex(null)}
        onNext={nextImage}
        onPrev={prevImage}
      />
    </div>
  )
}

export default App;