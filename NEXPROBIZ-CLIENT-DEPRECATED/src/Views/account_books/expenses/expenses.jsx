import { AccountHeader, ExpenseTable } from "../../../components";
import { useNavigate } from "react-router-dom";

export function Expenses(props) {
  const navigate = useNavigate();

  return (
    <div className="container-fixed">
      <div className="row p-2" style={{ borderBottom: "1px solid grey" }}>
        <AccountHeader
          title={"Expenses"}
          url="/account-books/expenses/create"
        />
      </div>
      <div>
        <ExpenseTable />
      </div>
    </div>
  );
}
