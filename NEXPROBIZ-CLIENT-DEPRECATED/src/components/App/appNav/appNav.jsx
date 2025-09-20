import { Link } from "react-router-dom";

export function AppNav(props) {
  const items = [
    
    { label: "Home", link: "/" },
    { label: "Dashboard", link: "/dashboard" },
    { label: "Owners", link: "/owners" },
    { label: "Account Books", link: "/account-books/assets" },
    { label: "Transactions", link: "/transactions" },
    { label: "Statements", link: "/statements" },
    { label: "Adjustments", link: "/adjustments" },
    { label: "Closings", link: "/closings" },
  ];
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="collapse navbar-collapse" id="navbarSupportedContent">
        <ul className="navbar-nav mr-auto">
          {items.map((item) => {
            return (
              <li className="nav-item active" key={item.link}>
                <Link className="nav-link" to={item.link}>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
