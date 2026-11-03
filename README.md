# Splitzee 💸

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

## 🗄️ Database Design (Entity Relationship Diagram)

The application uses a relational schema designed for tracking multi-user groups, granular expense shares, and balance settlements.

![Database ER Diagram](DB.png)

### Schema Overview (Mermaid)

```mermaid
erDiagram
    users ||--o{ group_members : "belongs to"
    user_groups ||--o{ group_members : "has"
    user_groups ||--o{ expenses : "contains"
    expenses ||--|{ split : "divided into"
    users ||--o{ split : "owes / paid"
    user_groups ||--o{ transactions : "recorded in"
    users ||--o{ transactions : "from_user"
    users ||--o{ transactions : "to_user"
    user_groups ||--o{ balances : "tracks"
    users ||--o{ balances : "holds"

    users {
        VARCHAR(255) email PK
        VARCHAR(255) name
        VARCHAR(255) password
        BIGINT version
        DATETIME created_at
        DATETIME updated_at
    }

    user_groups {
        VARCHAR(255) group_id PK
        VARCHAR(255) title
        BIT(1) is_direct
        BIGINT version
        DATETIME created_at
        DATETIME updated_at
    }

    group_members {
        VARCHAR(255) group_id FK
        VARCHAR(255) user_email FK
    }

    expenses {
        VARCHAR(255) expense_id PK
        VARCHAR(255) group_id FK
        VARCHAR(255) title
        VARCHAR(255) description
        DECIMAL amount
        BIGINT version
        DATETIME created_at
        DATETIME updated_at
    }

    split {
        BIGINT id PK
        VARCHAR(255) expense_id FK
        VARCHAR(255) user_email FK
        DECIMAL paid_amount
        DECIMAL owed_amount
    }

    transactions {
        VARCHAR(255) transaction_id PK
        VARCHAR(255) group_id FK
        VARCHAR(255) from_user_email FK
        VARCHAR(255) to_user_email FK
        DECIMAL amount
        ENUM status
        DATETIME confirmed_at
        DATETIME created_at
        DATETIME updated_at
    }

    balances {
        BIGINT id PK
        VARCHAR(255) group_id FK
        VARCHAR(255) user_email FK
        DECIMAL net_balance
        DECIMAL total_owed
        DECIMAL total_paid
        DECIMAL total_settled_in
        DECIMAL total_settled_out
        BIGINT version
        DATETIME created_at
        DATETIME updated_at
    }
```

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

