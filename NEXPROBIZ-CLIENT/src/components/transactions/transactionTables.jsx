import { ReactTabulator, reactFormatter } from "react-tabulator";
import { useAxios } from "../../hooks/axios";
import { useRef } from "react";
import { CircleLoader } from "react-spinners";
import moment from "moment/moment";
import { Visibility } from "@material-ui/icons";
import { useNavigate } from "react-router-dom";


export function TransactionTables(props) {
  const navigate = useNavigate()
  const tableRef = useRef();
  const [data , loading , error] = useAxios({url: 'transactions/all'})
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
  const TransactionTableActions = (props) => {
    const data = props.cell._cell.row.data
    const onClickViewDetails = () => {
      navigate(`/transactions/${data?.id}`)
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
      title: "Date",
      field: "transaction_date",
      width: 120,
      tooltip: true,
      mutator: (val) => {
        return moment(val).format('Do MMM, YYYY')
      }    
    },
    {
      title: "ID",
      field: "internal_id",
      width: 200,
      tooltip: true, 
    },
    {
      title: "Amount",
      field: "amount",
      width: 100,
      tooltip: true, 
      mutator: (value) => value ? `$${value}` : '$0.00'
    },
    {
      title: "Debit Account Type",
      field: "debit.type",
      width: 200,
      tooltip: true,
    },
    {
      title: "Credit Account Type",
      field: "credit.type",
      width: 200,
      tooltip: true,
    },
    {
      title: "Description",
      field: "description",
      width: 350,
      tooltip: true,
    },
    {
      title: "Actions",
      field: "custom",
      width: 150,
      tooltip: false,
      formatter: reactFormatter(<TransactionTableActions />)
    },
  ]

  const tableOptions = {
    layout: 'fitColumns',
    rowClick: false
  }
  return (
    <div className="container-fluid">
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


