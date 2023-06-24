import { Button, ButtonGroup } from "@material-ui/core";
import axios from "axios";
import { Field, Formik } from "formik";
import _ from "lodash";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import config from "../../../configs/config";

const account_type = {
  UNEARNED_REVENUE: "UNEARNED_REVENUE",
  ACCRUED_EXPENSE: "ACCRUED_EXPENSE",
  OTHERS: "OTHERS",
};

export function LiabilitiesAdd(props) {
  const navigate = useNavigate();
  const initialData = {
    account: "",
    description: "",
    type: account_type.OTHERS,
    total_amount: 0,
  };

  const LiabilitySchema = yup.object().shape({
    account: yup.string().required("Please provide an account."),
    description: yup.string().nullable(),
    type: yup.string().required(),
    total_amount: yup.number().min(0).required("Please enter a valid amount."),
    notes: yup.string(),
  });

  const onSubmit = async (values) => {
    console.log(values);
    const payload = {
      account: values.account,
      description: values.description,
      amount_due: values.total_amount,
      type: values.type,
      total_amount: values.total_amount,
    };
    const result = await axios.post(
      `${config.REACT_BASE_URL}/account-books/liabilities`,
      payload
    );
    navigate("/account-books/liabilities");
  };
  return (
    <Formik
      enableReinitialize={true}
      initialValues={initialData}
      validationSchema={LiabilitySchema}
      onSubmit={(values) => onSubmit(values)}
    >
      {(frm) => (
        <>
          <fieldset className="row no-gutters">
            <div className="col-lg-8 p-3">
              <h6 className="m-1">Add new Liability Account</h6>
              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label htmlFor="account" className="form-label m-2 col-sm-4">
                  Account
                </label>
                <Field
                  type="text"
                  name="account"
                  className="form-control-sm col-sm-7"
                  placeholder="Enter account"
                />
                {frm.errors.account && frm.touched.account && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.account}
                  </div>
                )}
              </div>
              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label
                  htmlFor="description"
                  className="form-label m-2 col-sm-4"
                >
                  Description
                </label>
                <Field
                  type="text"
                  name="description"
                  className="form-control-sm col-sm-7"
                  placeholder="Enter description"
                />
                {frm.errors.description && frm.touched.description && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.description}
                  </div>
                )}
              </div>

              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label
                  htmlFor="total_amount"
                  className="form-label m-2 col-sm-4"
                >
                  Total Amount
                </label>
                <Field
                  required={true}
                  type="number"
                  name="total_amount"
                  className="form-control-sm col-sm-7"
                  placeholder="Enter amount"
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
                <label htmlFor="type" className="form-label m-2 col-sm-4">
                  Type
                </label>
                <Field
                  as="select"
                  name="type"
                  className="form-control-sm col-sm-7"
                >
                  <option value={account_type.UNEARNED_REVENUE}>
                    Unearned Revenue
                  </option>
                  <option value={account_type.ACCRUED_EXPENSE}>
                    Accrued Expense
                  </option>
                  <option value={account_type.OTHERS}>
                    Others
                  </option>
                </Field>
                {frm.errors.type && frm.touched.type && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.type}
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
              onClick={frm.handleSubmit}
            >
              Create
            </Button>
            <Button
              className="m-2"
              variant="outlined"
              color="error"
              onClick={() => {
                navigate("/account-books/liabilities");
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
