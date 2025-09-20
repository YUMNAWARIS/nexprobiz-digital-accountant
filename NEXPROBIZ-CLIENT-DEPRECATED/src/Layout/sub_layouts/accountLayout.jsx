import { AccountBookNav } from "../../components/Account-books/main/AccountBookNav";

export function AccountLayout(props) {
  return (
    <div className="container-fluid" style={{ maxHeight: "100vh" }}>
      <div className="row justify-content-center h-100">
        <div className="col-md-2" style={{ padding: "0px" , height: '100%'}}>
          <AccountBookNav />
        </div>
        <div className="col-md-10" >
          {<props.children />}
        </div>
      </div>
    </div>
  );
}
