import { AddTransactionView, TransactionsViews, transactionDetailView } from "../Views"

const transactions_routes = [
  {
    path: '/transactions',
    view: TransactionsViews,
    title: "Business Transactions",
    layout: 'app',
    sub_layout: 'transaction_layout'  
  },

  // Business Transactions
  {
    path: '/transactions/add',
    view: AddTransactionView,
    title: "Business Transactions",
    layout: 'app',
    sub_layout: 'transaction_layout' 
  },
  {
    path: '/transactions/details',
    view: transactionDetailView,
    title: "Business Transactions",
    layout: 'app',
    sub_layout: 'transaction_layout' 
  },
]

export default transactions_routes