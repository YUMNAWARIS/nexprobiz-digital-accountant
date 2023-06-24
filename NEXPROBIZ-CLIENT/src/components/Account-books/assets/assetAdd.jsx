import { Button, ButtonGroup, FormLabel } from "@material-ui/core";
import axios from "axios";
import { Field, Formik } from "formik";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import config from "../../../configs/config";

export function AssetAdd(props) {
  const navigate = useNavigate();
  const initialData = {
    name: undefined,
    details: undefined,
    acquisition_date: moment().format("YYYY-MM-DD"),
    purchase_date: moment().format("YYYY-MM-DD"),
    purchasing_cost: undefined,
    useful_life: 1,
    salvage_value: 0.0,
    depreciation_method: "LINEAR DEPRECIATION METHOD",
    adjustment_frequency: "YEARLY",
    notes: "",
    enableDepreciation: true,
  };
  const assetStructure = yup.object().shape({
    name: yup
      .string()
      .required("Please provide a name for the asset.")
      .matches(/^[a-zA-Z0-9 ]*$/, "Name must be alphanumeric"),
    details: yup.string().nullable(),
    acquisition_date: yup
      .date()
      .required(
        "Acquisition date must be a valid date and is a required field."
      ),
    purchase_date: yup
      .date()
      .required("Purchase date must be a valid date and is a required field."),
    purchasing_cost: yup
      .number()
      .min(0.0)
      .required("Please enter a valid purchasing cost."),
    enableDepreciation: yup.boolean().default(true),
    useful_life: yup.number().integer().min(1).default(1),
    salvage_value: yup.number().required().min(0.0).default(0),
    depreciation_method: yup.string().default("LINEAR DEPRECIATION METHOD"),
    adjustment_frequency: yup
      .string()
      .matches(/(WEEKLY|MONTHLY|YEARLY)/g)
      .required("Please select an adjustment frequency.")
      .default("YEARLY"),

    notes: yup.string().nullable(),
  });
  const onSubmit = async (values) => {
    const payload = {
      ...values,
      ...(values.purchase_date && {
        purchase_date: moment(values.purchase_date).toISOString(),
      }),
      ...(values.acquisition_date && {
        acquisition_date: moment(values.acquisition_date).toISOString(),
      }),
    };
    const result = await axios.post(
      `${config.REACT_BASE_URL}/account-books/assets`,
      payload
    );
    navigate("/account-books/assets");
  };
  const onChangeEnableDepreciation = ({ name, value }, frm) => {
    frm.setFieldValue("useful_life", 1);
    frm.setFieldValue("salvage_value", 0.0);
    frm.setFieldValue("adjustment_frequency", "YEARLY");
    frm.setFieldValue(name, !frm.values.enableDepreciation);
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
              <h6 className="m-1">Details for Assets</h6>
              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label htmlFor="name" className="form-label m-2 col-sm-4">
                  Name
                </label>
                <Field
                  type="text"
                  name="name"
                  className="form-control-sm col-sm-7"
                  placeholder="Enter name for asset"
                />
                {frm.errors.name && frm.touched.name && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.name}
                  </div>
                )}
              </div>
              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label
                  htmlFor="acquisition_date"
                  className="form-label m-2 col-sm-4"
                >
                  Acquisition Date
                </label>
                <Field
                  type="date"
                  name="acquisition_date"
                  className="form-control-sm col-sm-7"
                />
                {frm.errors.acquisition_date &&
                  frm.touched.acquisition_date && (
                    <div
                      className="error"
                      style={{ color: "red", marginLeft: "7px" }}
                    >
                      {frm.errors.acquisition_date}
                    </div>
                  )}
              </div>
              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label
                  htmlFor="purchase_date"
                  className="form-label m-2 col-sm-4"
                >
                  Purchase Date
                </label>
                <Field
                  type="date"
                  name="purchase_date"
                  className="form-control-sm col-sm-7"
                />
                {frm.errors.purchase_date && frm.touched.purchase_date && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.purchase_date}
                  </div>
                )}
              </div>
              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label
                  htmlFor="purchasing_cost"
                  className="form-label m-2 col-sm-4"
                >
                  Purchase Cost
                </label>
                <Field
                  required={true}
                  type="number"
                  name="purchasing_cost"
                  className="form-control-sm col-sm-7"
                  placeholder="Enter cost"
                />
                {frm.errors.purchasing_cost && frm.touched.purchasing_cost && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.purchasing_cost}
                  </div>
                )}
              </div>
              <div className="mb-1 d-sm-flex align-items-baseline row">
                <p style={{ fontSize: "10px", padding: "10px" }}>
                  <strong>
                    <i>
                      Note: The purchase cost will be treated as the historical
                      value for the asset. It will not change when the asset is
                      depreciated. Please enter this cost correctly for the
                      correct calculation of the depreciation expense.
                    </i>
                  </strong>
                </p>
              </div>
              <div className="mb-1 d-sm-flex align-items-baseline row">
                <label htmlFor="details" className="form-label m-2 col-sm-4">
                  Details
                </label>
                <textarea
                  name="details"
                  className="form-control-sm col-sm-7"
                  placeholder="Enter details for asset"
                />
                {frm.errors.details && frm.touched.details && (
                  <div
                    className="error"
                    style={{ color: "red", marginLeft: "7px" }}
                  >
                    {frm.errors.details}
                  </div>
                )}
              </div>
            </div>
            <div className="col-md-5 p-3">
              <h6 className="m-1">Depreciation Details</h6>
              <div className="m-3 d-sm-flex align-items-baseline row">
                <FormLabel className="col-lg-4 col-sm-4">
                  Enable Depreciation:
                </FormLabel>
                <Field
                  type="checkbox"
                  name="enableDepreciation"
                  className="col-1"
                  onChange={(event) =>
                    onChangeEnableDepreciation(event.target, frm)
                  }
                />
              </div>
              {frm.values.enableDepreciation && (
                <>
                  <p style={{ fontSize: "10px", padding: "10px" }}>
                    <strong>
                      <i>
                        Note: Please fill in these fields for assets on which
                        depreciation will be applied. Depreciation will be
                        calculated based on the following values using the
                        Linear Depreciation Method.
                      </i>
                    </strong>
                  </p>
                  <div className="mb-1 d-sm-flex align-items-baseline row">
                    <label
                      htmlFor="useful_life"
                      className="form-label m-2 col-sm-4"
                    >
                      Useful Life
                    </label>
                    <Field
                      readOnly={!frm.values.enableDepreciation}
                      type="number"
                      name="useful_life"
                      className="form-control-sm col-sm-7"
                      placeholder="Enter useful life for asset"
                    />
                    {frm.errors.useful_life && frm.touched.useful_life && (
                      <div
                        className="error"
                        style={{ color: "red", marginLeft: "7px" }}
                      >
                        {frm.errors.useful_life}
                      </div>
                    )}
                  </div>
                  <div className="mb-1 d-sm-flex align-items-baseline row">
                    <label
                      htmlFor="salvage_value"
                      className="form-label m-2 col-sm-4"
                    >
                      Salvage Value
                    </label>
                    <Field
                      readOnly={!frm.values.enableDepreciation}
                      type="number"
                      name="salvage_value"
                      className="form-control-sm col-sm-7"
                      placeholder="Enter salvage value for asset"
                    />
                    {frm.errors.salvage_value && frm.touched.salvage_value && (
                      <div
                        className="error"
                        style={{ color: "red", marginLeft: "7px" }}
                      >
                        {frm.errors.salvage_value}
                      </div>
                    )}
                  </div>
                  <div className="mb-1 d-sm-flex align-items-baseline row">
                    <label
                      htmlFor="depreciation_method"
                      className="form-label m-2 col-sm-4"
                    >
                      Depreciation Method
                    </label>
                    <Field
                      as="select"
                      name="depreciation_method"
                      className="form-control-sm col-sm-7"
                    >
                      <option value="LINEAR DEPRECIATION METHOD">
                        Linear Depreciation Method
                      </option>
                    </Field>
                    {frm.errors.depreciation_method &&
                      frm.touched.depreciation_method && (
                        <div
                          className="error"
                          style={{ color: "red", marginLeft: "7px" }}
                        >
                          {frm.errors.depreciation_method}
                        </div>
                      )}
                  </div>
                  <div className="mb-1 d-sm-flex align-items-baseline row">
                    <label
                      htmlFor="adjustment_frequency"
                      className="form-label m-2 col-sm-4"
                    >
                      Adjustment Frequency
                    </label>
                    <Field
                      as="select"
                      name="adjustment_frequency"
                      className="form-control-sm col-sm-7"
                    >                      
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                    </Field>
                    {frm.errors.adjustment_frequency &&
                      frm.touched.adjustment_frequency && (
                        <div
                          className="error"
                          style={{ color: "red", marginLeft: "7px" }}
                        >
                          {frm.errors.adjustment_frequency}
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
                navigate("/account-books/assets");
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

export default AssetAdd;
