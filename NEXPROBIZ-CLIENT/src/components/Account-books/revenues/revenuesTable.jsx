import { ReactTabulator, reactFormatter } from "react-tabulator";
import { useAxios } from "../../../hooks/axios";
import { useRef } from "react";
import { CircleLoader } from "react-spinners";
import moment from "moment/moment";
import { Visibility } from "@material-ui/icons";
import { useNavigate } from "react-router-dom";

export function RevenueTables(props) {
  const navigate = useNavigate();
  const tableRef = useRef();
  const [data, loading, error] = useAxios({ url: "account-books/revenues" });
  if (loading || !data) {
    return (
      <div className="m-4 p4">
        <CircleLoader
          height="80"
          width="80"
          color="#4fa94d"
          ariaLabel="circles-loading"
          wrapperStyle={{}}
          wrapperClass=""
          visible={true}
        />
      </div>
    );
  }
  const ExpenseActions = (props) => {
    const data = props.cell._cell.row.data;
    const onClickViewDetails = () => {
      navigate(`/account-books/revenues/${data?.id}`);
    };
    return (
      <div>
        <span onClick={onClickViewDetails}>
          <Visibility />
          <span> View Details</span>
        </span>
      </div>
    );
  };
  const tableColumns = [
    {
      title: "Account Name",
      field: "account",
      width: 200,
      tooltip: true,
    },
    {
      title: "Date Received",
      field: "date_received",
      width: 150,
      tooltip: true,
      mutator: (val) => {
        return moment(val).format("YYYY-MM-DD");
      },
    },
    {
      title: "Amount",
      field: "amount",
      width: 100,
      tooltip: true,
      mutator: (val) => {
        return `$${val}`;
      },
    },
    {
      title: "Payment",
      field: "is_received",
      width: 130,
      tooltip: false,
      mutator: (value ) => {
        return value ? "Received" : "Not Received"
      }
    },
    {
      title: "Closing Status",
      field: "is_closed",
      width: 150,
      tooltip: false,
      mutator: (value ) => {
        return value ? "CLOSED" : "CURRENT"
      }
    },
    {
      title: "Actions",
      field: "custom",
      width: 150,
      tooltip: false,
      formatter: reactFormatter(<ExpenseActions />)
    },
  ];

  const tableOptions = {
    layout: "fitColumns",
    rowClick: false,
  };
  return (
    <div>
      {!loading && data && (
        <ReactTabulator
          columns={tableColumns}
          data={data}
          options={tableOptions}
        />
      )}
    </div>
  );
}