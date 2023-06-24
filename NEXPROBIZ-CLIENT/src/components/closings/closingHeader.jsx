
import { Typography } from "@material-ui/core";
import { AddBoxOutlined } from "@material-ui/icons";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export function ClosingHeader (props){
  const navigate = useNavigate()
  return (
    <Typography variant="h3" style={{textAlign: 'center', borderBottom: '1px dashed grey'}}>{props.title}</Typography>

  )
}