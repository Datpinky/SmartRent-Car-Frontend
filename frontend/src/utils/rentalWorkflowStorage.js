const STORAGE_KEY = 'smartrent:rental-workflows';

const DEFAULT_WORKFLOW = {
    receiveChecklist: {
        exterior: false,
        interior: false,
        documents: false,
        fuelLevel: false,
    },
    receiveNote: '',
    receiveImages: [],
    returnChecklist: {
        belongings: false,
        cleanliness: false,
        damagesChecked: false,
        fuelLevel: false,
    },
    returnNote: '',
    returnImages: [],
    aiInspection: null,
    updatedAt: '',
};

const readAll = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

const writeAll = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getRentalWorkflow = (bookingId) => {
    if (!bookingId) {
        return { ...DEFAULT_WORKFLOW };
    }

    const all = readAll();
    const stored = all[String(bookingId)] || {};

    return {
        ...DEFAULT_WORKFLOW,
        ...stored,
        receiveChecklist: {
            ...DEFAULT_WORKFLOW.receiveChecklist,
            ...(stored.receiveChecklist || {}),
        },
        returnChecklist: {
            ...DEFAULT_WORKFLOW.returnChecklist,
            ...(stored.returnChecklist || {}),
        },
        receiveImages: Array.isArray(stored.receiveImages) ? stored.receiveImages : [],
        returnImages: Array.isArray(stored.returnImages) ? stored.returnImages : [],
        aiInspection: stored.aiInspection && typeof stored.aiInspection === 'object'
            ? stored.aiInspection
            : null,
    };
};

export const saveRentalWorkflow = (bookingId, updates) => {
    if (!bookingId) {
        return getRentalWorkflow('');
    }

    const all = readAll();
    const current = getRentalWorkflow(bookingId);
    const next = {
        ...current,
        ...updates,
        receiveChecklist: {
            ...current.receiveChecklist,
            ...(updates.receiveChecklist || {}),
        },
        returnChecklist: {
            ...current.returnChecklist,
            ...(updates.returnChecklist || {}),
        },
        updatedAt: new Date().toISOString(),
    };

    all[String(bookingId)] = next;
    writeAll(all);

    return next;
};
