import { Router } from 'express';
import { ProductService } from '../services/ProductService';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { validateRequestBody, validateIdParam, validateString, validateNumber } from '../middleware/validation';

const router = Router();
const productService = new ProductService();

// GET /api/products - 모든 제품 조회
router.get('/', asyncHandler(async (req, res) => {
  const { search } = req.query;
  
  let products;
  if (search && typeof search === 'string') {
    products = await productService.searchProducts(search);
  } else {
    products = await productService.getAllProducts();
  }

  res.json({
    success: true,
    data: products,
    count: products.length
  });
}));

// GET /api/products/:id - 특정 제품 조회
router.get('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const product = await productService.getProductById(id);

  if (!product) {
    throw new AppError('제품을 찾을 수 없습니다.', 404);
  }

  res.json({
    success: true,
    data: product
  });
}));

// POST /api/products - 새 제품 등록
router.post('/', 
  validateRequestBody(['unique_code', 'name', 'unit']),
  asyncHandler(async (req, res) => {
    const { unique_code, name, description, unit, min_stock } = req.body;

    // 입력 데이터 유효성 검사
    const validatedData = {
      unique_code: validateString(unique_code, '제품 고유 번호', 1, 100),
      name: validateString(name, '제품명', 1, 200),
      description: description ? validateString(description, '제품 설명', 0, 1000) : undefined,
      unit: validateString(unit, '단위', 1, 20),
      min_stock: min_stock !== undefined ? validateNumber(min_stock, '최소 재고량', 0) : 0
    };

    const newProduct = await productService.createProduct(validatedData);

    res.status(201).json({
      success: true,
      message: '제품이 성공적으로 등록되었습니다.',
      data: newProduct
    });
  })
);

// PUT /api/products/:id - 제품 정보 수정
router.put('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { unique_code, name, description, unit, min_stock } = req.body;

  // 업데이트할 데이터 유효성 검사
  const updateData: any = {};

  if (unique_code !== undefined) {
    updateData.unique_code = validateString(unique_code, '제품 고유 번호', 1, 100);
  }
  if (name !== undefined) {
    updateData.name = validateString(name, '제품명', 1, 200);
  }
  if (description !== undefined) {
    updateData.description = description ? validateString(description, '제품 설명', 0, 1000) : null;
  }
  if (unit !== undefined) {
    updateData.unit = validateString(unit, '단위', 1, 20);
  }
  if (min_stock !== undefined) {
    updateData.min_stock = validateNumber(min_stock, '최소 재고량', 0);
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError('업데이트할 데이터가 없습니다.', 400);
  }

  const updatedProduct = await productService.updateProduct(id, updateData);

  res.json({
    success: true,
    message: '제품 정보가 성공적으로 수정되었습니다.',
    data: updatedProduct
  });
}));

// DELETE /api/products/:id - 제품 삭제
router.delete('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  await productService.deleteProduct(id);

  res.json({
    success: true,
    message: '제품이 성공적으로 삭제되었습니다.'
  });
}));

// GET /api/products/code/internal/:code - 내부 관리 번호로 제품 조회
router.get('/code/internal/:code', asyncHandler(async (req, res) => {
  const { code } = req.params;
  const product = await productService.getProductByInternalCode(code);

  if (!product) {
    throw new AppError('제품을 찾을 수 없습니다.', 404);
  }

  res.json({
    success: true,
    data: product
  });
}));

// GET /api/products/code/unique/:code - 고유 번호로 제품 조회
router.get('/code/unique/:code', asyncHandler(async (req, res) => {
  const { code } = req.params;
  const product = await productService.getProductByUniqueCode(code);

  if (!product) {
    throw new AppError('제품을 찾을 수 없습니다.', 404);
  }

  res.json({
    success: true,
    data: product
  });
}));

// GET /api/products/low-stock - 재고 부족 제품 조회
router.get('/status/low-stock', asyncHandler(async (req, res) => {
  const products = await productService.getLowStockProducts();

  res.json({
    success: true,
    data: products,
    count: products.length
  });
}));

export default router;