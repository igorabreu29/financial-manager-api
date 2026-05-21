import { describe, expect, it } from "vitest";
import { getRequestId, requestContext } from "./request-context.ts";

describe("requestContext", () => {
  it("returns undefined when called outside a context", () => {
    expect(getRequestId()).toBeUndefined();
  });

  it("returns the requestId when called inside a context", () => {
    let result: string | undefined;

    requestContext.run({ requestId: "req-abc-123" }, () => {
      result = getRequestId();
    });

    expect(result).toBe("req-abc-123");
  });

  it("returns undefined after the context run completes", () => {
    requestContext.run({ requestId: "req-xyz" }, () => {});
    expect(getRequestId()).toBeUndefined();
  });
});
