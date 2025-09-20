import { Button, ButtonGroup } from "@material-ui/core";
import axios from "axios";
import { Field, Formik } from "formik";
import _ from "lodash";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import config from "../../../configs/config";

const receivable_type = {
  ON_ACCOUNT : 'ON_ACCOUNT',
  NOTE : 'NOTE'
}
export function ReceivableAdd(props) {
  const navigate = useNavigate();
  const initialData = {
    account: "",
    description: "",
    date_due: moment().format("YYYY-MM-DD"),
    type: receivable_type.ON_ACCOUNT,
    client_name: "",
    client_email: "",
    client_address: "", 
    client_description: "",
    total_amount: 0,
    is_received: false,
    notes: "",
  };

  const expenseSchema = yup.object().shape({
    account: yup.string().required("Please provide an account."),
    description: yup.string().nullable(),
    date_due: yup.date().required(),
    type: yup.string().required(),
    client_name: yup.string().nullable(),
    client_email: yup.string().email().nullable(),
    client_address: yup.string().nullable(), 
    client_description: yup.string().nullable(),
    total_amount: yup.number().min(0).required("Please enter a valid amount."),
    notes: yup.string()
  });

  const onSubmit = async (values) => {
    console.log(values);
    const payload = {
      account: values.account,
      description: values.description,
      amount_due: values.total_amount,
      date_due: moment(values.date_due).toISOString(),
      type: values.type,
      total_amount: values.total_amount,
      client_details: {
        name: values.client_name,
        email: values.client_email,
        address: values.client_address,
        description: values.client_description
      },
      is_received: false
    };
    const result = await axios.post(
      `${config.REACT_BASE_URL}/account-books/receivables`,
      payload
    );
    navigate("/account-books/receivables");
  };
  return (
    <Formik
      enableReinitialize={true}
      initialValues={initialData}
      validationSchema={expenseSchema}
      onSubmit={(values) => onSubmit(values)}
    >
      {(frm) => (
        <>
          <fieldset className="row no-gutters">
            <div className="col-lg-8 p-3">
              <h6 className="m-1">Add new Receivable Account</h6>
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
                  htmlFor="date_due"
                  className="form-label m-2 col-sm-4"
                >
                  Date Due
                </label>
                <Field
                  type="date"
                  name="date_due"
                  className="form-control-sm col-sm-7"
                />
                {frm.errors.date_due && frm.touched.date_due && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.date_due}
                  </div>
                )}
              </div>


              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label htmlFor="total_amount" className="form-label m-2 col-sm-4">
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
                    <label
                      htmlFor="type"
                      className="form-label m-2 col-sm-4"
                    >
                      Type
                    </label>
                    <Field
                    as="select"
                    name="type"
                    className="form-control-sm col-sm-7"
                  >
                    <option value={receivable_type.NOTE}>Note Payable</option>
                    <option value={receivable_type.ON_ACCOUNT}>Accunt Payable</option>
                  </Field>
                    {
                      frm.errors.type &&
                      frm.touched.type && (
                        <div
                          className="error"
                          style={{ color: "red", marginLeft: "7px" }}
                        >
                          {frm.errors.type}
                        </div>
                      )}
                  </div>

              <h6 className="m-1">Client's Detail</h6>
              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label htmlFor="account" className="form-label m-2 col-sm-4">
                  Name
                </label>
                <Field
                  type="text"
                  name="client_name"
                  className="form-control-sm col-sm-7"
                  placeholder="Enter client name"
                />
                {frm.errors.client_name && frm.touched.client_name && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.client_name}
                  </div>
                )}
              </div>

              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label htmlFor="account" className="form-label m-2 col-sm-4">
                  Email
                </label>
                <Field
                  type="email"
                  name="client_email"
                  className="form-control-sm col-sm-7"
                  placeholder="Enter email for client"
                />
                {frm.errors.client_email && frm.touched.client_email && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.client_email}
                  </div>
                )}
              </div>
              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label htmlFor="account" className="form-label m-2 col-sm-4">
                  Address
                </label>
                <Field
                  type="text"
                  name="client_address"
                  className="form-control-sm col-sm-7"
                  placeholder="Enter address"
                />
                {frm.errors.client_address && frm.touched.client_address && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.client_address}
                  </div>
                )}
              </div>


              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label htmlFor="account" className="form-label m-2 col-sm-4">
                  Further Details
                </label>
                <Field
                  type="textarea"
                  name="client_description"
                  className="form-control-sm col-sm-7"
                  placeholder="Enter further details"
                />
                {frm.errors.client_description && frm.touched.client_description && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.client_description}
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
                navigate("/account-books/receivables");
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