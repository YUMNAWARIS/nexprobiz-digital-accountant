import { AssetCreateView, AssetDetailsView, Assets, Cash, CurrentAssets, CurrentAssetsCreateView, CurrentAssetsDetailsView, Expenses, ExpensesCreateView, ExpensesDetailsView, Liabilities, LiabilitiesCreateView, LiabilitiesDetailsView, OwnersEquity, OwnersEquityCreateView, OwnersEquityDetailView, OwnersWithdrawl, OwnersWithdrawlCreateView, OwnersWithdrawlDetailsView, Payables, PayablesCreateView, PayablesDetailsView, Receivables, ReceivablesCreateView, ReceivablesDetailsView, Revenues, RevenuesCreateView, RevenuesDetailView } from '../Views'

const account_book_routes = [

  // Asset
  {
    path: '/account-books/assets',
    view: Assets,
    title: "Assets",
    layout: 'app',
    sub_layout: 'account_book'
  },
  {
    path: '/account-books/assets/create',
    view: AssetCreateView,
    title: "Assets",
    layout: 'app',
    sub_layout: 'account_book'
  },
  {
    path: '/account-books/assets/:id',
    view: AssetDetailsView,
    title: "Assets",
    layout: 'app',
    sub_layout: 'account_book'
  },

  // Cash
  {
    path: '/account-books/cash',
    view: Cash,
    title: "Cash",
    layout: 'app',
    sub_layout: 'account_book'  
  },
  

  // Current Assets
  {
    path: '/account-books/current-assets',
    view: CurrentAssets,
    title: "Other Current Assets",
    layout: 'app',
    sub_layout: 'account_book'  
  },
  {
    path: '/account-books/current-assets/create',
    view: CurrentAssetsCreateView,
    title: "Other Current Assets",
    layout: 'app',
    sub_layout: 'account_book'  
  },
  {
    path: '/account-books/current-assets/:id',
    view: CurrentAssetsDetailsView
    ,
    title: "Other Current Assets",
    layout: 'app',
    sub_layout: 'account_book'  
  },

  // Liablities
  {
    path: '/account-books/liabilities',
    view: Liabilities,
    title: "Liabilities",
    layout: 'app',
    sub_layout: 'account_book'  
  },
  {
    path: '/account-books/liabilities/create',
    view: LiabilitiesCreateView,
    title: "Liabilities",
    layout: 'app',
    sub_layout: 'account_book'  
  },
  {
    path: '/account-books/liabilities/:id',
    view: LiabilitiesDetailsView,
    title: "Liabilities",
    layout: 'app',
    sub_layout: 'account_book'  
  },

  // Expenses
  {
    path: '/account-books/expenses',
    view: Expenses,
    title: "Expenses",
    layout: 'app',
    sub_layout: 'account_book'  
  },
  {
    path: '/account-books/expenses/create',
    view: ExpensesCreateView,
    title: "Expenses",
    layout: 'app',
    sub_layout: 'account_book'  
  },
  {
    path: '/account-books/expenses/:id',
    view: ExpensesDetailsView,
    title: "Expenses",
    layout: 'app',
    sub_layout: 'account_book'  
  },

  // Revenues
  {
    path: '/account-books/revenues',
    view: Revenues,
    title: "Revenues",
    layout: 'app',
    sub_layout: 'account_book'  
  },
  {
    path: '/account-books/revenues/create',
    view: RevenuesCreateView,
    title: "Revenues",
    layout: 'app',
    sub_layout: 'account_book'  
  },
  {
    path: '/account-books/revenues/:id',
    view: RevenuesDetailView,
    title: "Revenues",
    layout: 'app',
    sub_layout: 'account_book'  
  },

  // Payables
  {
    path: '/account-books/payables',
    view: Payables,
    title: "Payables",
    layout: 'app',
    sub_layout: 'account_book'  
  },
  {
    path: '/account-books/payables/create',
    view: PayablesCreateView,
    title: "Payables",
    layout: 'app',
    sub_layout: 'account_book'  
  },
  {
    path: '/account-books/payables/:id',
    view: PayablesDetailsView,
    title: "Payables",
    layout: 'app',
    sub_layout: 'account_book'  
  },

  // Receivables
  {
    path: '/account-books/receivables',
    view: Receivables,
    title: "Receivables",
    layout: 'app',
    sub_layout: 'account_book' 
  },
  {
    path: '/account-books/receivables/create',
    view: ReceivablesCreateView,
    title: "Receivables",
    layout: 'app',
    sub_layout: 'account_book' 
  },
  {
    path: '/account-books/receivables/:id',
    view: ReceivablesDetailsView,
    title: "Receivables",
    layout: 'app',
    sub_layout: 'account_book' 
  },

  // Owners Equity
  {
    path: '/account-books/equity',
    view: OwnersEquity,
    title: "Owners Equity",
    sub_layout: 'account_book',
    layout: 'app',
    sub_layout: 'account_book'  
  },
  {
    path: '/account-books/equity/create',
    view: OwnersEquityCreateView,
    title: "Owners Equity",
    sub_layout: 'account_book',
    layout: 'app',
    sub_layout: 'account_book'  
  },
  {
    path: '/account-books/equity/:id',
    view: OwnersEquityDetailView,
    title: "Owners Equity",
    sub_layout: 'account_book',
    layout: 'app',
    sub_layout: 'account_book'  
  },

  // With Drawls
  {
    path: '/account-books/withdrawls',
    view: OwnersWithdrawl,
    title: "Withdrawls",
    layout: 'app',
    sub_layout: 'account_book'  
  },
  {
    path: '/account-books/withdrawls/create',
    view: OwnersWithdrawlCreateView,
    title: "Withdrawls",
    layout: 'app',
    sub_layout: 'account_book'  
  },
  {
    path: '/account-books/withdrawls/:id',
    view: OwnersWithdrawlDetailsView,
    title: "Withdrawls",
    layout: 'app',
    sub_layout: 'account_book'  
  },
]

export default account_book_routes