import { Button, ButtonGroup, FormLabel } from "@material-ui/core";
import axios from "axios";
import { Field, Formik } from "formik";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import config from "../../../configs/config";

export function EquityAdd(props) {
  const navigate = useNavigate();
  const initialData = {
    account_name: undefined,
    total_amount: 0,
    notes: "",
  };

  const equityStructure = yup.object().shape({
    account_name: yup
      .string()
      .required("Please provide an account name.")
      .matches(/^[a-zA-Z0-9 ]*$/, "Account name must be alphanumeric"),
    total_amount: yup.number().required("Please enter a valid total amount."),
    notes: yup.string().nullable(),
  });

  const onSubmit = async (values) => {
    console.log(values);
    const payload = {
      ...values,
    };
    const result = await axios.post(
      `${config.REACT_BASE_URL}/account-books/equity`,
      payload
    );
    navigate("/account-books/equity");
  };

  return (
    <Formik
      enableReinitialize={true}
      initialValues={initialData}
      validationSchema={equityStructure}
      onSubmit={(values) => onSubmit(values)}
    >
      {(frm) => (
        <>
          <fieldset className="row no-gutters">
            <div className="col-md-5 p-3">
              <h6 className="m-1">New Owner's Equity Account</h6>
              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label htmlFor="account_name" className="form-label m-2 col-sm-4">
                  Account Name
                </label>
                <Field
                  type="text"
                  name="account_name"
                  className="form-control-sm col-sm-7"
                  placeholder="Enter account name for asset"
                />
                {frm.errors.account_name && frm.touched.account_name && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.account_name}
                  </div>
                )}
              </div>
              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label htmlFor="total_amount" className="form-label m-2 col-sm-4">
                  Total Amount
                </label>
                <Field
                  type="number"
                  name="total_amount"
                  className="form-control-sm col-sm-7"
                  placeholder="Enter total amount"
                />
                {frm.errors.total_amount && frm.touched.total_amount && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.total_amount}
                  </div>
                )}
              </div>
              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label htmlFor="notes" className="form-label m-2 col-sm-4">
                  Notes
                </label>
                <textarea
                  name="notes"
                  className="form-control-sm col-sm-7"
                  placeholder="Enter notes"
                />
                {frm.errors.notes && frm.touched.notes && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.notes}
                  </div>
                )}
              </div>
            </div>
          </fieldset>
          <ButtonGroup>
            <Button
              className="m-2"
              variant="contained"
              color="primary"
              onClick={() => {
                console.log(frm);
                frm.handleSubmit()
              }}
            >
              Create
            </Button>
            <Button
              className="m-2"
              variant="outlined"
              color="error"
              onClick={() => {
                navigate("/account-books/equity");
              }}
            >
              Cancel
            </Button>
          </ButtonGroup>
        </>
      )}
    </Formik>
  );
}