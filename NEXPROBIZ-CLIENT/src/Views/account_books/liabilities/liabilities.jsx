import { AccountHeader, LiabilitiesTable } from "../../../components";
import { useNavigate } from "react-router-dom";

export function Liabilities(props) {
  const navigate = useNavigate();

  return (
    <div className="container-fixed">
      <div className="row p-2" style={{ borderBottom: "1px solid grey" }}>
        <AccountHeader
          title={"Liabilities"}
          url="/account-books/liabilities/create"
        />
      </div>
      <div>
        <LiabilitiesTable />
      </div>
    </div>
  );
}
