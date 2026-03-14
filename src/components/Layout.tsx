import { motion } from 'framer-motion'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-velvet spotlight-bg vignette">
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <header className="text-center pt-[calc(12px+var(--safe-top))] pb-2 px-4">
          <motion.h1
            className="font-serif text-lg font-semibold text-gold-gradient tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            The Evvies
          </motion.h1>
        </header>

        {/* Main content */}
        <main className="flex-1 flex flex-col px-4 pb-4">
          {children}
        </main>
      </div>
    </div>
  )
}
