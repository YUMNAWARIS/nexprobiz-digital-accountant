import { AccountHeader, CurrentAssetsTable } from "../../../components";
import { useNavigate } from "react-router-dom";

export function CurrentAssets(props) {
  const navigate = useNavigate();

  return (
    <div className="container-fixed">
      <div className="row p-2" style={{ borderBottom: "1px solid grey" }}>
        <AccountHeader
          title={"Current Assets"}
          url="/account-books/current-assets/create"
        />
      </div>
      <div>
        <CurrentAssetsTable />
      </div>
    </div>
  );
}
