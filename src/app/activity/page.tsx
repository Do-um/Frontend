'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { SiteHeader } from '@/components/layout';
import { ActivityDetailModal } from '@/components/features/ActivityDetailModal';
import { useGetIntroduces } from '@/api/introduce/get/useGetIntroduces';
import { useAddIntroduce } from '@/api/introduce/post/useAddIntroduce';

export default function ActivityPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState({
    activityId: '',
    description: '',
  });
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [fileItems, setFileItems] = useState<
    Array<{ id: string; file: File; previewUrl: string }>
  >([]);
  const [fileDragIndex, setFileDragIndex] = useState<number | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const itemsPerPage = 6;
  const { introduces, isLoading, errorMessage, refetch } = useGetIntroduces();
  const { addIntroduce, isSubmitting, errorMessage: submitError } = useAddIntroduce();
  const selectedActivity = introduces.find((activity) => activity.id.toString() === selectedId);
  const totalPages = Math.max(1, Math.ceil(introduces.length / itemsPerPage));
  const pagedActivities = introduces.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  useEffect(() => {
    return () => {
      fileItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [fileItems]);

  const detailItems = useMemo(() => {
    if (!selectedActivity?.activityImage) {
      return [];
    }
    return [
      {
        id: `${selectedActivity.id}-image`,
        imageUrl: selectedActivity.activityImage,
        label: selectedActivity.activityId,
      },
    ];
  }, [selectedActivity]);

  const handleFormChange = (field: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const openForm = () => {
    setFormState({ activityId: '', description: '' });
    setImageUrlInput('');
    setImageUrls([]);
    setFileItems([]);
    setFileDragIndex(null);
    setIsDraggingFiles(false);
    setIsFormOpen(true);
  };

  const addImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) {
      return;
    }
    setImageUrls((prev) => [...prev, trimmed]);
    setImageUrlInput('');
  };

  const removeImageUrl = (index: number) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }
    setImageUrls((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(null);
  };

  const submitForm = async () => {
    if (fileItems.length > 0) {
      return;
    }
    const primaryImage = imageUrls[0] ?? '';
    const success = await addIntroduce({
      activityId: formState.activityId,
      description: formState.description,
      activityImage: primaryImage,
    });
    if (!success) {
      return;
    }
    setIsFormOpen(false);
    await refetch();
  };

  return (
    <div className="min-h-screen bg-[#f7f2e9] text-[#2b2b2b]">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6 pb-16 pt-10">
        <section className="flex flex-col items-center text-center gap-4">
          <div className="flex h-28 w-44 items-center justify-center">
            <img
              src="/doum-logo-large.png"
              alt="Do,um"
              className="h-28 w-44 object-contain"
            />
          </div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Our Activity</h1>
          <p className="text-xs text-[#6a6259]">우리가 해온 길, 우리가 가는 길</p>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Activity</h2>
            <button
              type="button"
              onClick={openForm}
              className="rounded-full border border-[#cfc4b3] px-3 py-1 text-xs font-semibold text-[#4b4b4b]"
            >
              작성하기
            </button>
          </div>

          {isLoading && (
            <div className="mt-6 text-xs text-[#6a6259]">주요 활동을 불러오는 중...</div>
          )}
          {!isLoading && errorMessage && (
            <div className="mt-6 text-xs text-red-500">{errorMessage}</div>
          )}
          {!isLoading && !errorMessage && submitError && (
            <div className="mt-6 text-xs text-red-500">{submitError}</div>
          )}

          {pagedActivities.length > 0 && (
            <>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pagedActivities.map((activity) => (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => setSelectedId(activity.id.toString())}
                    className="overflow-hidden rounded-2xl border border-[#e5ddd1] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex h-24 items-center justify-center bg-[#cfe0e6]">
                      {activity.activityImage ? (
                        <img
                          src={activity.activityImage}
                          alt={activity.activityId}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-16 rounded-full border border-[#aac4ce] bg-[#dbe9ee]" />
                      )}
                    </div>
                    <div className="px-4 py-3">
                      <h3 className="text-sm font-semibold">{activity.activityId}</h3>
                      <p className="mt-2 text-[11px] text-[#7a7268]">
                        {activity.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-center gap-3 text-xs text-[#6a6259]">
                <button
                  className="hover:text-[#7aa4e8] disabled:opacity-40"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      className={page === currentPage ? 'font-semibold text-[#2b2b2b]' : 'hover:text-[#7aa4e8]'}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  className="hover:text-[#7aa4e8] disabled:opacity-40"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  다음
                </button>
              </div>
            </>
          )}
        </section>
      </main>

      <ActivityDetailModal
        isOpen={Boolean(selectedActivity)}
        onClose={() => setSelectedId(null)}
        title={selectedActivity?.activityId ?? ''}
        subtitle={selectedActivity?.description ?? ''}
        items={detailItems}
      />

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsFormOpen(false)}
            role="presentation"
          />
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">활동 소개 추가</h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-full border border-[#e2d8c9] px-3 py-1 text-xs font-semibold text-[#4b4b4b]"
              >
                닫기
              </button>
            </div>

            <div className="mt-4 grid gap-3 text-xs">
            <input
              className="rounded-lg border border-[#e2d8c9] px-3 py-2"
              placeholder="활동 ID"
              value={formState.activityId}
              onChange={(event) => handleFormChange('activityId', event.target.value)}
            />
            <textarea
              className="rounded-lg border border-[#e2d8c9] px-3 py-2"
              placeholder="설명"
              value={formState.description}
              onChange={(event) => handleFormChange('description', event.target.value)}
            />
            <div className="grid gap-2">
              <p className="text-[11px] text-[#6a6259]">
                파일 드래그 앤 드롭은 프론트에서만 미리보기/순서 정리만 됩니다. 업로드 API가 준비되면 저장을 연결할게요.
              </p>
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDraggingFiles(true);
                }}
                onDragLeave={() => setIsDraggingFiles(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDraggingFiles(false);
                  const files = Array.from(event.dataTransfer.files).filter((file) =>
                    file.type.startsWith('image/')
                  );
                  if (files.length === 0) {
                    return;
                  }
                  const nextItems = files.map((file) => ({
                    id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
                    file,
                    previewUrl: URL.createObjectURL(file),
                  }));
                  setFileItems((prev) => [...prev, ...nextItems]);
                }}
                className={`rounded-lg border border-dashed px-3 py-6 text-center text-[11px] ${
                  isDraggingFiles ? 'border-[#7aa4e8] bg-[#eef4ff]' : 'border-[#e2d8c9] text-[#9b9386]'
                }`}
              >
                이미지 파일을 여기로 끌어다 놓으세요
              </div>
              <div className="grid gap-2">
                {fileItems.length === 0 && (
                  <div className="rounded-lg border border-dashed border-[#e2d8c9] px-3 py-4 text-center text-[11px] text-[#9b9386]">
                    아직 추가된 이미지가 없습니다.
                  </div>
                )}
                {fileItems.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setFileDragIndex(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (fileDragIndex === null || fileDragIndex === index) {
                        setFileDragIndex(null);
                        return;
                      }
                      setFileItems((prev) => {
                        const next = [...prev];
                        const [moved] = next.splice(fileDragIndex, 1);
                        next.splice(index, 0, moved);
                        return next;
                      });
                      setFileDragIndex(null);
                    }}
                    className="flex items-center justify-between rounded-lg border border-[#e2d8c9] px-3 py-2 text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#9b9386]">{index + 1}</span>
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="h-10 w-14 rounded-md object-cover"
                      />
                      <span className="truncate">{item.file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(item.previewUrl);
                        setFileItems((prev) => prev.filter((_, idx) => idx !== index));
                      }}
                      className="text-[10px] font-semibold text-[#c05d52]"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <p className="text-[11px] text-[#6a6259]">
                업로드 API 전에는 URL 입력으로만 저장할 수 있습니다. URL로 저장하려면 아래에 추가해 주세요.
              </p>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-[#e2d8c9] px-3 py-2"
                  placeholder="이미지 URL 입력"
                  value={imageUrlInput}
                  onChange={(event) => setImageUrlInput(event.target.value)}
                />
                <button
                  type="button"
                  onClick={addImageUrl}
                  className="rounded-lg border border-[#e2d8c9] px-3 py-2 text-[11px] font-semibold text-[#4b4b4b]"
                >
                  추가
                </button>
              </div>
              <div className="grid gap-2">
                {imageUrls.length === 0 && (
                  <div className="rounded-lg border border-dashed border-[#e2d8c9] px-3 py-4 text-center text-[11px] text-[#9b9386]">
                    이미지 URL을 추가해 주세요.
                  </div>
                )}
                {imageUrls.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(index)}
                    className="flex items-center justify-between rounded-lg border border-[#e2d8c9] px-3 py-2 text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#9b9386]">{index + 1}</span>
                      <span className="truncate">{url}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImageUrl(index)}
                      className="text-[10px] font-semibold text-[#c05d52]"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={submitForm}
                disabled={isSubmitting || fileItems.length > 0 || imageUrls.length === 0}
                className="rounded-full border border-[#cfc4b3] px-4 py-2 text-xs font-semibold text-[#4b4b4b] disabled:opacity-40"
              >
                {isSubmitting ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-[#e2d8c9] py-6 text-center text-xs text-[#6a6259]">
        <div className="font-semibold text-[#3f3a34]">DO,UM</div>
        <div className="mt-1">소프트웨어학과의 코딩봉사 동아리</div>
        <div className="mt-1">Contact: doum2018@kookmin.ac.kr</div>
        <div className="mt-3 text-[10px] text-[#8a7f73]">© DO,UM</div>
      </footer>
    </div>
  );
}
