import { Typography } from "@material-ui/core";
import { StatementHeader, StatementNav, TransactionHeader } from "../../components";

export function StatementLayout(props) {
  return (
    <div className="container-fixed" style={{ maxHeight: "100vh" }}>
      < StatementHeader title={props.title}/>
      < StatementNav />
      {<props.children></props.children>}
    </div>
  );
}
