// ============================================================================
// 导出/导入文件对话框
// ============================================================================

import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { sheetColors } from "../shared/tokens/colors";
import { useCharacter } from "../shared/storage/CharacterContext";
import { toOwlbearJSON, toFVTTJSON } from "../shared/storage/exportService";
import { toShareJSON } from "../shared/storage/shareService";
import { importCharacter } from "../shared/storage/importService";
import CharacterSheet from "../pages/PageFront";
import CharacterBackSide from "../pages/PageBack";
import SpellSheet from "../pages/PageSpell";

interface ExportImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FVAR = "'CTGR' 0, 'wdth' 100";
const PAGE_W = 1224;
const PAGE_H = 1659;

export default function ExportImportDialog({ open, onOpenChange }: ExportImportDialogProps) {
  const { character, updateCharacter, newCharacter } = useCharacter();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 注入打印样式
  useEffect(() => {
    if (!open) return;
    const styleId = "pdf-print-style";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.textContent = `
        @media print {
          body > *:not(.pdf-print-wrapper) { display: none !important; }
          .pdf-print-wrapper {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            z-index: 999999 !important;
            background: #fff;
          }
          .pdf-print-wrapper .pdf-page {
            position: relative;
            width: ${PAGE_W}px;
            height: ${PAGE_H}px;
            overflow: hidden;
            page-break-inside: avoid;
            page-break-after: always;
          }
          .pdf-print-wrapper .pdf-page:last-child { page-break-after: auto; }
          .pdf-print-wrapper [data-name="character-card"],
          .pdf-print-wrapper [data-name="角色卡背面"] {
            top: 0 !important;
          }
          .pdf-print-wrapper .pdf-page:nth-child(3) > .absolute:first-child {
            top: 0 !important;
          }
          .pdf-print-wrapper .pdf-page > .relative.size-full {
            width: 100% !important;
            height: 100% !important;
          }
          @page { margin: 0; size: ${PAGE_W}px ${PAGE_H}px; }
          html, body { margin: 0 !important; padding: 0 !important; height: auto !important; width: ${PAGE_W}px !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

          /* 隐藏特性和装备的添加输入框 */
          .pdf-print-wrapper textarea[placeholder*="特性"],
          .pdf-print-wrapper textarea[placeholder*="物品"] { display: none !important; }

          /* 隐藏攻击栏的新增 "+" 按钮 */
          .pdf-print-wrapper .border-dashed { display: none !important; }

          /* 隐藏当前生命值和临时生命值的数值输入 */
          .pdf-print-wrapper [data-name="hp"] input:first-of-type,
          .pdf-print-wrapper [data-name="temp-hp"] input { display: none !important; }

          /* 隐藏所有钱币的输入框 */
          .pdf-print-wrapper [data-name="钱币"] input { display: none !important; }

          /* 法术准备按钮始终显示为未选中状态（隐藏选中黑点） */
          .pdf-print-wrapper [data-name="法术"] [data-name="按钮"] svg circle:nth-child(3),
          .pdf-print-wrapper [data-name="戏法"] [data-name="按钮"] svg circle:nth-child(3) { display: none !important; }

          /* 隐藏法术页的已知戏法/已知法术/已准备法术信息行 */
          .pdf-print-wrapper .pdf-page:nth-child(3) .pointer-events-none.flex.justify-between { display: none !important; }
        }
      `;
      document.head.appendChild(styleEl);
    }
    return () => { styleEl?.remove(); };
  }, [open]);

  if (!open) return null;

  const exportPDF = () => {
    setExporting(true);
    setTimeout(() => {
      window.print();
      const cleanup = () => {
        setExporting(false);
        onOpenChange(false);
      };
      window.addEventListener("afterprint", cleanup, { once: true });
      setTimeout(cleanup, 5000);
    }, 300);
  };

  const exportOwlbear = () => {
    if (!character) return;
    const json = toOwlbearJSON(character);
    downloadJSON(json, `枭熊_${character.name ?? "角色"}.json`);
    onOpenChange(false);
  };

  const exportFVTT = () => {
    if (!character) return;
    const json = toFVTTJSON(character);
    downloadJSON(json, `fvtt_${character.name ?? "角色"}.json`);
    onOpenChange(false);
  };

  const exportShare = () => {
    if (!character) return;
    const json = toShareJSON(character);
    downloadJSON(json, `分享_${character.name ?? "角色"}.5eshare`);
    onOpenChange(false);
  };

  const downloadJSON = (json: string, filename: string) => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportHTML = async () => {
    setExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      const pages = printRef.current;
      if (!pages) throw new Error("容器未就绪");
      const pageEls = pages.querySelectorAll(".pdf-page");

      // 提取所有样式
      const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
      let stylesHTML = "";
      styles.forEach((s) => {
        if (s.tagName === "LINK") stylesHTML += s.outerHTML + "\n";
        else stylesHTML += s.outerHTML + "\n";
      });

      // 提取各页 HTML，并将 blob 图片转为 base64 内嵌
      const pageContents: string[] = [];
      for (const el of Array.from(pageEls)) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = el.innerHTML;

        // 查找所有 <img>，将 blob URL 转为 data URL
        const imgs = tempDiv.querySelectorAll("img");
        for (const img of Array.from(imgs)) {
          const src = img.getAttribute("src");
          if (src && (src.startsWith("blob:") || src.startsWith("http"))) {
            try {
              const resp = await fetch(src);
              const blob = await resp.blob();
              const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
              img.setAttribute("src", dataUrl);
            } catch {
              // 图片加载失败则保留原 src
            }
          }
        }

        pageContents.push(tempDiv.innerHTML);
      }

        const pageNames = ["角色卡正面", "角色卡背面", "法术书"];
        const tabs = pageNames.map((n, i) =>
          `<label class="page-tab" data-i="${i}" onclick="switchPage(${i})">${n}</label>`
        ).join("");

        const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>角色卡 - ${character?.name ?? ""}</title>
${stylesHTML}
<style>
  body { margin: 0; padding: 0; background: #e8e8e8; overflow-x: auto; }
  .page-nav { display: flex; gap: 4px; padding: 12px 0; justify-content: center; }
  .page-tab {
    padding: 6px 18px; border-radius: 4px 4px 0 0; cursor: pointer; font-size: 14px;
    font-family: var(--font-serif-medium), serif; color: #666; background: #ddd; user-select: none;
    transition: all 0.15s;
  }
  .page-tab:hover { background: #ccc; }
  .page-tab.active { background: #fff; color: #000; font-weight: 600; }
  .page-wrapper { display: flex; flex-direction: column; align-items: center; padding-bottom: 40px; }
  .page-container { position: relative; width: 1224px; height: 1659px; background: #fff; box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
  .page-content { position: absolute; inset: 0; }
  .page-content.hidden { display: none; }
  .page-content [data-name="character-card"],
  .page-content [data-name="角色卡背面"],
  .page-content > .absolute:first-child { top: 0 !important; }
</style>
</head>
<body>
  <div class="page-wrapper">
    <div class="page-nav">${tabs}</div>
    <div class="page-container">
      ${pageContents.map((c, i) => `<div class="page-content ${i === 0 ? "" : "hidden"}" data-page="${i}">${c}</div>`).join("")}
    </div>
  </div>
  <script>
    function switchPage(i) {
      document.querySelectorAll(".page-content").forEach(el => el.classList.add("hidden"));
      document.querySelector(\`.page-content[data-page="\${i}"]\`).classList.remove("hidden");
      document.querySelectorAll(".page-tab").forEach(el => el.classList.remove("active"));
      document.querySelector(\`.page-tab[data-i="\${i}"]\`).classList.add("active");
    }
    switchPage(0);
  <\/script>
</body>
</html>`;

        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `角色卡_${character?.name ?? "角色"}.html`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        alert("HTML 导出失败: " + (e instanceof Error ? e.message : "未知错误"));
      } finally {
        setExporting(false);
        onOpenChange(false);
      }
  };

  // 处理文件导入
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const result = importCharacter(text);

      if (result.success && result.data) {
        // 创建新角色
        const name = result.data.name || "导入角色";
        newCharacter(name);

        // 等待 React 状态更新后填充数据
        setTimeout(() => {
          updateCharacter(result.data!);
          setImportResult(`✅ 成功从 ${result.format} 格式导入角色「${name}」`);
        }, 50);
      } else {
        setImportResult(`❌ 导入失败: ${result.error || "无法识别的格式"}`);
      }
    } catch (err) {
      setImportResult(`❌ 文件读取失败: ${err instanceof Error ? err.message : "未知错误"}`);
    } finally {
      setImporting(false);
      // 重置 file input 以便重复选择同一文件
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {ReactDOM.createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.18)" }}
          onClick={(e) => e.target === e.currentTarget && onOpenChange(false)}
        >
          <div style={{
            width: "360px", backgroundColor: sheetColors.cardBg, borderRadius: "10px",
            border: "1px solid var(--color-border)", padding: "20px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.11)", fontVariationSettings: FVAR,
          }}>
            {/* 标题 + 切换标签 */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, borderBottom: `1px solid ${sheetColors.borderLight}`, paddingBottom: 8 }}>
              <button
                onClick={() => setShowImport(false)}
                style={{
                  fontSize: "14px", fontFamily: "var(--font-serif-bold)", fontWeight: 600,
                  color: showImport ? sheetColors.textPlaceholder : sheetColors.textPrimary,
                  background: "none", border: "none", cursor: "pointer", padding: "2px 0",
                  borderBottom: showImport ? "none" : `2px solid ${sheetColors.accentBlue}`,
                }}
              >
                导出
              </button>
              <button
                onClick={() => setShowImport(true)}
                style={{
                  fontSize: "14px", fontFamily: "var(--font-serif-bold)", fontWeight: 600,
                  color: showImport ? sheetColors.textPrimary : sheetColors.textPlaceholder,
                  background: "none", border: "none", cursor: "pointer", padding: "2px 0",
                  borderBottom: showImport ? `2px solid ${sheetColors.accentBlue}` : "none",
                }}
              >
                导入
              </button>
            </div>

            {/* 导出面板 */}
            {!showImport && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <ExportButton
                  label="导出为分享格式 (.5eshare)"
                  description="精简 JSON，用于快速跨端导入"
                  disabled={exporting}
                  onClick={exportShare}
                />
                <ExportButton
                  label="导出为枭熊 json"
                  description="Owlbear Rodeo 兼容格式"
                  disabled={exporting}
                  onClick={exportOwlbear}
                />
                <ExportButton
                  label="导出为 fvtt json"
                  description="Foundry VTT 兼容格式"
                  disabled={exporting}
                  onClick={exportFVTT}
                />
                <ExportButton
                  label={exporting ? "导出中..." : "导出为 html"}
                  description="可离线查看的交互式角色卡"
                  disabled={exporting}
                  onClick={exportHTML}
                />
                <ExportButton
                  label={exporting ? "导出中..." : "导出为 pdf"}
                  description="打印/保存为 PDF 文件"
                  disabled={exporting}
                  onClick={exportPDF}
                />
              </div>
            )}

            {/* 导入面板 */}
            {showImport && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{
                  padding: "14px", borderRadius: "2px",
                  border: `1px dashed ${sheetColors.borderLight}`,
                  backgroundColor: sheetColors.contentBg,
                  textAlign: "center",
                }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.5eshare"
                    onChange={handleFileImport}
                    style={{ display: "none" }}
                  />
                  <button
                    disabled={importing}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: "8px 20px", borderRadius: "4px",
                      border: `1px solid ${sheetColors.accentBlue}`,
                      backgroundColor: "transparent",
                      color: sheetColors.accentBlue,
                      cursor: "pointer", fontSize: "13px",
                      fontFamily: "var(--font-serif-medium)",
                      opacity: importing ? 0.5 : 1,
                    }}
                  >
                    {importing ? "导入中..." : "选择文件导入"}
                  </button>
                  <div style={{ marginTop: 8, fontSize: "11px", color: sheetColors.textPlaceholder }}>
                    支持格式: .5eshare (分享格式) / .json (枭熊/FVTT)
                  </div>
                </div>

                {/* 导入结果 */}
                {importResult && (
                  <div style={{
                    padding: "10px 12px", borderRadius: "2px",
                    backgroundColor: importResult.startsWith("✅") ? "#f0fdf4" : "#fef2f2",
                    border: `1px solid ${importResult.startsWith("✅") ? "#bbf7d0" : "#fecaca"}`,
                    fontSize: "12px", color: importResult.startsWith("✅") ? "#166534" : "#991b1b",
                    fontFamily: "var(--font-serif-regular-cjk)",
                  }}>
                    {importResult}
                  </div>
                )}

                <div style={{ fontSize: "11px", color: sheetColors.textPlaceholder, lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>支持的导入格式：</div>
                  <div>• 5eShare (.5eshare) - 本应用的分享格式</div>
                  <div>• Owlbear Rodeo (.json) - 枭熊格式</div>
                  <div>• Foundry VTT (.json) - FVTT 格式</div>
                  <div style={{ marginTop: 4 }}>导入后将自动创建新角色。</div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* 打印用隐藏容器 —— 三页 React 组件 */}
      {ReactDOM.createPortal(
        <div ref={printRef} className="pdf-print-wrapper" style={{ display: "none" }}>
          <div className="pdf-page"><CharacterSheet /></div>
          <div className="pdf-page"><CharacterBackSide /></div>
          <div className="pdf-page"><SpellSheet /></div>
        </div>,
        document.body
      )}
    </>
  );
}

// 导出按钮子组件
function ExportButton({ label, description, disabled, onClick }: {
  label: string;
  description: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button disabled={disabled} onClick={onClick} style={{
      display: "flex", flexDirection: "column", gap: 2, padding: "10px 14px", borderRadius: "2px",
      border: `1px solid ${sheetColors.borderLight}`, backgroundColor: sheetColors.cardBg,
      cursor: "pointer", textAlign: "left", width: "100%", transition: "background 0.1s",
      opacity: disabled ? 0.5 : 1,
    }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = sheetColors.contentBg; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = sheetColors.cardBg; }}
    >
      <span style={{ fontSize: "13px", fontFamily: "var(--font-serif-medium)", color: sheetColors.textPrimary }}>
        {label}
      </span>
      <span style={{ fontSize: "11px", color: sheetColors.textPlaceholder }}>
        {description}
      </span>
    </button>
  );
}