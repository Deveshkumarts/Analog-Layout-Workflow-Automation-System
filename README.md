<div align="center">
  <h1>🌊 FlowSync IC</h1>
  <p><b>Analog Layout Workflow Automation Platform</b></p>
  
  ![React](https://img.shields.io/badge/React-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
  ![NodeJS](https://img.shields.io/badge/Node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
  ![Express.js](https://img.shields.io/badge/Express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
</div>

<br />

**FlowSync IC** is a comprehensive workflow management platform tailored specifically for Analog IC (Integrated Circuit) Layout teams. It bridges the gap between Managers and Engineers by offering an intuitive interface for task assignment, progress tracking, and AI-driven estimations.

---

## ✨ Key Features

- **🤖 AI-Powered Insights:** Predict task duration and get smart suggestions for assigning engineers based on their skills and current workload.
- **📊 Interactive Kanban Board:** Visually track the progress of layout blocks through custom IC stages (*Not Started, In Progress, DRC, LVS, Review, Completed*).
- **📈 Advanced Analytics & Dashboard:** Real-time metrics on team performance, efficiency, and project risks. Export reports to PDF or Excel.
- **🔐 Secure Authentication:** Seamless login with Google OAuth 2.0 or standard credentials utilizing JWT.
- **✅ Streamlined Approvals:** Built-in review cycle for Managers to approve or reject layout submissions.

---

## 👥 User Roles & Workflows

### 🧑‍💼 Manager
- **Create Tasks:** Define new layout "Blocks" (Tasks) detailing complexity, tech nodes, and requirements.
- **Assign Efficiently:** Utilize **AI Suggestions** to match the right engineer to the task.
- **Monitor Progress:** Oversee high-level workflow via the Dashboard and detailed Analytics.
- **Review & Approve:** Provide final approvals on completed and verified blocks.

### 👩‍💻 Engineer
- **Manage Workload:** View assigned tasks directly on the personalized Kanban Board.
- **Track Verification:** Move tasks through standard IC verification stages (`Start` → `DRC` → `LVS`).
- **Submit for Review:** Once layouts are DRC and LVS clean, seamlessly submit them for managerial review.

---

## 🛠️ Tech Stack

### Frontend
- **React (Vite)** – Fast and modern UI development.
- **Framer Motion** – Fluid and dynamic animations.
- **Recharts** – Interactive and responsive data visualization.
- **React Router DOM** – Client-side routing.
- **Axios** – Promise-based HTTP client.

### Backend
- **Node.js & Express.js** – Scalable backend infrastructure.
- **MongoDB & Mongoose** – Flexible NoSQL database and object modeling.
- **Passport.js & JWT** – Secure authentication (Google OAuth 2.0 and local strategies).
- **Nodemailer** – Automated email notifications.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd "FlowSync IC"
   ```

2. **Setup Server:**
   ```bash
   cd server
   npm install
   ```
   *Create a `.env` file in the `server` directory and add your environment variables (`MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, etc.).*
   
   Start the development server:
   ```bash
   npm run dev
   ```

3. **Setup Client:**
   ```bash
   cd ../client
   npm install
   ```
   Start the Vite development server:
   ```bash
   npm run dev
   ```

4. **Seed Database (Optional):**
   To populate the database with initial dummy data:
   ```bash
   cd server
   npm run seed
   ```

---

## 📁 Project Structure

```text
FlowSync IC/
├── client/               # React frontend (Vite)
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page level components (Dashboard, Kanban, etc.)
│   │   └── App.jsx
│   └── package.json
├── server/               # Node.js + Express backend
│   ├── routes/           # API endpoints
│   ├── models/           # Mongoose schemas
│   ├── server.js         # Entry point
│   └── package.json
├── Workflow_Guide.txt    # Detailed Workflow Documentation
└── README.md
```

---

## 📝 License
This project is licensed under the **ISC License**.

<div align="center">
  <p><i>Built by the FlowSync IC Team.</i></p>
</div>
