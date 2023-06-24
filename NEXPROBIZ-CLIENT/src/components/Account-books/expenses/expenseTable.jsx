import { ReactTabulator, reactFormatter } from "react-tabulator";
import { useAxios } from "../../../hooks/axios";
import { useRef } from "react";
import { CircleLoader } from "react-spinners";
import moment from "moment/moment";
import { Visibility } from "@material-ui/icons";
import { useNavigate } from "react-router-dom";

export function ExpenseTable(props) {
  const navigate = useNavigate();
  const tableRef = useRef();
  const [data, loading, error] = useAxios({ url: "account-books/expenses" });
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
      navigate(`/account-books/expenses/${data?.id}`);
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
      title: "Date Incurred",
      field: "date_incurred",
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
      field: "is_paid",
      width: 100,
      tooltip: false,
      mutator: (value ) => {
        return value ? "PAID" : "NOT PAID"
      }
    },
    {
      title: "Closing Status",
      field: "is_close",
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