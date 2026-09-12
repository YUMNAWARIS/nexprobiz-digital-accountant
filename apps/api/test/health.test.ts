import { createHarness, type Harness } from "./setup/harness";

describe("§48 health endpoints", () => {
  let h: Harness;
  beforeAll(async () => {
    h = await createHarness();
  });
  afterAll(() => h.close());

  it("GET /health returns ok + version", async () => {
    const r = await h.http.get("/health");
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ status: "ok", version: expect.any(String) });
  });
  it("GET /health/ready checks postgres and blob storage", async () => {
    const r = await h.http.get("/health/ready");
    expect(r.status).toBe(200);
    expect(r.body.checks).toEqual({ postgres: "ok", blobStorage: "ok" });
  });
  it("§18: unknown route returns the error contract with requestId", async () => {
    const r = await h.http
      .get("/api/v1/does-not-exist")
      .set("x-request-id", "req-test-12345");
    expect(r.status).toBe(404);
    expect(r.body).toEqual({
      status: 404,
      code: "NOT_FOUND",
      message: expect.any(String),
      requestId: "req-test-12345",
    });
    expect(r.headers["x-request-id"]).toBe("req-test-12345");
  });
  it("§18: malformed JSON is a 400 VALIDATION_FAILED", async () => {
    const r = await h.http
      .post("/api/v1/anything")
      .set("content-type", "application/json")
      .send("{bad");
    expect(r.status).toBe(400);
    expect(r.body.code).toBe("VALIDATION_FAILED");
  });
});
