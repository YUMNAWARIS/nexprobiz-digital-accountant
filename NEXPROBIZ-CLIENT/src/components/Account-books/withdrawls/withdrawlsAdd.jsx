import { Button, ButtonGroup, FormLabel } from "@material-ui/core";
import axios from "axios";
import { Field, Formik } from "formik";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import config from "../../../configs/config";

export function WithdrawlAdd(props) {
  const navigate = useNavigate();
  const initialData = {
    account_name: undefined,
    amount: 0.00,
  };
  const assetStructure = yup.object().shape({
    account_name: yup
      .string()
      .required("Please provide a name for the asset.")
      .matches(/^[a-zA-Z0-9 ]*$/, "Name must be alphanumeric"),
    amount: yup
      .number()
      .min(0.0)
      .required("Please enter a withdrawl amount."),
  });
  const onSubmit = async (values) => {
    const payload = {
      ...values,
    };
    const result = await axios.post(
      `${config.REACT_BASE_URL}/account-books/withdrawls`,
      payload
    );
    navigate("/account-books/withdrawls");
  };
  return (
    <Formik
      enableReinitialize={true}
      initialValues={initialData}
      validationSchema={assetStructure}
      onSubmit={(values) => onSubmit(values)}
    >
      {(frm) => (
        <>
          <fieldset className="row no-gutters">
            <div className="col-md-7 p5-3">
              <h6 className="m-1">New Owner's Withdrawl Account</h6>
              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label htmlFor="account_name" className="form-label m-2 col-sm-5">
                  Account Name
                </label>
                <Field
                  type="text"
                  name="account_name"
                  className="form-control-sm col-sm-6"
                  placeholder="Enter account name for withdrawl"
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
                <label
                  htmlFor="amount"
                  className="form-label m-2 col-sm-5"
                >
                  Amount Withdrawl
                </label>
                <Field
                  required={true}
                  type="number"
                  name="amount"
                  className="form-control-sm col-sm-6"
                  placeholder="Enter cost"
                />
                {frm.errors.amount && frm.touched.amount && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.amount}
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
              type="submit"
              onClick={frm.handleSubmit}
            >
              Create
            </Button>
            <Button
              className="m-2"
              variant="outlined"
              color="error"
              onClick={() => {
                navigate("/account-books/withdrawls");
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
export default WithdrawlAdd;
