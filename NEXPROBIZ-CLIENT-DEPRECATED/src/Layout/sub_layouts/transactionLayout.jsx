import { Typography } from "@material-ui/core";
import { TransactionHeader } from "../../components";

export function TransactionLayout(props) {
  return (
    <div className="container-fixed" style={{ maxHeight: "100vh" }}>
      <TransactionHeader  title={props.title}/>
      {<props.children></props.children>}
    </div>
  );
}
