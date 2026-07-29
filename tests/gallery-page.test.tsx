import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/data", () => ({
  readData: vi.fn(),
}));

vi.mock("@/components/admin/PageTextEditor", () => ({
  default: ({ title }: { title: string }) => <div data-testid="page-text-editor">{title}</div>,
}));

vi.mock("@/components/admin/ContentManager", () => ({
  default: ({ title, items }: { title: string; items: Record<string, unknown>[] }) => (
    <div data-testid="content-manager">
      <span>{title}</span>
      <span data-testid="item-count">{items.length}</span>
    </div>
  ),
}));

import { readData } from "@/lib/data";
import GalleryPage from "@/app/(admin)/admin/(protected)/dashboard/gallery/page";

const mockGalleryData = {
  pageLabel: "Gallery",
  pageHeading: "Photo Gallery",
  pageSubtitle: "Browse our work",
  images: [
    { type: "image", src: "https://example.com/img1.jpg", alt: "Photo 1" },
    { type: "image", src: "https://example.com/img2.jpg", alt: "Photo 2" },
    { type: "video", videoSrc: "https://example.com/vid1.mp4", alt: "Video 1" },
  ],
};

describe("Admin GalleryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders PageTextEditor and ContentManager", async () => {
    vi.mocked(readData).mockResolvedValue(mockGalleryData as never);
    const page = await GalleryPage();
    render(page);

    expect(screen.getByTestId("page-text-editor")).toBeDefined();
    expect(screen.getByTestId("content-manager")).toBeDefined();
  });

  it("passes correct title to ContentManager", async () => {
    vi.mocked(readData).mockResolvedValue(mockGalleryData as never);
    const page = await GalleryPage();
    render(page);

    expect(screen.getByTestId("content-manager").textContent).toContain("Gallery Items");
  });

  it("passes images array as items to ContentManager", async () => {
    vi.mocked(readData).mockResolvedValue(mockGalleryData as never);
    const page = await GalleryPage();
    render(page);

    expect(screen.getByTestId("item-count").textContent).toBe("3");
  });

  it("passes empty array when data.images is undefined", async () => {
    vi.mocked(readData).mockResolvedValue({
      pageLabel: "Gallery",
      pageHeading: "Photo Gallery",
      pageSubtitle: "Browse our work",
    } as never);
    const page = await GalleryPage();
    render(page);

    expect(screen.getByTestId("item-count").textContent).toBe("0");
  });

  it("passes empty array when data.images is null", async () => {
    vi.mocked(readData).mockResolvedValue({
      pageLabel: "Gallery",
      pageHeading: "Photo Gallery",
      pageSubtitle: "Browse our work",
      images: null,
    } as never);
    const page = await GalleryPage();
    render(page);

    expect(screen.getByTestId("item-count").textContent).toBe("0");
  });

  it("passes correct props to PageTextEditor", async () => {
    vi.mocked(readData).mockResolvedValue(mockGalleryData as never);
    const page = await GalleryPage();
    const { container } = render(page);

    expect(container.querySelector("[data-testid='page-text-editor']")?.textContent).toContain("Page Text");
  });

  it("handles empty data gracefully", async () => {
    vi.mocked(readData).mockResolvedValue({} as never);
    const page = await GalleryPage();
    render(page);

    expect(screen.getByTestId("content-manager")).toBeDefined();
    expect(screen.getByTestId("item-count").textContent).toBe("0");
  });

  it("handles single item array", async () => {
    vi.mocked(readData).mockResolvedValue({
      images: [{ type: "image", src: "https://example.com/img1.jpg", alt: "Solo" }],
    } as never);
    const page = await GalleryPage();
    render(page);

    expect(screen.getByTestId("item-count").textContent).toBe("1");
  });

  it("handles many items", async () => {
    const manyImages = Array.from({ length: 50 }, (_, i) => ({
      type: "image",
      src: `https://example.com/img${i}.jpg`,
      alt: `Photo ${i}`,
    }));
    vi.mocked(readData).mockResolvedValue({ images: manyImages } as never);
    const page = await GalleryPage();
    render(page);

    expect(screen.getByTestId("item-count").textContent).toBe("50");
  });
});
