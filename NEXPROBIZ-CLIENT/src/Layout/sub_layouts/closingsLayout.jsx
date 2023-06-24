import { ClosingHeader } from "../../components";

export function ClosingsLayout(props) {
  return (
    <div className="container-fixed" style={{ maxHeight: "100vh" }}>
      
      <ClosingHeader title={props.title}/>

      {<props.children></props.children>}
    </div>
  );
}
