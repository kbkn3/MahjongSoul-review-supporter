type PointTuple = [number, number, number, number];
type Wind = 'east' | 'south';
type RankedRoom = 'bronze' | 'silver' | 'gold' | 'tama' | 'king';

const POINTS: {
    east: Record<RankedRoom, Record<string, PointTuple>>;
    south: Record<RankedRoom, Record<string, PointTuple>>;
    others: Record<string, PointTuple>;
} = {
    east: {
        bronze: {
            "初心★1": [25, 10, -5, -15],
            "初心★2": [25, 10, -5, -15],
            "初心★3": [25, 10, -5, -15],
            "雀士★1": [25, 10, -5, -25],
            "雀士★2": [25, 10, -5, -35],
            "雀士★3": [25, 10, -5, -45]
        },
        silver: {
            "雀士★1": [35, 15, -5, -25],
            "雀士★2": [35, 15, -5, -35],
            "雀士★3": [35, 15, -5, -45],
            "雀傑★1": [35, 15, -5, -55],
            "雀傑★2": [35, 15, -5, -65],
            "雀傑★3": [35, 15, -5, -75]
        },
        gold: {
            "雀傑★1": [55, 25, -5, -55],
            "雀傑★2": [55, 25, -5, -65],
            "雀傑★3": [55, 25, -5, -75],
            "雀豪★1": [55, 25, -5, -95],
            "雀豪★2": [55, 25, -5, -105],
            "雀豪★3": [55, 25, -5, -115]
        },
        tama: {
            "雀豪★1": [70, 35, -5, -95],
            "雀豪★2": [70, 35, -5, -105],
            "雀豪★3": [70, 35, -5, -115],
            "雀聖★1": [70, 35, -5, -125],
            "雀聖★2": [70, 35, -5, -135],
            "雀聖★3": [70, 35, -5, -145]
        },
        king: {
            "雀聖★1": [75, 35, -5, -125],
            "雀聖★2": [75, 35, -5, -135],
            "雀聖★3": [75, 35, -5, -145],
        }
    },
    south: {
        bronze: {
            "初心★1": [35, 15, -5, -15],
            "初心★2": [35, 15, -5, -15],
            "初心★3": [35, 15, -5, -15],
            "雀士★1": [35, 15, -5, -35],
            "雀士★2": [35, 15, -5, -55],
            "雀士★3": [35, 15, -5, -75]
        },
        silver: {
            "雀士★1": [55, 25, -5, -35],
            "雀士★2": [55, 25, -5, -55],
            "雀士★3": [55, 25, -5, -75],
            "雀傑★1": [55, 25, -5, -95],
            "雀傑★2": [55, 25, -5, -115],
            "雀傑★3": [55, 25, -5, -135]
        },
        gold: {
            "雀傑★1": [95, 45, -5, -95],
            "雀傑★2": [95, 45, -5, -115],
            "雀傑★3": [95, 45, -5, -135],
            "雀豪★1": [95, 45, -5, -180],
            "雀豪★2": [95, 45, -5, -195],
            "雀豪★3": [95, 45, -5, -210]
        },
        tama: {
            "雀豪★1": [125, 60, -5, -180],
            "雀豪★2": [125, 60, -5, -195],
            "雀豪★3": [125, 60, -5, -210],
            "雀聖★1": [125, 60, -5, -225],
            "雀聖★2": [125, 60, -5, -240],
            "雀聖★3": [125, 60, -5, -255]
        },
        king: {
            "雀聖★1": [135, 65, -5, -225],
            "雀聖★2": [135, 65, -5, -240],
            "雀聖★3": [135, 65, -5, -255],
        }
    },
    others: {
        1030: [50, 10, -10, -30],
        1020: [40, 10, -10, -20],
        515: [35, 5, -5, -15],
        510: [30, 5, -5, -10],
        tenho: [90, 45, 0, -135],
    }
};

const DAN_TO_TABLE: Record<string, RankedRoom> = {
    "初心": "bronze",
    "雀士": "silver",
    "雀傑": "gold",
    "雀豪": "tama",
    "雀聖": "king",
};

const KONTEN = /魂天Lv\d+/;
const KONTEN_PTEV: Record<Wind, { all: PointTuple; individual: PointTuple }> = {
    east: { all: [0.6, 0.2, -0.2, -0.6], individual: [0.6, 0.3, -0.3, -0.6] },
    south: { all: [1.0, 0.4, -0.4, -1.0], individual: [1.0, 0.4, -0.4, -1.0] },
};

function resolveTable(dan: string): RankedRoom | null {
    for (const [prefix, table] of Object.entries(DAN_TO_TABLE)) {
        if (dan.startsWith(prefix)) return table;
    }
    return null;
}

/** 段位ポイント期待値を算出する。tableが未指定の場合は段位名から適正卓を推定する */
function getPtEV(wind: Wind, dans: string[], table?: RankedRoom | null): (PointTuple | number)[] {
    if (dans.every(dan => KONTEN.test(dan))) {
        const points = KONTEN_PTEV[wind].all;
        return [points, points, points, points, 1];
    }

    const ptEV: (PointTuple | number)[] = dans.map(dan => {
        if (KONTEN.test(dan)) {
            return KONTEN_PTEV[wind].individual;
        }
        const resolvedTable = table || resolveTable(dan);
        const room = resolvedTable ? POINTS[wind]?.[resolvedTable] : undefined;
        if (!room || !(dan in room)) {
            return POINTS.others.tenho;
        }
        return room[dan];
    });
    ptEV.push(1);
    return ptEV;
}

export { POINTS, DAN_TO_TABLE, getPtEV };
export type { PointTuple, Wind, RankedRoom };
