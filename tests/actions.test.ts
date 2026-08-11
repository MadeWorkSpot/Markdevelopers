import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "mock-session" }),
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/data", () => ({
  readData: vi.fn(),
  writeData: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => ({
  adminAuth: {
    verifySessionCookie: vi
      .fn()
      .mockResolvedValue({ sub: "mock-user", email: "admin@example.com" }),
  },
  adminDb: {
    collection: vi.fn(),
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  getClientIpFromHeaders: vi.fn().mockResolvedValue("127.0.0.1"),
}));

vi.mock("@/lib/auth", () => ({
  clearAuthCookies: vi.fn(),
  assertAdminEmail: vi.fn(),
  isAdminEmail: vi.fn().mockReturnValue(true),
  getCookieOptions: vi.fn().mockReturnValue({
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  }),
}));

import { readData, writeData } from "@/lib/data";
import {
  addArrayItem,
  updateArrayItem,
  deleteArrayItem,
  reorderArray,
  saveContent,
} from "@/actions";

function mockData(key: string, arr: unknown[]) {
  vi.mocked(readData).mockResolvedValue({ [key]: arr } as never);
}

function mockEmptyData() {
  vi.mocked(readData).mockResolvedValue({} as never);
}

describe("addArrayItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds an item to the array", async () => {
    mockData("images", [{ src: "old.jpg" }]);
    const item = { src: "new.jpg", alt: "New" };

    const result = await addArrayItem("gallery", "images", item);

    expect(result).toEqual({ success: true });
    expect(writeData).toHaveBeenCalledWith("gallery", {
      images: [{ src: "old.jpg" }, { src: "new.jpg", alt: "New" }],
    });
  });

  it("adds to an empty array", async () => {
    mockData("images", []);
    const item = { src: "only.jpg" };

    const result = await addArrayItem("gallery", "images", item);

    expect(result).toEqual({ success: true });
    expect(writeData).toHaveBeenCalledWith("gallery", {
      images: [{ src: "only.jpg" }],
    });
  });

  it("creates the array if key does not exist", async () => {
    mockEmptyData();
    const item = { src: "new.jpg" };

    const result = await addArrayItem("gallery", "images", item);

    expect(result).toEqual({ success: true });
  });

  it("rejects invalid content type", async () => {
    const result = await addArrayItem("invalid-type", "images", {});

    expect(result).toEqual({ success: false, error: "Invalid content type" });
    expect(writeData).not.toHaveBeenCalled();
  });

  it("rejects oversized item", async () => {
    const largeItem = { data: "x".repeat(2_000_000) };

    const result = await addArrayItem("gallery", "images", largeItem);

    expect(result).toEqual({ success: false, error: expect.stringContaining("large") });
    expect(writeData).not.toHaveBeenCalled();
  });
});

describe("updateArrayItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates an item at the given index", async () => {
    mockData("images", [{ src: "old.jpg" }, { src: "keep.jpg" }]);
    const updated = { src: "new.jpg", alt: "Updated" };

    const result = await updateArrayItem("gallery", "images", 0, updated);

    expect(result).toEqual({ success: true });
    expect(writeData).toHaveBeenCalledWith("gallery", {
      images: [{ src: "new.jpg", alt: "Updated" }, { src: "keep.jpg" }],
    });
  });

  it("rejects index out of bounds (negative)", async () => {
    mockData("images", [{ src: "a.jpg" }]);

    const result = await updateArrayItem("gallery", "images", -1, {});

    expect(result).toEqual({ success: false, error: "Index out of bounds" });
    expect(writeData).not.toHaveBeenCalled();
  });

  it("rejects index out of bounds (too high)", async () => {
    mockData("images", [{ src: "a.jpg" }]);

    const result = await updateArrayItem("gallery", "images", 5, {});

    expect(result).toEqual({ success: false, error: "Index out of bounds" });
    expect(writeData).not.toHaveBeenCalled();
  });

  it("rejects invalid content type", async () => {
    const result = await updateArrayItem("invalid-type", "images", 0, {});

    expect(result).toEqual({ success: false, error: "Invalid content type" });
    expect(writeData).not.toHaveBeenCalled();
  });

  it("rejects oversized item", async () => {
    mockData("images", [{ src: "a.jpg" }]);
    const largeItem = { data: "x".repeat(2_000_000) };

    const result = await updateArrayItem("gallery", "images", 0, largeItem);

    expect(result).toEqual({ success: false, error: expect.stringContaining("large") });
    expect(writeData).not.toHaveBeenCalled();
  });

  it("creates the array if key does not exist and rejects", async () => {
    mockEmptyData();

    const result = await updateArrayItem("gallery", "images", 0, {});

    expect(result).toEqual({ success: false, error: "Index out of bounds" });
  });
});

describe("deleteArrayItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes an item at the given index", async () => {
    mockData("images", [{ src: "a.jpg" }, { src: "b.jpg" }, { src: "c.jpg" }]);

    const result = await deleteArrayItem("gallery", "images", 1);

    expect(result).toEqual({ success: true });
    expect(writeData).toHaveBeenCalledWith("gallery", {
      images: [{ src: "a.jpg" }, { src: "c.jpg" }],
    });
  });

  it("deletes the only item", async () => {
    mockData("images", [{ src: "only.jpg" }]);

    const result = await deleteArrayItem("gallery", "images", 0);

    expect(result).toEqual({ success: true });
    expect(writeData).toHaveBeenCalledWith("gallery", {
      images: [],
    });
  });

  it("handles empty array gracefully", async () => {
    mockData("images", []);

    const result = await deleteArrayItem("gallery", "images", 0);

    expect(result).toEqual({ success: true });
    expect(writeData).toHaveBeenCalled();
  });

  it("rejects invalid content type", async () => {
    const result = await deleteArrayItem("invalid-type", "images", 0);

    expect(result).toEqual({ success: false, error: "Invalid content type" });
    expect(writeData).not.toHaveBeenCalled();
  });
});

describe("reorderArray", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reorders items moving forward", async () => {
    mockData("images", [
      { src: "a.jpg" }, { src: "b.jpg" }, { src: "c.jpg" },
    ]);

    const result = await reorderArray("gallery", "images", 0, 2);

    expect(result).toEqual({ success: true });
    expect(writeData).toHaveBeenCalledWith("gallery", {
      images: [{ src: "b.jpg" }, { src: "c.jpg" }, { src: "a.jpg" }],
    });
  });

  it("reorders items moving backward", async () => {
    mockData("images", [
      { src: "a.jpg" }, { src: "b.jpg" }, { src: "c.jpg" },
    ]);

    const result = await reorderArray("gallery", "images", 2, 0);

    expect(result).toEqual({ success: true });
    expect(writeData).toHaveBeenCalledWith("gallery", {
      images: [{ src: "c.jpg" }, { src: "a.jpg" }, { src: "b.jpg" }],
    });
  });

  it("rejects fromIndex out of bounds (negative)", async () => {
    mockData("images", [{ src: "a.jpg" }]);

    const result = await reorderArray("gallery", "images", -1, 0);

    expect(result).toEqual({ success: false, error: "Index out of bounds" });
    expect(writeData).not.toHaveBeenCalled();
  });

  it("rejects fromIndex out of bounds (too high)", async () => {
    mockData("images", [{ src: "a.jpg" }]);

    const result = await reorderArray("gallery", "images", 5, 0);

    expect(result).toEqual({ success: false, error: "Index out of bounds" });
    expect(writeData).not.toHaveBeenCalled();
  });

  it("rejects toIndex out of bounds", async () => {
    mockData("images", [{ src: "a.jpg" }, { src: "b.jpg" }]);

    const result = await reorderArray("gallery", "images", 0, 5);

    expect(result).toEqual({ success: false, error: "Index out of bounds" });
    expect(writeData).not.toHaveBeenCalled();
  });

  it("rejects invalid content type", async () => {
    const result = await reorderArray("invalid-type", "images", 0, 1);

    expect(result).toEqual({ success: false, error: "Invalid content type" });
    expect(writeData).not.toHaveBeenCalled();
  });

  it("handles reorder at same index (no-op)", async () => {
    mockData("images", [{ src: "a.jpg" }, { src: "b.jpg" }]);

    const result = await reorderArray("gallery", "images", 0, 0);

    expect(result).toEqual({ success: true });
    expect(writeData).toHaveBeenCalled();
  });
});

describe("saveContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves and merges content", async () => {
    vi.mocked(readData).mockResolvedValue({
      pageLabel: "Old Label",
      pageHeading: "Old Heading",
      images: [{ src: "old.jpg" }],
    } as never);

    const result = await saveContent("gallery", {
      pageLabel: "New Label",
      pageHeading: "New Heading",
    });

    expect(result).toEqual({ success: true });
    expect(writeData).toHaveBeenCalledWith("gallery", {
      pageLabel: "New Label",
      pageHeading: "New Heading",
      images: [{ src: "old.jpg" }],
    });
  });

  it("rejects invalid content type", async () => {
    const result = await saveContent("invalid-type", {});

    expect(result).toEqual({ success: false, error: "Invalid content type" });
    expect(writeData).not.toHaveBeenCalled();
  });

  it("rejects oversized content", async () => {
    const largeData = { data: "x".repeat(2_000_000) };

    const result = await saveContent("gallery", largeData);

    expect(result).toEqual({ success: false, error: expect.stringContaining("large") });
    expect(writeData).not.toHaveBeenCalled();
  });
});
