import { ReactTabulator, reactFormatter } from "react-tabulator";
import { useAxios } from "../../../hooks/axios";
import { useRef } from "react";
import { CircleLoader } from "react-spinners";
import moment from "moment/moment";
import { Visibility } from "@material-ui/icons";
import { useNavigate } from "react-router-dom";

export function LiabilitiesTable(props) {
  const navigate = useNavigate();
  const tableRef = useRef();
  const [data, loading, error] = useAxios({ url: "account-books/liabilities" });
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
      navigate(`/account-books/liabilities/${data?.id}`);
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
      title: "Amount",
      field: "total_amount",
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
      title: "Account Type",
      field: "type",
      width: 190,
      tooltip: false,
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