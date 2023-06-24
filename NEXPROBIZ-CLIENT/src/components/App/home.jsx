import { Typography } from "@material-ui/core";
import React from "react";

export function Home(props) {
  return (
    <div className="my-4" style={{ textAlign: "center", width:'50%', margin:'auto'}}>
      <div className="row">
          <Typography  variant={'h4'} style={{ textAlign: "center" }}>Welcome to NexProBiz</Typography>
      </div>
      <div className="row">
        <p
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "18px",
            lineHeight: "1.6",
          }}
        >
          Your trusted partner for financial ledger management software. We
          specialize in streamlining financial operations, ensuring accuracy,
          and providing control over your financial records.
        </p>
      </div>
      <div className="row">
        <p
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "18px",
            lineHeight: "1.6",
          }}
        >
          We prioritize security and compliance, employing advanced measures to
          protect your financial data. Our software seamlessly integrates with
          your existing systems, scales effortlessly, and offers dedicated
          customer support.
        </p>
        <p
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "18px",
            lineHeight: "1.6",
          }}
        >
          Join satisfied clients who have revolutionized their financial ledger
          management. Contact us today for a personalized demonstration and
          discover how our software simplifies processes and drives your
          business forward.
        </p>
      </div>
    </div>
  );
}
