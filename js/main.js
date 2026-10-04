const root = document.documentElement;
const themeColorMeta = document.getElementById('theme-color-meta');
const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');
const siteHeader = document.querySelector('.site-header');
const scrollProgress = document.getElementById('scroll-progress-bar');
const hero = document.querySelector('.hero');
const heroGrid = document.querySelector('.hero-grid');
const yearNode = document.getElementById('year');
const heroGreeting = document.getElementById('hero-greeting');
const heroSupporting = document.getElementById('hero-supporting');
const heroContext = document.getElementById('hero-context');
const heroFlowItems = [...document.querySelectorAll('.hero-flow')];
const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

// Keep each local-time greeting paired with its matching supporting line.
function getGreeting(date = new Date()) {
  const hour = date.getHours();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (hour >= 5 && hour < 12) {
    return { greeting: 'Good Morning', supportingLine: "Let's make today count.", timeZone };
  }
  if (hour >= 12 && hour < 17) {
    return { greeting: 'Good Afternoon', supportingLine: "Glad you stopped by. Here's what I bring to the table.", timeZone };
  }
  return { greeting: 'Good Evening', supportingLine: 'Thanks for taking a moment to look around.', timeZone };
}

if (heroGreeting && heroSupporting) {
  let initialGreetingStarted = false;
  let lastGreeting = '';
  let lastSupportingLine = '';
  let lastTimeZone = '';
  let rolloverPending = false;

  const updateGreeting = () => {
    const greeting = getGreeting();
    const greetingChanged = greeting.greeting !== lastGreeting || greeting.supportingLine !== lastSupportingLine;
    const timeZoneChanged = greeting.timeZone !== lastTimeZone;
    if (initialGreetingStarted && !lastGreeting) return;
    if (!greetingChanged && !timeZoneChanged) return;

    const updateText = () => {
      heroGreeting.textContent = greeting.greeting;
      heroSupporting.textContent = greeting.supportingLine;
      if (heroContext) {
        const zoneLabel = new Intl.DateTimeFormat('en', {
          timeZone: greeting.timeZone,
          timeZoneName: 'short',
        }).formatToParts(new Date()).find((part) => part.type === 'timeZoneName')?.value || greeting.timeZone;
        heroContext.textContent = `Hello from Jaipur · ${zoneLabel}`;
      }
      lastGreeting = greeting.greeting;
      lastSupportingLine = greeting.supportingLine;
      lastTimeZone = greeting.timeZone;
    };

    if (!initialGreetingStarted) {
      initialGreetingStarted = true;
      updateText();
      let greetingRevealed = false;
      const revealGreeting = () => {
        if (greetingRevealed) return;
        greetingRevealed = true;
        heroFlowItems.forEach((element) => element.classList.add('is-entering'));
        requestAnimationFrame(() => requestAnimationFrame(() => {
          heroFlowItems.forEach((element) => {
            element.classList.remove('is-entering');
            element.classList.add('is-ready');
          });
          if (!reducedMotionQuery.matches) {
            heroGreeting.classList.add('is-writing');
            window.setTimeout(() => heroGreeting.classList.remove('is-writing'), 1200);
          }
        }));
      };

      const fontReady = document.fonts
        ? document.fonts.load('400 56px Sacramento').then(revealGreeting, revealGreeting)
        : Promise.resolve().then(revealGreeting);
      window.setTimeout(revealGreeting, 1200);
      return fontReady;
    }

    if (!greetingChanged) {
      updateText();
      return;
    }
    if (rolloverPending) return;
    rolloverPending = true;
    heroGreeting.style.setProperty('--flow-delay', '0ms');
    heroSupporting.style.setProperty('--flow-delay', '0ms');
    heroGreeting.classList.add('is-time-changing');
    heroSupporting.classList.add('is-time-changing');
    window.setTimeout(() => {
      updateText();
      heroGreeting.classList.remove('is-time-changing');
      heroSupporting.classList.remove('is-time-changing');
      rolloverPending = false;
    }, 180);
  };

  updateGreeting();
  window.setInterval(updateGreeting, 60_000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) updateGreeting();
  });
}

const setTheme = (theme) => {
  root.dataset.theme = theme;
  if (themeColorMeta) {
    themeColorMeta.content = theme === 'dark' ? '#050506' : '#f5f5f7';
  }
};

setTheme(root.dataset.theme || (systemThemeQuery.matches ? 'dark' : 'light'));

const subscribeToMediaChange = (query, listener) => {
  if (query.addEventListener) query.addEventListener('change', listener);
  else query.addListener(listener);
};

subscribeToMediaChange(systemThemeQuery, (event) => {
  setTheme(event.matches ? 'dark' : 'light');
});

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

const closeMenu = (restoreFocus = false) => {
  if (!navToggle || !siteNav) return;
  siteNav.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Open menu');
  if (restoreFocus) navToggle.focus();
};

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => closeMenu());
  });

  document.addEventListener('pointerdown', (event) => {
    if (siteNav.classList.contains('open') && !siteHeader.contains(event.target)) closeMenu();
  }, { passive: true });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && siteNav.classList.contains('open')) closeMenu(true);
  });
}

const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
const navSections = navLinks
  .map((link) => document.getElementById(link.hash.slice(1)))
  .filter(Boolean);

if ('IntersectionObserver' in window && navSections.length) {
  const activeSectionObserver = new IntersectionObserver((entries) => {
    const visibleEntries = entries.filter((entry) => entry.isIntersecting);
    if (!visibleEntries.length) return;
    const current = visibleEntries.sort((first, second) =>
      Math.abs(first.boundingClientRect.top) - Math.abs(second.boundingClientRect.top)
    )[0].target;
    navLinks.forEach((link) => {
      if (link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-18% 0px -68% 0px', threshold: 0 });
  navSections.forEach((section) => activeSectionObserver.observe(section));
}

const revealTargets = [...document.querySelectorAll('.reveal')];
document.querySelectorAll('.skills-grid, .stats-strip, .projects-grid, .education-grid').forEach((group) => {
  [...group.children].forEach((card, index) => {
    card.style.setProperty('--reveal-delay', `${Math.min(index * 65, 260)}ms`);
  });
});

if ('IntersectionObserver' in window && !reducedMotionQuery.matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
  revealTargets.forEach((element) => revealObserver.observe(element));
  root.classList.add('js-ready');
} else {
  revealTargets.forEach((element) => element.classList.add('visible'));
}

let scrollFrame = 0;
const updateScrollEffects = () => {
  scrollFrame = 0;
  const scrollTop = window.scrollY || root.scrollTop;
  const scrollRange = Math.max(1, root.scrollHeight - window.innerHeight);
  if (scrollProgress) scrollProgress.style.transform = `scaleX(${Math.min(1, scrollTop / scrollRange)})`;
  siteHeader?.classList.toggle('is-scrolled', scrollTop > 12);

  if (heroGrid && hero && !reducedMotionQuery.matches) {
    const heroHeight = Math.max(1, hero.offsetHeight);
    const progress = Math.min(1, Math.max(0, scrollTop / (heroHeight * 0.82)));
    heroGrid.style.setProperty('--hero-parallax', `${Math.min(22, scrollTop * 0.045)}px`);
    heroGrid.style.setProperty('--hero-scale', String(1 - progress * 0.025));
    heroGrid.style.setProperty('--hero-opacity', String(1 - progress * 0.18));
  }
};

const scheduleScrollEffects = () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollEffects);
};

window.addEventListener('scroll', scheduleScrollEffects, { passive: true });
window.addEventListener('resize', scheduleScrollEffects, { passive: true });
scheduleScrollEffects();

if (pointerQuery.matches && !reducedMotionQuery.matches) {
  const reflectiveCards = document.querySelectorAll(
    '.skill-card, .stat-card, .timeline-content, .project-card, .education-card, .contact-direct-card, .hero-portrait'
  );

  reflectiveCards.forEach((card) => {
    let bounds;
    let pointerX = 0;
    let pointerY = 0;
    let pointerFrame = 0;

    card.addEventListener('pointerenter', (event) => {
      bounds = card.getBoundingClientRect();
      pointerX = event.clientX - bounds.left;
      pointerY = event.clientY - bounds.top;
      card.classList.add('is-pointed');
    }, { passive: true });

    card.addEventListener('pointermove', (event) => {
      if (!bounds || pointerFrame) return;
      pointerX = event.clientX - bounds.left;
      pointerY = event.clientY - bounds.top;
      pointerFrame = requestAnimationFrame(() => {
        card.style.setProperty('--shine-x', `${pointerX}px`);
        card.style.setProperty('--shine-y', `${pointerY}px`);
        pointerFrame = 0;
      });
    }, { passive: true });

    card.addEventListener('pointerleave', () => {
      bounds = null;
      card.classList.remove('is-pointed');
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
    }, { passive: true });
  });
}

