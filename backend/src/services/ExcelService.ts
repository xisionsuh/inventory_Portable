import * as XLSX from 'xlsx';
import { Product } from '../models/Product';
import { TransactionWithProduct } from '../models/Transaction';
import { InventoryStatus } from './InventoryService';

export class ExcelService {
  // 제품 목록을 엑셀로 내보내기
  async exportProducts(products: Product[]): Promise<Buffer> {
    // 엑셀 데이터 준비
    const excelData = products.map(product => ({
      '내부관리번호': product.internal_code,
      '제품고유번호': product.unique_code,
      '제품명': product.name,
      '설명': product.description || '',
      '단위': product.unit,
      '단가': product.unit_price,
      '최소재고량': product.min_stock,
      '현재재고량': product.current_stock,
      '등록일': this.formatDate(product.created_at),
      '수정일': this.formatDate(product.updated_at)
    }));

    return this.createExcelBuffer(excelData, '제품목록');
  }

  // 재고 현황을 엑셀로 내보내기
  async exportInventory(inventory: InventoryStatus[]): Promise<Buffer> {
    // 엑셀 데이터 준비
    const excelData = inventory.map(item => ({
      '내부관리번호': item.internal_code,
      '제품고유번호': item.unique_code,
      '제품명': item.name,
      '단위': item.unit,
      '단가': item.unit_price,
      '최소재고량': item.min_stock,
      '현재재고량': item.current_stock,
      '총입고량': item.total_inbound,
      '총출고량': item.total_outbound,
      '최근입고일': this.formatDate(item.last_inbound_date),
      '최근출고일': this.formatDate(item.last_outbound_date),
      '재고상태': this.getStockStatusText(item.stock_status),
      '재고부족여부': item.is_low_stock ? '예' : '아니오',
      '등록일': this.formatDate(item.created_at)
    }));

    return this.createExcelBuffer(excelData, '재고현황');
  }

  // 거래 내역을 엑셀로 내보내기
  async exportTransactions(transactions: TransactionWithProduct[]): Promise<Buffer> {
    // 엑셀 데이터 준비
    const excelData = transactions.map(transaction => ({
      '거래일자': transaction.transaction_date,
      '거래유형': transaction.type === 'INBOUND' ? '입고' : '출고',
      '내부관리번호': transaction.product_internal_code,
      '제품고유번호': transaction.product_unique_code,
      '제품명': transaction.product_name,
      '수량': transaction.quantity,
      '단위': transaction.product_unit,
      '단가': transaction.unit_price || '',
      '총액': transaction.total_amount || '',
      '공급업체': transaction.supplier || '',
      '출고사유': transaction.reason || '',
      '등록일시': this.formatDateTime(transaction.created_at)
    }));

    return this.createExcelBuffer(excelData, '거래내역');
  }

  // 입고 내역만 엑셀로 내보내기
  async exportInboundTransactions(transactions: TransactionWithProduct[]): Promise<Buffer> {
    const inboundTransactions = transactions.filter(t => t.type === 'INBOUND');
    
    const excelData = inboundTransactions.map(transaction => ({
      '입고일자': transaction.transaction_date,
      '내부관리번호': transaction.product_internal_code,
      '제품고유번호': transaction.product_unique_code,
      '제품명': transaction.product_name,
      '입고수량': transaction.quantity,
      '단위': transaction.product_unit,
      '단가': transaction.unit_price || '',
      '총액': transaction.total_amount || '',
      '공급업체': transaction.supplier || '',
      '등록일시': this.formatDateTime(transaction.created_at)
    }));

    return this.createExcelBuffer(excelData, '입고내역');
  }

  // 출고 내역만 엑셀로 내보내기
  async exportOutboundTransactions(transactions: TransactionWithProduct[]): Promise<Buffer> {
    const outboundTransactions = transactions.filter(t => t.type === 'OUTBOUND');
    
    const excelData = outboundTransactions.map(transaction => ({
      '출고일자': transaction.transaction_date,
      '내부관리번호': transaction.product_internal_code,
      '제품고유번호': transaction.product_unique_code,
      '제품명': transaction.product_name,
      '출고수량': transaction.quantity,
      '단위': transaction.product_unit,
      '출고사유': transaction.reason || '',
      '등록일시': this.formatDateTime(transaction.created_at)
    }));

    return this.createExcelBuffer(excelData, '출고내역');
  }

  // 재고 부족 제품 목록을 엑셀로 내보내기
  async exportLowStockProducts(products: InventoryStatus[]): Promise<Buffer> {
    const lowStockProducts = products.filter(p => p.is_low_stock);

    const excelData = lowStockProducts.map(product => ({
      '내부관리번호': product.internal_code,
      '제품고유번호': product.unique_code,
      '제품명': product.name,
      '단위': product.unit,
      '최소재고량': product.min_stock,
      '현재재고량': product.current_stock,
      '부족수량': Math.max(0, product.min_stock - product.current_stock),
      '재고상태': this.getStockStatusText(product.stock_status)
    }));

    return this.createExcelBuffer(excelData, '재고부족제품');
  }

  // 제품 템플릿 생성 (재고 현황 내보내기 형식과 동일)
  async createProductTemplate(): Promise<Buffer> {
    const templateData = [{
      '내부관리번호': '',
      '제품고유번호': 'ABC-123',
      '제품명': '샘플제품',
      '단위': '개',
      '단가': 10000,
      '최소재고량': 10,
      '현재재고량': 0,
      '총입고량': '',
      '총출고량': '',
      '최근입고일': '',
      '최근출고일': '',
      '재고상태': '',
      '재고부족여부': '',
      '등록일': ''
    }];

    return this.createExcelBuffer(templateData, '제품등록양식');
  }

  // 입고 템플릿 생성 (재고 현황 내보내기 형식과 동일)
  async createInboundTemplate(): Promise<Buffer> {
    const templateData = [{
      '내부관리번호': '',
      '제품고유번호': 'ABC-123',
      '제품명': '',
      '단위': '',
      '단가': 10000,
      '최소재고량': '',
      '현재재고량': '',
      '총입고량': 100,
      '총출고량': '',
      '최근입고일': '2025-01-15',
      '최근출고일': '',
      '재고상태': '',
      '재고부족여부': '',
      '등록일': ''
    }];

    return this.createExcelBuffer(templateData, '입고등록양식');
  }

  // 출고 템플릿 생성 (재고 현황 내보내기 형식과 동일)
  async createOutboundTemplate(): Promise<Buffer> {
    const templateData = [{
      '내부관리번호': '',
      '제품고유번호': 'ABC-123',
      '제품명': '',
      '단위': '',
      '단가': '',
      '최소재고량': '',
      '현재재고량': '',
      '총입고량': '',
      '총출고량': 50,
      '최근입고일': '',
      '최근출고일': '2025-01-15',
      '재고상태': '',
      '재고부족여부': '',
      '등록일': ''
    }];

    return this.createExcelBuffer(templateData, '출고등록양식');
  }

  // 엑셀 파일에서 제품 데이터 파싱 (입력된 데이터만 인식)
  parseProductsFromExcel(buffer: Buffer): any[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    return data
      .filter((row: any) => {
        // 필수 항목이 있는 행만 인식
        const uniqueCode = row['제품고유번호'] || row['unique_code'];
        const name = row['제품명'] || row['name'];
        const unit = row['단위'] || row['unit'];
        return uniqueCode && name && unit;
      })
      .map((row: any) => ({
        internal_code: row['내부관리번호'] || row['internal_code'] || '',
        unique_code: row['제품고유번호'] || row['unique_code'],
        name: row['제품명'] || row['name'],
        description: row['설명'] || row['description'] || '',
        unit: row['단위'] || row['unit'],
        unit_price: Number(row['단가'] || row['unit_price'] || 0),
        min_stock: Number(row['최소재고량'] || row['min_stock'] || 0)
      }));
  }

  // 엑셀 파일에서 입고 데이터 파싱 (입력된 데이터만 인식)
  parseInboundFromExcel(buffer: Buffer): any[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    return data
      .filter((row: any) => {
        // 필수 항목이 있는 행만 인식
        const uniqueCode = row['제품고유번호'] || row['unique_code'];
        const inboundQty = row['총입고량'];
        const inboundDate = row['최근입고일'] || row['거래일자'] || row['transaction_date'] || row['입고일자'];
        return uniqueCode && inboundQty && inboundDate;
      })
      .map((row: any) => ({
        transaction_date: row['최근입고일'] || row['거래일자'] || row['transaction_date'] || row['입고일자'],
        internal_code: row['내부관리번호'] || row['internal_code'],
        unique_code: row['제품고유번호'] || row['unique_code'],
        quantity: Number(row['총입고량'] || row['입고수량'] || row['quantity'] || 0),
        unit_price: Number(row['단가'] || row['unit_price'] || 0),
        supplier: row['공급업체'] || row['supplier'] || ''
      }));
  }

  // 엑셀 파일에서 출고 데이터 파싱 (입력된 데이터만 인식)
  parseOutboundFromExcel(buffer: Buffer): any[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    return data
      .filter((row: any) => {
        // 필수 항목이 있는 행만 인식
        const uniqueCode = row['제품고유번호'] || row['unique_code'];
        const outboundQty = row['총출고량'];
        const outboundDate = row['최근출고일'] || row['거래일자'] || row['transaction_date'] || row['출고일자'];
        return uniqueCode && outboundQty && outboundDate;
      })
      .map((row: any) => ({
        transaction_date: row['최근출고일'] || row['거래일자'] || row['transaction_date'] || row['출고일자'],
        internal_code: row['내부관리번호'] || row['internal_code'],
        unique_code: row['제품고유번호'] || row['unique_code'],
        quantity: Number(row['총출고량'] || row['출고수량'] || row['quantity'] || 0),
        reason: row['출고사유'] || row['reason'] || ''
      }));
  }

  // 엑셀 버퍼 생성 (공통 함수)
  private createExcelBuffer(data: any[], sheetName: string): Buffer {
    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    
    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // 컬럼 너비 자동 조정
    const columnWidths = this.calculateColumnWidths(data);
    worksheet['!cols'] = columnWidths;
    
    // 헤더 스타일 적용 (첫 번째 행)
    if (data.length > 0) {
      const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'E6E6FA' } },
            alignment: { horizontal: 'center' }
          };
        }
      }
    }
    
    // 워크시트를 워크북에 추가
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // 엑셀 파일을 버퍼로 변환
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true
    });
    
    return excelBuffer;
  }

  // 컬럼 너비 계산
  private calculateColumnWidths(data: any[]): any[] {
    if (data.length === 0) return [];
    
    const keys = Object.keys(data[0]);
    const widths = keys.map(key => {
      // 헤더 길이
      let maxLength = key.length;
      
      // 데이터 중 최대 길이 찾기
      data.forEach(row => {
        const cellValue = String(row[key] || '');
        maxLength = Math.max(maxLength, cellValue.length);
      });
      
      // 최소 10, 최대 50으로 제한
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
    
    return widths;
  }

  // 날짜 포맷팅 (YYYY-MM-DD)
  private formatDate(dateString?: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return dateString;
    }
  }

  // 날짜시간 포맷팅 (YYYY-MM-DD HH:mm:ss)
  private formatDateTime(dateString?: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toISOString().replace('T', ' ').split('.')[0];
    } catch {
      return dateString;
    }
  }

  // 재고 상태 텍스트 변환
  private getStockStatusText(status: string): string {
    switch (status) {
      case 'NORMAL':
        return '정상';
      case 'LOW':
        return '부족';
      case 'OUT_OF_STOCK':
        return '재고없음';
      default:
        return '알수없음';
    }
  }

  // 파일명 생성 (한글 + 날짜)
  generateFileName(type: string): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
    
    const typeMap: { [key: string]: string } = {
      'products': '제품목록',
      'inventory': '재고현황',
      'transactions': '거래내역',
      'inbound': '입고내역',
      'outbound': '출고내역',
      'low-stock': '재고부족제품'
    };
    
    const typeName = typeMap[type] || type;
    return `${typeName}_${dateStr}_${timeStr}.xlsx`;
  }
}