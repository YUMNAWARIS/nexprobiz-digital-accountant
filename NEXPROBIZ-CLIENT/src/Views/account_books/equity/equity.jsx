import { AccountHeader, EquityTable } from "../../../components";
import { useNavigate } from "react-router-dom";

export function OwnersEquity(props) {
  const navigate = useNavigate()
  return (
    <div className="container-fixed">
      <div className="row p-2" style={{ borderBottom: "1px solid grey" }}>
        <AccountHeader
          title={"Owner's Equity"}
          url="/account-books/equity/create"
        />
      </div>
      <div>
          <EquityTable />
      </div>
    </div>
  );
}
