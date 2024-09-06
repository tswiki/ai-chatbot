"use client";
import { useEffect } from 'react';
import Hotjar from '@hotjar/browser';


// Extend the Window interface to include hj and its q property
declare global {
  interface Window {
    hj: ((...args: any[]) => void) & { q?: any[] };
    _hjSettings: { hjid: number; hjsv: number };
  }
}

const HotjarSnippet = () => {
    
    const siteId = 5126157;
    const hotjarVersion = 6;

  useEffect(() => {
    Hotjar.init(siteId, hotjarVersion);

  }, []);

  return null;
};

export default HotjarSnippet;
