import { describe, it, expect, vi, beforeAll } from "vitest";

type ReadDataFn = (file: string) => Promise<Record<string, unknown>>;
let readData: ReadDataFn;

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "test-project");
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "test-api-key");
  const mod = await import("@/lib/data");
  readData = mod.readData as unknown as ReadDataFn;
  vi.stubGlobal("fetch", vi.fn());
});

describe("readData", () => {
  it("returns empty object on 404", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(null, { status: 404 }),
    );
    const result = await readData("about");
    expect(result).toEqual({});
  });

  it("returns empty object on non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(null, { status: 500 }),
    );
    const result = await readData("about");
    expect(result).toEqual({});
  });

  it("returns empty object when fetch throws", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network error"));
    const result = await readData("about");
    expect(result).toEqual({});
  });

  it("parses a flat document with string and number fields", async () => {
    const body = {
      fields: {
        title: { stringValue: "Hello" },
        count: { integerValue: "42" },
      },
    };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(body), { status: 200 }),
    );
    const result = await readData("about");
    expect(result).toEqual({ title: "Hello", count: 42 });
  });

  it("parses a document with boolean and null fields", async () => {
    const body = {
      fields: {
        active: { booleanValue: true },
        deleted: { nullValue: null },
      },
    };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(body), { status: 200 }),
    );
    const result = await readData("about");
    expect(result).toEqual({ active: true, deleted: null });
  });

  it("parses nested mapValue", async () => {
    const body = {
      fields: {
        hero: {
          mapValue: {
            fields: {
              heading: { stringValue: "Welcome" },
              visible: { booleanValue: true },
            },
          },
        },
      },
    };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(body), { status: 200 }),
    );
    const result = await readData("about");
    expect(result).toEqual({ hero: { heading: "Welcome", visible: true } });
  });

  it("parses arrayValue", async () => {
    const body = {
      fields: {
        tags: {
          arrayValue: {
            values: [
              { stringValue: "a" },
              { stringValue: "b" },
            ],
          },
        },
      },
    };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(body), { status: 200 }),
    );
    const result = await readData("about");
    expect(result).toEqual({ tags: ["a", "b"] });
  });

  it("parses doubleValue", async () => {
    const body = {
      fields: {
        rating: { doubleValue: 4.5 },
      },
    };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(body), { status: 200 }),
    );
    const result = await readData("about");
    expect(result).toEqual({ rating: 4.5 });
  });

  it("returns empty object when document has no fields", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 }),
    );
    const result = await readData("about");
    expect(result).toEqual({});
  });

  it("calls the correct Firestore REST URL", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ fields: { x: { stringValue: "y" } } }), { status: 200 }),
    );
    await readData("site");
    expect(fetch).toHaveBeenCalledWith(
      "https://firestore.googleapis.com/v1/projects/test-project/databases/(default)/documents/content/site?key=test-api-key",
    );
  });
});
