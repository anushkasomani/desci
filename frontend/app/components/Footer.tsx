// app/components/Footer.tsx
import Link from 'next/link'
import { CubeTransparentIcon } from '@heroicons/react/24/outline'

const footerSections = {
  platform: [
    { name: 'Tokenize IP', href: '/tokenize' },
    { name: 'Marketplace', href: '/market' },
    { name: 'Analytics', href: '/analytics' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Whitepaper', href: '/whitepaper' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-indigo-500/10">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2">
              <CubeTransparentIcon className="w-8 h-8 text-indigo-400" />
              <span className="text-2xl font-bold text-white">GENOME</span>
            </Link>
            <p className="mt-4 text-sm text-gray-400">The future of IP is here.</p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Platform</h3>
            <ul className="mt-4 space-y-2">
              {footerSections.platform.map(item => (
                <li key={item.name}><Link href={item.href} className="text-base text-gray-400 hover:text-white">{item.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Company</h3>
            <ul className="mt-4 space-y-2">
              {footerSections.company.map(item => (
                <li key={item.name}><Link href={item.href} className="text-base text-gray-400 hover:text-white">{item.name}</Link></li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Legal</h3>
            <ul className="mt-4 space-y-2">
              {footerSections.legal.map(item => (
                <li key={item.name}><Link href={item.href} className="text-base text-gray-400 hover:text-white">{item.name}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8">
          <p className="text-base text-gray-500 text-center">&copy; 2025 GENOME Technologies Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer;