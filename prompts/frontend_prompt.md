

Build a comprehensive personal finance dashboard web app with the following specifications:

## IMPORTANT
- The project root is the monorepo, but this specific 'project' is the Next.js application located in the /web-app directory. Refer to /server for API contracts but do not modify it.
- - Use the /frontend-design plugin for the design 

## PROJECT OVERVIEW
This is a personal finance tracking and budgeting application. Users upload CSV files with bank transactions, view spending analysis, manage budgets, and get AI-powered savings insights.

## PROJECT STATUS
- Backend already finalised, use the api request and response models to design the interfaces of the web app
- Fronted template is ready, with all the navigation betwamongeen pages are set up and all the packages needed so far  are installed. Do not alter the current functionalities already im0lemented
- the connection with the backend is already established and tested

## COLOR SCHEME & BRANDING
- Primary Color: Teal (#208E95 or similar professional blue-green)
- Secondary Color: Warm Gray (#5E5240)
- Background: Clean cream (#FCFCF9) for light mode
- Dark mode: Charcoal (#1F2121)
- Accent for alerts: Red (#C01527) for overspending, Green (#208E95) for savings
- Open to other colors as well
- Use Tailwind CSS with the color palette above
- Design inspiration: use image i uploaded for inspiration

## NAVIGATION & LAYOUT
- Sidebar on desktop (collapsible hamburger on mobile) with:
  - Dashboard
  - Transactions
  - Analytics
  - Budgets (just placeholder. add a coming soon message)
  - Insights
  - Settings (as it is)
- Mobile responsive (works great on phones, tablets, desktop)
- Sticky header for easy access

## PAGE 1: DASHBOARD (Home/Landing Page)
This is the first page users see. It should be glanceable and show key metrics at a glance.

### Components:
1. **Welcome Card**
   - Greeting with user's name
   - Quick stat: Total spending this month
   - Link to upload CSV

2. **Summary Cards (4 columns, responsive grid)**
   - Total Spent This Month: $X,XXX.XX (show vs budget if exists)
   - Remaining Budget: $X,XXX.XX (green if positive, red if negative)
   - Recurring Costs: $XXX.XX (total monthly recurring)
   - Savings Goal Progress: XX% (if goal exists)

3. **Charts Section (2 columns on desktop, 1 on mobile)**
   - **Left: Spending by Category (Pie Chart)**
     - Show top 5 categories
     - Interactive: click to see transactions in that category
     - Legend below chart with percentages
   
   - **Right: Spending Trend (Line Chart)**
     - Last 6 months of spending
     - Show current month highlighted
     - Interactive: hover to see exact amounts
     - Include toggle for "Actual" vs "Budget"

4. **Recent Transactions Widget**
   - Show last 5/10 transactions in a mini table
   - Columns: Date | Merchant | Amount | Category
   - Color-coded by category
   - Link "View All" to Transactions page

5. **Quick Insights Callout**
   - Highlight box showing 1-2 AI-generated insights:
     - "You spent $XX more than last month on dining"
     - "You have 3 subscriptions totaling $XX/month"
   - pick the one that requires most attention
   - Design as notification-style card with icon
   - Include "Generate New Insights" button
   - Display a badge with a message to generate new insight becase new data have been added

6. **Call-to-Action Buttons**
   - Primary: "Upload CSV" (large, prominent)
   - Secondary: "Set Budget" (button as placeholder, budget api not available)
   - Secondary: "View Insights"

## PAGE 2: TRANSACTIONS
List and manage all imported transactions.

### Components:
1. **Filter & Search Bar (sticky at top)**
   - Search by merchant name
   - Date range picker (start date → end date)
   - Category dropdown filter (show all categories)
   - Amount range slider ($0 - max transaction)
   - Sort dropdown: Date (newest first), Amount (high to low), Merchant (A-Z)

2. **Bulk Actions Bar**
   - Use the provided component for bulk actions
   - Checkbox to select all visible transactions
   - Bulk recategorize button (opens dropdown)
   - Bulk export button (exports to CSV)

3. **Transactions Table**
   - Columns: Checkbox | Date | Merchant | Amount | Category | Confidence | Actions
   
   **Table Rows:**
   - Each transaction row shows:
     - Checkbox (select for bulk actions)
     - Date (formatted: "Jan 10, 2026")
     - Merchant (clickable to see all from that merchant)
     - Amount (formatted: $X,XXX.XX, color-coded by category)
     - Category (pill/badge with color, clickable)
     - Confidence Score (if AI categorized: 95% confidence, show as small badge with icon)
     - Actions: Edit button (edit category), Delete button
   
   - Row colors: Very light background for alternating rows (light theme)
   - Hover state: Subtle highlight, shows edit/delete buttons more prominently
   - Click merchant name → filter to only that merchant

4. **Pagination**
   - Show 25 transactions per page
   - Pagination controls at bottom: "< Previous | Page X of Y | Next >"
   - Show "Showing X-Y of Z transactions"

5. **Empty State**
   - If no transactions: Large illustration + "No transactions yet"
   - CTA: "Upload a CSV file to get started"

6. **Category Edit Modal**
   - When clicking category or edit button on transaction:
   - Modal shows original merchant name, amount, date
   - Dropdown to select new category
   - Optional: note field "Why did you change this?"
   - Buttons: Save | Cancel

   Open to new ideas if needed

### PAGE 3: ANALYTICS
i want to display the different categories of analytics in different tabs with the shadcn components tabulation component

- it is not necessary to display all analytics. consider what's most necessary and do not display redundant analytics

- filters where possible (e.g date range)
- quick filter like (1 month / 3 months / 6 months) where needed
- open to ideas for this component

## PAGE 4: INSIGHTS
AI-generated financial insights and recommendations. see on /server

### Components:
To be adapted to the insight available from the backend. adapt if and where necessary.

This is what should be present ideally:
1. **Generate Insights Button**
   - Large, prominent button at top: "Generate New Insights"
   - Shows loading spinner while generating
   - Disabled if insights were generated in last hour (show "Refreshes in XX minutes")

2. **Insights Cards Grid** (1 column on mobile, 2-3 on desktop)
   Each insight card shows:
   - Insight title (e.g., "Subscription Audit", "Spending Pattern", "Savings Opportunity")
   - Icon (subscription icon, chart icon, piggy bank icon)
   - Description/finding (2-3 sentences, plain language)
   - Key metric highlighted (e.g., "$120/month in unused subscriptions")
   - Call-to-action if applicable (e.g., "Review Subscriptions" button)
   - Timestamp: "Generated today at 2:30 PM"

3. **Insight Categories** (tabs or accordion)
   Organize insights by type:
   - 💳 **Spending Patterns** (e.g., "You spend 15% more on dining on weekends")
   - 🔄 **Recurring Charges** (e.g., "3 subscriptions totaling $XX/month")
   - 💰 **Savings Opportunities** (e.g., "Switch grocery store to save $XX/month")
   - ⚠️ **Anomalies** (e.g., "Unusual $XXX transaction detected")
   - 📊 **Comparisons** (e.g., "You spent 20% more than last month")

4. **Savings Tracker**
   - Show total potential savings if user implements insights
   - "Potential monthly savings: $XXX if you act on recommendations"
   - Checkbox list of recommendations to "mark as done"
   - Track realized savings

5. **Empty State**
   - If no insights generated yet: "Insights will appear here once you generate them"
   - CTA: "Generate insights"


## PAGE 5: BUDGETS
Create and manage spending budgets by category.

- Just a placeholder with a coming soon message


## PAGE 5: SETTINGS (the modal i already have)
User preferences and account management.
Use the same layout i have already designed
keep the current functionalities intact

### Components:
1. **Account Section**
   already there

2. **Preferences Section**
   - Currency: Dropdown (USD, EUR, GBP, etc.) - default to EUR (Berlin user)
   - Date format: Dropdown (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
   - Theme: Toggle between Light / Dark / System

3. **Data Management**
   - Download all my data (just placeholder, do not have the endpoint)
   - Delete all transactions (red button, requires confirmation)
   - Clear cache / reset app

4. **Notification Preferences**
   Just placeholder
   - Email notifications toggle (on/off)
   - Budget alerts toggle (on/off)
   - Newsletter toggle (monthly insights email)

5. **Logout Button**
   already there

## RESPONSIVE DESIGN REQUIREMENTS
- Mobile first (works perfect on iPhone/Android)
- Tablet (iPad, large phones - optimize grid layouts)
- Desktop (1400px+)
- Hamburger menu on mobile (sidebar collapses)
- Charts adapt to screen size (full width on mobile)
- Touch-friendly buttons (48px minimum tap target)

## INTERACTIVE FEATURES
- Hover states on all buttons and cards (subtle shadow/background change)
- Click to copy (merchants, amounts) - show toast notification "Copied to clipboard"
- Loading states (skeleton screens) for data-heavy pages
- Toast notifications for actions:
  - "Budget created successfully"
  - "Transaction updated"
  - "Insights generated"
- Modal dialogs for confirmation and bulk actions (delete, logout)
- Smooth page transitions (fade/slide)

## DATA INTEGRATION (Important for backend team)
The frontend will call the api endpoint from the fast api application in /server


## IMPORTANT DESIGN NOTES
- Keep it simple and minimal (avoid cluttering screens)
- Use consistent spacing (8px/16px grid)
- Show loading states (skeleton screens, spinners)
- Handle empty states gracefully
- Use color strategically (not too many colors, maintain hierarchy)
- Professional look (fintech standard, not playful)
- Accessibility: Good contrast, keyboard navigation, ARIA labels
- Make numbers scannable (bold amounts, larger font for key metrics)



## FINAL NOTES
- Do not alter the current layout structure and functionalities already present in the template
- This should be a production-ready, polished app (not a prototype)
- Use best practices for React components (reusable, well-organized)
- Include error boundaries and error handling
- Include loading and error states everywhere
- Use the /frontend-design plugin for the design 
- use context7 if you need to fetcg documentation
- use this library for charts "https://react-charts.tanstack.com"
- shadcn/ui components for the rest