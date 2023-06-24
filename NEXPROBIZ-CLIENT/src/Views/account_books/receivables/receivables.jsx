import { AccountHeader, ReceivableTables } from "../../../components";
import { useNavigate } from "react-router-dom";

export function Receivables(props) {
  const navigate = useNavigate();

  return (
    <div className="container-fixed">
      <div className="row p-2" style={{ borderBottom: "1px solid grey" }}>
        <AccountHeader
          title={"Receivables"}
          url="/account-books/receivables/create"
        />
      </div>
      <div>
        <ReceivableTables />
      </div>
    </div>
  );
}
