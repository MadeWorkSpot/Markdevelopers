import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContentManager from "@/components/admin/ContentManager";

const mockRouter = vi.hoisted(() => ({ refresh: vi.fn() }));
const toastMock = vi.hoisted(() => {
  const errorFn = vi.fn();
  return {
    toast: Object.assign(
      (message: string) => {},
      { success: vi.fn(), error: errorFn }
    ),
    errorFn,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("@/components/admin/Toaster", () => ({
  toast: toastMock.toast,
}));

vi.mock("@/components/admin/ConfirmDialog", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
  ConfirmProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/components/admin/ImageUploader", () => ({
  default: () => null,
}));

const defaultProps = {
  title: "Gallery Items",
  items: [
    { type: "image", src: "https://example.com/img1.jpg", alt: "Image 1" },
    { type: "image", src: "https://example.com/img2.jpg", alt: "Image 2" },
  ] as Record<string, unknown>[],
  fields: [
    { key: "type", label: "Type", type: "select" as const, options: ["image", "video"] },
    { key: "src", label: "Image URL", type: "image" as const, dependsOn: { key: "type", value: "image" } },
    { key: "videoSrc", label: "Video URL", type: "video" as const, dependsOn: { key: "type", value: "video" } },
    { key: "alt", label: "Alt Text", type: "text" as const },
  ],
  onSave: vi.fn().mockResolvedValue({ success: true }),
  onAdd: vi.fn().mockResolvedValue({ success: true }),
  onDelete: vi.fn().mockResolvedValue({ success: true }),
  onReorder: vi.fn().mockResolvedValue({ success: true }),
};

function renderContentManager(props = {}) {
  return render(<ContentManager {...defaultProps} {...props} />);
}

describe("ContentManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the title", () => {
    renderContentManager({ title: "Gallery Items" });
    expect(screen.getByText("Gallery Items")).toBeDefined();
  });

  it("renders item preview text", () => {
    renderContentManager();
    expect(screen.getByText("Item 1")).toBeDefined();
    expect(screen.getByText("Item 2")).toBeDefined();
  });

  it("renders images for items with src", () => {
    const { container } = renderContentManager();
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBe(2);
    expect(imgs[0].getAttribute("src")).toBe("https://example.com/img1.jpg");
    expect(imgs[1].getAttribute("src")).toBe("https://example.com/img2.jpg");
  });

  it("shows 'No items yet.' when items is empty", () => {
    renderContentManager({ items: [] });
    expect(screen.getByText("No items yet.")).toBeDefined();
  });

  it("shows 'Add New' button when not editing", () => {
    renderContentManager();
    expect(screen.getByText("Add New")).toBeDefined();
  });

  it("shows form heading when 'Add New' is clicked", async () => {
    renderContentManager();
    const addButton = screen.getByText("Add New");
    await userEvent.click(addButton);
    expect(screen.getByText("Add New", { selector: "h2" })).toBeDefined();
  });

  it("shows edit form when Edit button is clicked", async () => {
    renderContentManager();
    const editButtons = screen.getAllByText("Edit");
    await userEvent.click(editButtons[0]);
    expect(screen.getByText("Edit", { selector: "h2" })).toBeDefined();
  });

  it("shows edit form with 'Save' button and 'Cancel' button", async () => {
    renderContentManager();
    await userEvent.click(screen.getAllByText("Edit")[0]);
    expect(screen.getByText("Save")).toBeDefined();
    expect(screen.getByText("Cancel")).toBeDefined();
  });

  it("calls onSave with correct index and data when saving", async () => {
    const onSave = vi.fn().mockResolvedValue({ success: true });
    renderContentManager({ onSave });

    await userEvent.click(screen.getAllByText("Edit")[0]);
    const saveButton = screen.getByText("Save");
    await userEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(0, expect.objectContaining({
      type: expect.any(String),
      src: expect.any(String),
      alt: expect.any(String),
    }));
  });

  it("calls onAdd with form data when adding new item", async () => {
    const onAdd = vi.fn().mockResolvedValue({ success: true });
    renderContentManager({ onAdd, items: [] });

    await userEvent.click(screen.getByText("Add New"));

    const urlInput = screen.getByPlaceholderText("Image URL");
    await userEvent.type(urlInput, "https://example.com/new.jpg");
    const altInput = screen.getByDisplayValue("");
    await userEvent.type(altInput, "New Image");

    await userEvent.click(screen.getByText("Save"));

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      type: "image",
      src: "https://example.com/new.jpg",
      alt: "New Image",
    }));
  });

  it("calls onDelete when Delete is confirmed", async () => {
    const onDelete = vi.fn().mockResolvedValue({ success: true });
    renderContentManager({ onDelete });

    await userEvent.click(screen.getAllByText("Delete")[0]);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(0);
  });

  it("shows error toast when required field is empty", async () => {
    const fields = [
      { key: "name", label: "Name", type: "text" as const },
    ];
    renderContentManager({ items: [], fields });

    await userEvent.click(screen.getByText("Add New"));
    await userEvent.click(screen.getByText("Save"));

    expect(toastMock.errorFn).toHaveBeenCalledWith("Name is required");
  });

  it("calls onReorder when items are dragged", async () => {
    const onReorder = vi.fn().mockResolvedValue({ success: true });
    const { container } = renderContentManager({ onReorder });

    const items = container.querySelectorAll("[draggable='true']");
    expect(items.length).toBeGreaterThanOrEqual(2);

    const dataTransfer = {
      effectAllowed: "",
      setData: vi.fn(),
      getData: vi.fn().mockReturnValue("0"),
    } as unknown as DataTransfer;

    fireEvent.dragStart(items[0], { dataTransfer });
    fireEvent.dragEnter(items[1], { dataTransfer });
    fireEvent.dragOver(items[1], { dataTransfer });
    fireEvent.drop(items[1], { dataTransfer });
    fireEvent.dragEnd(items[1]);

    await waitFor(() => {
      expect(onReorder).toHaveBeenCalledWith(0, 1);
    });
  });

  it("hides onReorder handle when onReorder is not provided", () => {
    const { container } = renderContentManager({ onReorder: undefined });
    const grabbers = container.querySelectorAll("[title='Drag to reorder']");
    expect(grabbers.length).toBe(0);
  });

  it("shows video element for items with videoSrc", () => {
    const items = [
      { type: "video", videoSrc: "https://example.com/video.mp4", alt: "Video 1" },
    ] as Record<string, unknown>[];
    const { container } = renderContentManager({ items });

    const videos = container.querySelectorAll("video");
    expect(videos.length).toBe(1);
    expect(videos[0].getAttribute("src")).toBe("https://example.com/video.mp4");
  });

  it("calls router.refresh after successful save", async () => {
    renderContentManager();
    await userEvent.click(screen.getAllByText("Edit")[0]);
    await userEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });

  it("calls router.refresh after successful delete", async () => {
    renderContentManager();
    await userEvent.click(screen.getAllByText("Delete")[0]);

    await waitFor(() => {
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });

  it("validates URL format for image fields", async () => {
    const fields = [
      { key: "url", label: "URL", type: "url" as const },
    ];
    renderContentManager({ items: [], fields });

    await userEvent.click(screen.getByText("Add New"));
    await waitFor(() => {
      expect(screen.getByText("URL")).toBeDefined();
    });
  });
});
