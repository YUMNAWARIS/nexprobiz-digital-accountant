import { Typography } from "@material-ui/core";
import { AddBoxOutlined } from "@material-ui/icons";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export function TransactionHeader (props){
  const navigate = useNavigate()
  return (
    <div>
      <Typography variant="h3" style={{textAlign: 'center', borderBottom: '1px dashed grey'}}>{props.title}</Typography>
      <div>
 
      </div>
    </div>
  )
}