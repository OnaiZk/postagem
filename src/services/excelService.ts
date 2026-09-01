import * as XLSX from 'xlsx';
import { PostagemRecord, StockItem } from '../types';

export const exportStockToExcel = (stockItems: StockItem[], filename = 'ESTOQUE_POSTAGEM_ELETROMIDIA.xlsx') => {
  const exportData = stockItems.map((s) => ({
    'ID ESTOQUE': s.id,
    'CLIENTE': s.cliente,
    'CAMPANHA': s.campanha,
    'GRÁFICA': s.grafica || '',
    'TIPO MATERIAL': s.tipo_material,
    'QTD DISPONÍVEL': s.quantidade_disponivel,
    'QTD POSTADA NA RUA': s.quantidade_postada || 0,
    'QTD TOTAL RECEBIDA': s.quantidade_total,
    'LOCALIZAÇÃO GALPÃO': s.localizacao,
    'LOTE / OS': s.lote_os || '',
    'STATUS': s.status,
    'DATA ENTRADA': s.data_entrada ? s.data_entrada.split('-').reverse().join('/') : '',
    'TÉCNICO RESPONSÁVEL': s.tecnico_responsavel,
    'QTD FOTOS LAYOUT': s.fotos_layout?.length || 0,
    'OBSERVAÇÕES': s.observacoes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const colWidths = [
    { wch: 18 }, // ID
    { wch: 25 }, // CLIENTE
    { wch: 35 }, // CAMPANHA
    { wch: 20 }, // GRAFICA
    { wch: 22 }, // MATERIAL
    { wch: 16 }, // DISPONIVEL
    { wch: 18 }, // POSTADA
    { wch: 18 }, // TOTAL
    { wch: 25 }, // LOCALIZACAO
    { wch: 15 }, // LOTE/OS
    { wch: 15 }, // STATUS
    { wch: 15 }, // DATA ENTRADA
    { wch: 22 }, // TECNICO
    { wch: 18 }, // QTD FOTOS
    { wch: 35 }  // OBS
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Estoque Postagem');
  XLSX.writeFile(workbook, filename);
};

export const exportToExcel = (records: PostagemRecord[], filename = 'POSTAGEM_ELETROMIDIA_EXPORT.xlsx') => {
  // Format records for Excel export
  const exportData = records.map((r) => ({
    'ID': r.id,
    'ANO': r.ano,
    'DATA RECEBIMENTO': r.data ? r.data.split('-').reverse().join('/') : '',
    'HORA': r.hora || '',
    'PROTOCOLO / OS / NF': r.protocolo_os_nf || '',
    'GRÁFICA': r.grafica || '',
    'CLIENTE': r.cliente || '',
    'CAMPANHA': r.campanha || '',
    'LAYOUT': r.layout || 1,
    'QUANTIDADE CARTAZES': r.quantidade || 0,
    'STATUS': r.status || 'Conferido',
    'CONFERÊNCIA QTD': r.conferido_qtd ? 'OK' : 'NO',
    'CONFERÊNCIA AVARIA': r.conferido_avaria ? 'OK' : 'NO',
    'CANHOTO ASSINADO': r.conferido_canhoto ? 'SIM' : 'NO',
    'FOTO NF ANEXADA': r.foto_nf ? 'SIM' : 'NO',
    'FOTO CARTAZ ANEXADA': r.foto_cartaz ? 'SIM' : 'NO',
    'OBSERVAÇÕES': r.observacoes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  const colWidths = [
    { wch: 15 }, // ID
    { wch: 8 },  // ANO
    { wch: 18 }, // DATA
    { wch: 10 }, // HORA
    { wch: 22 }, // PROTOCOLO
    { wch: 20 }, // GRAFICA
    { wch: 25 }, // CLIENTE
    { wch: 30 }, // CAMPANHA
    { wch: 10 }, // LAYOUT
    { wch: 20 }, // QTD
    { wch: 15 }, // STATUS
    { wch: 16 }, // CONF QTD
    { wch: 18 }, // CONF AVARIA
    { wch: 16 }, // CANHOTO
    { wch: 16 }, // FOTO NF
    { wch: 20 }, // FOTO CARTAZ
    { wch: 35 }  // OBS
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Postagem Protocolos');

  XLSX.writeFile(workbook, filename);
};

export const exportToCSV = (records: PostagemRecord[], filename = 'POSTAGEM_ELETROMIDIA_EXPORT.csv') => {
  const exportData = records.map((r) => ({
    'ID': r.id,
    'ANO': r.ano,
    'DATA': r.data,
    'HORA': r.hora,
    'PROTOCOLO_OS_NF': r.protocolo_os_nf,
    'GRAFICA': r.grafica,
    'CLIENTE': r.cliente,
    'CAMPANHA': r.campanha,
    'LAYOUT': r.layout,
    'QUANTIDADE': r.quantidade,
    'STATUS': r.status,
    'OBSERVACOES': r.observacoes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const parseExcelFile = async (file: File): Promise<PostagemRecord[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const importedRecords: PostagemRecord[] = [];
        let idCounter = 1;

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<any>(sheet, { header: 1, defval: '' });

          if (!jsonData || jsonData.length === 0) continue;

          const year = sheetName.replace(/[^0-9]/g, '') || String(new Date().getFullYear());
          const headers = (jsonData[0] as any[]).map((h) => String(h).toUpperCase().trim());

          const clienteIdx = headers.findIndex((h) => h.includes('CLIENTE'));
          const campanhaIdx = headers.findIndex((h) => h.includes('CAMPANHA'));
          const graficaIdx = headers.findIndex((h) => h.includes('GR') && (h.includes('FICA') || h.includes('AFICA')));
          const layoutIdx = headers.findIndex((h) => h.includes('LAYOUT'));
          const quantIdx = headers.findIndex((h) => h.includes('QUANT'));
          const protoIdx = headers.findIndex((h) => h.includes('PROTO') || h.includes('OS') || h.includes('NF'));
          const dataIdx = headers.findIndex((h) => h.includes('DATA'));
          const horaIdx = headers.findIndex((h) => h.includes('HORA'));

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (!row || !row.some((cell) => cell !== '')) continue;

            const cliente = clienteIdx >= 0 ? String(row[clienteIdx] || '').trim() : '';
            const campanha = campanhaIdx >= 0 ? String(row[campanhaIdx] || '').trim() : '';
            const grafica = graficaIdx >= 0 ? String(row[graficaIdx] || '').trim() : '';

            if (!cliente && !campanha && !grafica) continue;

            const layoutRaw = layoutIdx >= 0 ? row[layoutIdx] : 1;
            const quantRaw = quantIdx >= 0 ? row[quantIdx] : 0;
            const proto = protoIdx >= 0 ? String(row[protoIdx] || '').trim() : '';
            const dataVal = dataIdx >= 0 ? row[dataIdx] : '';
            const horaVal = horaIdx >= 0 ? row[horaIdx] : '';

            let dataStr = '';
            if (dataVal instanceof Date) {
              dataStr = dataVal.toISOString().split('T')[0];
            } else if (typeof dataVal === 'string' && dataVal) {
              if (dataVal.includes('/')) {
                const parts = dataVal.split('/');
                if (parts.length === 3) {
                  const d = parts[0].padStart(2, '0');
                  const m = parts[1].padStart(2, '0');
                  const y = parts[2].length === 4 ? parts[2] : `20${parts[2]}`;
                  dataStr = `${y}-${m}-${d}`;
                }
              } else {
                dataStr = dataVal.substring(0, 10);
              }
            }

            let horaStr = '';
            if (horaVal instanceof Date) {
              horaStr = horaVal.toTimeString().substring(0, 5);
            } else if (typeof horaVal === 'string') {
              horaStr = horaVal.trim();
            }

            const quant = parseInt(String(quantRaw).replace(/[^0-9]/g, '') || '0', 10);
            const layout = parseInt(String(layoutRaw).replace(/[^0-9]/g, '') || '1', 10);

            importedRecords.push({
              id: `rec_imp_${Date.now()}_${idCounter++}`,
              ano: year,
              cliente,
              campanha,
              grafica,
              layout,
              quantidade: quant,
              protocolo_os_nf: proto,
              data: dataStr,
              hora: horaStr,
              status: 'Conferido',
              observacoes: 'Importado de arquivo Excel',
              conferido_qtd: true,
              conferido_avaria: true,
              conferido_canhoto: true,
              created_at: new Date().toISOString()
            });
          }
        }

        resolve(importedRecords);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
