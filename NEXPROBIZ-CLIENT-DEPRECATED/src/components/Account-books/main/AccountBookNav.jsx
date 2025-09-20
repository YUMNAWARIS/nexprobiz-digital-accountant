import { Link } from "react-router-dom"
import './accountBookNav.css'

export function AccountBookNav(props){

  let account_books_items = [
    {label:'Assets', link: "/account-books/assets"},
    // {label:'Cash', link: "/account-books/cash"},
    {label:'Current Assets', link: "/account-books/current-assets"},
    {label:'Liabilities', link: "/account-books/liabilities"},
    {label:'Payables', link: "/account-books/payables"},
    {label:'Receivables', link: "/account-books/receivables"},
    {label:'Expenses', link: "/account-books/expenses"},
    {label:'Revenues', link: "/account-books/revenues"},
    {label:'Equity', link: "/account-books/equity"},
    {label:'Withdrawls', link: "/account-books/withdrawls"},
  ]
  return (
    <div className='account-nav'>
      {account_books_items.map(item => {
        return (
          <div className="account-nav-items" key={item.label}>
            <Link to={item.link}>{item.label}</Link>
          </div>
        )
      })}
    
    </div>
  )
}