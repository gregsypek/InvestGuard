# InvestGuard

![alt tag](./public/logo.svg)

## Advanced Investment Portfolio & Treasury Bond Manager

**InvestGuard** is a high-performance web application designed for long-term investors. Built with **Next.js 15** and **Tailwind CSS 4**, it offers a sophisticated suite of tools to manage diverse asset classes, with a specialized focus on **Polish Treasury Bonds (EDO, DOS)**, advanced historical simulations, and a unique **Smart Sales System**.

[https://invest-guard-blue.vercel.app/](https://invest-guard-blue.vercel.app/)

---

## 🚀 Key Features

### 🪄 Magic Auto-Kalkulator (NBP & Yahoo Finance)
* **Cross-API Integration:** Instantly fetches historical closing prices via `yahoo-finance2` and pairs them with historical currency exchange rates from the NBP (National Bank of Poland) API.
* **Multi-Currency & Spread Logic:** Automatically calculates the exact PLN cost for foreign assets (USD, EUR, GBP) on any past date. Features a dynamic toggle to simulate broker spreads and commissions.

### 📈 Advanced Historical Simulation Engine
* **True Running Balance:** Reconstructs your portfolio's history day-by-day based on transaction logs. Accurately handles backdated transactions and prevents "time-traveler" data bugs.
* **Interactive Expandable Charts:** Individual asset rows in the ledger expand into detailed Recharts graphs, overlaying market price action with your specific 'Buy' (🟢) and 'Sell' (🔴) execution points.
* **Smart Time Filters:** Dynamic period filters (1W, 1M, YTD, MAX) that intelligently adjust their availability based on the age of your real data and aggregate transactions using a time-windowing algorithm.

### 🛡️ Specialized Treasury Bond Module
Unlike generic portfolio trackers, InvestGuard features a dedicated engine for government bonds:
* **Separation Logic:** Automated visual separation for historical and active bond entries.
* **Accrual Tracking:** Real-time visualization of interest accumulation.
* **Portfolio Balancing:** Monitors the "55% Bond Safety Buffer" strategy.

### 🧠 Smart Sales & Accumulation System
* **Asset Accumulation Visualization:** Tracks how your positions grow over time through consistent DCA (Dollar Cost Averaging).
* **Intelligent Exit Logic:** Built-in logic to handle partial sales while maintaining cost-basis accuracy.

### 📊 Multi-Portfolio Management
* **Active & Booster Strategy:** Separate your core passive holdings (MSCI World/EM) from your 5% performance-boosting "Radar" picks (e.g., Defense sector, IT).
* **Global Analytics:** Unified dashboard providing real-time stats across all sub-portfolios.

---

## 🛠️ Tech Stack

* **Framework:** Next.js 15 (App Router, Server Components, Server Actions)
* **Styling:** Tailwind CSS v4 (Oxide engine)
* **Language:** TypeScript
* **Database:** Prisma ORM with PostgreSQL
* **Data Visualization:** Recharts
* **External APIs:** Yahoo Finance (`yahoo-finance2`), NBP Web API (Narodowy Bank Polski)
* **Icons:** Lucide React
* **Authentication:** Auth.js (NextAuth)

---

## 📸 Visual Showcase

### 1. Main Dashboard Overview
![alt tag](./public/screenshots/investGuard2.png)
*Overview of all managed capital, global performance stats, and time-filtered historical simulation.*

### 2. Treasury Bond & Asset Ledger
![alt tag](./public/screenshots/investGuard5.png)
*Detailed ledger featuring expandable inline charts with transaction event markers.*

### 3. Planner & Auto-Fill Helper
![alt tag](./public/screenshots/investGuard3.png)
*Intelligent forms featuring the Magic Calculator for automated spread and currency conversions.*

---

## 🛤️ Roadmap (Coming Soon)

* **[ ] Investor Profile:** Personalized risk assessment and goal-tracking milestones.
* **[ ] Advanced Settings:** Customizable notification system for bond maturity dates.
* **[ ] AI Radar:** Automated sentiment analysis for "on-the-radar" companies.

---

## ⚙️ Getting Started

1. **Clone the repository:**
  
   ```bash
   git clone https://github.com/gregsypek/InvestGuard.git
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Setup environment variables:**
   Create a `.env` file with your `DATABASE_URL` and `AUTH_SECRET`.
4. **Run the development server:**

   ```bash
   npm run dev
   ```

---

Made with [@gregsypek](https://twitter.com/@gregsypek) 2026