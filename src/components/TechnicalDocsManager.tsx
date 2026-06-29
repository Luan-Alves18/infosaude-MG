import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";

type Doc = {
  id: string;
  title: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  document_date: string;
  created_at: string;
  updated_at: string;
};

const BUCKET = "technical-docs";

const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const fmtSize = (n: number | null) => {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
};

const toDateInput = (iso: string) => {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
};

export const TechnicalDocsManager = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Upload dialog state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDate, setUploadDate] = useState(toDateInput(new Date().toISOString()));

  // Preview dialog
  const [previewDoc, setPreviewDoc] = useState<Doc | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Edit dialog
  const [editDoc, setEditDoc] = useState<Doc | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete
  const [deleteDoc, setDeleteDoc] = useState<Doc | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("technical_docs")
      .select("*")
      .order("document_date", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar documentações", description: error.message, variant: "destructive" });
      setDocs([]);
    } else {
      setDocs((data ?? []) as Doc[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const onPickFile = (file: File | null) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Apenas arquivos PDF são aceitos.", variant: "destructive" });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande (limite 50 MB).", variant: "destructive" });
      return;
    }
    setPendingFile(file);
    setUploadTitle(file.name.replace(/\.pdf$/i, ""));
    setUploadDate(toDateInput(new Date().toISOString()));
    setUploadOpen(true);
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    const title = uploadTitle.trim();
    if (!title) {
      toast({ title: "Informe um título para a documentação.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada.");
      const id = crypto.randomUUID();
      const safeName = pendingFile.name.replace(/[^\w.\-]+/g, "_");
      const filePath = `${id}/${safeName}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, pendingFile, {
          contentType: pendingFile.type || "application/pdf",
          upsert: false,
        });
      if (upErr) throw upErr;

      const documentDate = uploadDate
        ? new Date(`${uploadDate}T12:00:00`).toISOString()
        : new Date().toISOString();

      const { error: insErr } = await (supabase as any)
        .from("technical_docs")
        .insert({
          title,
          file_path: filePath,
          file_name: pendingFile.name,
          file_size: pendingFile.size,
          mime_type: pendingFile.type || "application/pdf",
          document_date: documentDate,
          uploaded_by: auth.user.id,
        });
      if (insErr) {
        // rollback file
        await supabase.storage.from(BUCKET).remove([filePath]);
        throw insErr;
      }

      toast({ title: "Documentação enviada com sucesso." });
      setUploadOpen(false);
      setPendingFile(null);
      setUploadTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadDocs();
    } catch (e) {
      toast({
        title: "Falha no upload",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const openPreview = async (doc: Doc) => {
    setPreviewDoc(doc);
    setPreviewUrl(null);
    setPreviewLoading(true);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.file_path, 3600);
    setPreviewLoading(false);
    if (error || !data) {
      toast({
        title: "Não foi possível gerar a pré-visualização.",
        description: error?.message,
        variant: "destructive",
      });
      setPreviewDoc(null);
      return;
    }
    setPreviewUrl(data.signedUrl);
  };

  const openFullscreen = async (doc: Doc) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.file_path, 3600);
    if (error || !data) {
      toast({ title: "Não foi possível abrir o documento.", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const downloadDoc = async (doc: Doc) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.file_path, 60, { download: doc.file_name });
    if (error || !data) {
      toast({ title: "Falha no download.", variant: "destructive" });
      return;
    }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = doc.file_name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const startEdit = (doc: Doc) => {
    setEditDoc(doc);
    setEditTitle(doc.title);
    setEditDate(toDateInput(doc.document_date));
  };

  const saveEdit = async () => {
    if (!editDoc) return;
    const title = editTitle.trim();
    if (!title) {
      toast({ title: "O título não pode ficar vazio.", variant: "destructive" });
      return;
    }
    setSavingEdit(true);
    const documentDate = editDate
      ? new Date(`${editDate}T12:00:00`).toISOString()
      : editDoc.document_date;
    const { error } = await (supabase as any)
      .from("technical_docs")
      .update({ title, document_date: documentDate })
      .eq("id", editDoc.id);
    setSavingEdit(false);
    if (error) {
      toast({ title: "Falha ao salvar alterações.", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Documentação atualizada." });
    setEditDoc(null);
    await loadDocs();
  };

  const confirmDelete = async () => {
    if (!deleteDoc) return;
    setDeleting(true);
    const { error: sErr } = await supabase.storage.from(BUCKET).remove([deleteDoc.file_path]);
    if (sErr) {
      // segue para tentar remover metadata mesmo assim
      console.warn("Falha ao remover arquivo do storage", sErr);
    }
    const { error } = await (supabase as any)
      .from("technical_docs")
      .delete()
      .eq("id", deleteDoc.id);
    setDeleting(false);
    if (error) {
      toast({ title: "Falha ao excluir.", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Documentação excluída." });
    setDeleteDoc(null);
    await loadDocs();
  };

  const totalLabel = useMemo(
    () => `${docs.length} ${docs.length === 1 ? "documento" : "documentos"}`,
    [docs.length],
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1">
            <h2 className="text-base font-semibold">Documentações técnicas em PDF</h2>
            <p className="text-xs text-muted-foreground">
              Envie, visualize, baixe e organize as documentações internas do Núcleo de Dados.
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Anexar PDF
          </Button>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">{loading ? "Carregando…" : totalLabel}</p>

      <div className="space-y-3">
        {docs.map((d) => (
          <Card key={d.id} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold leading-tight break-words">{d.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 break-all">
                        {d.file_name} · {fmtSize(d.file_size)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Atualização: <span className="font-medium text-foreground">{fmtDate(d.document_date)}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openPreview(d)}>
                    <Eye className="h-4 w-4" /> Pré-visualizar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openFullscreen(d)}>
                    <ExternalLink className="h-4 w-4" /> Tela cheia
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => downloadDoc(d)}>
                    <Download className="h-4 w-4" /> Baixar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => startEdit(d)}>
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => setDeleteDoc(d)}
                  >
                    <Trash2 className="h-4 w-4" /> Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && docs.length === 0 && (
          <Card>
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              Nenhuma documentação enviada ainda. Use o botão <strong>Anexar PDF</strong> acima.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={(o) => !uploading && setUploadOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova documentação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-xs text-muted-foreground break-all">
              Arquivo: <strong>{pendingFile?.name}</strong> · {fmtSize(pendingFile?.size ?? null)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-title">Título</Label>
              <Input
                id="doc-title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Ex.: Manual de governança de dados"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-date">Data de atualização</Label>
              <Input
                id="doc-date"
                type="date"
                value={uploadDate}
                onChange={(e) => setUploadDate(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Por padrão é preenchido com a data do upload. Pode ser editado depois.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>
              Cancelar
            </Button>
            <Button onClick={confirmUpload} disabled={uploading} className="gap-2">
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog
        open={!!previewDoc}
        onOpenChange={(o) => {
          if (!o) {
            setPreviewDoc(null);
            setPreviewUrl(null);
          }
        }}
      >
        <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 flex flex-col">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle className="pr-8 truncate">{previewDoc?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 px-5">
            {previewDoc && (
              <>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openFullscreen(previewDoc)}>
                  <ExternalLink className="h-4 w-4" /> Abrir em nova aba
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => downloadDoc(previewDoc)}>
                  <Download className="h-4 w-4" /> Baixar
                </Button>
              </>
            )}
          </div>
          <div className="flex-1 mt-3 px-5 pb-5 min-h-0">
            {previewLoading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando documento…
              </div>
            ) : previewUrl ? (
              <iframe
                src={previewUrl}
                title={previewDoc?.title}
                className="w-full h-full rounded-md border border-border bg-muted"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editDoc} onOpenChange={(o) => !o && setEditDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar documentação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">Data de atualização</Label>
              <Input
                id="edit-date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDoc(null)} disabled={savingEdit}>
              Cancelar
            </Button>
            <Button onClick={saveEdit} disabled={savingEdit} className="gap-2">
              {savingEdit && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteDoc} onOpenChange={(o) => !o && !deleting && setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documentação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove permanentemente o arquivo "{deleteDoc?.title}" do portal. Não é possível desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TechnicalDocsManager;
