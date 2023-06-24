import { AccountHeader, PayableTable } from "../../../components";
import { useNavigate } from "react-router-dom";

export function Payables(props) {
  const navigate = useNavigate();

  return (
    <div className="container-fixed">
      <div className="row p-2" style={{ borderBottom: "1px solid grey" }}>
        <AccountHeader
          title={"Payables"}
          url="/account-books/payables/create"
        />
      </div>
      <div>
        <PayableTable/>
      </div>
    </div>
  );
}
