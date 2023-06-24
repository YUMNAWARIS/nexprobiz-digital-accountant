import { Button, Card, CardContent, CardHeader } from "@material-ui/core";
import { AccountHeader, AssetTables } from "../../../components";
import { useNavigate } from "react-router-dom";
import { Typography } from "@mui/material";
import { AddBoxOutlined } from "@material-ui/icons";

export function Assets(props) {
  const navigate = useNavigate();
  return (
    <div className="container-fixed">
      <div className="row p-2" style={{borderBottom: '1px solid grey'}}>
        <AccountHeader title="Assets" url="/account-books/assets/create"/>
      </div>
      <div>
        <AssetTables />
      </div>
    </div>
  );
}
