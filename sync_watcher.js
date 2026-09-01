import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

const EXCEL_FILE = "POSTAGEM - PROTOCOLO.xlsx";
const CONVEX_URL = "https://little-stingray-828.convex.cloud";

console.log("==================================================");
console.log("?? MONITORADOR AUTOMÁTICO DE PLANILHA INICIADO");
console.log(`?? Observando arquivo: ${EXCEL_FILE}`);
console.log(`??  Conectado ao Convex: ${CONVEX_URL}`);
console.log("==================================================");

let isProcessing = false;
let lastModifiedTime = 0;

function syncExcelData() {
  if (!fs.existsSync(EXCEL_FILE)) {
    console.log(`?? Arquivo ${EXCEL_FILE} não encontrado.`);
    return;
  }

  const stats = fs.statSync(EXCEL_FILE);
  if (stats.mtimeMs === lastModifiedTime) return;
  lastModifiedTime = stats.mtimeMs;

  if (isProcessing) return;
  isProcessing = true;

  console.log(`\n? [${new Date().toLocaleTimeString()}] Alteração detectada na planilha! Processando...`);

  try {
    const fileBuffer = fs.readFileSync(EXCEL_FILE);
    const workbook = XLSX.read(fileBuffer, { type: "buffer", cellDates: true });
    const allRecords = [];
    let idCounter = 1;

    for (const sheetName of workbook.SheetNames) {
      if (!sheetName.startsWith("NOTAS")) continue;
      const year = sheetName.replace(/[^0-9]/g, "") || String(new Date().getFullYear());
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

      if (!jsonData || jsonData.length === 0) continue;

      const headers = jsonData[0].map((h) => String(h).toUpperCase().trim());
      const clienteIdx = headers.findIndex((h) => h.includes("CLIENTE"));
      const campanhaIdx = headers.findIndex((h) => h.includes("CAMPANHA"));
      const graficaIdx = headers.findIndex((h) => h.includes("GR") && (h.includes("FICA") || h.includes("AFICA")));
      const layoutIdx = headers.findIndex((h) => h.includes("LAYOUT"));
      const quantIdx = headers.findIndex((h) => h.includes("QUANT"));
      const protoIdx = headers.findIndex((h) => h.includes("PROTO") || h.includes("OS") || h.includes("NF"));
      const dataIdx = headers.findIndex((h) => h.includes("DATA"));
      const horaIdx = headers.findIndex((h) => h.includes("HORA"));

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || !row.some((cell) => cell !== "")) continue;

        const cliente = clienteIdx >= 0 ? String(row[clienteIdx] || "").trim() : "";
        const campanha = campanhaIdx >= 0 ? String(row[campanhaIdx] || "").trim() : "";
        const grafica = graficaIdx >= 0 ? String(row[graficaIdx] || "").trim() : "";

        if (!cliente && !campanha && !grafica) continue;

        const layoutRaw = layoutIdx >= 0 ? row[layoutIdx] : 1;
        const quantRaw = quantIdx >= 0 ? row[quantIdx] : 0;
        const proto = protoIdx >= 0 ? String(row[protoIdx] || "").trim() : "";
        const dataVal = dataIdx >= 0 ? row[dataIdx] : "";
        const horaVal = horaIdx >= 0 ? row[horaIdx] : "";

        let dataStr = "";
        if (dataVal instanceof Date) {
          dataStr = dataVal.toISOString().split("T")[0];
        } else if (typeof dataVal === "string" && dataVal) {
          if (dataVal.includes("/")) {
            const parts = dataVal.split("/");
            if (parts.length === 3) {
              const d = parts[0].padStart(2, "0");
              const m = parts[1].padStart(2, "0");
              const y = parts[2].length === 4 ? parts[2] : `20${parts[2]}`;
              dataStr = `${y}-${m}-${d}`;
            }
          } else {
            dataStr = dataVal.substring(0, 10);
          }
        }

        let horaStr = "";
        if (horaVal instanceof Date) {
          horaStr = horaVal.toTimeString().substring(0, 5);
        } else if (typeof horaVal === "string") {
          horaStr = horaVal.trim();
        }

        const quant = parseInt(String(quantRaw).replace(/[^0-9]/g, "") || "0", 10);
        const layout = parseInt(String(layoutRaw).replace(/[^0-9]/g, "") || "1", 10);

        allRecords.push({
          id: `rec_${idCounter++}`,
          ano: year,
          cliente,
          campanha,
          grafica,
          layout,
          quantidade: quant,
          quantidade_raw: String(quant),
          protocolo_os_nf: proto,
          data: dataStr,
          hora: horaStr,
          status: "Conferido",
          observacoes: "",
          conferido_qtd: true,
          conferido_avaria: true,
          conferido_canhoto: true,
          created_at: `${year}-01-01T00:00:00Z`
        });
      }
    }

    // Save updated initialData.json
    fs.writeFileSync("src/data/initialData.json", JSON.stringify(allRecords, null, 2), "utf-8");
    console.log(`? Base local atualizada com ${allRecords.length} registros extraídos da planilha.`);
    console.log(`?? O site/app recarregará os dados automaticamente!`);
  } catch (err) {
    console.error("? Erro ao ler planilha:", err.message);
  } finally {
    isProcessing = false;
  }
}

// Initial check
syncExcelData();

// Watch file for changes
fs.watchFile(EXCEL_FILE, { interval: 1500 }, () => {
  syncExcelData();
});
