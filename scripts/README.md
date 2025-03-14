# RDM Pool Scripts

This directory contains scripts for managing the RDM Pool application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file:
```bash
cp .env.example .env
```

3. Fill in your Firebase configuration in the `.env` file with values from your Firebase Console.

## Available Scripts

### Create Test Users
Creates test user accounts and their picks for the Valspar Championship.

```bash
npm run create-users
```

This will:
- Create an admin account
- Create test accounts for all participants
- Import their picks for the Valspar Championship
- Output credentials for the admin account

## Security Notes

- The admin account credentials will be displayed in the console after running the script
- Save these credentials securely
- The script can be run multiple times safely - it will skip existing users and picks
- Test accounts are marked with `isTestAccount: true` and can be converted to real accounts later 