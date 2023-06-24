import { useNavigate } from "react-router-dom";
import { AccountHeader, WithdrawlTables } from "../../../components";

export function OwnersWithdrawl(props) {
  const navigate = useNavigate();
  return (
    <div className="container-fixed">
      <div className="row p-2" style={{ borderBottom: "1px solid grey" }}>
        <AccountHeader
          title={"Owner's Withdrawl"}
          url="/account-books/withdrawls/create"
        />
      </div>
      <div>
        <WithdrawlTables />
      </div>
    </div>
  );
}
