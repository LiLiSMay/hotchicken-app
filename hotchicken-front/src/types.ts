export interface Mesa {
    id: number;
    numero: number;
    estado: 'libre' | 'ocupada';
    pedidoActual?: string;
}
