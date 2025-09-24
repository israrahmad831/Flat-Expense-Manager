# Expense Manager 💰

A comprehensive expense management application for sharing and tracking expenses with roommates and groups.

## ✨ Features

### 🔐 Authentication
- **Email/Password Sign-in**: Secure authentication with bcrypt password hashing
- **Google OAuth**: One-click sign-in with Google
- **Session Management**: Persistent sessions with NextAuth.js
- **Protected Routes**: Dashboard and profile pages require authentication

### 📊 Expense Management
- **Add Expenses**: Create detailed expense records with categories
- **Real-time Dashboard**: View total expenses, monthly spending, and statistics
- **Category Breakdown**: Organize expenses by categories (Food, Utilities, Rent, etc.)
- **Expense History**: Complete list of all transactions with details

### 📈 Analytics & Reports
- **Interactive Analytics**: Comprehensive spending analysis
- **Category Distribution**: Visual breakdown of spending by category
- **Monthly Trends**: Track spending patterns over time
- **Time Filters**: View data by week, month, year, or custom periods
- **Progress Bars**: Visual representation of spending patterns

### 👤 User Management
- **User Profiles**: Personal profile and account settings
- **Notification Preferences**: Control email notifications and alerts
- **Privacy Controls**: Manage data and privacy settings
- **Account Security**: View connected accounts and security status

### 🎨 Modern UI/UX
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Mode**: Automatic theme detection
- **Smooth Animations**: Loading states and transitions
- **Accessible**: Built with accessibility best practices
- **Intuitive Navigation**: Clean and user-friendly interface

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Authentication**: NextAuth.js with JWT sessions
- **Database**: MongoDB with native driver
- **Styling**: Tailwind CSS with custom components
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React icons
- **Deployment Ready**: Vercel, Netlify, or any Node.js host

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- Google Cloud Console (for Google OAuth)

### Installation

1. **Clone and Install**
```bash
git clone <repository-url>
cd expense-manager
npm install
```

2. **Environment Setup**
Create `.env.local` in the root directory:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/expense-manager

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT
JWT_SECRET=your-jwt-secret-here
```

3. **Start MongoDB**
```bash
# Windows (as Administrator)
net start MongoDB

# macOS
brew services start mongodb/brew/mongodb-community

# Linux
sudo systemctl start mongod
```

4. **Run Development Server**
```bash
npm run dev
```

Visit `http://localhost:3000` 🎉

## 📱 Application Flow

1. **Landing Page**: Welcome screen with feature overview
2. **Authentication**: Sign up or sign in with email/Google
3. **Dashboard**: Main expense overview with quick actions
4. **Add Expenses**: Modal form for creating new expenses
5. **Analytics**: Detailed reports and spending insights
6. **Profile**: User settings and account management

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `GET|POST /api/auth/[...nextauth]` - NextAuth.js handlers

### Expenses
- `GET /api/expenses` - Fetch user expenses
- `POST /api/expenses` - Create new expense

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts    # NextAuth config
│   │   │   └── signup/route.ts           # User registration
│   │   └── expenses/route.ts             # Expense CRUD
│   ├── auth/
│   │   ├── signin/page.tsx               # Sign in page
│   │   └── signup/page.tsx               # Sign up page
│   ├── dashboard/page.tsx                # Main dashboard
│   ├── analytics/page.tsx                # Analytics & reports
│   ├── profile/page.tsx                  # User profile
│   ├── layout.tsx                        # Root layout
│   ├── page.tsx                          # Landing page
│   └── providers.tsx                     # Context providers
├── components/ui/                        # Reusable UI components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── progress.tsx
├── lib/
│   └── auth.ts                           # NextAuth configuration
└── types/
    └── next-auth.d.ts                    # TypeScript declarations
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **CSRF Protection**: Built-in NextAuth.js protection
- **Session Security**: HTTP-only cookies with secure flags
- **Input Validation**: Zod schema validation on all forms
- **SQL Injection Prevention**: MongoDB native driver protection
- **Environment Variables**: Sensitive data in environment files

## 🎯 Key Features Deep Dive

### Dashboard
- Real-time expense statistics
- Monthly spending overview
- Quick add expense functionality
- Recent transactions list
- Category-wise spending breakdown

### Analytics
- Interactive spending charts
- Time-based filtering (week/month/year)
- Category distribution analysis
- Monthly trend visualization
- Expense pattern insights

### Responsive Design
- Mobile-first approach
- Adaptive navigation
- Touch-friendly interfaces
- Optimized performance on all devices

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Manual Deployment
```bash
npm run build
npm start
```

## 🧪 Development

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and SETUP.md
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub Discussions for questions

---

Built with ❤️ using Next.js, TypeScript, and MongoDB