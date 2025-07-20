### **Trivia Game API - User Creation Issue**

## **Problem**
The user creation endpoint is failing with this error:
```
"new row violates row-level security policy for table 'users'"
```

## **Root Cause**
Your Supabase `users` table has Row Level Security (RLS) enabled, but there's no policy that allows INSERT operations.

## **Quick Solutions**

### **Option 1: Disable RLS (Easiest for Development)**
In your Supabase dashboard:
1. Go to **Database** → **Tables**
2. Click on the `users` table
3. Toggle off **"Enable Row Level Security"**

### **Option 2: Add RLS Policy via SQL**
Run this in your Supabase SQL Editor:
```sql
-- Allow public user creation
CREATE POLICY "Allow public user creation" ON users
FOR INSERT TO public
WITH CHECK (true);
```

### **Option 3: Disable RLS via SQL**
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

## **Test After Fix**
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser"}'
```

Should return:
```json
{
  "status": "success",
  "message": "User created successfully",
  "data": {
    "user_id": "some-uuid",
    "username": "testuser"
  }
}
```

## **Next Steps**
1. Fix the RLS policy using one of the options above
2. Test user creation
3. Test user retrieval: `curl http://localhost:3000/users/{user_id}`
4. Continue with other API endpoints

The code itself is correct - this is purely a database permission issue.
