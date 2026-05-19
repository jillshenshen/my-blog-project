"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { AlbumImage } from "@/lib/types/album";
import { DeleteAlbumImageButton } from "@/components/admin/DeleteAlbumImageButton";

const BATCH_FORM_ID = "batch-edit-images";
const BATCH_DELETE_FORM_ID = "batch-delete-images";

type Props = {
  coverImage: string | null;
  images: AlbumImage[];
  reorderAction: (
    orderedIds: string[],
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  setCoverAction: (imageUrl: string) => Promise<void>;
  deleteImageAction: (imageId: string) => Promise<void>;
};

export function SortableAlbumImages({
  coverImage,
  images,
  reorderAction,
  setCoverAction,
  deleteImageAction,
}: Props) {
  const [items, setItems] = useState<AlbumImage[]>(images);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // 5px 才觸發拖曳，避免誤觸；click 仍正常
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      // 長按 200ms 才觸發，避免捲動衝突
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    if (pending) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const previousItems = items;
    const oldIndex = previousItems.findIndex((i) => i.id === active.id);
    const newIndex = previousItems.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const newItems = arrayMove(previousItems, oldIndex, newIndex);
    setItems(newItems);
    setErrorMsg(null);

    const orderedIds = newItems.map((i) => i.id);
    startTransition(async () => {
      const result = await reorderAction(orderedIds);
      if (!result.ok) {
        setItems(previousItems);
        setErrorMsg(result.error);
      }
    });
  }

  const ids = items.map((i) => i.id);

  return (
    <>
      <div className="mt-4 flex items-center justify-between text-[11px] text-muted">
        <p>拖曳照片左側縮圖即可調整順序。手機長按縮圖開始拖。</p>
        <span aria-live="polite" className="text-accent">
          {pending ? "排序儲存中…" : ""}
        </span>
      </div>

      {errorMsg ? (
        <p className="mt-2 border border-red-500/40 bg-red-500/5 px-3 py-2 text-xs text-red-500">
          排序失敗：{errorMsg}
        </p>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="mt-4 space-y-4">
            {items.map((img) => (
              <SortableImageRow
                key={img.id}
                image={img}
                isCover={coverImage === img.url}
                setCoverAction={setCoverAction}
                deleteImageAction={deleteImageAction}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </>
  );
}

type RowProps = {
  image: AlbumImage;
  isCover: boolean;
  setCoverAction: (imageUrl: string) => Promise<void>;
  deleteImageAction: (imageId: string) => Promise<void>;
};

function SortableImageRow({
  image,
  isCover,
  setCoverAction,
  deleteImageAction,
}: RowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex flex-col gap-4 border border-[var(--color-border)] bg-background p-4 sm:flex-row"
    >
      <div className="flex-shrink-0">
        <div
          {...attributes}
          {...listeners}
          aria-label="拖曳以調整順序"
          className="relative h-32 w-32 cursor-grab touch-none overflow-hidden bg-[var(--color-border)] active:cursor-grabbing"
        >
          <Image
            src={image.url}
            alt={image.alt || "album image"}
            fill
            sizes="128px"
            draggable={false}
            className="pointer-events-none object-cover"
          />
        </div>
        {isCover ? (
          <p className="mt-2 text-center text-[10px] tracking-[0.2em] text-accent uppercase">
            Cover
          </p>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
              Alt（SEO 替代文字）
            </span>
            <input
              form={BATCH_FORM_ID}
              name={`alt_${image.id}`}
              type="text"
              defaultValue={image.alt}
              maxLength={200}
              className="mt-1 w-full border border-[var(--color-border)] bg-background px-2 py-1.5 text-sm text-foreground focus:border-foreground focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
              拍攝日期
            </span>
            <input
              form={BATCH_FORM_ID}
              name={`takenAt_${image.id}`}
              type="date"
              defaultValue={image.takenAt ?? ""}
              className="mt-1 w-full border border-[var(--color-border)] bg-background px-2 py-1.5 text-sm text-foreground focus:border-foreground focus:outline-none"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
              Caption（燈箱底部說明）
            </span>
            <input
              form={BATCH_FORM_ID}
              name={`caption_${image.id}`}
              type="text"
              defaultValue={image.caption}
              maxLength={300}
              className="mt-1 w-full border border-[var(--color-border)] bg-background px-2 py-1.5 text-sm text-foreground focus:border-foreground focus:outline-none"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-col items-end gap-2 sm:w-32">
        <label className="flex cursor-pointer items-center gap-2 text-[10px] tracking-[0.2em] text-muted uppercase select-none">
          <input
            type="checkbox"
            name={`delete_${image.id}`}
            form={BATCH_DELETE_FORM_ID}
            className="h-4 w-4 cursor-pointer accent-red-500"
          />
          <span>選取</span>
        </label>
        <form action={setCoverAction.bind(null, image.url)}>
          <button
            type="submit"
            disabled={isCover}
            className="cursor-pointer text-[10px] tracking-[0.2em] text-foreground uppercase transition hover:text-accent disabled:cursor-default disabled:text-muted"
          >
            {isCover ? "✓ Cover" : "Set as Cover"}
          </button>
        </form>
        <DeleteAlbumImageButton
          action={deleteImageAction.bind(null, image.id)}
        />
      </div>
    </li>
  );
}
