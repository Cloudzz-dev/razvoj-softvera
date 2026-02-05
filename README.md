# DFDS: Dokumentacija

> **Verzija**: 3.0.0  
> **Datum**: Veljača 2026  
> **Status**: Produkcijska Verzija  
> **Tim**: Team Cloudzz

---

## 📖 Sadržaj

1. [Uvod i Pregled Projekta](#-uvod-i-pregled-projekta)
2. [Detaljan opis rada](#-detaljan-opis-rada)
- [Korisničke Uloge](#-korisničke-uloge)
- [Naslovna Stranica (Landing Page)](#-naslovna-stranica-landing-page)
- [Dashboard Funkcionalnosti](#-dashboard-funkcionalnosti-sve-kartice)
- [AI Asistent](#-ai-asistent)
3. [Tehnička dokumentacija](#-tehnička-dokumentacija)
- [Tehnološki Stack](#-tehnološki-stack)
- [Arhitektura Sustava](#-arhitektura-sustava)
- [Shema Baze Podataka](#-shema-baze-podataka)
- [API Dokumentacija](#-api-dokumentacija)
- [Sigurnost](#-sigurnost)
- [Kako Pokrenuti](#-kako-pokrenuti)

---

## 📖 Uvod i Pregled Projekta

### Što je DFDS?

**DFDS (Developers, Founders, Deal-makers, Startups)** je sveobuhvatna platforma dizajnirana da poboljša startup ekosustav. Naš tim, **Team Cloudzz**, fokusirao se na rješavanje ključnog problema: *nepovezanosti između inovatora (Foundera), developera i investitora.
### Tim Cloudzz

**Team Cloudzz** je tim koji je dizajnirao DFDS. Trenutno je tim od tri učenika Strukovne škole Vice Vlatkovića

|Ime i Prezime|Uloga|
|-------------|-----|
|Leon Ležaić|Developer|
|Frane Fantina|Developer|
|Roko Begonja|Developer|


### Ideja

**Kako smo došli na ideju za DFDS?** na ideju za DFDS smo došli nakon prikupljenih podataka da u Hrvatskoj oko 70% startupa propadne zbog nedostatka financiranja. Također smo primjetili da je teško pronaći investitore i developere koji bi se pridružili startupu. Zato smo napravili DFDS kako bi riješili taj problem.



### Misija

Stvoriti **živi ekosustav** gdje se:
- 🚀 Startup timovi **grade** od nule
- 💰 Inovacije **financiraju** transparentno
- 🤝 Talenti **povezuju** inteligentno

### Ključne Značajke Platforme

| Značajka | Opis |
|----------|------|
| **Smart Matching** | Algoritamsko povezivanje investitora i startupa korištenjem vektorske sličnosti |
| **Real-time Chat** | Privatne poruke bez kašnjenja putem WebSocketa |
| **AI Konzultant** | Instant analiza poslovnih ideja i generiranje e-mailova |
| **Equity Simulator** | Interaktivni kalkulator dilucije vlasništva |
| **Investicijski Dashboard** | Transparentno praćenje financiranja i transakcija |
| **Community Threads** | Forum za razmjenu znanja i partnerstava |
| **API Pristup** | Programatski pristup podacima platforme |

---

## Detaljan opis rada

---


## 👥 Korisničke Uloge

DFDS podržava četiri različite korisničke uloge, svaka s prilagođenim sučeljem i funkcionalnostima:

```mermaid
graph TB
    subgraph Uloge["🎭 Korisničke Uloge"]
        DEV["👨‍💻 DEVELOPER<br/>Graditelji Proizvoda"]
        FOUNDER["🚀 FOUNDER<br/>Osnivači Startupa"]
        INVESTOR["💼 INVESTOR<br/>Financijeri"]
        ADMIN["🛡️ ADMIN<br/>Administratori"]
    end
    
    DEV --> |"Traži posao"| FOUNDER
    FOUNDER --> |"Traži financiranje"| INVESTOR
    FOUNDER --> |"Gradi tim"| DEV
    INVESTOR --> |"Ulaže u"| FOUNDER
    ADMIN --> |"Nadzire"| DEV
    ADMIN --> |"Nadzire"| FOUNDER
    ADMIN --> |"Nadzire"| INVESTOR
```

### 👨‍💻 Developer (Razvojni Programer)

**Pristup**: Dashboard s fokusom na mrežu i prilike

| Mogućnost | Opis |
|-----------|------|
| Profil vještina | Prikaz tehnologija (React, Node.js, Python, itd.) |
| Portfolio projekata | Galerija prošlih radova s GitHub linkovima |
| Network pretraga | Pronalaženje drugih developera i foundera |
| Slanje poruka | Direktna komunikacija s potencijalnim poslodavcima |
| Prijava na startup | Mogućnost pridruživanja postojećim startupima |

### 🚀 Founder (Osnivač)

**Pristup**: Posebni founder dashboard s metrikama startupa

| Mogućnost | Opis |
|-----------|------|
| Kreiranje startupa | Registracija novog startupa s pitch-om i detaljima |
| Tim management | Pozivanje članova i dodjela uloga |
| Investor matching | AI-predloženi investitori na temelju fokusa |
| Funding runway | Prikaz prikupljenih sredstava i trajanja |
| Growth analytics | Grafikoni rasta i aktivnosti |

### 💼 Investor

**Pristup**: Dashboard s fokusom na deal flow

| Mogućnost | Opis |
|-----------|------|
| Startup discovery | Pregled startupa po fazama (Pre-seed, Seed, Series A) |
| Portfolio praćenje | Pregled svih ulaganja |
| Due diligence | Pristup detaljima startupa |
| Direktne poruke | Kontaktiranje osnivača |
| Check size profil | Prikaz prosječnog ulaganja i fokusa |

### 🛡️ Admin

**Pristup**: Potpuni pristup + admin funkcije

| Mogućnost | Opis |
|-----------|------|
| Analytics dashboard | Metrike platforme u realnom vremenu |
| Blog upravljanje | Kreiranje i uređivanje blog postova |
| Korisnici pregled | Nadzor svih računa |
| Feature requests | Upravljanje zahtjevima za nove funkcije |

---

## 📱 Naslovna Stranica (Landing Page)

Prva stranica koju posjetitelji vide. Dizajnirana za konverziju.

![Naslovna Stranica](./docs/images/HomePage-Screenshot.png)

### Sekcije:

1. **Hero Section** - Glavni naslov, opis i CTA gumbi
2. **How It Works** - 3-step objašnjenje platforme
3. **Call To Action** - Registracijski CTA
4. **Modern Footer** - Linkovi, social media, copyright


---

## 📱 Dashboard Funkcionalnosti (Sve Kartice)

Dashboard je srce DFDS platforme. Sadrži **12 zasebnih kartica** za različite funkcionalnosti:

```mermaid
graph LR
    subgraph Navigation["📍 Dashboard Navigacija"]
        O["🏠 Overview"]
        S["🚀 Startups"]
        N["👥 Network"]
        I["💼 Investors"]
        T["💬 Threads"]
        M["✉️ Messages"]
        P["💳 Payments"]
        R["🗺️ Roadmap"]
        C["📊 Calculator"]
        A["🔑 API Access"]
        MB["🛡️ Members"]
        ST["⚙️ Settings"]
    end
    
    O --> S --> N --> I --> T --> M --> P --> R --> C --> A --> MB --> ST
```

---

### 1. 🏠 Overview (Pregled)

**Ruta**: `/dashboard`

Kontrolna ploča s pregledom ključnih metrika i brzim akcijama.

![Glavni Dashboard](./docs/images/dashboard_final_1769369850203.png)

#### Komponente:

| Element | Opis |
|---------|------|
| **Welcome Section** | Personalizirani pozdrav s imenom korisnika |
| **Stats Cards** | 4 kartice: Connections, Startups, Investors, Growth |
| **Growth Dashboard** | Interaktivni graf s metrikama rasta (za developere) |
| **Founder Dashboard** | Runway, funding, team size (za foundere) |
| **Quick Actions** | Brzi linkovi: Find Co-founders, Browse Startups, Connect with Investors |
| **Action Buttons** | Messages i Payments gumbi s gradijentom |
| **Recent Activity** | Lista zadnjih aktivnosti s ikonama i vremenskim oznakama |

#### Razlike po ulozi:

```mermaid
graph TB
    subgraph Dashboard
        CHECK{Uloga?}
        CHECK -->|FOUNDER| FD["FounderDashboard<br/>• Runway<br/>• Raised<br/>• Team Size<br/>• Funding Graph"]
        CHECK -->|DEVELOPER/INVESTOR| GD["GrowthDashboard<br/>• Connections Graph<br/>• Activity Metrics<br/>• Network Growth"]
    end
```

---

### 2. 🚀 Startups

**Ruta**: `/dashboard/startups`

Pregled i kreiranje startupa na platformi.

![Pregled Startupa](./docs/images/startups_page_final_1769369880445.png)

#### Funkcionalnosti:

| Funkcija | Opis |
|----------|------|
| **Search** | Pretraga po imenu, pitch-u, fazi ili founderu |
| **Create Startup** | Modal za registraciju novog startupa |
| **Startup Cards** | Prikaz: logo, ime, faza, pitch, founder |
| **Connect Button** | Direktno slanje poruke founderu |
| **Pagination** | Navigacija kroz stranice (25 po stranici) |
| **External Links** | Link na web stranicu startupa |

#### Faze Startupa:

```mermaid
graph LR
    PS["🌱 Pre-seed"] --> S["🌿 Seed"] --> A["🌳 Series A"] --> B["🌲 Series B+"]
```

---

### 3. 👥 Network (Mreža Developera)

**Ruta**: `/dashboard/network`

Pronalaženje talenata za gradnju tima.

![Mreža Developera](./docs/images/network_page_1769370073312.png)

#### Funkcionalnosti:

| Funkcija | Opis |
|----------|------|
| **Developer Grid** | Kartice developera s avatarima |
| **Search** | Pretraga po imenu ili emailu |
| **Skills Display** | Prikaz tehnologija (badges) |
| **Bio Preview** | Kratki opis developera |
| **Location** | Geografska lokacija |
| **Connect** | Gumb za slanje poruke |
| **Load More** | Infinite scroll ili pagination |

---

### 4. 💼 Investors

**Ruta**: `/dashboard/investors`

Povezivanje s investitorima.

![Investitori](./docs/images/investors_page_1769370060670.png)

#### Funkcionalnosti:

| Funkcija | Opis |
|----------|------|
| **Investor Grid** | Kartice investitora |
| **Search** | Pretraga po imenu |
| **Focus Areas** | Područje interesa (SaaS, AI, Web3...) |
| **Check Size** | Prosječna veličina ulaganja |
| **Portfolio Count** | Broj ulaganja |
| **Connect** | Direktna poruka investitoru |

---

### 5. 💬 Threads (Diskusije)

**Ruta**: `/dashboard/threads`

Community forum za razmjenu znanja.

![Diskusije](./docs/images/threads_page_1769370084469.png)

#### Funkcionalnosti:

| Funkcija | Opis |
|----------|------|
| **Create Thread** | Kreiranje nove diskusije s naslovom, sadržajem i tagovima |
| **Thread List** | Lista svih diskusija sortirano po vremenu |
| **Tags** | Filtriranje po kategorijama |
| **Like** | Heart reakcija na thread |
| **Reply** | Odgovaranje na diskusije |
| **Author Info** | Ime, uloga i firma autora |
| **Trending** | Sidebar s popularnim threadovima |

#### Thread Model:

```mermaid
erDiagram
    Thread ||--o{ ThreadReply : "ima"
    Thread ||--o{ ThreadLike : "ima"
    User ||--o{ Thread : "kreira"
    User ||--o{ ThreadReply : "piše"
    User ||--o{ ThreadLike : "lajka"
    
    Thread {
        string id PK
        string title
        string content
        string[] tags
        datetime createdAt
    }
    
    ThreadReply {
        string id PK
        string content
        int likes
        datetime createdAt
    }
    
    ThreadLike {
        string id PK
        datetime createdAt
    }
```

---

### 6. ✉️ Messages (Poruke)

**Ruta**: `/dashboard/messages`

Real-time chat sustav.

![Chat Sustav](./docs/images/chat_page_final_1769369863673.png)

#### Funkcionalnosti:

| Funkcija | Opis |
|----------|------|
| **Message Inbox** | Lista konverzacija s preview-om zadnje poruke |
| **Conversation View** | Prikaz svih poruka u konverzaciji |
| **Real-time Updates** | Pusher WebSocket za instant poruke |
| **Unread Indicators** | Označavanje nepročitanih poruka |
| **User Search** | Pretraga korisnika za novu konverzaciju |
| **Timestamps** | Relativno vrijeme (prije X minuta) |

#### Real-time Arhitektura:

```mermaid
sequenceDiagram
    participant A as Alice
    participant API as Server
    participant P as Pusher
    participant B as Bob
    
    A->>API: POST /api/messages/send
    API->>API: Spremi u PostgreSQL
    API->>P: pusher.trigger('user-bob', 'new-message', data)
    P-->>B: WebSocket event
    B->>B: Prikaži novu poruku
    API-->>A: 201 OK
```

---

### 7. 💳 Payments (Plaćanja)

**Ruta**: `/dashboard/payments`

Slanje i primanje novca unutar platforme.

#### Funkcionalnosti:

| Funkcija | Opis |
|----------|------|
| **Stats Overview** | Total Sent, Total Received, Platform Fees (2.5%) |
| **User Search** | Pretraga primatelja po imenu ili emailu |
| **Payment Modal** | Modal za unos iznosa i odabir metode |
| **Transaction History** | Lista svih transakcija s filterima |
| **Payment Methods** | PayPal, Crypto (viem), Card |

#### Platne Metode:

```mermaid
graph TB
    subgraph Methods["Podržane Metode"]
        PP["💳 PayPal<br/>Fiat Currency"]
        CR["🔗 Crypto<br/>ETH/USDC via viem"]
        CD["💰 Card<br/>Stripe Integration"]
    end
    
    PP --> TX["Transaction<br/>2.5% Fee"]
    CR --> TX
    CD --> TX
```

#### Transaction Statusi:

| Status | Opis |
|--------|------|
| `PENDING` | Transakcija pokrenuta, čeka potvrdu |
| `COMPLETED` | Uspješno izvršena |
| `FAILED` | Neuspješna (nedovoljno sredstava, etc.) |
| `CANCELLED` | Otkazana od strane korisnika |

---

### 8. 🗺️ Roadmap

**Ruta**: `/dashboard/roadmap`

Transparentni prikaz planiranih funkcionalnosti s mogućnošću glasanja.

![Roadmap](./docs/images/roadmap_page_1769370098909.png)

#### Funkcionalnosti:

| Funkcija | Opis |
|----------|------|
| **Feature Requests** | Lista predloženih funkcionalnosti |
| **Voting** | Upvote/Downvote sustav |
| **Status Tracking** | PLANNED → IN_PROGRESS → COMPLETED |
| **Submit Request** | Predlaganje novih funkcionalnosti |
| **Sort Options** | Po glasovima, datumu, statusu |

---

### 9. 📊 Equity Simulator (Kalkulator)

**Ruta**: `/dashboard/calculator`

Interaktivni alat za vizualizaciju dilucije vlasništva kroz runde financiranja.

#### Funkcionalnosti:

| Funkcija | Opis |
|----------|------|
| **Initial Equity** | Postavljanje početnih postotaka (Founder, Co-founder, Investors) |
| **Add Funding Round** | Simulacija Pre-seed, Seed, Series A... |
| **Dilution Visualization** | Pie chart s promjenama postotaka |
| **Scenario Comparison** | Usporedba različitih scenarija |
| **Export** | Dijeljenje rezultata |

#### Primjer Dilucije:

```mermaid
pie title "Prije Seed Runde"
    "Founder" : 60
    "Co-founder" : 30
    "Angel" : 10
```

```mermaid
pie title "Nakon Seed Runde ($1M @ $5M valuation)"
    "Founder" : 48
    "Co-founder" : 24
    "Angel" : 8
    "Seed Investors" : 20
```

---

### 10. 🔑 API Access

**Ruta**: `/dashboard/api-access`

Upravljanje API ključevima za programatski pristup.

#### Funkcionalnosti:

| Funkcija | Opis |
|----------|------|
| **API Key Generation** | Kreiranje novih ključeva s imenima |
| **Key Management** | Lista svih ključeva s statusom |
| **Permissions** | Odabir dozvola (read, write, delete) |
| **Expiration** | Postavljanje isteka ključa |
| **Documentation** | Inline API dokumentacija s primjerima |
| **Test Endpoint** | Testiranje API poziva iz UI-a |
| **Usage Stats** | Prikaz zadnjeg korištenja |

#### API Key Model:

```mermaid
erDiagram
    User ||--o{ ApiKey : "posjeduje"
    
    ApiKey {
        string id PK
        string keyHash "SHA-256 hash"
        string keyPrefix "Prvih 8 znakova"
        string name
        boolean isActive
        string[] permissions
        datetime lastUsed
        datetime expiresAt
    }
```

---

### 11. 🛡️ Members

**Ruta**: `/dashboard/members`

Prikaz verificiranih članova i premium pristupa.

#### Funkcionalnosti:

| Funkcija | Opis |
|----------|------|
| **Verified Builders** | Lista verificiranih developera |
| **Subscription Tiers** | FREE, PRO, GROWTH planovi |
| **Badge Display** | Verifikacijski badge za profile |

#### Subscription Tiers:

| Tier | Mogućnosti |
|------|------------|
| **FREE** | Osnovni pristup, 100 poruka/dan |
| **PRO** | Sve FREE + neograničene poruke, API pristup |
| **GROWTH** | Sve PRO + prioritetna podrška, advanced analytics |

---

### 12. ⚙️ Settings (Postavke)

**Ruta**: `/dashboard/settings`

Upravljanje korisničkim računom i profilom.

![Postavke](./docs/images/settings_page_1769370112162.png)

#### Tab: Profile

| Polje | Opis |
|-------|------|
| Name | Ime i prezime |
| Email | Email adresa (readonly) |
| Bio | Kratki opis |
| Location | Grad/Država |
| Skills | Lista vještina (tags) |
| GitHub URL | Link na GitHub profil |
| LinkedIn URL | Link na LinkedIn profil |

#### Tab: Account

| Akcija | Opis |
|--------|------|
| **Change Password** | Ažuriranje lozinke |
| **Delete Account** | Brisanje računa (30-dnevni grace period) |

#### Tab: Notifications

| Opcija | Opis |
|--------|------|
| Email Notifications | Toggle za email obavijesti |
| Push Notifications | Toggle za push obavijesti |
| Marketing Emails | Toggle za marketing |

---

## 🤖 AI Asistent

Floating widget dostupan na svim dashboard stranicama.

### Lokacija u Kodu

`/components/ai/AiAssistant.tsx`

### Funkcionalnosti

| Funkcija | Opis |
|----------|------|
| **Chat Interface** | Razgovor s AI asistentom |
| **Quick Actions** | Unaprijed definirane akcije |
| **Resizable Window** | Povlačenje za promjenu veličine |
| **Markdown Rendering** | Formatirani odgovori s code highlightingom |
| **Conversation History** | Pamćenje konteksta razgovora |

### Quick Actions

```mermaid
graph LR
    QA["⚡ Quick Actions"]
    QA --> A1["✨ Analyze Pitch<br/>Analiza i prijedlozi poboljšanja"]
    QA --> A2["🔍 Find Investors<br/>Pretraga investitora po kriterijima"]
    QA --> A3["📧 Draft Email<br/>Generiranje cold emaila investitoru"]
```

### Primjer Korištenja

```
User: "Analiziraj moj pitch: Gradimo AI platformu za automatizirano testiranje softvera..."

AI: ### Analiza Pitcha

**Snage:**
- Jasno definirani problem
- Rastući TAM (Total Addressable Market)

**Prijedlozi:**
1. Dodajte konkretne brojke (smanjenje vremena testiranja za X%)
2. Navedite konkurenciju i vašu diferencijaciju
3. Uključite social proof (beta korisnici, partnerships)

**Ocjena:** 7/10 - Dobar temelj, treba više specifičnosti.
```


---

## Tehnička dokumentacija

---

## 🔧 Tehnološki Stack

### Pregled Arhitekture

```mermaid
graph TB
    subgraph Frontend["🖥️ Frontend Layer"]
        NEXT["Next.js 16<br/>(App Router + SSR)"]
        REACT["React 18<br/>(UI Library)"]
        TAILWIND["Tailwind CSS<br/>(Styling)"]
        FRAMER["Framer Motion<br/>(Animacije)"]
    end
    
    subgraph Backend["⚙️ Backend Layer"]
        API["Next.js API Routes<br/>(REST Endpoints)"]
        AUTH["NextAuth.js<br/>(Autentifikacija)"]
        PRISMA["Prisma ORM<br/>(Database Access)"]
    end
    
    subgraph Database["🗄️ Data Layer"]
        PG["PostgreSQL<br/>(Primary Database)"]
        REDIS["Redis<br/>(Cache & PubSub)"]
    end
    
    subgraph Services["☁️ External Services"]
        PUSHER["Pusher<br/>(WebSockets)"]
        RESEND["Resend<br/>(Transactional Email)"]
        OPENAI["OpenAI<br/>(AI Assistant)"]
        POSTHOG["PostHog<br/>(Analytics)"]
    end
    
    NEXT --> API
    REACT --> NEXT
    TAILWIND --> REACT
    FRAMER --> REACT
    
    API --> AUTH
    API --> PRISMA
    PRISMA --> PG
    API --> REDIS
    
    API --> PUSHER
    API --> RESEND
    API --> OPENAI
    NEXT --> POSTHOG
```

### Detaljni Opis Tehnologija

#### Frontend

| Tehnologija | Verzija | Svrha |
|-------------|---------|-------|
| **Next.js** | 16.x | Full-stack React framework s App Routerom, SSR/SSG, i API rutama |
| **React** | 18.2 | Deklarativna UI biblioteka s hookovima i Suspense podrškom |
| **Tailwind CSS** | 3.4 | Utility-first CSS framework za brzi razvoj |
| **Framer Motion** | 11.x | Produkcijske animacije i prijelazi |
| **Lucide React** | 0.555 | Moderna ikona biblioteka (500+ ikona) |
| **Recharts** | 3.5 | React komponente za data vizualizaciju |
| **React Hot Toast** | 2.6 | Elegantne notifikacije |

#### Backend / Server

| Tehnologija | Verzija | Svrha |
|-------------|---------|-------|
| **Next.js API Routes** | 16.x | Serverless API endpointi |
| **Prisma** | 5.10 | Type-safe ORM za PostgreSQL |
| **NextAuth.js** | 4.24 | Autentifikacija (OAuth + Credentials) |
| **bcryptjs** | 3.0 | Sigurno hashiranje lozinki |
| **Zod** | 4.1 | Runtime validacija schema |
| **Jose** | 6.1 | JWT token handling |

#### Baza Podataka i Cache

| Tehnologija | Svrha |
|-------------|-------|
| **PostgreSQL** | Primarna relacionalna baza s 25+ tablica |
| **Redis** | Cache layer i PubSub za real-time |
| **Prisma Migrations** | Verzioniranje schema baze |

#### Eksterni Servisi

| Servis | Svrha |
|--------|-------|
| **Pusher** | Real-time WebSocket komunikacija za chat |
| **Resend** | Transakcijski email (verifikacija, notifikacije) |
| **OpenAI** | AI asistent za analizu pitcheva i generiranje emailova |
| **PostHog** | Product analytics i event tracking |

#### DevOps i Alati

| Alat | Svrha |
|------|-------|
| **Docker** | Kontejnerizacija aplikacije |
| **Vitest** | Unit i integration testiranje |
| **ESLint** | Linting i code quality |
| **TypeScript** | Static type checking |

---

## 🏗️ Arhitektura Sustava

### Kako Podaci Putuju

```mermaid
sequenceDiagram
    participant U as 👤 Korisnik
    participant F as 💻 Frontend (Next.js)
    participant A as ⚡ API Routes
    participant P as 🔷 Prisma
    participant DB as 🗄️ PostgreSQL
    participant R as 🔴 Redis
    participant WS as 🔌 Pusher
    participant AI as 🤖 OpenAI
    
    U->>F: Klik na "Pošalji poruku"
    F->>A: POST /api/messages/send
    A->>P: prisma.message.create()
    P->>DB: INSERT INTO Message
    DB-->>P: OK + message data
    P-->>A: Message object
    A->>R: PUBLISH channel:user_123
    R->>WS: Trigger event
    WS-->>U: Real-time poruka stiže!
    A-->>F: 201 Created
    F-->>U: UI Update ✓
    
    Note over U,AI: AI Asistent Flow
    U->>F: "Analiziraj moj pitch"
    F->>A: POST /api/chat
    A->>AI: OpenAI Completion
    AI-->>A: AI Response
    A-->>F: Stream response
    F-->>U: Markdown renderiran odgovor
```

### Struktura Direktorija (Sažetak)

> **Napomena**: Ovo je sažeti prikaz glavnih direktorija. Stvarna struktura sadrži više datoteka.

```
dfds/
├── app/                    # Next.js App Router
│   ├── api/               # 34+ API endpoints
│   │   ├── auth/          # NextAuth handlers
│   │   ├── messages/      # Chat API
│   │   ├── startups/      # Startup CRUD
│   │   ├── threads/       # Forum API
│   │   ├── transactions/  # Payment API
│   │   └── v1/            # Public API v1
│   ├── dashboard/         # 15+ dashboard stranica
│   │   ├── page.tsx       # Glavni dashboard
│   │   ├── startups/      # Startup pregled
│   │   ├── network/       # Developer mreža
│   │   ├── investors/     # Investitori
│   │   ├── messages/      # Chat sučelje
│   │   ├── payments/      # Transakcije
│   │   ├── threads/       # Community forum
│   │   ├── roadmap/       # Feature voting
│   │   ├── calculator/    # Equity simulator
│   │   ├── api-access/    # API ključevi
│   │   ├── members/       # Članstvo
│   │   └── settings/      # Postavke profila
│   └── (public pages)/    # Landing, Login, Register...
├── components/            # React komponente
│   ├── ui/               # Shadcn-style UI primitivi
│   ├── dashboard/        # Dashboard komponente
│   ├── landing/          # Landing page sekcije
│   ├── messaging/        # Chat komponente
│   ├── payments/         # Payment komponente
│   └── ai/               # AI Asistent
├── lib/                  # Utility funkcije
│   ├── auth.ts          # NextAuth konfiguracija
│   ├── prisma.ts        # Prisma client
│   ├── pusher.ts        # WebSocket setup
│   ├── matchmaker.ts    # Vector similarity matching
│   └── email.ts         # Email templates
├── prisma/              # Database
│   ├── schema.prisma    # 25+ modela
│   └── seed.ts          # Test podaci
└── config/              # App konfiguracija
    └── nav.ts           # Navigacija
```

---

## 🗄️ Shema Baze Podataka

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o| Profile : "ima"
    User ||--o{ Startup : "osniva"
    User ||--o{ StartupMembership : "član"
    User ||--o{ Message : "šalje"
    User ||--o{ Connection : "follower"
    User ||--o{ Connection : "following"
    User ||--o{ Thread : "kreira"
    User ||--o{ Transaction : "sender"
    User ||--o{ Transaction : "receiver"
    User ||--o{ ApiKey : "posjeduje"
    User ||--o{ Notification : "prima"
    
    Profile ||--o{ Project : "ima"
    
    Startup ||--o{ StartupMembership : "članovi"
    Startup ||--o| Team : "tim"
    
    Team ||--o{ TeamMembership : "članovi"
    Team ||--o{ TeamInvite : "pozivnice"
    
    Conversation ||--o{ Message : "sadrži"
    Conversation ||--o{ ConversationParticipant : "sudionici"
    
    Thread ||--o{ ThreadReply : "odgovori"
    Thread ||--o{ ThreadLike : "lajkovi"
    
    FeatureRequest ||--o{ FeatureRequestVote : "glasovi"
    
    User {
        string id PK
        string name
        string email UK
        datetime emailVerified
        string password
        UserRole role
        SubscriptionTier subscriptionTier
        string referralCode UK
        int referralCount
        boolean isVerifiedBuilder
        datetime deletedAt
        datetime scheduledDeletionAt
    }
    
    Profile {
        string id PK
        string bio
        string location
        string[] skills
        string githubUrl
        string linkedinUrl
        string experience
        string availability
        string rate
        string firm
        string checkSize
        string focus
    }
    
    Startup {
        string id PK
        string name
        string pitch
        string stage
        string websiteUrl
        string raised
        int teamSize
    }
    
    Transaction {
        string id PK
        float amount
        float serviceFee
        float netAmount
        PaymentProvider provider
        TransactionStatus status
        string idempotencyKey UK
    }
    
    Message {
        string id PK
        string content
        boolean read
        string[] attachments
    }
```

### Ključni Modeli

| Model | Svrha | Relacije |
|-------|-------|----------|
| **User** | Centralni entitet za sve korisnike | Profile, Startups, Messages, Transactions |
| **Profile** | Prošireni podaci korisnika | User (1:1), Projects |
| **Startup** | Registrirani startups | Founder, Team, Memberships |
| **Team** | Tim startupa | Startup (1:1), Members, Invites |
| **Message** | Chat poruke | Sender, Conversation |
| **Transaction** | Financijske transakcije | Sender, Receiver |
| **Thread** | Forum diskusije | Author, Replies, Likes |
| **ApiKey** | API pristupni ključevi | User |
| **Notification** | Obavijesti korisnika | User |

### Enumeracije

```typescript
enum UserRole {
    DEVELOPER   // Razvojni programer
    FOUNDER     // Osnivač startupa
    INVESTOR    // Investitor
    ADMIN       // Administrator
}

enum SubscriptionTier {
    FREE        // Besplatni plan
    PRO         // Profesionalni plan
    GROWTH      // Rast plan
}

enum TransactionStatus {
    PENDING     // U tijeku
    COMPLETED   // Završeno
    FAILED      // Neuspješno
    CANCELLED   // Otkazano
}

enum PaymentProvider {
    PAYPAL      // PayPal plaćanje
    CRYPTO      // Kripto plaćanje
    CARD        // Kartično plaćanje
}

enum TeamRole {
    OWNER       // Vlasnik
    ADMIN       // Administrator tima
    MEMBER      // Član
    VIEWER      // Promatrač
}
```

---

## 🔌 API Dokumentacija

### Autentifikacija

API koristi dva načina autentifikacije:

1. **Session-based** (za frontend): NextAuth sesija
2. **API Key** (za eksterne integracije): Bearer token

```bash
# API Key autentifikacija
curl -H "Authorization: Bearer dfds_xxxx..." https://api.dfds.io/v1/startups
```

### Javni API Endpoiniti (v1)

#### GET /api/v1/startups

Dohvaća listu startupa.

| Parametar | Tip | Opis |
|-----------|-----|------|
| `page` | number | Broj stranice (default: 1) |
| `limit` | number | Broj rezultata (default: 25, max: 100) |
| `search` | string | Pretraga po imenu ili pitchu |
| `stage` | string | Filter po fazi (Pre-seed, Seed, etc.) |

**Response:**
```json
{
  "data": [
    {
      "id": "clxx...",
      "name": "TechStartup",
      "pitch": "Revolucionarna AI platforma...",
      "stage": "Seed",
      "founder": {
        "id": "clxx...",
        "name": "Ivan Horvat"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 150
  }
}
```

#### POST /api/v1/startups

Kreira novi startup (zahtijeva FOUNDER ulogu).

**Request Body:**
```json
{
  "name": "Novi Startup",
  "pitch": "Opis projekta...",
  "stage": "Pre-seed",
  "websiteUrl": "https://example.com",
  "teamSize": 3
}
```

#### GET /api/v1/users

Dohvaća listu korisnika (filtrirano po ulozi).

| Parametar | Tip | Opis |
|-----------|-----|------|
| `role` | UserRole | Filter po ulozi |
| `search` | string | Pretraga po imenu |

### Interni API Endpointi

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/register` | POST | Registracija novog korisnika |
| `/api/auth/[...nextauth]` | * | NextAuth handleri |
| `/api/messages/send` | POST | Slanje poruke |
| `/api/conversations` | GET | Lista konverzacija |
| `/api/transactions` | GET/POST | Transakcije |
| `/api/threads` | GET/POST | Forum diskusije |
| `/api/threads/[id]/like` | POST | Like thread |
| `/api/threads/[id]/reply` | POST | Odgovor na thread |
| `/api/roadmap` | GET/POST | Feature requests |
| `/api/roadmap/vote` | POST | Glasanje za feature |
| `/api/settings` | GET/PUT | Korisničke postavke |
| `/api/keys` | GET/POST/DELETE | API ključevi |
| `/api/pusher/auth` | POST | Pusher autentifikacija |

### Rate Limiting

| Tier | Limit |
|------|-------|
| Unauthenticated | 10 req/min |
| FREE | 100 req/min |
| PRO | 1000 req/min |
| GROWTH | 10000 req/min |

### Error Responses

| Kod | Opis |
|-----|------|
| `400` | Bad Request - Nevaljani podaci |
| `401` | Unauthorized - Nedostaje autentifikacija |
| `403` | Forbidden - Nedovoljna prava |
| `404` | Not Found - Resurs ne postoji |
| `429` | Too Many Requests - Rate limit |
| `500` | Internal Server Error |

---

## 🔒 Sigurnost

### Sigurnosne Mjere

| Mjera | Implementacija |
|-------|----------------|
| **Password Hashing** | bcryptjs s cost factor 12 |
| **Session Management** | JWT tokeni s NextAuth |
| **CSRF Protection** | Middleware token validation |
| **Rate Limiting** | Redis-backed rate limiter |
| **Input Sanitization** | Zod validacija + HTML sanitization |
| **SQL Injection** | Prisma parameterized queries |
| **XSS Prevention** | React automatic escaping + CSP headers |

### Account Deletion Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as Server
    participant DB as Database
    participant CRON as Cleanup Job
    
    U->>API: DELETE /api/settings (delete account)
    API->>DB: SET deletedAt = NOW()
    API->>DB: SET scheduledDeletionAt = NOW() + 30 days
    API-->>U: Account marked for deletion
    
    Note over U,CRON: 30 dana grace period
    
    U->>API: Login (within 30 days)
    API->>DB: CLEAR deletedAt, scheduledDeletionAt
    API-->>U: Account reactivated!
    
    Note over CRON: After 30 days
    CRON->>DB: DELETE users WHERE scheduledDeletionAt < NOW()
    CRON->>DB: CASCADE delete all related data
```

---

## 🚀 Kako Pokrenuti

### Preduvjeti

- Node.js 18+
- PostgreSQL 14+
- Redis (opcionalno, za full real-time)
- pnpm/npm/yarn

### Koraci

```bash
# 1. Klonirajte repozitorij
git clone https://github.com/team-cloudzz/dfds.git
cd dfds

# 2. Instalirajte dependencies
npm install

# 3. Konfigurirajte environment varijable
cp env.example .env
# Uredite .env s vašim podacima

# 4. Inicijalizirajte bazu
npx prisma db push
npx prisma db seed

# 5. Pokrenite development server
npm run dev

# 6. Otvorite u pregledniku
open http://localhost:3000
```

### Environment Varijable

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/dfds"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GITHUB_ID="..."
GITHUB_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Services
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
RESEND_API_KEY="..."
OPENAI_API_KEY="..."
POSTHOG_KEY="..."

# Redis (optional)
REDIS_URL="redis://localhost:6379"
```

### Docker Deployment

```bash
# Build i pokreni sve servise
docker-compose up -d

# Ili koristi deploy skriptu
./deploy.sh full
```

---

## 📞 Kontakt i Podrška

- **Email**: team@cloudzz.dev

---

*Hvala što koristite DFDS!*  
*— Tim Cloudzz*

**Verzija dokumentacije**: 3.0.0  
**Zadnje ažuriranje**: Veljača 2026


[def]: #-naslovna-stranica