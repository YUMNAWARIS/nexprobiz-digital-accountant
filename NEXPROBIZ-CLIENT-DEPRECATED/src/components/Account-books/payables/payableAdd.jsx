import { Button, ButtonGroup } from "@material-ui/core";
import axios from "axios";
import { Field, Formik } from "formik";
import _ from "lodash";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import config from "../../../configs/config";

const payable_types = {
  ON_ACCOUNT : 'ON_ACCOUNT',
  NOTE : 'NOTE'
}
export function PayableAdd(props) {
  const navigate = useNavigate();
  const initialData = {
    account: "",
    description: "",
    date_due: moment().format("YYYY-MM-DD"),
    type: payable_types.ON_ACCOUNT,

    vendor_name: "",
    vendor_email: "",
    vendor_address: "", 
    vendor_description: "",

    total_amount: 0,
    
    is_paid: false,

    payment_method: "BANK_ACCOUNT",
    payment_status: "",
    payment_date: moment().format("YYYY-MM-DD"),

    notes: "",
  };

  const expenseSchema = yup.object().shape({
    account: yup.string().required("Please provide an account."),
    description: yup.string().nullable(),
    date_due: yup.date().required(),
    type: yup.string().required(),
    vendor_name: yup.string().nullable(),
    vendor_email: yup.string().email().nullable(),
    vendor_address: yup.string().nullable(), 
    vendor_description: yup.string().nullable(),
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
      vendor_details: {
        name: values.vendor_name,
        email: values.vendor_email,
        address: values.vendor_address,
        description: values.vendor_description
      },
      is_paid: false
    };
    const result = await axios.post(
      `${config.REACT_BASE_URL}/account-books/payables`,
      payload
    );
    navigate("/account-books/payables");
  };

  const onChangePaymentDetails = (values, frm) => {
    frm.setFieldValue("is_paid", !frm.values.is_paid);
    frm.setFieldValue("payment_detail", {
      payment_method: "",
      payment_status: "",
      payment_date: moment().format("YYYY-MM-DD"),
    });
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
              <h6 className="m-1">Add new Payable Account</h6>
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
                  Date Incurred
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
                    <option value={payable_types.NOTE}>Note Payable</option>
                    <option value={payable_types.ON_ACCOUNT}>Accunt Payable</option>
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

              <h6 className="m-1">Vendor's Detail</h6>
              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label htmlFor="account" className="form-label m-2 col-sm-4">
                  Name
                </label>
                <Field
                  type="text"
                  name="vendor_name"
                  className="form-control-sm col-sm-7"
                  placeholder="Enter vendor name"
                />
                {frm.errors.vendor_name && frm.touched.vendor_name && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.vendor_name}
                  </div>
                )}
              </div>

              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label htmlFor="account" className="form-label m-2 col-sm-4">
                  Email
                </label>
                <Field
                  type="email"
                  name="vendor_email"
                  className="form-control-sm col-sm-7"
                  placeholder="Enter email for vendor"
                />
                {frm.errors.vendor_email && frm.touched.vendor_email && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.vendor_email}
                  </div>
                )}
              </div>
              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label htmlFor="account" className="form-label m-2 col-sm-4">
                  Address
                </label>
                <Field
                  type="text"
                  name="vendor_address"
                  className="form-control-sm col-sm-7"
                  placeholder="Enter address"
                />
                {frm.errors.vendor_address && frm.touched.vendor_address && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.vendor_address}
                  </div>
                )}
              </div>


              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label htmlFor="account" className="form-label m-2 col-sm-4">
                  Further Details
                </label>
                <Field
                  type="textarea"
                  name="vendor_description"
                  className="form-control-sm col-sm-7"
                  placeholder="Enter further details"
                />
                {frm.errors.vendor_description && frm.touched.vendor_description && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.vendor_description}
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
                navigate("/account-books/payables");
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