# 🚀 Space Trader

Vesmírná obchodní a bojová hra inspirovaná Elite Dangerous, napsaná v čistém JavaScriptu s Canvas 2D API. Bez závislostí, bez buildtools — jen otevřít `index.html` a hrát.

## Funkce

- **Volný pohyb ve vesmíru** — newtonská fyzika se setrvačností, boční trysky, boost
- **Obchodní systém** — 8 druhů zboží, dynamické ceny na každé stanici
- **5 galaxií** — mezigalaktický warp s 20sekundovým odpočtem a hyperspace animací
- **20 kupovatelných lodí** — od Viper Mk.I až po Fleet Carrier, každá s unikátními vlastnostmi
- **Zakázky** — přepravní kontrakty s hodnocením a odměnami
- **Boj** — nepřátelské lodě, střelba, exploze, XP za zabití
- **Upgrade systém** — Motor, Štít, Pancéřování, Náklad, Zbraně, Nádrž
- **Coriolis stanice** — Elite Dangerous styl, velké rotující stanice s výběrem parkovacího mola
- **Autopilot** — PID řídící systém s plynným brzděním
- **Garáže a flotila** — kupování hangárů, správa více lodí najednou
- **Tuning Studio** — vlastní název lodi, barva trupu a trysek
- **Více pilotů** — 3 save sloty s výběrem startovní základny (ETS2 styl)
- **Permadeath / GTA respawn** — při zničení lodi pokuta a respawn v Sol systému
- **Zvukový systém** — SFX pro střelbu, exploze, warp, přistání, level up
- **Admin režim** — neomezené kredity, palivo, nezničitelnost (přístupový kód)
- **Světlý / tmavý režim** — přepínatelný z hlavního menu

## Jak spustit

Stačí otevřít soubor `game/index.html` v prohlížeči (Chrome / Firefox / Edge):

```
https://spacetrader2.netlify.app/
```

## Ovládání

| Klávesa | Akce |
|---|---|
| `W` | Hlavní trysky (dopředu) |
| `A` / `D` | Otočení lodě |
| `Q` / `E` | Boční trysky (bez otočení) |
| `Shift+W` | Boost |
| `Mezerník` | Střelba |
| `F` | Přistát / Vzlétnout |
| `P` | Parkovací režim |
| `M` | Mapa hvězdné soustavy |
| `N` | Mapa galaxií |
| `R` | Spustit warp odpočet |
| `ESC` | Pauza |

## Struktura projektu

```
game/
├── index.html      # Hlavní HTML + všechny UI overlay elementy
├── style.css       # Veškeré styly
├── config.js       # Konstanty, konfigurace lodí, zboží, galaxií, upgradů
└── js/
    ├── sound.js    # Zvukový systém (Web Audio API)
    ├── intro.js    # Úvodní cinematic
    ├── world.js    # Generování světa (chunky, stanice, nepřátelé)
    ├── render.js   # Vykreslování (Canvas 2D)
    ├── ui.js       # Veškeré UI — HUD, obchod, dock panel, upgrady
    └── main.js     # Herní smyčka, vstupy, stavový automat
```

## Technologie

- **Vanilla JavaScript** — bez frameworků, bez závislostí
- **Canvas 2D API** — vykreslování hry i minimapy
- **Web Audio API** — procedurálně generované zvuky
- **localStorage** — ukládání hry (3 sloty)

## Školní projekt

Vytvořeno jako školní projekt na **Střední průmyslové škole Trutnov**.

---

*SPACE TRADER © 2026 — Nekonečný vesmír*
