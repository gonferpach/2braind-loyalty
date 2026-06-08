// backend/src/shared/services/jsonpe.service.ts
// Servicio de validación DNI/RUC usando api.json.pe (fetch nativo)

const JSONPE_BASE_URL = 'https://api.json.pe';
const JSONPE_TOKEN = process.env.JSONPE_TOKEN || '';

interface JsonPeDniResponse {
    success?: boolean;
    message?: string;
    data?: {
        numero?: string;
        nombre_completo?: string;
        nombres?: string;
        apellido_paterno?: string;
        apellido_materno?: string;
        codigo_verificacion?: number;
        direccion?: string;
    };
}

interface JsonPeRucResponse {
    success?: boolean;
    message?: string;
    data?: {
        numero?: string;
        nombre_o_razon_social?: string;
        estado?: string;
        condicion?: string;
        direccion?: string;
        departamento?: string;
        provincia?: string;
        distrito?: string;
        es_buen_contribuyente?: boolean;
    };
}

export class JsonPeService {

    /**
     * Valida un DNI peruano contra RENIEC via Json.pe
     */
    static async validateDni(dni: string): Promise<{
        success: boolean;
        documentId: string;
        fullName: string;
        verificationDigit?: number;
    } | null> {
        try {
            const response = await fetch(`${JSONPE_BASE_URL}/api/dni`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${JSONPE_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ dni }),
                signal: AbortSignal.timeout(10000),
            });

            const json = await response.json() as JsonPeDniResponse;
            if (json.success && json.data?.nombre_completo) {
                return {
                    success: true,
                    documentId: dni,
                    fullName: json.data.nombre_completo,
                    verificationDigit: json.data.codigo_verificacion,
                };
            }
            return null;
        } catch (error: any) {
            console.error('[JsonPeService] Error validating DNI:', error?.message || error);
            return null;
        }
    }

    /**
     * Valida un RUC peruano contra SUNAT via Json.pe
     */
    static async validateRuc(ruc: string): Promise<{
        success: boolean;
        documentId: string;
        businessName: string;
        status?: string;
        condition?: string;
        address?: string;
        isGoodTaxpayer?: boolean;
    } | null> {
        try {
            const response = await fetch(`${JSONPE_BASE_URL}/api/ruc`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${JSONPE_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ruc }),
                signal: AbortSignal.timeout(10000),
            });

            const json = await response.json() as JsonPeRucResponse;
            if (json.success && json.data?.nombre_o_razon_social) {
                return {
                    success: true,
                    documentId: ruc,
                    businessName: json.data.nombre_o_razon_social,
                    status: json.data.estado,
                    condition: json.data.condicion,
                    address: json.data.direccion,
                    isGoodTaxpayer: json.data.es_buen_contribuyente,
                };
            }
            return null;
        } catch (error: any) {
            console.error('[JsonPeService] Error validating RUC:', error?.message || error);
            return null;
        }
    }

    /**
     * Auto-detecta si es DNI (8 dígitos) o RUC (11 dígitos) y valida
     */
    static async validateDocument(documentId: string): Promise<{
        type: 'DNI' | 'RUC';
        success: boolean;
        fullName?: string;
        businessName?: string;
        documentId: string;
        verificationDigit?: number;
        status?: string;
        condition?: string;
        address?: string;
        isGoodTaxpayer?: boolean;
    } | null> {
        const clean = documentId.replace(/[^0-9]/g, '');

        if (clean.length === 8) {
            const result = await JsonPeService.validateDni(clean);
            if (!result) return null;
            return { type: 'DNI', ...result };
        }

        if (clean.length === 11) {
            const result = await JsonPeService.validateRuc(clean);
            if (!result) return null;
            return { type: 'RUC', ...result };
        }

        return null;
    }
}