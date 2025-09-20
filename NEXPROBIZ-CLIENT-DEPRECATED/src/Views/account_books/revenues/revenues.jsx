import { AccountHeader, RevenueTables } from "../../../components";
import { useNavigate } from "react-router-dom";

export function Revenues(props) {
  const navigate = useNavigate();

  return (
    <div className="container-fixed">
      <div className="row p-2" style={{ borderBottom: "1px solid grey" }}>
        <AccountHeader
          title={"Revenues"}
          url="/account-books/revenues/create"
        />
      </div>
      <div>
        <RevenueTables />
      </div>
    </div>
  );
}
