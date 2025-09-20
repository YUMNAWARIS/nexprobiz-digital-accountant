
import { useParams } from "react-router-dom";
import { useAxios } from "../../../hooks/axios";
import { CircleLoader } from "react-spinners";
import { Card, CardContent, Typography, Grid } from "@mui/material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles(() => ({
  card: {
    maxWidth: 500,
    margin: "1rem",
    backgroundColor: "#f5f5f5",
  },

  data: {
    fontSize: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    position: 'relative',
  },
  underline: {
    textDecoration: 'underline',
  },

}));
export function EquityDetails(props) {
  const params = useParams();
  const classes = useStyles();

  const [data, loading] = useAxios({
    url: `account-books/equity/${params.id}`,
  });
  if (loading || !data) {
    return (
      <div className="m-4 p4">
        <CircleLoader
          height="100"
          width="100"
          color="#4fa94d"
          ariaLabel="circles-loading"
          wrapperStyle={{}}
          wrapperClass=""
          visible={true}
        />
      </div>
    );
  }
  return (
    <div className="container-fixed">
      <div className="row" style={{ borderBottom: "2px solid black" }}>
        <Typography variant="h4" className="col-md-9 mb-2 mt-2">
          {data?.account_name}
        </Typography>
      </div>
      <div className="row">
        <Card className={classes.card}>
          <CardContent>
            <Typography variant="body1" className={classes.data}>
              <strong>ID: </strong> {data.id}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Total Amount: </strong>
              {new Date(data.total_amount).toLocaleString()}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Created At: </strong>
              {new Date(data.date_created).toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}