import { Button, ButtonGroup, FormLabel, Typography } from "@material-ui/core";
import axios from "axios";
import { Field, Formik } from "formik";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import config from "../../configs/config";
import { useState } from "react";
import { useAxios } from "../../hooks/axios";

const AccountTypes = {
  asset: "asset",
  current_assets: "current_assets",
  liability: "liability",
  payables: "payables",
  receivables: "receivables",
  expense: "expense",
  revenues: "revenues",
  owners_equity: "owners_equity",
  owners_withdrawl: "owners_withdrawl",
};

export function TransactionAdd(props) {
  const [debitAccounts, setDebitAccounts] = useState([]);
  const [creditAccounts, setCreditAccounts] = useState([]);

  const navigate = useNavigate();
  const initialData = {
    description: "",
    debit_account: "",
    debit_account_type: "",
    credit_account: "",
    credit_account_type: "",
    amount: 0.0,
    notes: "",
  };
  const transactionStructure = yup.object().shape({
    description: yup.string().required(),
    debit_account: yup.string().required(),
    debit_account_type: yup.string().required(),
    credit_account: yup.string().required(),
    credit_account_type: yup.string().required(),
    amount: yup.number().min(0.1).required(),
    notes: yup.string().nullable(),
  });
  const onSubmit = async (values) => {
    const payload = {
      description: values.description,
      debit: {
        id: values.debit_account,
        type: values.debit_account_type,
      },
      credit: {
        id: values.credit_account,
        type: values.credit_account_type,
      },
      amount: Number(values.amount ?? 0),
      notes: values.notes,
    };
    console.log(payload);
    const result = await axios.post(
      `${config.REACT_BASE_URL}/transactions`,
      payload
    );
    navigate("/transactions");
  };

  const onChangeDebitAccountType = async (value, frm) => {
    const data = await axios.get(
      `${config.REACT_BASE_URL}/transactions?account_type=${value}`
    );
    setDebitAccounts(data.data);
    frm.setFieldValue("debit_account_type", AccountTypes[value]);
    const firstAccount = data.data ? data.data[0]?.id : "";
    frm.setFieldValue("debit_account", firstAccount);
  };
  const onChangeCreditAccountType = async (value, frm) => {
    const data = await axios.get(
      `${config.REACT_BASE_URL}/transactions?account_type=${value}`
    );
    setCreditAccounts(data.data);
    frm.setFieldValue("credit_account_type", AccountTypes[value]);
    const firstAccount = data.data ? data.data[0]?.id : "";
    frm.setFieldValue("credit_account", firstAccount);
  };

  return (
    <Formik
      enableReinitialize={true}
      initialValues={initialData}
      validationSchema={transactionStructure}
      onSubmit={(values) => onSubmit(values)}
    >
      {(frm) => (
        <>
          <fieldset className="container" style={{border: '2px solid black'}}>
            <div className="row" style={{borderBottom: "2px solid black"}}>
              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label
                  htmlFor="description"
                  className="form-label m-2 col-sm-2"
                >
                  Description
                </label>
                <Field
                  type="text"
                  name="description"
                  className="form-control-sm col-sm-9"
                  placeholder="Enter description for transactions"
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
                <label htmlFor="amount" className="form-label m-2 col-sm-2">
                  Amount
                </label>
                <Field
                  type="number"
                  name="amount"
                  className="form-control-sm col-sm-9"
                  placeholder="Enter amount for transactions"
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

            <div className="row no-gutters">
              <div
                className="col-md-6 p-4"
                style={{ borderRight: "2px solid black" }}
              >
                <h6 className="m-1">Debit Details</h6>
                <br />

                <div className="mb-1 d-sm-flex align-items-baseline row">
                  <label
                    htmlFor="debit_account_type"
                    className="form-label m-2 col-sm-4"
                  >
                    Account Type
                  </label>
                  <Field
                    as="select"
                    name="debit_account_type"
                    className="form-control-sm col-sm-7"
                    placeholder="Account Type for Debit"
                    onChange={(event) =>
                      onChangeDebitAccountType(event.target.value, frm)
                    }
                    value={frm.values.debit_account_type}
                  >
                    <option value={""}></option>
                    {Object.keys(AccountTypes).map((key) => {
                      return <option value={AccountTypes[key]}>{key}</option>;
                    })}
                  </Field>
                  {frm.errors.debit_account_type &&
                    frm.touched.debit_account_type && (
                      <div
                        className="error"
                        style={{ color: "red", marginLeft: "7px" }}
                      >
                        {frm.errors.debit_account_type}
                      </div>
                    )}
                </div>

                <div className="mb-1 d-sm-flex align-items-baseline row">
                  <label
                    htmlFor="debit_account"
                    className="form-label m-2 col-sm-4"
                  >
                    Account
                  </label>
                  <Field
                    as="select"
                    name="debit_account"
                    className="form-control-sm col-sm-7"
                    placeholder="Account Type for Debit"
                    value={frm.values.debit_account}
                    onChange={(event) =>
                      frm.setFieldValue(event.target.name, event.target.value)
                    }
                  >
                    <option value={""}></option>

                    {debitAccounts
                      ? debitAccounts.map((account) => {
                          return (
                            <option value={account.id}>
                              {account.name ||
                                account.account ||
                                account.account_name}
                            </option>
                          );
                        })
                      : ""}
                  </Field>
                  {frm.errors.debit_account && frm.touched.debit_account && (
                    <div
                      className="error"
                      style={{ color: "red", marginLeft: "7px" }}
                    >
                      {frm.errors.debit_account}
                    </div>
                  )}
                </div>
                <br />
                <div
                  style={{
                    border: "2px solid black",
                    padding: "5px",
                    minHeight: "100px",
                    maxHeight: "100px",
                    overflow: "scroll",
                  }}
                >
                  <p name="debit_account">
                    {JSON.stringify(
                      debitAccounts.find((account) =>
                        frm.values.debit_account.includes(account.id)
                      ),
                      "",
                      3
                    )}
                  </p>
                </div>
              </div>
              <div className="col-md-6 p-4">
                <h6 className="m-1">Credit Details</h6>
                <br />

                <div className="mb-1 d-sm-flex align-items-baseline row">
                  <label
                    htmlFor="credit_account_type"
                    className="form-label m-2 col-sm-4"
                  >
                    Account Type
                  </label>
                  <Field
                    as="select"
                    name="credit_account_type"
                    className="form-control-sm col-sm-7"
                    placeholder="Account Type for Debit"
                    onChange={(event) =>
                      onChangeCreditAccountType(event.target.value, frm)
                    }
                    value={frm.values.credit_account_type}
                  >
                    <option value={""}></option>

                    {Object.keys(AccountTypes).map((key) => {
                      return <option value={AccountTypes[key]}>{key}</option>;
                    })}
                  </Field>
                  {frm.errors.credit_account_type &&
                    frm.touched.credit_account_type && (
                      <div
                        className="error"
                        style={{ color: "red", marginLeft: "7px" }}
                      >
                        {frm.errors.credit_account_type}
                      </div>
                    )}
                </div>

                <div className="mb-1 d-sm-flex align-items-baseline row">
                  <label
                    htmlFor="credit_account"
                    className="form-label m-2 col-sm-4"
                  >
                    Account
                  </label>

                  <Field
                    as="select"
                    name="credit_account"
                    className="form-control-sm col-sm-7"
                    placeholder="Account Type for credit"
                    value={frm.values.credit_account}
                    onChange={(event) =>
                      frm.setFieldValue(event.target.name, event.target.value)
                    }
                  >
                    <option value={""}></option>

                    {creditAccounts
                      ? creditAccounts.map((account) => {
                          return (
                            <option value={account.id}>
                              {account.name ||
                                account.account ||
                                account.account_name}
                            </option>
                          );
                        })
                      : ""}
                  </Field>
                  {frm.errors.credit_account && frm.touched.credit_account && (
                    <div
                      className="error"
                      style={{ color: "red", marginLeft: "7px" }}
                    >
                      {frm.errors.credit_account}
                    </div>
                  )}
                </div>
                <br />
                <div
                  style={{
                    border: "2px solid black",
                    padding: "5px",
                    minHeight: "100px",
                    maxHeight: "100px",
                    overflow: "scroll",
                  }}
                >
                  <p name="credit_account">
                    {JSON.stringify(
                      creditAccounts.find((account) =>
                        frm.values.credit_account.includes(account.id)
                      ),
                      "",
                      3
                    )}
                  </p>
                </div>
              </div>
            </div>
          </fieldset>
          <ButtonGroup className="d-flex justify-content-center">
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
                navigate("/transactions");
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
