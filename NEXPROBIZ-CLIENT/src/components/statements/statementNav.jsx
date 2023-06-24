import { ButtonGroup } from "@material-ui/core";
import { BorderBottom } from "@material-ui/icons";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export function StatementNav(props) {
  const navigate = useNavigate();
  return (
    <div className="row" style={{ width: "100%" , padding: '10px', borderBottom: '1px dashed grey'}}>
      <div className="col-md-4">
        <Button
          variant="outlined"
          color="primary"
          type="submit"
          onClick={() => navigate("/statements/balance-sheet")}
          style={{ width: "100%" }}
        >
          Balance Sheet
          
        </Button>
      </div>

      <div className="col-md-4">
        <Button
          
          variant="outlined"
          color="primary"
          type="submit"
          onClick={() => navigate("/statements/income-statement")}
          style={{ width: "100%" }}
        >
          Income Statement
        </Button>
      </div>
      

      <div className="col-md-4">
        <Button
          variant="outlined"
          color="primary"
          onClick={() => {
            navigate("/statements/trial-balance");
            
          }}
          style={{ width: "100%" }}
        >
          Trial Balance
        </Button>
      </div>
    </div>
  );
}
