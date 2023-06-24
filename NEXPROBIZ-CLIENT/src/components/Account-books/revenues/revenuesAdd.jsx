import { Button, ButtonGroup } from "@material-ui/core";
import axios from "axios";
import { Field, Formik } from "formik";
import _ from "lodash";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import config from "../../../configs/config";

export function RevenueAdd(props) {
  const navigate = useNavigate();
  const initialData = {
    account: "",
    description: "",
    date_received: moment().format("YYYY-MM-DD"),
    amount: 0,
    is_received: false,
    payment_method: "CASH",
    payment_status: "COMPLETE",
    payment_date: moment().format("YYYY-MM-DD"),
    notes: "",
  };

  const revenueSchema = yup.object().shape({
    account: yup.string().required("Please provide an account."),
    description: yup.string().nullable(),
    amount: yup.number().min(0).required("Please enter a valid amount."),
    is_received: yup.boolean().required(),
    payment_method: yup.string(),
    payment_status: yup.string(),
    payment_date: yup.date(),
    notes: yup.string()
  });

  const onSubmit = async (values) => {
    const payload = {
      account: values.account,
      description: values.description,
      amount: values.amount,
      is_received: values.is_received,
      date_received: moment().toISOString(),
      ...(values.is_received
        ? {
            payment_detail: {
              payment_method: values.payment_method,
              payment_status: values.payment_status,
              payment_date: moment(values.payment_date).toISOString(),
            },
          }
        : {}),
    };
    const result = await axios.post(
      `${config.REACT_BASE_URL}/account-books/revenues`,
      payload
    );
    navigate("/account-books/revenues");
  };

  const onChangePaymentDetails = (values, frm) => {
    frm.setFieldValue("is_received", !frm.values.is_received);
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
      validationSchema={revenueSchema}
      onSubmit={(values) => onSubmit(values)}
    >
      {(frm) => (
        <>
          <fieldset className="row no-gutters">
            <div className="col-lg-8 p-3">
              <h6 className="m-1">Add new Revenue</h6>
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
                  htmlFor="date_received"
                  className="form-label m-2 col-sm-4"
                >
                  Date Received
                </label>
                <Field
                  disabled
                  type="date"
                  name="date_received"
                  className="form-control-sm col-sm-7"
                />
                {frm.errors.date_received && frm.touched.date_received && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.date_received}
                  </div>
                )}
              </div>
              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label htmlFor="amount" className="form-label m-2 col-sm-4">
                  Amount
                </label>
                <Field
                  required={true}
                  type="number"
                  name="amount"
                  className="form-control-sm col-sm-7"
                  placeholder="Enter amount"
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
              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label htmlFor="is_received" className="m-2 col-lg-4 col-sm-5">
                  Is Recieved
                </label>
                <Field
                  type="checkbox"
                  name="is_received"
                  className="col-1"
                  onChange={(value) => {
                    onChangePaymentDetails(value, frm);
                  }}
                />
                {frm.errors.is_received && frm.touched.is_received && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.is_received}
                  </div>
                )}
              </div>
              {frm.values.is_received && (
                <>
                  <div className="mb-1 d-sm-flex align-items-baseline row">
                    <label
                      htmlFor="payment_method"
                      className="form-label m-2 col-sm-4"
                       >
                      Payment Method
                    </label>
                    <Field
                    as="select"
                    name="payment_method"
                    className="form-control-sm col-sm-7"
                  >
                    <option value="CASH">Cash</option>
                    <option value="ON_ACCOUNT">On Account</option>
                  </Field>
                    {
                      frm.errors.payment_method &&
                     
                      frm.touched.payment_method && (
                        <div
                          className="error"
                          style={{ color: "red", marginLeft: "7px" }}
                        >
                          {frm.errors.payment_method}
                        </div>
                      )}
                  </div>
                  <div className="mb-1 d-sm-flex align-items-baseline row">
                    <label
                      htmlFor="payment_status"
                      className="form-label m-2 col-sm-4"
                    >
                      Payment Statuses
                    </label>
                    <Field
                    as="select"
                    name="payment_status"
                    className="form-control-sm col-sm-7"
                  >
                    <option value="COMPLETE">Complete Payment</option>
                    <option value="INCOMPLETE">Incomplete Payment</option>
                    <option value="PARTIAL">Partial Payment</option>
                  </Field>
                    {
                      frm.errors.payment_status &&
                      frm.touched.payment_status && (
                        <div
                          className="error"
                          style={{ color: "red", marginLeft: "7px" }}
                        >
                          {frm.errors.payment_status}
                        </div>
                      )}
                  </div>
                  <div className="mb-1 d-sm-flex align-items-baseline row">
                    <label
                      htmlFor="payment_date"
                      className="form-label m-2 col-sm-4"
                    >
                      Payment Date
                    </label>
                    <Field
                      type="date"
                      name="payment_date"
                      className="form-control-sm col-sm-7"
                    />
                    {
                      frm.errors.payment_date &&
                      frm.touched.payment_date && (
                        <div
                          className="error"
                          style={{ color: "red", marginLeft: "7px" }}
                        >
                          {frm.errors.payment_date}
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
                </>
              )}
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
                navigate("/account-books/revenues");
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