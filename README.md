# 🚀 DFDS

**Where Innovation Meets Capital**

DFDS is a comprehensive networking platform that connects startups, investors, and developers in one seamless ecosystem. Built for the **Competition** by **Team Cloudzz**.

## 📚 Documentation

For a deep dive into the architecture, API, and project structure, please read the [Official Documentation](./DFDS_Dokumentacija.md).

---

## ✨ Features

### 🤝 Smart Networking
Connect directly with founders, developers, and investors. Build meaningful relationships within the startup ecosystem through our integrated messaging system.

### 🤖 AI-Powered Support
Get intelligent, context-aware business advice powered by GPT-4. Like having a private business advisor available 24/7.

### 💸 Crypto-Enabled Payments
Secure, transparent transactions with cryptocurrency support. No intermediaries, no traditional banking limitations.

### 📊 Real-Time Analytics
Track your network growth, engagement metrics, and business performance with comprehensive analytics dashboards.

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Next.js 16](https://nextjs.org/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Authentication** | [NextAuth.js](https://next-auth.js.org/) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **UI Components** | [Headless UI](https://headlessui.com/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Cloudzz-dev/dfds.git
   cd dfds
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Configure the following in `.env.local`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/dfds"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000) in your browser

---

## 🐳 Docker Deployment

DFDS includes a powerful one-click deployment script for easy self-hosting.

### Quick Start (One Command)

```bash
# Full installation: installs Docker, sets up environment, and starts everything
./deploy.sh full
```

### Available Commands

| Command | Description |
|---------|-------------|
| `./deploy.sh install` | Install Docker, Docker Compose, and Git |
| `./deploy.sh setup` | Generate environment configuration |
| `./deploy.sh start` | Build and start all containers |
| `./deploy.sh start-lb` | Start with Nginx load balancer |
| `./deploy.sh stop` | Stop all containers |
| `./deploy.sh restart` | Restart all containers |
| `./deploy.sh logs` | View container logs |
| `./deploy.sh status` | Show container status |
| `./deploy.sh scale N` | Scale to N app instances |
| `./deploy.sh clean` | Remove all containers and volumes |

### Clustering & Scaling

Scale your application to handle more traffic:

```bash
# Scale to 3 instances
./deploy.sh scale 3

# Start with load balancer
./deploy.sh start-lb
```

### Manual Docker Compose

```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

---

## 📁 Project Structure

```
dfds/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Authentication pages
│   └── register/          # Registration flow
├── components/            # Reusable React components
├── lib/                   # Utility functions and configurations
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

---

## 🎨 Design System

DFDS features a premium glassmorphism design with:

- **Deep Zinc backgrounds** (`#09090b`)
- **Glass panels** with backdrop blur
- **Indigo-to-purple gradients** for primary accents
- **Inter font** for clean typography

---

## 👥 Team Cloudzz

- **Leon**
- **Frane**
- **Roko**

---

## 📄 License

This project was created for the Competition.

---

## 🔗 Links

- **Website**: [dfds.cloudzz.dev](https://dfds.cloudzz.dev)
- **Demo**: [dfds.cloudzz.dev](https://dfds.cloudzz.dev)

---

<p align="center">
  <strong>Building what's next. 🚀</strong>
</p>
