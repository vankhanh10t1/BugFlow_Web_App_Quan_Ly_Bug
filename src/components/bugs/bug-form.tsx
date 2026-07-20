"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert, FileText, ImageIcon, LoaderCircle, Paperclip, X } from "lucide-react";
import { AuthField } from "@/components/auth/auth-field";
import { createBugAction, type BugActionState, updateBugAction } from "@/features/bugs/actions";

type ProjectOption = { id: string; code: string; name: string };
type BugDefaults = { id: string; title: string; description: string; reproductionSteps: string | null; expectedResult: string | null; actualResult: string | null; environment: string | null; browser: string | null; operatingSystem: string | null; applicationVersion: string | null; priority: string; severity: string; dueDate: Date | null };
type UploadStatus = "pending" | "uploading" | "success" | "error";
type SelectedFile = { id: string; file: File; previewUrl?: string; status: UploadStatus; error?: string };

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "text/plain", "application/x-ndjson", "application/pdf", "video/mp4", "video/webm"]);
const allowedExtensions = /\.(jpe?g|png|webp|gif|txt|log|ndjson|pdf|mp4|webm)$/i;
const executableExtensions = /\.(exe|bat|cmd|com|js|msi|sh|ps1)$/i;

function TextArea({ id, label, value, required, error }: { id: string; label: string; value?: string | null; required?: boolean; error?: string[] }) { return <div className="space-y-1.5"><label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label><textarea id={id} name={id} defaultValue={value ?? ""} required={required} rows={id === "description" || id === "reproductionSteps" ? 5 : 3} aria-invalid={Boolean(error?.length)} className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 aria-[invalid=true]:border-red-500" />{error?.length ? <p className="text-xs text-red-600">{error[0]}</p> : null}</div>; }
function fileSize(size: number) { return size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${(size / 1024).toFixed(1)} KB`; }
function clientFileError(file: File, maxSizeMb: number) { if (!file.size) return "Tệp rỗng"; if (executableExtensions.test(file.name)) return "Không cho phép tệp thực thi"; if (!allowedExtensions.test(file.name) || (!allowedMimeTypes.has(file.type) && !/\.(log|ndjson|txt)$/i.test(file.name))) return "Định dạng tệp không được hỗ trợ"; if (file.size > maxSizeMb * 1024 * 1024) return `Tệp vượt quá ${maxSizeMb} MB`; return null; }

export function BugForm({ projects = [], bug, attachmentLimits = { maxFiles: 5, maxSizeMb: 10 } }: { projects?: ProjectOption[]; bug?: BugDefaults; attachmentLimits?: { maxFiles: number; maxSizeMb: number } }) {
  const router = useRouter();
  const action = bug ? updateBugAction.bind(null, bug.id) : createBugAction;
  const [state, formAction, pending] = useActionState<BugActionState, FormData>(action, undefined);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [selectionError, setSelectionError] = useState("");
  const [uploadSummary, setUploadSummary] = useState("");
  const uploadStartedFor = useRef<string | null>(null);
  const previewUrls = useRef(new Set<string>());

  useEffect(() => () => { for (const url of previewUrls.current) URL.revokeObjectURL(url); }, []);
  useEffect(() => {
    if (bug || !state?.bugId || uploadStartedFor.current === state.bugId) return;
    uploadStartedFor.current = state.bugId;
    const bugId = state.bugId;
    const chosenFiles = files;
    if (!chosenFiles.length) { router.push(`/bugs/${bugId}`); return; }
    void (async () => {
      const failedNames: string[] = [];
      for (const item of chosenFiles) {
        setFiles((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "uploading", error: undefined } : entry));
        try {
          const body = new FormData(); body.set("file", item.file); body.set("bugId", bugId);
          const response = await fetch("/api/uploads", { method: "POST", body });
          const result = await response.json().catch(() => null) as { message?: string; error?: string } | null;
          if (!response.ok) throw new Error(result?.message ?? result?.error ?? "Tải tệp thất bại");
          setFiles((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "success", error: undefined } : entry));
        } catch (error) {
          failedNames.push(item.file.name);
          const message = error instanceof Error ? error.message : "Tải tệp thất bại";
          setFiles((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "error", error: message } : entry));
        }
      }
      if (!failedNames.length) router.push(`/bugs/${bugId}`);
      else setUploadSummary(`Đã tạo lỗi nhưng không thể tải ${failedNames.length} tệp: ${failedNames.join(", ")}. Bạn có thể tải lại tại trang chi tiết lỗi.`);
    })();
  }, [bug, files, router, state?.bugId]);

  function selectFiles(list: FileList | null) {
    if (!list || state?.bugId) return;
    setSelectionError("");
    const available = attachmentLimits.maxFiles - files.length;
    if (available <= 0) { setSelectionError(`Chỉ được chọn tối đa ${attachmentLimits.maxFiles} tệp`); return; }
    const incoming = Array.from(list);
    if (incoming.length > available) setSelectionError(`Chỉ thêm ${available} tệp đầu tiên; tối đa ${attachmentLimits.maxFiles} tệp cho mỗi lỗi`);
    const accepted: SelectedFile[] = [];
    for (const file of incoming.slice(0, available)) {
      const error = clientFileError(file, attachmentLimits.maxSizeMb);
      if (error) { setSelectionError(`${file.name}: ${error}`); continue; }
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      if (previewUrl) previewUrls.current.add(previewUrl);
      accepted.push({ id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`, file, previewUrl, status: "pending" });
    }
    setFiles((current) => [...current, ...accepted]);
  }

  function removeFile(id: string) {
    setFiles((current) => { const target = current.find((item) => item.id === id); if (target?.previewUrl) { URL.revokeObjectURL(target.previewUrl); previewUrls.current.delete(target.previewUrl); } return current.filter((item) => item.id !== id); });
    setSelectionError("");
  }

  const uploadInProgress = files.some((file) => file.status === "uploading");
  const createdBugId = state?.bugId;
  return <form action={formAction} className="space-y-5 rounded-xl border bg-white p-6 shadow-sm">
    {!bug ? <div className="space-y-1.5"><label htmlFor="projectId" className="text-sm font-medium text-slate-700">Dự án</label><select id="projectId" name="projectId" required disabled={Boolean(createdBugId)} className="h-11 w-full rounded-lg border bg-white px-3 text-sm"><option value="">Chọn dự án</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.code} · {project.name}</option>)}</select>{state?.fieldErrors?.projectId ? <p className="text-xs text-red-600">{state.fieldErrors.projectId[0]}</p> : null}</div> : null}
    <AuthField id="title" name="title" label="Tiêu đề lỗi" defaultValue={bug?.title} placeholder="Thanh toán thất bại khi áp dụng mã giảm giá" error={state?.fieldErrors?.title} required />
    <TextArea id="description" label="Mô tả" value={bug?.description} error={state?.fieldErrors?.description} required />
    <TextArea id="reproductionSteps" label="Các bước tái hiện" value={bug?.reproductionSteps} error={state?.fieldErrors?.reproductionSteps} />
    <div className="grid gap-5 md:grid-cols-2"><TextArea id="expectedResult" label="Kết quả mong đợi" value={bug?.expectedResult} /><TextArea id="actualResult" label="Kết quả thực tế" value={bug?.actualResult} /></div>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><AuthField id="environment" name="environment" label="Môi trường" defaultValue={bug?.environment ?? ""} placeholder="Staging" /><AuthField id="browser" name="browser" label="Trình duyệt" defaultValue={bug?.browser ?? ""} placeholder="Chrome 126" /><AuthField id="operatingSystem" name="operatingSystem" label="Hệ điều hành" defaultValue={bug?.operatingSystem ?? ""} placeholder="Windows 11" /><AuthField id="applicationVersion" name="applicationVersion" label="Phiên bản ứng dụng" defaultValue={bug?.applicationVersion ?? ""} placeholder="2.4.1" /></div>
    <div className="grid gap-5 sm:grid-cols-3"><div className="space-y-1.5"><label htmlFor="priority" className="text-sm font-medium">Độ ưu tiên</label><select id="priority" name="priority" defaultValue={bug?.priority ?? "MEDIUM"} className="h-11 w-full rounded-lg border bg-white px-3 text-sm">{["LOW","MEDIUM","HIGH","URGENT"].map((value) => <option key={value}>{value}</option>)}</select></div><div className="space-y-1.5"><label htmlFor="severity" className="text-sm font-medium">Mức độ nghiêm trọng</label><select id="severity" name="severity" defaultValue={bug?.severity ?? "MAJOR"} className="h-11 w-full rounded-lg border bg-white px-3 text-sm">{["MINOR","MAJOR","CRITICAL","BLOCKER"].map((value) => <option key={value}>{value}</option>)}</select></div><AuthField id="dueDate" name="dueDate" type="date" label="Hạn xử lý" defaultValue={bug?.dueDate ? new Date(bug.dueDate).toISOString().slice(0,10) : ""} /></div>
    {!bug ? <section className="space-y-3 rounded-xl border border-dashed p-4"><div className="flex items-center gap-2"><Paperclip className="size-4 text-blue-600" /><div><h2 className="text-sm font-semibold">Tệp minh chứng</h2><p className="text-xs text-slate-500">Tối đa {attachmentLimits.maxFiles} tệp, {attachmentLimits.maxSizeMb} MB/tệp. Tệp chỉ được tải lên sau khi tạo lỗi thành công.</p></div></div><input type="file" multiple disabled={Boolean(createdBugId)} accept="image/jpeg,image/png,image/webp,image/gif,text/plain,.log,application/x-ndjson,.ndjson,application/pdf,video/mp4,video/webm" onChange={(event) => { selectFiles(event.target.files); event.target.value = ""; }} className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-medium" />{selectionError ? <p role="alert" className="text-xs text-red-600">{selectionError}</p> : null}<div className="grid gap-3 sm:grid-cols-2">{files.map((item) => <article key={item.id} className="flex min-w-0 items-center gap-3 rounded-lg border bg-slate-50 p-3">{item.previewUrl ? <span role="img" aria-label={`Xem trước ${item.file.name}`} style={{ backgroundImage: `url(${item.previewUrl})` }} className="size-12 shrink-0 rounded-md bg-cover bg-center"><span className="sr-only">Ảnh xem trước</span></span> : item.file.type.startsWith("image/") ? <ImageIcon className="size-8 shrink-0 text-slate-400" /> : <FileText className="size-8 shrink-0 text-slate-400" />}<div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.file.name}</p><p className="text-xs text-slate-500">{fileSize(item.file.size)}</p>{item.status === "uploading" ? <p className="mt-1 flex items-center gap-1 text-xs text-blue-600"><LoaderCircle className="size-3 animate-spin" />Đang tải lên</p> : item.status === "success" ? <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="size-3" />Đã tải lên</p> : item.status === "error" ? <p className="mt-1 flex items-center gap-1 text-xs text-red-600"><CircleAlert className="size-3" />{item.error}</p> : <p className="mt-1 text-xs text-slate-400">Sẵn sàng</p>}</div>{item.status === "pending" && !createdBugId ? <button type="button" onClick={() => removeFile(item.id)} aria-label={`Bỏ ${item.file.name}`} className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"><X className="size-4" /></button> : null}</article>)}</div>{!files.length ? <p className="text-center text-xs text-slate-400">Chưa chọn tệp nào.</p> : null}</section> : null}
    {state?.message ? <p role="status" className={`rounded-lg p-3 text-sm ${state.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{state.message}</p> : null}{uploadSummary ? <div role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800"><p>{uploadSummary}</p><button type="button" onClick={() => router.push(`/bugs/${createdBugId}`)} className="mt-3 rounded-lg bg-amber-900 px-3 py-2 text-xs font-medium text-white">Mở chi tiết lỗi để tải lại</button></div> : null}<button disabled={pending || uploadInProgress || Boolean(createdBugId)} className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white disabled:opacity-60">{pending ? "Đang tạo lỗi…" : uploadInProgress ? "Đang tải tệp…" : bug ? "Lưu lỗi" : createdBugId ? "Đã tạo lỗi" : "Tạo lỗi"}</button>
  </form>;
}
