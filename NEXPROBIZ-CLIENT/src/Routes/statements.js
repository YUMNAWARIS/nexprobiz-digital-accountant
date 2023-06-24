import { Balance } from "@mui/icons-material"
import { AddTransactionView, BalanceSheetView, IncomeStatementView, TransactionsViews, TrialBalanceView, transactionDetailView } from "../Views"

const statement_routes = [
  {
    path: '/statements',
    view: BalanceSheetView,
    title: "Financial Statements",
    layout: 'app',
    sub_layout: 'statement_layout'
  },
  {
    path: '/statements/balance-sheet',
    view: BalanceSheetView,
    title: "Financial Statements",
    layout: 'app',
    sub_layout: 'statement_layout'  
  },

  {
    path: '/statements/income-statement',
    view: IncomeStatementView,
    title: "Financial Statements",
    layout: 'app',
    sub_layout: 'statement_layout' 
  },
  {
    path: '/statements/trial-balance',
    view: TrialBalanceView,
    title: "Financial Statements",
    layout: 'app',
    sub_layout: 'statement_layout' 
  },
]

export default statement_routes