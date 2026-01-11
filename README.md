# CarbonCredit Platform

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

## 📋 Introduction

**CarbonCredit Platform** is a decentralized application (dApp) designed to facilitate the trading, verification, and management of carbon credits. Built on the **Polygon Amoy Testnet**, it connects organizations, government bodies, verifiers, and individual users in a transparent and secure ecosystem.

The platform leverages blockchain technology to ensure the immutability of credit issuance and transactions, while providing a modern, user-friendly interface for managing complex workflows like project verification and role-based access control.

## ✨ Key Features

-   **🔐 Secure Authentication**: Seamless login using **MetaMask** wallet with cryptographic signature verification.
-   **👥 Role-Based Access Control (RBAC)**: Distinct workflows for different user roles:
    -   **User**: Buy/sell credits, view marketplace.
    -   **Owner**: Register projects, request verification.
    -   **Verifier**: Audit and verify project claims.
    -   **Government**: Approve projects and issue credits.
    -   **Admin**: Manage system roles and configurations.
-   **🌍 Real-time Marketplace**: Live order book and trading interface for buying and selling carbon credits using crypto assets (MATIC).
-   **📑 Project Lifecycle Management**: End-to-end flow from project submission -> verification -> government approval -> credit issuance.
-   **📊 Interactive Dashboard**: Visual analytics using **Recharts** to track carbon credit trends and portfolio performance.
-   **⚡ High Performance**: Powered by **Vite** for lightning-fast development and production builds.


### Technology Stack

-   **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React (Icons), Recharts.
-   **Blockchain Interaction**: Ethers.js v6.
-   **Build Tool**: Vite.
-   **Linting**: ESLint.

## 🚀 Installation

Ensure you have **Node.js** (v18+) and **npm** installed on your machine.

1.  **Clone the repository**
    ```bash
    git clone https://github.com/anhluog/Carbon-UI-Admin.git
    cd Carbon-UI-Admin
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

## 🏃 Running the Project

### Development Server
Start the development server with Hot Module Replacement (HMR):
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### Production Build
Build the application for production:
```bash
npm run build
```
Preview the production build locally:
```bash
npm run preview
```

## ⚙️ Environment Configuration

Create a `.env` file in the root directory to configure the smart contract addresses. You can copy the structure below:

```env
# Address of the CarbonCredit Token Contract
VITE_CARBONCREDIT_ADDRESS=0xYourTokenContractAddress

# Address of the Marketplace Contract
VITE_MARKETPLACE_ADDRESS=0xYourMarketplaceContractAddress
```

> **Note**: This project is configured for the **Polygon Amoy Testnet (Chain ID: 80002)**. Ensure your MetaMask is connected to the correct network.

## 📂 Folder Structure

```
src/
├── abi/                # Smart Contract ABIs (JSON)
├── components/         # React Components (Pages & Widgets)
│   ├── Marketplace.tsx # Trading interface
│   ├── Project.tsx     # Project management
│   ├── User.tsx        # User dashboard
│   └── ...
├── utils/              # Utility functions
├── App.tsx             # Main Application Component & Routing Logic
├── eth.ts              # Blockchain interaction logic (Ethers.js wrappers)
├── main.tsx            # Entry point
└── index.css           # Global styles and Tailwind directives
```

## 🤝 Contribution Guidelines

We welcome contributions! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the **MIT License**. See the `LICENSE` file for more details.

## 🗺 Roadmap

-   [ ] **Mobile Optimization**: Enhance responsive design for mobile devices.
-   [ ] **Multi-Wallet Support**: Integrate WalletConnect and Coinbase Wallet.
-   [ ] **Mainnet Launch**: Deploy contracts to Polygon Mainnet.
-   [ ] **Advanced Analytics**: Add deep-dive reporting for government auditors.
