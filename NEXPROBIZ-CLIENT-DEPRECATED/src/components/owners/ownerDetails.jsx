import { useAxios } from "../../hooks/axios";

export function OwnerDetails(props) {
  const [data, loading, error] = useAxios({ url: "owners" });
  console.log(data);

  return (
    <>
      {!loading &&  data && (
        <>
          <div className="container">
            <div className="row">
              <div className="col-md-2">Name</div>
              <div className="col-md-10">{data?.name}</div>
            </div>
            <div className="row">
              <div className="col-md-2">Email</div>
              <div className="col-md-10">{data?.email}</div>
            </div>
            <div className="row">
              <div className="col-md-2">Phone</div>
              <div className="col-md-10">{data?.phone}</div>
            </div>
            <div className="row">
              <div className="col-md-2">Address</div>
              <div className="col-md-10">{`${data?.address?.street} ${data?.address?.city} ${data?.address?.countryCode}`}</div>
            </div>
            <div className="row">
              <div className="col-md-2">Zip Code</div>
              <div className="col-md-10">{data?.address?.zip}</div>
            </div>
            <div className="row">
              <div className="col-md-2">Ownership Percentage</div>
              <div className="col-md-10">{`${data?.owner_ship_percentage || '100'}%`}</div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
