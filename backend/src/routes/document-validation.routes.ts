// backend/src/routes/document-validation.routes.ts
// Endpoint para validar DNI/RUC contra RENIEC/SUNAT via Json.pe

import { Router } from 'express';
import { JsonPeService } from '../shared/services/jsonpe.service';
import { authenticateToken } from '../shared/middleware/auth.middleware';

const router = Router();

/**
 * POST /api/validate-document
 * Valida un DNI (8 dígitos) o RUC (11 dígitos) peruano
 * Body: { documentId: "27427864" }
 * Response: { type, success, fullName/businessName, documentId, ... }
 */
router.post('/', authenticateToken, async (req, res) => {
    const { documentId } = req.body;

    if (!documentId) {
        return res.status(400).json({
            success: false,
            message: 'documentId es requerido',
        });
    }

    const clean = documentId.replace(/[^0-9]/g, '');

    if (clean.length !== 8 && clean.length !== 11) {
        return res.status(400).json({
            success: false,
            message: 'DNI debe tener 8 dígitos o RUC debe tener 11 dígitos',
        });
    }

    const result = await JsonPeService.validateDocument(clean);

    if (!result) {
        return res.status(404).json({
            success: false,
            message: clean.length === 8
                ? 'DNI no encontrado en RENIEC'
                : 'RUC no encontrado en SUNAT',
        });
    }

    return res.json({
        success: true,
        type: result.type,
        documentId: result.documentId,
        fullName: 'fullName' in result ? result.fullName : undefined,
        businessName: 'businessName' in result ? result.businessName : undefined,
        verificationDigit: result.verificationDigit,
        status: result.status,
        condition: result.condition,
        address: result.address,
        isGoodTaxpayer: result.isGoodTaxpayer,
    });
});

export default router;