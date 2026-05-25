import { useState, useEffect, useCallback } from 'react'
import {
  HiOutlineArrowLeft,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCodeBracket,
  HiOutlinePhoto,
  HiOutlinePlay,
  HiOutlineRocketLaunch,
  HiOutlineUserGroup,
  HiOutlineXMark,
} from 'react-icons/hi2'
import { SiEpicgames, SiSteam } from 'react-icons/si'
import './App.css'

function Lightbox({ images, index, onClose }) {
  const [current, setCurrent] = useState(index)

  const prev = useCallback(() => setCurrent(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setCurrent(i => (i + 1) % images.length), [images.length])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, onClose])

  return (
    <div className="lb-overlay" onClick={onClose}>
      <button className="lb-close" onClick={onClose} aria-label="Zavřít">
        <HiOutlineXMark />
      </button>
      <button className="lb-arrow lb-arrow--left" onClick={e => { e.stopPropagation(); prev() }} aria-label="Předchozí">
        <HiOutlineChevronLeft />
      </button>
      <div className="lb-img-wrap" onClick={e => e.stopPropagation()}>
        <img src={images[current]} alt="" className="lb-img" />
        <div className="lb-counter">{current + 1} / {images.length}</div>
      </div>
      <button className="lb-arrow lb-arrow--right" onClick={e => { e.stopPropagation(); next() }} aria-label="Další">
        <HiOutlineChevronRight />
      </button>
    </div>
  )
}

/** Prezentační web — uprav texty a odkazy. */
const SITE = {
  brand: 'Space Trader',
  heroBanner: '/screenshots/hero-banner.png',
  heroBannerWidth: 1024,
  heroBannerHeight: 506,
  gameUrl: '/game/index.html',
  steam: {
    label: 'Steam',
    hint: 'Wishlist · koupě · komunita',
    href: '#',
  },
  epic: {
    label: 'Epic Games',
    hint: 'Wishlist · koupě · komunita',
    href: '#',
  },
  gallery: [
    '/screenshots/screen1.png',
    '/screenshots/screen2.png',
    '/screenshots/screen3.png',
    '/screenshots/screen4.png',
    '/screenshots/screen5.png',
    '/screenshots/screen6.png',
    '/screenshots/screen7.png',
    '/screenshots/screen8.png',
    '/screenshots/screen9.png',
  ],
  team: [
    { role: 'Člen týmu', name: 'Jiří Kabrt' },
    { role: 'Člen týmu', name: 'Lukáš Maisner' },
    { role: 'Hlavní vedoucí týmu', name: 'Jakub Dostál' },
    { role: 'Pomoc s webem', name: 'Claude Code' },
  ],
  sources: [
    { label: 'React', href: 'https://react.dev/' },
    { label: 'Vite', href: 'https://vite.dev/' },
    { label: 'react-icons', href: 'https://react-icons.github.io/react-icons/' },
    { label: 'Fonty (Google Fonts)', href: 'https://fonts.google.com/' },
  ],
}

function SteamComingSoon({ brand, onBack }) {
  return (
    <div className="site">
      <div className="site-aurora" aria-hidden />
      <div className="site-inner">
        <header className="site-header">
          <div className="site-header__glow" aria-hidden />
          <a className="site-logo" href="#top">
            <span className="site-logo__mark" aria-hidden>
              <HiOutlineRocketLaunch className="site-logo__icon" />
            </span>
            <span className="site-logo__text">{brand}</span>
          </a>
        </header>

        <main id="main">
          <section className="section section--steam steam-soon-page" style={{ marginTop: 'clamp(40px, 8vw, 72px)' }}>
            <div className="section__rim" aria-hidden />
            <SiSteam
              aria-hidden
              style={{
                width: 72,
                height: 72,
                color: 'var(--hud-cyan)',
                filter: 'drop-shadow(0 0 18px rgba(100,200,255,0.5))',
                marginBottom: '1.5rem',
              }}
            />
            <h1 className="section__title" style={{ fontSize: 'clamp(1.3rem, 4vw, 2rem)', marginBottom: '1.2rem' }}>
              Připravujeme vše pro vás
            </h1>
            <div className="section__prose" style={{ maxWidth: '32rem', margin: '0 auto 2.5rem' }}>
              <p>
                Naše Steam stránka momentálně není k dispozici. Pracujeme na tom —
                brzy zde najdete wishlist, koupi i komunitu.
              </p>
              <p style={{ color: 'var(--text-muted)' }}>
                Děkujeme za trpělivost. Zůstaňte naladěni!
              </p>
            </div>
            <button className="btn btn--secondary" onClick={onBack}>
              <HiOutlineArrowLeft aria-hidden />
              Zpět na hlavní stránku
            </button>
          </section>
        </main>
      </div>
    </div>
  )
}

function App() {
  const { brand, steam, epic } = SITE
  const [page, setPage] = useState('home')
  const [lightbox, setLightbox] = useState(null)

  if (page === 'steam') {
    return <SteamComingSoon brand={brand} onBack={() => setPage('home')} />
  }

  return (
    <div className="site">
      <div className="site-aurora" aria-hidden />
      <div className="site-inner">
        <header className="site-header">
          <div className="site-header__glow" aria-hidden />
          <a className="site-logo" href="#top">
            <span className="site-logo__mark" aria-hidden>
              <HiOutlineRocketLaunch className="site-logo__icon" />
            </span>
            <span className="site-logo__text">{brand}</span>
          </a>
          <nav className="site-nav" aria-label="Hlavní menu">
            <a href="#o-hre">O hře</a>
            <a href="#steam">Obchody</a>
            <a href="#galerie">Gameplay</a>
            <a href="#tym">Tým</a>
            <a href="#zdroje">Zdroje</a>
          </nav>
        </header>

        <main id="main">
          <section className="hero hero--art-banner" id="top" aria-labelledby="hero-title">
            <div className="hero__visual">
              <div className="hero__visual-frame" aria-hidden />
              <div className="hero__scanlines" aria-hidden />
              <img
                className="hero__cover"
                src={SITE.heroBanner}
                alt=""
                width={SITE.heroBannerWidth}
                height={SITE.heroBannerHeight}
                decoding="async"
                fetchPriority="high"
              />
            </div>
            <div className="hero__content">
              <p className="hero__eyebrow">2D vesmírný obchod</p>
              <h1 id="hero-title" className="visually-hidden">
                {brand}
              </h1>
              <p className="hero__lede">
              </p>
              <div className="hero__actions">
                <a className="btn btn--primary" href={SITE.gameUrl} target="_blank" rel="noreferrer">
                  <HiOutlinePlay aria-hidden />
                  Spustit hru
                </a>
              </div>
            </div>
          </section>

          <section className="section section--about" id="o-hre">
            <div className="section__rim" aria-hidden />
            <h2 className="section__title">
              <HiOutlineRocketLaunch aria-hidden />
              O hře
            </h2>
            <div className="section__prose">
              <p>
                a vydáváš se dobývat nekonečný vesmír. Nakupuješ zboží na jedné stanici a
                prodáváš ho draze jinde — každý obchod je sázka na to, kde se ceny zrovna
                pohybují.

                Vedle volného obchodu plníš přepravní zakázky: naloď náklad, doruč ho na
                cílovou stanici a inkasuj odměnu. Čím nebezpečnější trasa, tím větší
                výdělek. Za vydělané kredity opravuješ loď, doplňuješ palivo a pořizuješ
                vylepšení, která ti dají navrch v soubojích i na dlouhých trasách.

                Jakmile prozkoumáš Sluneční soustavu, odemykají se warpové skoky do
                vzdálených galaxií — Aethon Prime, Mlhovina Veridia, Krynn Nexus a Void
                Reach. Každá je jiná, každá skrývá jiná rizika i příležitosti. Vesmír se
                generuje procedurálně a nekončí — záleží jen na tobě, jak daleko se
                dostaneš.
              </p>
              <p>
                Struktura zůstává jednoduchá — snadné doplňování textů nebo pozdější
                napojení na CMS.
              </p>
            </div>
          </section>

          <section className="section section--steam" id="steam">
            <div className="section__rim" aria-hidden />
            <h2 className="section__title">
              Kde koupit
            </h2>
            <div className="shop-grid">
              <button
                className="shop-card shop-card--steam"
                onClick={() => setPage('steam')}
              >
                <SiSteam className="shop-card__icon" aria-hidden />
                <span className="shop-card__label">{steam.label}</span>
                <span className="shop-card__hint">{steam.hint}</span>
              </button>
              <button
                className="shop-card shop-card--epic"
                onClick={() => setPage('steam')}
              >
                <SiEpicgames className="shop-card__icon" aria-hidden />
                <span className="shop-card__label">{epic.label}</span>
                <span className="shop-card__hint">{epic.hint}</span>
              </button>
            </div>
            <p className="shop-coming-soon">
              Vše se připravuje — brzy dostupné na obou platformách.
            </p>
          </section>

          <section className="section section--gallery-block" id="galerie">
            <div className="section__rim" aria-hidden />
            <h2 className="section__title">
              <HiOutlinePhoto aria-hidden />
              Gameplay &amp; screenshoty
            </h2>
            <ul className="gallery">
              {SITE.gallery.map((src, i) => (
                <li key={src} className="gallery__item">
                  <figure className="gallery__figure" onClick={() => setLightbox(i)} style={{ cursor: 'pointer' }}>
                    <div className="gallery__img-wrap">
                      <img src={src} alt="" width={960} height={540} loading="lazy" />
                      <div className="gallery__shine" aria-hidden />
                    </div>
                  </figure>
                </li>
              ))}
            </ul>
            {lightbox !== null && (
              <Lightbox images={SITE.gallery} index={lightbox} onClose={() => setLightbox(null)} />
            )}
          </section>

        </main>

        <footer className="site-footer" id="tym">
          <div className="site-footer__line" aria-hidden />

          <div className="footer-panel" id="zdroje">
            <h2 className="footer-panel__title">
              <HiOutlineUserGroup aria-hidden />
              Kdo to dělá
            </h2>
            <ul className="team-list team-list--footer">
              {SITE.team.map(({ role, name }) => (
                <li key={role}>
                  <span className="team-list__role">{role}</span>
                  <span className="team-list__name">{name}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-sources">
            <h3 className="footer-sources__title">
              <HiOutlineCodeBracket aria-hidden />
              Zdroje &amp; licence
            </h3>
            <ul className="sources-list sources-list--footer">
              {SITE.sources.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noreferrer">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="site-footer__line" aria-hidden />
          <p className="footer-copy">
            © {new Date().getFullYear()} {brand}
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
