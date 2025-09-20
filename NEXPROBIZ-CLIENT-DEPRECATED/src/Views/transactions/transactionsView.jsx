import { useNavigate } from "react-router-dom";
import { TransactionTables } from "../../components";
import { Button } from "@mui/material";
import { AddBoxOutlined } from "@material-ui/icons";

export function TransactionsViews(props) {
  const navigate = useNavigate()
  return (
    <>
      <div className="d-flex justify-content-end" style={{borderStyle: 'outset'}}>
        <Button
          className="col-md-3 m-4"
          variant="outlined"
          color="primary"
          startIcon={<AddBoxOutlined />}
          onClick={() => {
            navigate("/transactions/add");
          }}
        >
          Add new Transaction Entry
        </Button>
      </div>
      <TransactionTables />
    </>
  );
}
