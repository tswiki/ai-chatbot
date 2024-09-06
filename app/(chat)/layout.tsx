'use client'

import { SidebarDesktop } from '@/components/sidebar-desktop'
import Hotjar from '@hotjar/browser';
import { useEffect } from 'react'


interface ChatLayoutProps {
  children: React.ReactNode
}

export default async function ChatLayout({ children }: ChatLayoutProps) {
  
  useEffect(()=>{Hotjar.init(5126157, 6)},[])
  
  return (
    <div className="relative flex h-[calc(100vh_-_theme(spacing.16))] overflow-hidden">
      <SidebarDesktop />
      {children}
    </div>
  )
}
