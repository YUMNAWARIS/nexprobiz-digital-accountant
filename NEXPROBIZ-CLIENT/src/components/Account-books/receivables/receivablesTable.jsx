import { ReactTabulator, reactFormatter } from "react-tabulator";
import { useAxios } from "../../../hooks/axios";
import { useRef } from "react";
import { CircleLoader } from "react-spinners";
import moment from "moment/moment";
import { Visibility } from "@material-ui/icons";
import { useNavigate } from "react-router-dom";

export function ReceivableTables(props) {
  const navigate = useNavigate();
  const tableRef = useRef();
  const [data, loading, error] = useAxios({ url: "account-books/receivables" });
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
  const RecievablesActions = (props) => {
    const data = props.cell._cell.row.data;
    const onClickViewDetails = () => {
      navigate(`/account-books/receivables/${data?.id}`);
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
      title: "Amount Due",
      field: "amount_due",
      width: 140,
      tooltip: true,
      mutator: (val) => {
        return `$${val}`;
      },
    },
    {
      title: "Date Added",
      field: "date_added",
      width: 150,
      tooltip: true,
      mutator: (val) => {
        return moment(val).format("YYYY-MM-DD");
      },
    },
    {
      title: "Date Due",
      field: "date_due",
      width: 150,
      tooltip: true,
      mutator: (val) => {
        return moment(val).format("YYYY-MM-DD");
      },
    },
    {
      title: "Payment Type",
      field: "type",
      width: 140,
      tooltip: false,
      mutator: (value ) => {
        return value ? "ON Account" : "NOT ON Account"
      }
    },
    {
      title: "Actions",
      field: "custom",
      width: 150,
      tooltip: false,
      formatter: reactFormatter(<RecievablesActions />)
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