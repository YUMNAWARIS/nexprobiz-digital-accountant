import { ReactTabulator, reactFormatter } from "react-tabulator";
import { useAxios } from "../../../hooks/axios";
import { useRef } from "react";
import { CircleLoader } from "react-spinners";
import moment from "moment/moment";
import { Visibility } from "@material-ui/icons";
import { useNavigate } from "react-router-dom";


export function AssetTables(props) {
  const navigate = useNavigate()
  const tableRef = useRef();
  const [data , loading , error] = useAxios({url: 'account-books/assets'})
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
  const AssetActions = (props) => {
    const data = props.cell._cell.row.data
    const onClickViewDetails = () => {
      navigate(`/account-books/assets/${data?.id}`)
    }
    return (
      <div>
        <span onClick={onClickViewDetails}>
          <Visibility />
          <span> View Details</span>
        </span>
      </div>
    )
  }
  const tableColumns = [
    {
      title: "Account",
      field: "name",
      width: 120,
      tooltip: true
    },
    {
      title: "Acqusition Date",
      field: "acquisition_date",
      width: 150,
      tooltip: true,
      mutator: (val) => {
        return moment(val).format('YYYY-MM-DD')
      }
    },
    {
      title: "Purchase Date",
      field: "purchase_date",
      width: 150,
      tooltip: true,
      mutator: (val) => {
        return moment(val).format('YYYY-MM-DD')
      }
    },
    {
      title: "Value",
      field: "purchasing_cost",
      width: 120,
      tooltip: true,
      mutator: (val) => {
        return `$${val}`
      }
    },
    {
      title: "Sold?",
      field: "isSold",
      width: 120,
      tooltip: true,
      mutator: (val) => {
        return val ? 'Sold' : 'Not Sold'
      }
    },
    {
      title: "Depreciation Applied",
      field: "depreciation",
      width: 190,
      tooltip: true,
      mutator: (val) => {
        return val ? 'Yes' : 'No'
      }
    },
    {
      title: "Actions",
      field: "custom",
      width: 100,
      tooltip: false,
      formatter: reactFormatter(<AssetActions />)
    },
  ]

  const tableOptions = {
    layout: 'fitColumns',
    rowClick: false
  }
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
