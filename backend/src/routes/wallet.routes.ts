// backend/src/routes/wallet.routes.ts
// Endpoints para Google Wallet integration via Wallet API (Hermes)

import { Router } from 'express';
import { WalletService } from '../shared/services/wallet.service';
import { authenticateToken } from '../shared/middleware/auth.middleware';
import { checkRole } from '../shared/middleware/role.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * GET /api/wallet/status
 * Verificar estado del Wallet API
 */
router.get('/status', authenticateToken, async (_req, res) => {
    const status = await WalletService.getStatus();
    if (!status) {
        return res.status(503).json({
            success: false,
            message: 'Wallet API no disponible',
        });
    }
    return res.json({ success: true, ...status });
});

/**
 * POST /api/wallet/create-card
 * Crear tarjeta de fidelización en Google Wallet para un cliente
 * Body: { clientSlug, accountId, accountName, points }
 */
router.post('/create-card', authenticateToken, checkRole([UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN]), async (req, res) => {
    const { clientSlug, accountId, accountName, points } = req.body;

    if (!clientSlug || !accountId || !accountName) {
        return res.status(400).json({
            success: false,
            message: 'clientSlug, accountId y accountName son requeridos',
        });
    }

    const card = await WalletService.createLoyaltyCard(
        clientSlug,
        accountId,
        accountName,
        points || 0
    );

    if (!card) {
        return res.status(500).json({
            success: false,
            message: 'Error al crear tarjeta en Google Wallet',
        });
    }

    return res.json({
        success: true,
        card,
        walletLink: card.wallet_link || null,
        walletObjectId: card.wallet_object_id || null,
    });
});

/**
 * GET /api/wallet/card/:uuid
 * Obtener datos de una tarjeta de Wallet
 */
router.get('/card/:uuid', authenticateToken, async (req, res) => {
    const { uuid } = req.params;
    const result = await WalletService.getCardWithWalletLink(uuid);

    if (!result) {
        return res.status(404).json({
            success: false,
            message: 'Tarjeta no encontrada',
        });
    }

    return res.json({ success: true, ...result });
});

/**
 * GET /api/wallet/stats
 * Obtener estadísticas de Wallet
 */
router.get('/stats', authenticateToken, checkRole([UserRole.SUPER_ADMIN]), async (_req, res) => {
    const stats = await WalletService.getStats();
    if (!stats) {
        return res.status(503).json({
            success: false,
            message: 'Wallet API no disponible',
        });
    }
    return res.json({ success: true, stats });
});

export default router;