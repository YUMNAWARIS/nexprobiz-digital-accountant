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
export function RevenuesDetails(props) {
  const params = useParams();
  const classes = useStyles();

  const [data, loading] = useAxios({
    url: `account-books/revenues/${params.id}`,
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
              <strong>ID: </strong> {data.id}
            </Typography>

            <Typography variant="body1" className={classes.data}>
              <strong>Date Received: </strong>
              {new Date(data.date_received).toLocaleString()}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Amount: </strong>
              {` $${data.amount}`}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Description: </strong>
              {` ${data.description}`}
            </Typography>
            {data.is_received && (
              <>
              <br/>
                <Typography variant="h5" className={`${classes.title} ${classes.underline}`}>
                  <span>Payment Details: </span>
                </Typography>
                <Typography variant="body1" className={classes.data}>
                  <strong>Payment Method: </strong>
                  {data?.payment_detail?.payment_method}
                </Typography>
                <Typography variant="body1" className={classes.data}>
                  <strong>Payment Status: </strong>
                  {data?.payment_detail?.payment_status}
                </Typography>
                <Typography variant="body1" className={classes.data}>
                  <strong>payment_date: </strong>
                  {data.payment_detail?.payment_date.toLocaleString()}
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
// "id": "6511daaa-a267-4562-bc7e-01659878f0d3",
//         "useful_life": "4",
//         "salvage_value": "10",
//         "depreciation_method": "LINEAR DEPRECIATION METHOD",
//         "depreciation_expense": "247.5",
//         "isDepreciatedFully": false,
//         "adjustment_frequency": "YEARLY",
//         "total_adjustment_made": 0,
//         "notes": null