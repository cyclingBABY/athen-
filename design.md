# Library Management System Design Documents

This document contains the structural and behavioral diagrams for the modern React-based Library Management System.

## 1. Conceptual Diagram (System Architecture)

```mermaid
graph LR
    subgraph Client [Frontend Layer]
        React[React UI/App]
    end
    subgraph Server [Backend Layer]
        PHP[PHP API / Services]
    end
    subgraph Database [Data Layer]
        MySQL[(MySQL Database)]
    end

    User((User)) -->|Interacts with| React
    React -->|HTTP/REST JSON Requests| PHP
    PHP -->|JSON Responses| React
    PHP <-->|SQL Queries / Data| MySQL
```

---

## 2. Data Flow Diagram (DFD)

### Context Diagram (Level 0)

```mermaid
graph LR
    Student[Student] -.->|Search Books, Borrow/Return Requests| System
    System((Library Management\nSystem)) -.->|Book Info, Transaction Status| Student
    
    Admin[Admin] -.->|Manage Books, Manage Users, Approve Requests| System
    System -.->|System Reports, Alert Status| Admin
    
    Lecturer[Lecturer] -.->|Search, Borrow/Return| System
    System -.->|Book Info, Approval| Lecturer
```

### Level 1 DFD

```mermaid
flowchart TD
    User((User))
    Admin((Admin))
    
    P1(1.0 User Authentication)
    P2(2.0 Book Management)
    P3(3.0 Transaction Processing)
    
    DB_User[(D1 Users)]
    DB_Books[(D2 Books)]
    DB_Trans[(D3 Transactions)]
    
    User -->|Login Credentials| P1
    P1 -->|Verify & Token| DB_User
    P1 -->|Auth Status| User
    
    Admin -->|Add/Edit/Delete Books| P2
    P2 -->|Update Catalog| DB_Books
    
    User -->|Search Queries| P2
    DB_Books -->|Book Details| P2
    P2 -->|Search Results| User
    
    User -->|Borrow/Return Request| P3
    P3 -->|Update Status| DB_Trans
    P3 -->|Check Availability| DB_Books
    P3 -->|Transaction Receipt| User
```

---

## 3. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ BORROWING_TRANSACTIONS : places
    BOOKS ||--o{ BORROWING_TRANSACTIONS : included_in
    CATEGORIES ||--o{ BOOKS : categorizes

    USERS {
        int id PK
        string name
        string email
        string password_hash
        string role "Admin, Student, Lecturer"
        datetime created_at
    }

    CATEGORIES {
        int id PK
        string name
        string description
    }

    BOOKS {
        int id PK
        string title
        string author
        string isbn
        int category_id FK
        int total_copies
        int available_copies
    }

    BORROWING_TRANSACTIONS {
        int id PK
        int user_id FK
        int book_id FK
        date borrow_date
        date due_date
        date return_date
        string status "pending, borrowed, returned, late"
    }
```

---

## 4. Unified Modelling Language (UML) Diagrams

### Use Case Diagram

```mermaid
flowchart LR
    %% Actors
    Admin((Admin))
    Student((Student))
    Lecturer((Lecturer))

    %% System Boundary
    subgraph LMS [Library Management System]
        UC1([Login / Logout])
        UC2([Search Books])
        UC3([Borrow Book])
        UC4([Return Book])
        UC5([Manage Books])
        UC6([Manage Users])
        UC7([View Reports])
    end

    %% Relationships
    Student --- UC1
    Student --- UC2
    Student --- UC3
    Student --- UC4

    Lecturer --- UC1
    Lecturer --- UC2
    Lecturer --- UC3
    Lecturer --- UC4

    Admin --- UC1
    Admin --- UC5
    Admin --- UC6
    Admin --- UC7
```

### Sequence Diagram (Book Borrowing Process)

```mermaid
sequenceDiagram
    participant User as React Frontend (User)
    participant API as PHP API
    participant JWT as Auth Middleware
    participant DB as MySQL Database

    User->>API: POST /api/borrow (book_id)
    API->>JWT: Validate Token
    alt Invalid Token
        JWT-->>API: Authentication Failed
        API-->>User: 401 Unauthorized
    else Valid Token
        JWT-->>API: User ID Extracted
        API->>DB: Check Book Availability
        DB-->>API: Return Copies count
        
        alt Copies > 0
            API->>DB: Insert into borrowing_transactions
            API->>DB: Decrement available_copies
            DB-->>API: Success
            API-->>User: 200 OK (Borrow Success)
        else No Copies Available
            API-->>User: 400 Bad Request (Not Available)
        end
    end
```

### Class Diagram

```mermaid
classDiagram
    class User {
        -int id
        -String name
        -String email
        -String role
        +login()
        +logout()
        +updateProfile()
    }

    class Book {
        -int id
        -String title
        -String isbn
        -int available_copies
        +getDetails()
        +updateStock(int count)
    }

    class Transaction {
        -int id
        -date borrowDate
        -date returnDate
        -String status
        +createTransaction()
        +completeTransaction()
        +calculateFine()
    }

    class DatabaseManager {
        -Connection conn
        +connect()
        +query(String sql)
        +disconnect()
    }

    User "1" -- "0..*" Transaction : Places
    Book "1" -- "0..*" Transaction : Associated With
    DatabaseManager ..> User : Handles Data
    DatabaseManager ..> Book : Handles Data
    DatabaseManager ..> Transaction : Handles Data
```
