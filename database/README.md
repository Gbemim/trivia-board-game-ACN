# Database Setup

This folder contains all database-related files for the Trivia Game backend.

## 📁 Folder Structure

```
database/
├── README.md                           # This file
├── schemas/                           # Database schema files
│   ├── postgresql_schema.sql         # PostgreSQL schema with indexes & triggers
│   └── supabase.sql                  # Supabase-compatible schema
└── seeds/                            # Seed data files
    └── seed_trivia_questions.sql     # Sample trivia questions (32 questions)
```

## 🐘 PostgreSQL Installation

### macOS
```bash
brew install postgresql
brew services start postgresql
```

### Windows
Download and install from: https://www.postgresql.org/download/windows/

### Ubuntu/Linux
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Docker (Any OS)
```bash
docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

## 🚀 Quick Setup

### For Supabase
1. Copy `schemas/supabase.sql` and run in Supabase SQL Editor
2. Optionally run `seeds/seed_trivia_questions.sql` for sample data

### For PostgreSQL
```bash
# 1. Create database
createdb trivia_game

# 2. Setup tables
psql trivia_game < database/schemas/postgresql_schema.sql

# 3. Add sample data (optional)
psql trivia_game < database/seeds/seed_trivia_questions.sql
```

##  Environment Setup

Create a `.env` file in your project root:

**For PostgreSQL:**
```bash
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trivia_game
```

**For Supabase:**
```bash
DATABASE_TYPE=supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚨 Common Issues

**"psql: command not found"** → Make sure PostgreSQL is installed and in your PATH
**"database does not exist"** → Run `createdb trivia_game` first
**"connection refused"** → Make sure PostgreSQL is running

## Seed Data

The `seeds/` folder contains sample trivia questions covering:
- Sports (8 questions)
- Science (8 questions)  
- Music (8 questions)
- Technology (8 questions)

Each question includes:
- Category
- Question text
- Multiple choice answers
- Correct answer index
- Point value (10 points each)
