import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavigationContext } from './navigationContextInstance';

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<string>('expenses');
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isMainPage =
    location.pathname === '/' ||
    location.pathname === '/overview' ||
    location.pathname === '/expenses';

  // Helper to get reliable scroll offset across browsers
  const getScrollTop = () =>
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0;

  // Smooth scroll to a section on the main page
  const scrollToSection = useCallback(
    (id: string) => {
      // If not on main page, navigate to main page with hash
      if (!isMainPage) {
        navigate(`/#${id}`);
        return;
      }

      const element = document.getElementById(id);
      if (!element) {
        if (id === 'expenses') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setActiveSection('expenses');
        }
        return;
      }

      isProgrammaticScrollRef.current = true;
      setActiveSection(id);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      if (id === 'expenses') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }

      // Update URL hash cleanly without page reload
      window.history.replaceState(null, '', `#${id}`);

      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 800);
    },
    [isMainPage, navigate]
  );

  // Initial load / route change / hash synchronization
  useEffect(() => {
    if (!isMainPage) return;

    const hash = location.hash.replace(/^#/, '').toLowerCase();
    const path = location.pathname.replace(/^\//, '').toLowerCase();

    const targetSection = (hash === 'overview' || path === 'overview') ? 'overview' : 'expenses';
    const timer = setTimeout(() => {
      setActiveSection(targetSection);
      if (targetSection === 'overview') {
        const el = document.getElementById('overview');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname, location.hash, isMainPage]);

  // Robust, bidirectional scroll observer & listener
  useEffect(() => {
    if (!isMainPage) return;

    let ticking = false;

    const updateActiveFromScroll = () => {
      if (isProgrammaticScrollRef.current) return;

      const scrollTop = getScrollTop();

      // 1. If near the absolute top, always Expenses (now the top section)
      if (scrollTop < 80) {
        setActiveSection('expenses');
        return;
      }

      const overviewEl = document.getElementById('overview');
      if (!overviewEl) {
        setActiveSection('expenses');
        return;
      }

      // 2. If scrolled near the bottom of the document, Overview is active
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      if (window.innerHeight + scrollTop >= docHeight - 80) {
        setActiveSection('overview');
        return;
      }

      // 3. Section position relative to viewport:
      // When the top edge of Overview reaches within 55% of the viewport height,
      // Overview becomes the dominant section in view.
      const threshold = window.innerHeight * 0.55;
      const rect = overviewEl.getBoundingClientRect();

      if (rect.top <= threshold) {
        setActiveSection('overview');
      } else {
        setActiveSection('expenses');
      }
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          ticking = false;
          updateActiveFromScroll();
        });
        ticking = true;
      }
    };

    // Attach to both window and document to guarantee event delivery on all browsers/platforms
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    // Also observe elements via IntersectionObserver for instant response
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          if (isProgrammaticScrollRef.current) return;
          for (const entry of entries) {
            if (entry.target.id === 'overview') {
              const rect = entry.target.getBoundingClientRect();
              if (rect.top <= window.innerHeight * 0.55) {
                setActiveSection('overview');
              } else if (rect.top > window.innerHeight * 0.55 && getScrollTop() > 80) {
                setActiveSection('expenses');
              }
            }
          }
        },
        {
          root: null,
          threshold: [0, 0.1, 0.25, 0.5, 0.75],
        }
      );

      const expEl = document.getElementById('expenses');
      const ovEl = document.getElementById('overview');
      if (expEl) observer.observe(expEl);
      if (ovEl) observer.observe(ovEl);
    }

    // Initial check
    updateActiveFromScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (observer) observer.disconnect();
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [isMainPage]);

  return (
    <NavigationContext.Provider value={{ activeSection, scrollToSection, isMainPage }}>
      {children}
    </NavigationContext.Provider>
  );
};
