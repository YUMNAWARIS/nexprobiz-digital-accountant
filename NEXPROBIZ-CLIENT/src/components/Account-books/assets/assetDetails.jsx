import { useParams } from "react-router-dom";
import { useAxios } from "../../../hooks/axios";
import { CircleLoader } from "react-spinners";
import { Card, CardContent, Typography, Grid } from "@mui/material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles(() => ({
  card: {
    minWidth: 275,
    maxWidth: 600,
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
export function AssetDetails(props) {
  const params = useParams();
  const classes = useStyles();

  const [data, loading] = useAxios({
    url: `account-books/assets/${params.id}`,
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
              <strong>Acquisition Date:</strong>
              {new Date(data.acquisition_date).toLocaleString()}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Purchase Date:</strong>
              {new Date(data.purchase_date).toLocaleString()}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Purchasing Cost:</strong> ${data.purchasing_cost}
            </Typography>
            <Typography variant="body1" className={classes.data}>
              <strong>Selling Status:</strong>
              {data.isSold ? "Sold" : "Not sold"}
            </Typography>
            {data.depreciation && (
              <>
              <br/>
                <Typography variant="h5" className={`${classes.title} ${classes.underline}`}>
                  <span>Depreciation Details</span>
                </Typography>
                <Typography variant="body1" className={classes.data}>
                  <strong>Depreciation Method:</strong>
                  {data?.depreciation?.depreciation_method}
                </Typography>
                <Typography variant="body1" className={classes.data}>
                  <strong>Useful Life:</strong>
                  {data?.depreciation?.useful_life}
                </Typography>
                <Typography variant="body1" className={classes.data}>
                  <strong>Salvage Value:</strong>
                  {data.depreciation?.salvage_value}
                </Typography>
                <Typography variant="body1" className={classes.data}>
                  <strong>Depreciation Expense:</strong>
                  {data.depreciation?.depreciation_expense}
                </Typography>
                <Typography variant="body1" className={classes.data}>
                  <strong>Adjustment Frequency:</strong>
                  {data.depreciation.adjustment_frequency}
                </Typography>
                <Typography variant="body1" className={classes.data}>
                  <strong>Total Adjustment Made:</strong> $
                  {data.depreciation.total_adjustment_made}
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
