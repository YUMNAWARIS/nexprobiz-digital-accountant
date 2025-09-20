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
export function WithDrawlDetails(props) {
  const params = useParams();
  const classes = useStyles();

  const [data, loading] = useAxios({
    url: `account-books/withdrawls/${params.id}`,
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
              <strong>ID:</strong> {data.id}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Total Amount:</strong>
              {new Date(data.amount).toLocaleString()}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Created At:</strong>
              {new Date(data.date_created).toLocaleString()}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Closing Status:</strong>
              {data.isClosed ? "Closed" : "Current"}
            </Typography>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
// {
//   "id": "29c07e84-0f75-4e72-ac28-4d2bcbd682f1",
//   "account_name": "With Drawl 1",
//   "amount": "100",
//   "date_created": "2023-06-17T09:49:50.421Z",
//   "isClosed": false,

// }