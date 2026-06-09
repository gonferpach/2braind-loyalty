// frontend/src/modules/loyalpyme/components/customer/dashboard/WalletCard.tsx
// Botón "Agregar a Google Wallet" para clientes afiliados

import React, { useState, useEffect } from 'react';
import { Paper, Button, Text, Stack, Group, Loader, Alert } from '@mantine/core';
import { IconWallet, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import axiosInstance from '../../../../../shared/services/axiosInstance';
import { useTranslation } from 'react-i18next';

interface WalletCardProps {
    userId: string;
    userName: string;
    businessSlug: string;
    businessName: string;
    userPoints: number;
}

const WalletCard: React.FC<WalletCardProps> = ({ userId, userName, businessSlug, businessName, userPoints }) => {
    const { t } = useTranslation();
    const [walletLink, setWalletLink] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check if wallet card already exists for this user
    useEffect(() => {
        const checkWallet = async () => {
            try {
                const res = await axiosInstance.get(`/wallet/card/${userId}`);
                if (res.data?.success && res.data?.walletLink) {
                    setWalletLink(res.data.walletLink);
                }
            } catch {
                // Card doesn't exist yet — that's fine
            } finally {
                setChecking(false);
            }
        };
        if (userId) checkWallet();
        else setChecking(false);
    }, [userId]);

    const handleCreateCard = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosInstance.post('/wallet/create-card', {
                clientSlug: businessSlug,
                accountId: userId,
                accountName: userName,
                points: userPoints || 0,
            });

            if (res.data?.success && res.data?.walletLink) {
                setWalletLink(res.data.walletLink);
                notifications.show({
                    title: '¡Tarjeta creada!',
                    message: `Tu tarjeta de ${businessName} está lista para agregar a Google Wallet`,
                    color: 'teal',
                    icon: <IconCheck size={18} />,
                    autoClose: 4000,
                });
            } else {
                throw new Error('No se recibió el link de Wallet');
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Error al crear la tarjeta de Wallet';
            setError(msg);
            notifications.show({
                title: 'Error',
                message: msg,
                color: 'red',
                autoClose: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <Paper withBorder p="md" radius="md">
                <Group justify="center">
                    <Loader size="sm" />
                    <Text size="sm" c="dimmed">Verificando tarjeta digital...</Text>
                </Group>
            </Paper>
        );
    }

    // If wallet link exists, show "Add to Google Wallet" button
    if (walletLink) {
        return (
            <Paper withBorder p="lg" radius="md" shadow="sm"
                style={{ background: 'linear-gradient(135deg, #1a73e8 0%, #0D9488 100%)' }}>
                <Stack gap="sm" align="center">
                    <Group gap="xs">
                        <IconWallet size={24} color="white" />
                        <Text fw={600} size="lg" c="white">Tarjeta Digital</Text>
                    </Group>
                    <Text size="sm" c="white" opacity={0.9}>
                        Tu tarjeta de fidelización de {businessName}
                    </Text>
                    <Button
                        component="a"
                        href={walletLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="white"
                        color="blue"
                        radius="md"
                        size="md"
                        leftSection={<IconWallet size={20} />}
                        styles={{ root: { fontWeight: 600 } }}
                    >
                        Agregar a Google Wallet
                    </Button>
                    <Text size="xs" c="white" opacity={0.7}>
                        Puntos actuales: {userPoints || 0}
                    </Text>
                </Stack>
            </Paper>
        );
    }

    // If no wallet link, show create button
    return (
        <Paper withBorder p="lg" radius="md" shadow="sm">
            <Stack gap="sm" align="center">
                <Group gap="xs">
                    <IconWallet size={20} />
                    <Text fw={500}>Tarjeta Digital</Text>
                </Group>
                <Text size="sm" c="dimmed" ta="center">
                    Obtené tu tarjeta de fidelización en Google Wallet
                </Text>
                {error && <Alert color="red" p="xs">{error}</Alert>}
                <Button
                    onClick={handleCreateCard}
                    loading={loading}
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'teal', deg: 90 }}
                    radius="md"
                    size="md"
                    leftSection={<IconWallet size={18} />}
                >
                    Crear mi Tarjeta Digital
                </Button>
            </Stack>
        </Paper>
    );
};

export default WalletCard;