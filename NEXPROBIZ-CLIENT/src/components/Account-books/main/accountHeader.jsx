import { Typography } from "@material-ui/core";
import { AddBoxOutlined } from "@material-ui/icons";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export function AccountHeader(props) {
  const navigate = useNavigate()
  return (
    <>
      <Typography variant="h4" className="col-md-9">
        {props.title}
      </Typography>
      <Button
        className="col-md-3"
        variant="contained"
        color="primary"
        startIcon={<AddBoxOutlined />}
        onClick={() => {
          navigate(props.url || '/home');
        }}
      >
        New Account
      </Button>
    </>
  );
}
