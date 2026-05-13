import { GitBranch, ExternalLink } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-white/5 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <p className="text-sm text-white/40">© 2025 Aleksandros Iljas</p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/aleksiljs1"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-white/40 transition-colors hover:text-sky-400"
          >
            <GitBranch size={18} />
          </a>
          <a
            href="https://www.linkedin.com/in/aleksandros-iljas/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="text-white/40 transition-colors hover:text-sky-400"
          >
            <ExternalLink size={18} />
          </a>
        </div>
      </div>
    </footer>
  )
}
