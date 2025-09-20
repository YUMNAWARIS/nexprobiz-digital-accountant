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
    fontWeight: 'bold',
    marginBottom: 10,
    position: 'relative',
  },
  underline: {
    textDecoration: 'underline',
  },
}));

export function PayablesDetails(props) {
  const params = useParams();
  const classes = useStyles();

  const [data, loading] = useAxios({
    url: `account-books/payables/${params.id}`,
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
          {data?.account}
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
              <strong>Description:</strong> {data.description}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Date Added:</strong>{" "}
              {new Date(data.date_added).toLocaleString()}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Date Paid:</strong>{" "}
              {data.date_paid
                ? new Date(data.date_paid).toLocaleString()
                : "Not paid"}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Date Due:</strong>{" "}
              {new Date(data.date_due).toLocaleString()}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Type:</strong> {data.type}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Vendor Name:</strong>{" "}
              {data.vendor_details.name || "Not available"}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Vendor Email:</strong>{" "}
              {data.vendor_details.email || "Not available"}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Vendor Address:</strong>{" "}
              {data.vendor_details.address || "Not available"}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Amount Due:</strong> {data.amount_due}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Total Amount:</strong> {data.total_amount}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Is Paid:</strong>{" "}
              {data.is_paid ? "Paid" : "Not paid"}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Payment Method:</strong>{" "}
              {data.payment_detail.payment_method || "Not available"}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Payment Status:</strong>{" "}
              {data.payment_detail.payment_status || "Not available"}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Payment Date:</strong>{" "}
              {data.payment_detail.payment_date
                ? new Date(data.payment_detail.payment_date).toLocaleString()
                : "Not available"}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Data:</strong>{" "}
              {Object.keys(data.data).length > 0
                ? JSON.stringify(data.data)
                : "No data"}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Notes:</strong>{" "}
              {data.notes || "No notes"}
            </Typography>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}