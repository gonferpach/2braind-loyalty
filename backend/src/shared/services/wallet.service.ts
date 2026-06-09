// backend/src/shared/services/wallet.service.ts
// Servicio de integración con Google Wallet via Wallet API (Hermes)

const WALLET_API_BASE_URL = process.env.WALLET_API_URL || 'http://localhost:420';

interface WalletCardCreate {
    client_slug: string;
    account_id?: string;
    account_name?: string;
    points?: number;
    latitude?: number | null;
    longitude?: number | null;
}

interface WalletCard {
    card_uuid: string;
    client_slug: string;
    account_id: string;
    account_name: string;
    points: number;
    wallet_link?: string;
    wallet_object_id?: string;
    created_at: string;
}

interface WalletStatus {
    app: string;
    version: string;
    docs: string;
    mode: string;
}

export class WalletService {

    /**
     * Verificar estado del Wallet API
     */
    static async getStatus(): Promise<WalletStatus | null> {
        try {
            const response = await fetch(`${WALLET_API_BASE_URL}/`, {
                signal: AbortSignal.timeout(5000),
            });
            return await response.json() as WalletStatus;
        } catch (error: any) {
            console.error('[WalletService] Error checking status:', error?.message || error);
            return null;
        }
    }

    /**
     * Crear una tarjeta de fidelización en Google Wallet
     * @param clientSlug Slug del comercio (ej: "barra-420")
     * @param accountId ID del cliente (DNI o ID interno)
     * @param accountName Nombre completo del cliente
     * @param points Puntos iniciales
     * @returns Datos de la tarjeta creada con link de Google Wallet
     */
    static async createLoyaltyCard(
        clientSlug: string,
        accountId: string,
        accountName: string,
        points: number = 0
    ): Promise<WalletCard | null> {
        try {
            const payload: WalletCardCreate = {
                client_slug: clientSlug,
                account_id: accountId,
                account_name: accountName,
                points,
            };

            const response = await fetch(`${WALLET_API_BASE_URL}/api/v1/cards/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(15000),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[WalletService] Error creating card: ${response.status} - ${errorText}`);
                return null;
            }

            return await response.json() as WalletCard;
        } catch (error: any) {
            console.error('[WalletService] Error creating loyalty card:', error?.message || error);
            return null;
        }
    }

    /**
     * Obtener datos de una tarjeta por UUID
     */
    static async getCard(cardUuid: string): Promise<WalletCard | null> {
        try {
            const response = await fetch(`${WALLET_API_BASE_URL}/api/v1/cards/${cardUuid}`, {
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                console.error(`[WalletService] Card not found: ${cardUuid}`);
                return null;
            }

            return await response.json() as WalletCard;
        } catch (error: any) {
            console.error('[WalletService] Error getting card:', error?.message || error);
            return null;
        }
    }

    /**
     * Actualizar puntos de una tarjeta
     * Actualmente el Wallet API no tiene PATCH para puntos,
     * así que obtenemos la tarjeta y devolvemos el link actualizado
     */
    static async getCardWithWalletLink(cardUuid: string): Promise<{ card: WalletCard; walletLink: string } | null> {
        const card = await WalletService.getCard(cardUuid);
        if (!card) return null;

        // El wallet_link viene directo de la API
        const walletLink = card.wallet_link || '';

        return { card, walletLink };
    }

    /**
     * Publicar/approvar un pase de Wallet para un cliente
     */
    static async publishCard(clientId: string): Promise<any> {
        try {
            const response = await fetch(`${WALLET_API_BASE_URL}/api/v1/wallet/publish/${clientId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(15000),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[WalletService] Error publishing card: ${response.status} - ${errorText}`);
                return null;
            }

            return await response.json();
        } catch (error: any) {
            console.error('[WalletService] Error publishing card:', error?.message || error);
            return null;
        }
    }

    /**
     * Obtener estadísticas de Wallet
     */
    static async getStats(): Promise<any> {
        try {
            const response = await fetch(`${WALLET_API_BASE_URL}/api/v1/wallet/stats`, {
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) return null;
            return await response.json();
        } catch (error: any) {
            console.error('[WalletService] Error getting stats:', error?.message || error);
            return null;
        }
    }
}