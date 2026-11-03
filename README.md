#  ![Logo title](frontend/src/assets/Title_dark_theme.png)

Splitzee is a full-stack expense-sharing application designed to simplify tracking shared expenses, calculating group balances, and settling debts among friends and groups.

---

## 🚀 Features

- **User Authentication**: Secure JWT-based authentication and email notifications (via Resend).
- **Group & Direct Splitting**: Create group expenses or manage direct 1-to-1 splits.
- **Flexible Expense Splitting**: Log expenses with detailed breakdown of who paid and how much each member owes.
- **Real-Time Balances**: Automatically computed net balances, total paid, owed, and settled amounts.
- **Settlement Transactions**: Record and confirm payments between users to settle balances.

---

## 🛠️ Tech Stack

- **Backend**:
  - Java 23 & Spring Boot 4.x
  - Spring Data JPA & Hibernate
  - Spring Security with JWT
  - MySQL database
  - Springdoc OpenAPI (Swagger UI)
- **Frontend**:
  - React 19 + TypeScript
  - Vite
  - Tailwind CSS
  - Axios & Lucide Icons

---

## 🗄️ Database Design (EER Diagram)

The application uses a relational schema designed for tracking multi-user groups, granular expense shares, and balance settlements.

![Database EER Diagram](DB.png)



### Key Entities

- **`users`**: User profiles identified by email with credentials and audit timestamps.
- **`user_groups`**: Represents group containers or 1-to-1 direct split threads (`is_direct`).
- **`group_members`**: Junction table mapping users to their respective groups.
- **`expenses`**: High-level expense records tied to a group and an overall amount.
- **`split`**: Breakdown of an expense showing individual member contributions (`paid_amount`) and liabilities (`owed_amount`).
- **`transactions`**: Direct settlements made from one user to another within a group.
- **`balances`**: Materialized / computed ledger summarizing each member's net balances and settlement totals.

---

## 🏁 Getting Started

### Prerequisites

- Java 21+ (Java 23 recommended)
- Maven
- Node.js 18+ and npm
- MySQL Server

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Configure your database connection in `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/split
   spring.datasource.username=root
   spring.datasource.password=YOUR_PASSWORD
   ```
3. Build and run the backend:
   ```bash
   mvn clean spring-boot:run
   ```
4. Access Swagger API documentation at:
   `http://localhost:8080/swagger-ui/index.html`

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.
