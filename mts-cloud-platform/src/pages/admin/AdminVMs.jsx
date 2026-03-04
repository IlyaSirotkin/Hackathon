import { useState } from 'react';
import {
    Box, Card, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, TextField,
    InputAdornment, MenuItem,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import VMStatusChip from '../../components/VMStatusChip';
import { mockVMs, mockTenants } from '../../services/mockData';

export default function AdminVMs() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [tenantFilter, setTenantFilter] = useState('all');

    const allVMs = mockVMs.map((vm) => ({
        ...vm,
        tenantName: mockTenants.find((t) => t.id === vm.tenantId)?.name || 'Неизвестный',
    }));

    const filteredVMs = allVMs.filter((vm) => {
        const matchSearch =
            vm.name.toLowerCase().includes(search.toLowerCase()) ||
            vm.ip.includes(search) ||
            vm.tenantName.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || vm.status === statusFilter;
        const matchTenant = tenantFilter === 'all' || vm.tenantId === tenantFilter;
        return matchSearch && matchStatus && matchTenant;
    });

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 0.5 }}>Все виртуальные машины</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Обзор всех ВМ по всем тенантам
            </Typography>

            {/* Фильтры */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <TextField
                    size="small"
                    placeholder="Поиск по имени, IP, тенанту..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ minWidth: 280 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                            </InputAdornment>
                        ),
                    }}
                />
                <TextField
                    size="small"
                    select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ minWidth: 160 }}
                    label="Статус"
                >
                    <MenuItem value="all">Все статусы</MenuItem>
                    <MenuItem value="running">Работают</MenuItem>
                    <MenuItem value="stopped">Остановлены</MenuItem>
                </TextField>
                <TextField
                    size="small"
                    select
                    value={tenantFilter}
                    onChange={(e) => setTenantFilter(e.target.value)}
                    sx={{ minWidth: 200 }}
                    label="Тенант"
                >
                    <MenuItem value="all">Все тенанты</MenuItem>
                    {mockTenants.map((t) => (
                        <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                    ))}
                </TextField>
            </Box>

            {/* Таблица */}
            <Card>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Имя</TableCell>
                                <TableCell>Тенант</TableCell>
                                <TableCell>Статус</TableCell>
                                <TableCell>ОС</TableCell>
                                <TableCell>Ресурсы</TableCell>
                                <TableCell>IP</TableCell>
                                <TableCell>Сеть</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredVMs.map((vm) => (
                                <TableRow key={vm.id} hover>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{vm.id}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{vm.name}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={vm.tenantName} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell>
                                        <VMStatusChip status={vm.status} />
                                    </TableCell>
                                    <TableCell>{vm.os}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {vm.cpu} vCPU · {vm.ram} ГБ · {vm.disk} ГБ
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{vm.ip}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{vm.network}</Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredVMs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            Ничего не найдено
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
        </Box>
    );
}