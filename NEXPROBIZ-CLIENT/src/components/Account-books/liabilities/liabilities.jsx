import { useParams } from "react-router-dom";
import { useAxios } from "../../../hooks/axios";
import { CircleLoader } from "react-spinners";
import { Card, CardContent, Typography, Grid } from "@mui/material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles(() => ({
  card: {
    minWidth: 275,
    margin: "1rem",
    backgroundColor: "#f5f5f5",
  },

  data: {
    fontSize: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    position: "relative",
  },
  underline: {
    textDecoration: "underline",
  },
}));
export function LiabilitiesDetails(props) {
  const params = useParams();
  const classes = useStyles();

  const [data, loading] = useAxios({
    url: `account-books/liabilities/${params.id}`,
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
          {data?.name}
        </Typography>
      </div>
      <div className="row">
        <Card className={classes.card}>
          <CardContent>
            <Typography variant="body1" className={classes.data}>
              <strong>ID:</strong> {data.id}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Account:</strong> {data.account}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Description:</strong> {data.description || "Not provided"}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Type:</strong> {data.type}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Payment Method:</strong>{" "}
              {data.payment_detail.payment_method || "Not provided"}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Payment Status:</strong>{" "}
              {data.payment_detail.payment_status || "Not provided"}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Payment Date:</strong>{" "}
              {data.payment_detail.payment_date
                ? new Date(data.payment_detail.payment_date).toLocaleString()
                : "Not provided"}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Total Amount:</strong> ${data.total_amount}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Adjustment Details:</strong>{" "}
              {data.adjustment_details.length > 0
                ? data.adjustment_details[0]
                : "Not provided"}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Date Added:</strong>{" "}
              {data.date_added
                ? new Date(data.date_added).toLocaleString()
                : "Not provided"}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Is Completed:</strong> {data.is_completed ? "Yes" : "No"}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Data:</strong> {JSON.stringify(data.data)}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Notes:</strong> {data.notes || "Not provided"}
            </Typography>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

