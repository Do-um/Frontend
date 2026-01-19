'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { SiteHeader } from '@/components/layout';
import { ActivityDetailModal } from '@/components/features/ActivityDetailModal';
import { useGetProjects } from '@/api/project/get/useGetProjects';
import { useAddProject } from '@/api/project/post/useAddProject';
import { useEditProject } from '@/api/project/post/useEditProject';
import { useDeleteProject } from '@/api/project/post/useDeleteProject';
import type { Project, ProjectPayload } from '@/api/project/types';

interface ProjectFormState {
  projectId?: string;
  title: string;
  summary: string;
  description: string;
  thumbnailUrl: string;
  images: string;
  tags: string;
  teamName: string;
  members: string;
  periodStart: string;
  periodEnd: string;
  github: string;
  demo: string;
  notion: string;
  isPinned: boolean;
}

const emptyForm: ProjectFormState = {
  title: '',
  summary: '',
  description: '',
  thumbnailUrl: '',
  images: '',
  tags: '',
  teamName: '',
  members: '',
  periodStart: '',
  periodEnd: '',
  github: '',
  demo: '',
  notion: '',
  isPinned: false,
};

const formatMembers = (members: string[]) => {
  if (members.length <= 2) {
    return members.join(', ');
  }
  return `${members[0]}, ${members[1]} 등`;
};

const formatPeriod = (start: string, end: string) => {
  if (!start || !end) {
    return '';
  }
  return `${start} ~ ${end}`;
};

const splitCsv = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function ProjectActivityPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { projects, isLoading, errorMessage, refetch } = useGetProjects();
  const { addProject, isSubmitting: isAdding, errorMessage: addError } = useAddProject();
  const { editProject, isSubmitting: isEditingRequest, errorMessage: editError } = useEditProject();
  const { deleteProject, isSubmitting: isDeleting, errorMessage: deleteError } = useDeleteProject();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<ProjectFormState>(emptyForm);
  const itemsPerPage = 6;
  const selectedProject = projects.find((project) => project.projectId === selectedId);
  const totalPages = Math.max(1, Math.ceil(projects.length / itemsPerPage));
  const pagedProjects = projects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const combinedErrorMessage = errorMessage || addError || editError || deleteError;

  const detailItems = useMemo(() => {
    if (!selectedProject) {
      return [];
    }
    return selectedProject.images.map((imageUrl, index) => ({
      id: `${selectedProject.projectId}-${index}`,
      imageUrl,
      label: `${selectedProject.title} 이미지 ${index + 1}`,
    }));
  }, [selectedProject]);

  const openAddForm = () => {
    setIsEditing(false);
    setFormState(emptyForm);
    setIsFormOpen(true);
  };

  const openEditForm = () => {
    if (!selectedProject) {
      return;
    }
    setIsEditing(true);
    setFormState({
      projectId: selectedProject.projectId,
      title: selectedProject.title,
      summary: selectedProject.summary,
      description: selectedProject.description,
      thumbnailUrl: selectedProject.thumbnailUrl,
      images: selectedProject.images.join(', '),
      tags: selectedProject.tags.join(', '),
      teamName: selectedProject.teamName,
      members: selectedProject.members.join(', '),
      periodStart: selectedProject.period?.start ?? '',
      periodEnd: selectedProject.period?.end ?? '',
      github: selectedProject.links?.github ?? '',
      demo: selectedProject.links?.demo ?? '',
      notion: selectedProject.links?.notion ?? '',
      isPinned: selectedProject.isPinned,
    });
    setIsFormOpen(true);
  };

  const handleFormChange = (field: keyof ProjectFormState, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const submitForm = async () => {
    try {
      const payload: ProjectPayload = {
        projectId: formState.projectId,
        title: formState.title,
        summary: formState.summary,
        description: formState.description,
        thumbnailUrl: formState.thumbnailUrl,
        images: splitCsv(formState.images),
        tags: splitCsv(formState.tags),
        teamName: formState.teamName,
        members: splitCsv(formState.members),
        period: {
          start: formState.periodStart,
          end: formState.periodEnd,
        },
        links: {
          github: formState.github || undefined,
          demo: formState.demo || undefined,
          notion: formState.notion || undefined,
        },
        isPinned: formState.isPinned,
      };

    const success = isEditing ? await editProject(payload) : await addProject(payload);
      if (!success) {
        return;
      }

      setIsFormOpen(false);
      await refetch();
    } catch (_error) {
      return;
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) {
      return;
    }
    if (!window.confirm('프로젝트를 삭제할까요?')) {
      return;
    }
    try {
      const success = await deleteProject(selectedProject.projectId);
      if (!success) {
        return;
      }
      setSelectedId(null);
      await refetch();
    } catch (_error) {
      return;
    }
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
          <h1 className="text-2xl font-semibold sm:text-3xl"> Our Project</h1>
          <p className="text-xs text-[#6a6259]">우리가 해온 길, 우리가 가는 길</p>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Project</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openEditForm}
                disabled={!selectedProject}
                className="rounded-full border border-[#cfc4b3] px-3 py-1 text-xs font-semibold text-[#4b4b4b] disabled:opacity-40"
              >
                수정
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!selectedProject || isDeleting}
                className="rounded-full border border-[#cfc4b3] px-3 py-1 text-xs font-semibold text-[#4b4b4b] disabled:opacity-40"
              >
                삭제
              </button>
              <button
                type="button"
                onClick={openAddForm}
                className="rounded-full border border-[#cfc4b3] px-3 py-1 text-xs font-semibold text-[#4b4b4b]"
              >
              작성하기
              </button>
            </div>
          </div>

          {isLoading && (
            <div className="mt-6 text-xs text-[#6a6259]">프로젝트를 불러오는 중...</div>
          )}
          {combinedErrorMessage && (
            <div className="mt-6 text-xs text-red-500">{combinedErrorMessage}</div>
          )}
          {pagedProjects.length > 0 && (
            <>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pagedProjects.map((project) => (
                  <button
                    key={project.projectId}
                    type="button"
                    onClick={() => setSelectedId(project.projectId)}
                    className="overflow-hidden rounded-2xl border border-[#e5ddd1] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex h-24 items-center justify-center bg-[#cfe0e6]">
                      {project.thumbnailUrl ? (
                        <img
                          src={project.thumbnailUrl}
                          alt={project.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-16 rounded-full border border-[#aac4ce] bg-[#dbe9ee]" />
                      )}
                    </div>
                    <div className="px-4 py-3">
                      <h3 className="text-sm font-semibold">{project.title}</h3>
                      <p className="mt-1 text-[11px] text-[#7a7268]">{project.summary}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-[#7a7268]">
                        <span>{formatPeriod(project.period?.start, project.period?.end)}</span>
                        <span className="text-[10px] font-semibold text-[#6a6259]">
                          {formatMembers(project.members)}
                        </span>
                      </div>
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
        isOpen={Boolean(selectedProject)}
        onClose={() => setSelectedId(null)}
        title={selectedProject?.title ?? ''}
        subtitle={selectedProject?.description ?? ''}
        items={detailItems}
      />

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsFormOpen(false)}
            role="presentation"
          />
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{isEditing ? '프로젝트 수정' : '프로젝트 추가'}</h3>
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
                placeholder="제목"
                value={formState.title}
                onChange={(event) => handleFormChange('title', event.target.value)}
              />
              <input
                className="rounded-lg border border-[#e2d8c9] px-3 py-2"
                placeholder="요약"
                value={formState.summary}
                onChange={(event) => handleFormChange('summary', event.target.value)}
              />
              <textarea
                className="rounded-lg border border-[#e2d8c9] px-3 py-2"
                placeholder="설명"
                value={formState.description}
                onChange={(event) => handleFormChange('description', event.target.value)}
              />
              <input
                className="rounded-lg border border-[#e2d8c9] px-3 py-2"
                placeholder="썸네일 URL"
                value={formState.thumbnailUrl}
                onChange={(event) => handleFormChange('thumbnailUrl', event.target.value)}
              />
              <input
                className="rounded-lg border border-[#e2d8c9] px-3 py-2"
                placeholder="이미지 URL (콤마 구분)"
                value={formState.images}
                onChange={(event) => handleFormChange('images', event.target.value)}
              />
              <input
                className="rounded-lg border border-[#e2d8c9] px-3 py-2"
                placeholder="태그 (콤마 구분)"
                value={formState.tags}
                onChange={(event) => handleFormChange('tags', event.target.value)}
              />
              <input
                className="rounded-lg border border-[#e2d8c9] px-3 py-2"
                placeholder="팀명"
                value={formState.teamName}
                onChange={(event) => handleFormChange('teamName', event.target.value)}
              />
              <input
                className="rounded-lg border border-[#e2d8c9] px-3 py-2"
                placeholder="멤버 (콤마 구분)"
                value={formState.members}
                onChange={(event) => handleFormChange('members', event.target.value)}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-lg border border-[#e2d8c9] px-3 py-2"
                  placeholder="시작일 (YYYY-MM-DD)"
                  value={formState.periodStart}
                  onChange={(event) => handleFormChange('periodStart', event.target.value)}
                />
                <input
                  className="rounded-lg border border-[#e2d8c9] px-3 py-2"
                  placeholder="종료일 (YYYY-MM-DD)"
                  value={formState.periodEnd}
                  onChange={(event) => handleFormChange('periodEnd', event.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  className="rounded-lg border border-[#e2d8c9] px-3 py-2"
                  placeholder="GitHub 링크"
                  value={formState.github}
                  onChange={(event) => handleFormChange('github', event.target.value)}
                />
                <input
                  className="rounded-lg border border-[#e2d8c9] px-3 py-2"
                  placeholder="Demo 링크"
                  value={formState.demo}
                  onChange={(event) => handleFormChange('demo', event.target.value)}
                />
                <input
                  className="rounded-lg border border-[#e2d8c9] px-3 py-2"
                  placeholder="Notion 링크"
                  value={formState.notion}
                  onChange={(event) => handleFormChange('notion', event.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-[11px] text-[#6a6259]">
                <input
                  type="checkbox"
                  checked={formState.isPinned}
                  onChange={(event) => handleFormChange('isPinned', event.target.checked)}
                />
                상단 고정
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={submitForm}
                disabled={isAdding || isEditingRequest}
                className="rounded-full border border-[#cfc4b3] px-4 py-2 text-xs font-semibold text-[#4b4b4b] disabled:opacity-40"
              >
                {isAdding || isEditingRequest ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-[#e2d8c9] py-6 text-center text-xs text-[#6a6259]">
        <div className="font-semibold text-[#3f3a34]">DO,UM</div>
        <div className="mt-1">소프트웨어학과의 교과외 활동</div>
        <div className="mt-1">Contact: doum@dokim.ac.kr</div>
        <div className="mt-3 text-[10px] text-[#8a7f73]">© DO,UM</div>
      </footer>
    </div>
  );
}
