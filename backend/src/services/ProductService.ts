import { db } from '../config/database';
import { Product, CreateProductData, UpdateProductData } from '../models/Product';

export class ProductService {
  // 내부 관리 번호 생성 (P + 6자리 숫자)
  private async generateInternalCode(): Promise<string> {
    const result = await db.get(
      'SELECT COUNT(*) as count FROM products'
    );
    const nextNumber = (result.count + 1).toString().padStart(6, '0');
    return `P${nextNumber}`;
  }

  // 모든 제품 조회
  async getAllProducts(): Promise<Product[]> {
    const products = await db.all(
      'SELECT * FROM products ORDER BY created_at DESC'
    );
    return products;
  }

  // ID로 제품 조회
  async getProductById(id: number): Promise<Product | null> {
    const product = await db.get(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );
    return product || null;
  }

  // 내부 관리 번호로 제품 조회
  async getProductByInternalCode(internalCode: string): Promise<Product | null> {
    const product = await db.get(
      'SELECT * FROM products WHERE internal_code = ?',
      [internalCode]
    );
    return product || null;
  }

  // 고유 번호로 제품 조회
  async getProductByUniqueCode(uniqueCode: string): Promise<Product | null> {
    const product = await db.get(
      'SELECT * FROM products WHERE unique_code = ?',
      [uniqueCode]
    );
    return product || null;
  }

  // 내부 관리 번호 또는 고유 번호로 제품 조회
  async getProductByCode(internalCode: string, uniqueCode: string): Promise<Product | null> {
    const product = await db.get(
      'SELECT * FROM products WHERE internal_code = ? OR unique_code = ?',
      [internalCode, uniqueCode]
    );
    return product || null;
  }

  // 새 제품 생성
  async createProduct(productData: CreateProductData): Promise<Product> {
    // 고유 번호 중복 확인
    const existingProduct = await this.getProductByUniqueCode(productData.unique_code);
    if (existingProduct) {
      throw new Error('이미 존재하는 제품 고유 번호입니다.');
    }

    // 내부 관리 번호 생성
    const internalCode = await this.generateInternalCode();

    const result = await db.run(
      `INSERT INTO products (internal_code, unique_code, name, description, unit, unit_price, min_stock, current_stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        internalCode,
        productData.unique_code,
        productData.name,
        productData.description || null,
        productData.unit,
        productData.unit_price || 0,
        productData.min_stock || 0
      ]
    );

    const newProduct = await this.getProductById(result.lastID!);
    if (!newProduct) {
      throw new Error('제품 생성 후 조회에 실패했습니다.');
    }

    return newProduct;
  }

  // 제품 정보 업데이트
  async updateProduct(id: number, updateData: UpdateProductData): Promise<Product> {
    const existingProduct = await this.getProductById(id);
    if (!existingProduct) {
      throw new Error('존재하지 않는 제품입니다.');
    }

    // 고유 번호 변경 시 중복 확인
    if (updateData.unique_code && updateData.unique_code !== existingProduct.unique_code) {
      const duplicateProduct = await this.getProductByUniqueCode(updateData.unique_code);
      if (duplicateProduct) {
        throw new Error('이미 존재하는 제품 고유 번호입니다.');
      }
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updateData.unique_code !== undefined) {
      updateFields.push('unique_code = ?');
      updateValues.push(updateData.unique_code);
    }
    if (updateData.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(updateData.name);
    }
    if (updateData.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(updateData.description);
    }
    if (updateData.unit !== undefined) {
      updateFields.push('unit = ?');
      updateValues.push(updateData.unit);
    }
    if (updateData.unit_price !== undefined) {
      updateFields.push('unit_price = ?');
      updateValues.push(updateData.unit_price);
    }
    if (updateData.min_stock !== undefined) {
      updateFields.push('min_stock = ?');
      updateValues.push(updateData.min_stock);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    await db.run(
      `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const updatedProduct = await this.getProductById(id);
    if (!updatedProduct) {
      throw new Error('제품 업데이트 후 조회에 실패했습니다.');
    }

    return updatedProduct;
  }

  // 제품 삭제
  async deleteProduct(id: number): Promise<void> {
    const existingProduct = await this.getProductById(id);
    if (!existingProduct) {
      throw new Error('존재하지 않는 제품입니다.');
    }

    await db.run('DELETE FROM products WHERE id = ?', [id]);
  }

  // 재고 수량 업데이트
  async updateStock(id: number, newStock: number): Promise<Product> {
    if (newStock < 0) {
      throw new Error('재고 수량은 0 이상이어야 합니다.');
    }

    await db.run(
      'UPDATE products SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStock, id]
    );

    const updatedProduct = await this.getProductById(id);
    if (!updatedProduct) {
      throw new Error('재고 업데이트 후 조회에 실패했습니다.');
    }

    return updatedProduct;
  }

  // 재고 부족 제품 조회
  async getLowStockProducts(): Promise<Product[]> {
    const products = await db.all(
      'SELECT * FROM products WHERE current_stock <= min_stock ORDER BY name'
    );
    return products;
  }

  // 제품 검색 (내부 관리 번호 또는 고유 번호로)
  async searchProducts(searchTerm: string): Promise<Product[]> {
    const products = await db.all(
      `SELECT * FROM products 
       WHERE internal_code LIKE ? OR unique_code LIKE ? OR name LIKE ?
       ORDER BY name`,
      [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    );
    return products;
  }
}