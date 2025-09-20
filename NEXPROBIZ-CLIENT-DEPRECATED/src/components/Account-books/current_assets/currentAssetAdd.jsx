import { Button, ButtonGroup, FormLabel } from "@material-ui/core";
import axios from "axios";
import { Field, Formik } from "formik";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import config from "../../../configs/config";

export function CurrentAssetsAdd(props) {
  const navigate = useNavigate();
  const initialData = {
    account_name: undefined,
    type: undefined,
    total_cost: 0,
    // data: {},
    notes: "",
  };
  const assetStructure = yup.object().shape({
    account_name: yup.string().required("Please provide an account."),
    type: yup.string().nullable(),
    total_cost: yup.number().min(0).required("Please enter a valid total cost."),
    data: yup.object().nullable(),
    notes: yup.string().nullable(),
  });
  const onSubmit = async (values) => {
    const payload = {
      ...values,
    };
    const result = await axios.post(
      `${config.REACT_BASE_URL}/account-books/current-assets`,
      payload
    );
    navigate("/account-books/current-assets");
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
            <div className="col-md-5 p-3">
              <h6 className="m-1">Details for Current Assets</h6>
              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label htmlFor="account_name" className="form-label m-2 col-sm-4">
                  Account
                </label>
                <Field
                  type="text"
                  name="account_name"
                  className="form-control-sm col-sm-7"
                  placeholder="Enter account"
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
                <label htmlFor="type" className="form-label m-2 col-sm-4">
                  Type
                </label>
                <Field
                  type="text"
                  name="type"
                  className="form-control-sm col-sm-7"
                  placeholder="Enter type"
                />
                {frm.errors.type && frm.touched.type && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.type}
                  </div>
                )}
              </div>
              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label
                  htmlFor="total_cost"
                  className="form-label m-2 col-sm-4"
                >
                  Total Cost
                </label>
                <Field
                  required={true}
                  type="number"
                  name="total_cost"
                  className="form-control-sm col-sm-7"
                  placeholder="Enter total cost"
                />
                {frm.errors.total_cost && frm.touched.total_cost && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.total_cost}
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
                navigate("/account-books/current-assets");
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